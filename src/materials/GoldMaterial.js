import * as THREE from 'three';

// Bright gold with slight underwater patina — visible gold domes in reference
export function createGoldMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color:           0xd4a52a,
    metalness:       0.92,
    roughness:       0.18,
    emissive:        0x3a2200,
    emissiveIntensity: 0.4,
    envMapIntensity: 2.2,
  });

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common> varying vec3 vWP;`)
      .replace('#include <project_vertex>', `#include <project_vertex> vWP=(modelMatrix*vec4(transformed,1.0)).xyz;`);

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWP;
        float hG(vec3 p){p=fract(p*0.31+0.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
        float nG(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
          return mix(mix(mix(hG(i),hG(i+vec3(1,0,0)),f.x),mix(hG(i+vec3(0,1,0)),hG(i+vec3(1,1,0)),f.x),f.y),
                     mix(mix(hG(i+vec3(0,0,1)),hG(i+vec3(1,0,1)),f.x),mix(hG(i+vec3(0,1,1)),hG(i+vec3(1,1,1)),f.x),f.y),f.z);}
      `)
      .replace('#include <color_fragment>', `
        #include <color_fragment>
        float patina = nG(vWP * 0.3) * 0.5 + nG(vWP * 1.5) * 0.5;
        patina = smoothstep(0.4, 0.75, patina);
        // Subtle green-gold patina but keep it mostly golden like reference
        vec3 verdegris = vec3(0.20, 0.38, 0.25);
        diffuseColor.rgb = mix(diffuseColor.rgb, verdegris, patina * 0.28);
        // Bright highlight areas stay warm gold
        float highlight = nG(vWP * 2.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.75, 0.15), highlight * 0.15);
      `);
  };

  return mat;
}
