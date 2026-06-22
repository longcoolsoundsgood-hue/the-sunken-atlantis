import * as THREE from 'three';

const noiseGLSL = `
  float hashF(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noiseF(vec2 p){
    vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hashF(i),hashF(i+vec2(1,0)),f.x),mix(hashF(i+vec2(0,1)),hashF(i+vec2(1,1)),f.x),f.y);}
  float fbmF(vec2 p){float v=0.,a=0.5;for(int i=0;i<6;i++){v+=a*noiseF(p);p*=2.1;a*=0.5;}return v;}
  float hash3(vec3 p){p=fract(p*0.31+0.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
  float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
    return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
`;

export function createOceanFloorMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color:     0x4a3c28,
    roughness: 0.96,
    metalness: 0.0,
  });

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common> varying vec3 vWPF; varying vec3 vWNF;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vWPF=(modelMatrix*vec4(transformed,1.0)).xyz;
        vWNF=normalize((modelMatrix*vec4(objectNormal,0.0)).xyz);`);

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWPF; varying vec3 vWNF;
        ${noiseGLSL}`)
      .replace('#include <color_fragment>', `
        #include <color_fragment>

        // Large-scale sediment variation
        float macro = fbmF(vWPF.xz * 0.008);
        // Fine sand ripples
        float ripple = sin(vWPF.x * 0.9 + vWPF.z * 0.6) * 0.5 + 0.5;
        ripple *= noiseF(vWPF.xz * 0.4);
        // Micro pebble scatter
        float pebble = step(0.72, n3(vWPF * 2.5));

        vec3 sand     = vec3(0.52, 0.44, 0.30);
        vec3 darkSilt = vec3(0.18, 0.15, 0.10);
        vec3 pebbleC  = vec3(0.40, 0.38, 0.34);
        vec3 moss     = vec3(0.15, 0.22, 0.12);

        // Layer them
        vec3 c = mix(darkSilt, sand, macro);
        c = mix(c, c * 1.25, ripple * 0.4);
        c = mix(c, pebbleC,  pebble * 0.5);
        // Moss in low spots
        float mossDepth = smoothstep(0.6, 0.0, vWPF.y + fbmF(vWPF.xz * 0.05) * 4.0);
        c = mix(c, moss, mossDepth * 0.45);

        diffuseColor.rgb = c;
      `);
  };

  return mat;
}
