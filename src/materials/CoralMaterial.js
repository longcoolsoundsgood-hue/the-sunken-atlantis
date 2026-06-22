import * as THREE from 'three';

const noiseGLSL = `
  float hashC(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float noiseC(vec3 x){
    vec3 i=floor(x),f=fract(x); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hashC(i),hashC(i+vec3(1,0,0)),f.x),mix(hashC(i+vec3(0,1,0)),hashC(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hashC(i+vec3(0,0,1)),hashC(i+vec3(1,0,1)),f.x),mix(hashC(i+vec3(0,1,1)),hashC(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbmC(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<4;i++){v+=a*noiseC(p);p*=2.1;a*=0.5;} return v; }
`;

// Palette: staghorn orange, brain coral purple, fan coral yellow, tube coral cyan
const CORAL_COLORS = [
  { base: 0xe8501a, emissive: 0x331005 }, // orange staghorn
  { base: 0xcc3388, emissive: 0x220a15 }, // pink brain
  { base: 0xf0c030, emissive: 0x221800 }, // golden cup
  { base: 0x22ddcc, emissive: 0x003322 }, // cyan tube (bioluminescent)
  { base: 0xff4444, emissive: 0x220000 }, // red fire coral
];

export function createCoralMaterial(index = 0) {
  const c = CORAL_COLORS[index % CORAL_COLORS.length];
  const mat = new THREE.MeshStandardMaterial({
    color:             c.base,
    roughness:         0.72,
    metalness:         0.0,
    emissive:          c.emissive,
    emissiveIntensity: 0.6,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    mat.userData.shader = shader;

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime;
        varying vec3 vWorldPosC;
        varying float vWave;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vWorldPosC = (modelMatrix * vec4(transformed, 1.0)).xyz;
        // Gentle polyp pulsation
        float pulse = sin(uTime * 1.4 + vWorldPosC.x * 0.8 + vWorldPosC.z * 0.6) * 0.012;
        vWave = pulse;`);

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWorldPosC;
        varying float vWave;
        ${noiseGLSL}`)
      .replace('#include <color_fragment>', `
        #include <color_fragment>
        float n = fbmC(vWorldPosC * 0.9);
        // Tip highlights (lighter at extremities)
        float tip = smoothstep(0.45, 0.65, n);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.5 + 0.12, tip * 0.6);
        // Base darkening (more pigment near substrate)
        float base = 1.0 - tip;
        diffuseColor.rgb *= mix(1.0, 0.6, base * 0.4);
      `)
      .replace('#include <emissivemap_fragment>', `
        #include <emissivemap_fragment>
        // Bioluminescent pulse at tips
        float glow = smoothstep(0.55, 0.75, fbmC(vWorldPosC * 1.2)) * (0.5 + vWave * 8.0);
        totalEmissiveRadiance += diffuseColor.rgb * glow * 0.35;
      `);
  };

  return mat;
}

export function updateCoralMaterials(materials, time) {
  for (const mat of materials) {
    if (mat.userData.shader) mat.userData.shader.uniforms.uTime.value = time;
  }
}
