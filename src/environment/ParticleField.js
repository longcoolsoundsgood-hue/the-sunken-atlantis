import * as THREE from 'three';

// ─── Marine snow: slow-falling organic particles + rising bioluminescent motes ─
const vertexShader = `
  uniform float uTime;
  uniform float uSize;
  attribute float aSpeed;
  attribute float aOffset;
  attribute float aType;   // 0=snow, 1=biolum mote
  varying float vType;
  varying float vAlpha;

  void main(){
    vType = aType;
    vec3 pos = position;

    if(aType < 0.5){
      // Marine snow — slow diagonal fall with gentle drift
      float t = mod(uTime * aSpeed + aOffset, 120.0);
      pos.y -= t;                                       // fall downward
      pos.x += sin(uTime * 0.18 + aOffset * 2.3) * 2.8;
      pos.z += cos(uTime * 0.14 + aOffset * 1.7) * 2.2;
      vAlpha = 0.35 + aSpeed * 0.12;
    } else {
      // Bioluminescent motes — slow rise
      float t = mod(uTime * aSpeed * 0.4 + aOffset, 80.0);
      pos.y += t;
      pos.x += sin(uTime * 0.25 + aOffset) * 1.5;
      vAlpha = 0.7 + sin(uTime * 2.0 + aOffset * 5.0) * 0.3;
    }

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (80.0 / -mvPos.z);
    if(aType > 0.5) gl_PointSize *= 2.2;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragmentShader = `
  varying float vType;
  varying float vAlpha;

  void main(){
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.0, d) * vAlpha;

    vec3 color;
    if(vType < 0.5){
      // Marine snow — cool white
      color = vec3(0.82, 0.90, 0.96);
    } else {
      // Bioluminescent mote — cyan glow
      color = vec3(0.2, 1.0, 0.85);
      alpha *= 1.5;
    }
    gl_FragColor = vec4(color, alpha);
  }
`;

export function createParticleField({ count = 8000, areaRadius = 480 } = {}) {
  const snowCount  = Math.floor(count * 0.85);
  const moteCount  = count - snowCount;
  const total      = snowCount + moteCount;

  const positions = new Float32Array(total * 3);
  const speeds    = new Float32Array(total);
  const offsets   = new Float32Array(total);
  const types     = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const r     = Math.sqrt(Math.random()) * areaRadius;
    const theta = Math.random() * Math.PI * 2;
    positions[i*3]   = r * Math.cos(theta);
    positions[i*3+1] = Math.random() * 120 - 20;
    positions[i*3+2] = r * Math.sin(theta);
    speeds[i]   = 0.5 + Math.random() * 1.5;
    offsets[i]  = Math.random() * 120;
    types[i]    = i < snowCount ? 0 : 1;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSpeed',   new THREE.BufferAttribute(speeds,    1));
  geo.setAttribute('aOffset',  new THREE.BufferAttribute(offsets,   1));
  geo.setAttribute('aType',    new THREE.BufferAttribute(types,     1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSize: { value: 2.8 } },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.name = 'MarineSnow';
  return { points, material: mat };
}

export function updateParticles(material, time) {
  material.uniforms.uTime.value = time;
}
