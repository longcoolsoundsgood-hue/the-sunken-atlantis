import * as THREE from 'three';

// ─── Multi-layer analytic caustics with animated Voronoi + wave interference ──
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main(){
    vUv = uv;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  // Voronoi for sharp caustic pattern
  vec2 voronoi(vec2 x){
    vec2 n = floor(x);
    vec2 f = fract(x);
    float md = 8.0;
    vec2 mr;
    for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
      vec2 g = vec2(float(i),float(j));
      vec2 o = fract(sin(vec2(dot(n+g,vec2(127.1,311.7)),dot(n+g,vec2(269.5,183.3))))*43758.5453);
      o = 0.5 + 0.5*sin(uTime*0.9 + 6.2831*o);
      vec2 r = g + o - f;
      float d = dot(r,r);
      if(d<md){ md=d; mr=r; }
    }
    return vec2(sqrt(md), dot(mr,mr));
  }

  float causticLayer(vec2 uv, float speed, float scale){
    vec2 v = voronoi(uv * scale + uTime * speed);
    // Sharp bright edges of Voronoi = caustic lines
    return 1.0 - smoothstep(0.0, 0.22, v.x);
  }

  void main(){
    vec2 uv = vWorldPos.xz * 0.018;

    // Three layers at different scales/speeds for complexity
    float c1 = causticLayer(uv,  0.22,  9.0);
    float c2 = causticLayer(uv, -0.15, 14.0) * 0.6;
    float c3 = causticLayer(uv,  0.10, 22.0) * 0.35;

    float pattern = c1 + c2 + c3;
    pattern = pow(pattern, 1.8);

    // Depth attenuation based on world Y (lower = dimmer)
    float depthFade = smoothstep(-40.0, 20.0, vWorldPos.y);

    vec3 color = vec3(0.45, 0.92, 1.0) * pattern * depthFade;
    // Warm highlight for sunlit areas
    color += vec3(0.8, 0.95, 1.0) * max(0.0, pattern - 0.7) * depthFade;

    gl_FragColor = vec4(color, pattern * 0.55 * depthFade);
  }
`;

export function createCausticsPlane(size = 1200) {
  const geo = new THREE.PlaneGeometry(size, size, 1, 1);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.ShaderMaterial({
    uniforms:    { uTime: { value: 0 } },
    vertexShader,
    fragmentShader,
    transparent: true,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.08;
  mesh.renderOrder = 1;
  mesh.name = 'CausticsPlane';
  return { mesh, material: mat };
}

export function updateCaustics(material, time) {
  material.uniforms.uTime.value = time;
}
