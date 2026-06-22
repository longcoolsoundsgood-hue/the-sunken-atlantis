import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass }      from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js';

// ─── Underwater grade + god-ray shimmer + chromatic aberration ───────────────
const UnderwaterGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime:    { value: 0 },
    uLightPos:{ value: new THREE.Vector2(0.3, 0.82) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uLightPos;
    varying vec2 vUv;

    void main() {
      // Mild chromatic aberration for underwater lens distortion
      float aberr = 0.0012;
      float r = texture2D(tDiffuse, vUv + vec2( aberr, 0.0)).r;
      float g = texture2D(tDiffuse, vUv                    ).g;
      float b = texture2D(tDiffuse, vUv - vec2( aberr, 0.0)).b;
      vec3 c = vec3(r, g, b);

      // Underwater teal tint — preserve overall luminance
      vec3 teal = vec3(0.55, 0.88, 1.0);
      c = mix(c, c * teal, 0.32);

      // Boost gold/warm tones from city lights (counteract over-tinting)
      float warmLuma = dot(c, vec3(0.5, 0.4, 0.0));
      c = mix(c, c + vec3(0.06, 0.04, 0.0) * warmLuma, 0.4);

      // Vignette (oval, not too dark)
      float d = length((vUv - 0.5) * vec2(1.0, 1.3));
      float vignette = 1.0 - smoothstep(0.42, 1.1, d);
      c *= mix(0.65, 1.0, vignette);

      // God-ray shimmer — projected from upper-left sun position
      vec2 dir = vUv - uLightPos;
      float rayAngle = atan(dir.y, dir.x);
      float rayDist  = length(dir);
      float rays = sin(rayAngle * 22.0 + uTime * 0.5) * 0.5 + 0.5;
      rays *= sin(rayAngle * 11.0 - uTime * 0.8) * 0.5 + 0.5;
      float rayMask = smoothstep(0.95, 0.0, rayDist) * rays;
      c += vec3(0.18, 0.35, 0.50) * rayMask * 0.18;

      // Subtle wave shimmer overlay
      float shimmer = sin(vUv.x * 32.0 + uTime * 0.85) * sin(vUv.y * 20.0 - uTime * 0.6);
      c *= 1.0 + shimmer * 0.018;

      // Filmic tone compression
      c = c / (c + 0.10) * 1.10;
      // Contrast lift
      c = pow(max(c, 0.0), vec3(0.92));

      gl_FragColor = vec4(c, 1.0);
    }
  `,
};

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2.1;
  renderer.outputColorSpace    = THREE.SRGBColorSpace;
  return renderer;
}

export function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // Bloom — softer glow matching reference (gold domes, lights)
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.65,   // strength
    0.55,   // radius
    0.72    // threshold
  );
  composer.addPass(bloom);

  const gradePass = new ShaderPass(UnderwaterGradeShader);
  composer.addPass(gradePass);

  composer.addPass(new OutputPass());

  return { composer, bloom, gradePass, godRayPass: gradePass };
}

export function handleResize(renderer, composer, camera) {
  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
}
