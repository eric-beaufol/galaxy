import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

/**
 * Base
 */
// Debug
const gui = new dat.GUI({ width: 500 })

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Parameters

const parameters = {
  count: 395879,
  size: 0.01,
  radius: 3,
  branches: 5,
  branchEndSize: 0,
  spin: 1,
  randomness: 1.12,
  randomnessPower: 1.679,
  insideColor: '#ff6030',
  outsideColor: '#1b3984',
  bloomStrength: 0.5,
  bloomThreshold: 0,
  bloomRadius: 0,
  colorMixer: 3,
  density: 1
}

let geometry = null
let material = null
let points = null

const generateGalaxy = () => {

  // Remove previous galaxy
  if (points !== null) {
    geometry.dispose()
    material.dispose()
    scene.remove(points)
  }

  const { count, size, branches, spin, randomness, randomnessPower, density, branchEndSize } = parameters
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  geometry = new THREE.BufferGeometry()
  const insideColor = new THREE.Color(parameters.insideColor)
  const outsideColor = new THREE.Color(parameters.outsideColor)

  for (let i = 0; i < count * 3; i++) {
    const i3 = i * 3
    const radius = Math.pow(Math.random(), density) * parameters.radius
    const branchAngle = (Math.PI * 2 / branches) * (i % branches)
    const spinAngle = radius * spin

    const randomVector = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    )
    
    // internal coord or external ? (0 -> 1)
    const progress = Math.min(1 - branchEndSize, radius / parameters.radius)
    randomVector.normalize().multiplyScalar(Math.pow(Math.random(), randomnessPower /* (1 - progress)*/))
    randomVector.multiplyScalar(randomness - progress * randomness)
    
    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomVector.x
    positions[i3 + 1] = randomVector.y
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomVector.z

    randomVector.set(positions[i3], positions[i3 + 1], positions[i3 + 2])

    if (i3 > 10000 && i3 < 10020) {
      console.log(randomVector.length())
    }

    // Color
    const mixedColor = insideColor.clone()
    mixedColor.lerp(outsideColor, randomVector.length() / parameters.colorMixer)
    
    colors[i3] = mixedColor.r
    colors[i3 + 1] = mixedColor.g
    colors[i3 + 2] = mixedColor.b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  
  material = new THREE.PointsMaterial({ 
    size,
    vertexColors: true,
    blending: THREE.AdditiveBlending
  })

  points = new THREE.Points(
    geometry,
    material
  )

  scene.add(points)
}

generateGalaxy()

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 3
camera.position.y = 3
camera.position.z = 3
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.autoRotate = true
controls.autoRotateSpeed = .1

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Effect composer
 */
const renderScene = new RenderPass(scene, camera)

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  parameters.bloomStrength,
  parameters.bloomRadius,
  parameters.bloomThreshold
)

// Composer
const composer = new EffectComposer(renderer)
composer.addPass(renderScene)
composer.addPass(bloomPass)

const updateBloom = () => {
  bloomPass.threshold = parameters.bloomThreshold
  bloomPass.radius = parameters.bloomRadius
  bloomPass.strength = parameters.bloomStrength
}

const galaxyFolder = gui.addFolder('galaxy')
galaxyFolder.add(parameters, 'count').min(100).max(10000000).step(1).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'size').min(0.001).max(0.1).step(0.001).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'radius').min(.1).max(20).step(0.01).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'branchEndSize').min(0).max(1).step(.001).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'spin').min(-5).max(5).step(0.001).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'density').min(1).max(3).step(0.01).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'randomness').min(0).max(10).step(0.001).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy)
galaxyFolder.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy)
galaxyFolder.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'colorMixer').min(.1).max(20).step(0.01).onFinishChange(generateGalaxy)

const bloomFolder = gui.addFolder('bloom')
bloomFolder.add(parameters, 'bloomStrength').min(0).max(10).step(.01).name('strength').onChange(updateBloom)
bloomFolder.add(parameters, 'bloomThreshold').min(0).max(1).step(.001).name('threshold').onChange(updateBloom)
bloomFolder.add(parameters, 'bloomRadius').min(0).max(1).step(.001).name('radius').onChange(updateBloom)


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  // Update controls
  controls.update()

  // Render
  composer.render()

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()