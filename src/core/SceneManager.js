import * as THREE from 'three';
import { Config } from './Config.js';

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06192b);
  scene.fog = new THREE.FogExp2(0x06192b, 0.0028);
  return scene;
}

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    55, window.innerWidth / window.innerHeight, 0.5, 3000);
  // High cinematic aerial angle matching reference image
  camera.position.set(80, 310, 480);
  camera.lookAt(0, 10, 0);
  return camera;
}

export function createLights(scene) {
  // Strong ambient — underwater fills everything
  const ambient = new THREE.AmbientLight(0x3a7aaa, 4.5);
  scene.add(ambient);

  // Primary sun from upper-left (matching reference god rays direction)
  const sun = new THREE.DirectionalLight(0xaaddff, 7.0);
  sun.position.set(-120, 450, 180);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far  = 1600;
  sun.shadow.camera.left   = -600;
  sun.shadow.camera.right  =  600;
  sun.shadow.camera.top    =  600;
  sun.shadow.camera.bottom = -600;
  sun.shadow.bias = -0.0002;
  scene.add(sun);

  // Secondary fill from front-right
  const fill = new THREE.DirectionalLight(0x1155aa, 3.2);
  fill.position.set(250, 80, 280);
  scene.add(fill);

  // Backlight rim from below/behind to lift dark sides
  const rim = new THREE.DirectionalLight(0x002255, 1.8);
  rim.position.set(-100, -50, -200);
  scene.add(rim);

  // City center bioluminescent glow
  const cityGlow = new THREE.PointLight(0x44ccff, 5.0, 900, 1.6);
  cityGlow.position.set(0, 60, 0);
  scene.add(cityGlow);

  // Palace warm gold glow
  const palaceGlow = new THREE.PointLight(0xffaa22, 6.0, 350, 2.0);
  palaceGlow.position.set(0, 120, 0);
  scene.add(palaceGlow);

  // Hemisphere sky/ground
  const hemi = new THREE.HemisphereLight(0x2288bb, 0x112233, 2.5);
  scene.add(hemi);

  // Additional fill lights in ring districts
  const ring1 = new THREE.PointLight(0x3388cc, 2.0, 400, 2.0);
  ring1.position.set(120, 30, 0);
  scene.add(ring1);
  const ring2 = new THREE.PointLight(0x3388cc, 2.0, 400, 2.0);
  ring2.position.set(-120, 30, 0);
  scene.add(ring2);

  return { sun, fill, rim, cityGlow, palaceGlow, ambient, hemi };
}
