import * as THREE from 'three';

const noiseGLSL = `
  float hash(vec3 p){
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x){
    vec3 i = floor(x), f = fract(x);
    f = f*f*(3.0-2.0*f);
    return mix(
      mix(mix(hash(i),             hash(i+vec3(1,0,0)),f.x),
          mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
          mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p){
    float v=0.0, a=0.5;
    for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.1; a*=0.5; }
    return v;
  }
`;

// ─── Aged white Pentelic marble with veining, algae staining, barnacle micro-detail ──
export function createMarbleMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color:     0xc8c4bc,
    roughness: 0.45,
    metalness: 0.03,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    mat.userData.shader = shader;

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vWorldPos    = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vWorldNormal = normalize((modelMatrix * vec4(objectNormal, 0.0)).xyz);`);

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        ${noiseGLSL}`)
      .replace('#include <roughnessmap_fragment>', `
        #include <roughnessmap_fragment>
        // Algae in crevices — rougher in recesses
        float algae = fbm(vWorldPos * 0.18 + 0.5);
        roughnessFactor = mix(roughnessFactor, 0.9, algae * 0.35);
      `)
      .replace('#include <color_fragment>', `
        #include <color_fragment>

        // --- Primary veining ---
        float v1 = fbm(vWorldPos * 0.25);
        float v2 = fbm(vWorldPos * 0.9  + vec3(3.1, 0.7, -2.4));
        float vein = smoothstep(0.38, 0.60, v1 * 0.6 + v2 * 0.4);

        // White base with cream highlights
        vec3 marbleBase  = vec3(0.78, 0.76, 0.72);
        vec3 veinColor   = vec3(0.52, 0.50, 0.48);
        diffuseColor.rgb = mix(marbleBase, veinColor, vein * 0.55);

        // --- Algae / biofilm stain (green-brown in crevices) ---
        float depth = 1.0 - abs(vWorldNormal.y); // more on vertical faces
        float algaeMask = smoothstep(0.3, 0.75, fbm(vWorldPos * 0.12) + depth * 0.3);
        vec3 algaeColor = vec3(0.18, 0.26, 0.14);
        diffuseColor.rgb = mix(diffuseColor.rgb, algaeColor, algaeMask * 0.40);

        // --- Barnacle micro-texture (bright speckles on horizontal surfaces) ---
        float barnacle = step(0.74, noise(vWorldPos * 4.5));
        barnacle *= max(0.0, vWorldNormal.y); // only top-facing
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.88, 0.84, 0.78), barnacle * 0.45);

        // --- Wet sheen near base ---
        float wetness = smoothstep(3.0, 0.0, vWorldPos.y);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.6, wetness * 0.5);
      `);
  };

  return mat;
}

// ─── Dark, oxidised, damage-heavy marble for ruins ───────────────────────────
export function createDarkMarbleMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color:     0x7a7870,
    roughness: 0.68,
    metalness: 0.01,
  });

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWorldPos2;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vWorldPos2 = (modelMatrix * vec4(transformed, 1.0)).xyz;`);

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWorldPos2;
        ${noiseGLSL}`)
      .replace('#include <color_fragment>', `
        #include <color_fragment>
        float grime = fbm(vWorldPos2 * 0.2);
        diffuseColor.rgb = mix(diffuseColor.rgb * 0.5, diffuseColor.rgb * 1.1, grime);
        // Coral/rust streaks
        vec3 rust = vec3(0.35, 0.18, 0.08);
        float rustMask = smoothstep(0.55, 0.85, fbm(vWorldPos2 * 0.35 + vec3(1.7)));
        diffuseColor.rgb = mix(diffuseColor.rgb, rust, rustMask * 0.35);
      `);
  };

  return mat;
}
