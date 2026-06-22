import * as THREE from 'three';

export function createTerrain(radius, material) {
  const segments = 180;
  const size     = radius * 3.2;
  const geo      = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;

  function hash(x, z) {
    const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function noise(x, z) {
    const ix = Math.floor(x), iz = Math.floor(z);
    const fx = x - ix, fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
    return (
      hash(ix,   iz)   * (1-ux) * (1-uz) +
      hash(ix+1, iz)   * ux     * (1-uz) +
      hash(ix,   iz+1) * (1-ux) * uz     +
      hash(ix+1, iz+1) * ux     * uz
    );
  }
  function fbm(x, z) {
    let v = 0, a = 0.5, freq = 1;
    for (let i = 0; i < 7; i++) { v += a * noise(x * freq, z * freq); freq *= 2.1; a *= 0.48; }
    return v;
  }

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const r = Math.hypot(x, z);
    // Multi-octave height
    const h = (fbm(x * 0.006, z * 0.006) - 0.5) * 24
            + (fbm(x * 0.025, z * 0.025) - 0.5) * 5
            + (fbm(x * 0.08,  z * 0.08)  - 0.5) * 1.5;
    // Flatten city footprint, slight bowl/depression for ancient city
    const cityFlat = Math.exp(-r * r / (radius * radius * 0.02));
    const hillRidge = Math.exp(-r * r / (radius * radius * 0.0012)) * 8; // central hill
    pos.setY(i, h * (1 - cityFlat) - cityFlat * 2.0 + hillRidge);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  mesh.name = 'OceanFloor';
  return mesh;
}
