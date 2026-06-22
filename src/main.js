import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { Config }       from './core/Config.js';
import { createScene, createCamera, createLights } from './core/SceneManager.js';
import { createRenderer, createComposer, handleResize } from './core/RendererSetup.js';
import { Loop }         from './core/Loop.js';

import { buildCity }    from './generators/CityLayout.js';
import { createMarbleMaterial } from './materials/MarbleMaterial.js';
import { createCoralMaterial }  from './materials/CoralMaterial.js';
import { createGoldMaterial }   from './materials/GoldMaterial.js';
import { createOceanFloorMaterial } from './materials/OceanFloorMaterial.js';
import { createSeaweedMaterial, updateSeaweedTime } from './generators/SeaweedGenerator.js';

import { createCausticsPlane, updateCaustics } from './environment/CausticsEffect.js';
import { createParticleField, updateParticles } from './environment/ParticleField.js';
import { applyDepthAttenuation } from './environment/UnderwaterFog.js';

import { FishSchool, createFishMaterial } from './wildlife/FishSchool.js';
import { createJellyfish, updateJellyfish } from './wildlife/Jellyfish.js';
import { CameraFlythrough } from './camera/CameraFlythrough.js';

// ─── Init ─────────────────────────────────────────────────────────────────────
const canvas   = document.getElementById('app');
const fpsLabel = document.getElementById('fps');

const scene    = createScene();
const camera   = createCamera();
const renderer = createRenderer(canvas);
const { composer, gradePass, godRayPass } = createComposer(renderer, scene, camera);
handleResize(renderer, composer, camera);

const lights = createLights(scene);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping  = true;
controls.dampingFactor  = 0.06;
controls.minDistance    = 30;
controls.maxDistance    = 1200;
controls.maxPolarAngle  = Math.PI * 0.46;
controls.target.set(0, 15, 0);

// ─── Materials ────────────────────────────────────────────────────────────────
const materials = {
  marble:  createMarbleMaterial(),
  coral:   createCoralMaterial(0),
  gold:    createGoldMaterial(),
  seaweed: createSeaweedMaterial(),
  rock:    createOceanFloorMaterial(),
};

// ─── City ─────────────────────────────────────────────────────────────────────
console.time('buildCity');
const city = buildCity(materials);
scene.add(city);
console.timeEnd('buildCity');

// ─── Caustics ─────────────────────────────────────────────────────────────────
const { mesh: causticsMesh, material: causticsMat } =
  createCausticsPlane(Config.city.radius * 3.2);
scene.add(causticsMesh);

const { mesh: archCaustics, material: archCausticsMat } =
  createCausticsPlane(Config.city.radius * 2.9);
archCaustics.position.y = 25;
archCaustics.renderOrder = 2;
scene.add(archCaustics);

// ─── Particles ────────────────────────────────────────────────────────────────
const { points: particles, material: particleMat } = createParticleField({
  count:      Config.quality.particleCount,
  areaRadius: Config.city.radius * 1.4,
});
scene.add(particles);

// ─── Fish schools ─────────────────────────────────────────────────────────────
const fishMat = createFishMaterial();
const schools  = [];
for (let i = 0; i < Config.quality.schoolCount; i++) {
  const theta  = (i / Config.quality.schoolCount) * Math.PI * 2;
  const r      = Config.city.radius * 0.45;
  const center = new THREE.Vector3(Math.cos(theta) * r, 22 + i * 5, Math.sin(theta) * r);
  const school = new FishSchool({ count: Config.quality.fishPerSchool, center, bounds: 42, material: fishMat });
  scene.add(school.mesh);
  schools.push(school);
}

// ─── Jellyfish ────────────────────────────────────────────────────────────────
const jellies = [];
for (let i = 0; i < 14; i++) {
  const theta = Math.random() * Math.PI * 2;
  const r     = Math.random() * Config.city.radius * 0.65;
  const { mesh, material } = createJellyfish(
    new THREE.Vector3(Math.cos(theta) * r, 14 + Math.random() * 30, Math.sin(theta) * r)
  );
  scene.add(mesh);
  jellies.push({ mesh, material });
}

// ─── Camera flythrough ────────────────────────────────────────────────────────
const flythrough = new CameraFlythrough(camera);

// ─── Loop ─────────────────────────────────────────────────────────────────────
let fpsAcc = 0, fpsFrames = 0;

const loop = new Loop((dt, elapsed) => {
  controls.update();

  applyDepthAttenuation(scene, camera);
  updateCaustics(causticsMat,     elapsed);
  updateCaustics(archCausticsMat, elapsed + 0.65);
  updateParticles(particleMat,    elapsed);
  updateSeaweedTime(materials.seaweed, elapsed);
  updateJellyfish(jellies, elapsed);
  schools.forEach(s => s.update(dt));
  flythrough.update(dt);

  // Pulsing bioluminescent fill lights
  lights.cityGlow.intensity   = 3.5 + Math.sin(elapsed * 0.65) * 1.0;
  lights.palaceGlow.intensity = 4.5 + Math.sin(elapsed * 1.05 + 1.0) * 1.2;
  lights.palaceGlow.color.setHSL(0.11 + Math.sin(elapsed * 0.18) * 0.025, 0.92, 0.55);

  if (gradePass) {
    gradePass.uniforms.uTime.value = elapsed;
    gradePass.uniforms.uLightPos.value.set(0.28, 0.82);
  }

  if (materials.marble.userData.shader)
    materials.marble.userData.shader.uniforms.uTime.value = elapsed;

  composer.render();

  fpsAcc += dt; fpsFrames++;
  if (fpsAcc >= 0.5) {
    fpsLabel.textContent = `${Math.round(fpsFrames / fpsAcc)} FPS`;
    fpsAcc = 0; fpsFrames = 0;
  }
});

loop.start();

// ─── Controls hint ────────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if (e.key === 'c' || e.key === 'C') {
    flythrough.active ? flythrough.stop() : flythrough.start();
    controls.enabled = !flythrough.active;
  }
});
