/**
 * ArchitectureKit.js
 * AAA-grade modular architecture generators for Atlantis.
 * Every function produces intentional, reference-matched geometry.
 */
import * as THREE from 'three';
import { mulberry32, randRange } from '../utils/MathUtils.js';
import { createDoricColumn } from './ColumnGenerator.js';

// ─── GEOMETRY PRIMITIVES ────────────────────────────────────────────────────

function makeDome(radius, segments = 20, hemiRatio = 0.55) {
  return new THREE.SphereGeometry(radius, segments, Math.ceil(segments * 0.6),
    0, Math.PI * 2, 0, Math.PI * hemiRatio);
}

function makeCylinder(rTop, rBot, h, segs = 12) {
  return new THREE.CylinderGeometry(rTop, rBot, h, segs);
}

function makeBox(w, h, d) {
  return new THREE.BoxGeometry(w, h, d);
}

// Column with capital
function addColumn(parent, x, y, z, r, h, mat, segs = 10) {
  const shaft = new THREE.Mesh(makeCylinder(r * 0.88, r, h, segs), mat);
  shaft.position.set(x, y + h / 2, z);
  shaft.castShadow = true;
  parent.add(shaft);
  // Echinus
  const cap = new THREE.Mesh(makeCylinder(r * 1.4, r * 0.9, h * 0.12, segs), mat);
  cap.position.set(x, y + h + h * 0.06, z);
  parent.add(cap);
  // Abacus slab
  const ab = new THREE.Mesh(makeBox(r * 2.8, h * 0.08, r * 2.8), mat);
  ab.position.set(x, y + h + h * 0.14, z);
  parent.add(ab);
}

// Byzantine tower with gold dome
function addTower(parent, x, z, baseY, height, radius, marbleMat, goldMat) {
  const g = new THREE.Group();
  // Tapered shaft
  const shaft = new THREE.Mesh(makeCylinder(radius * 0.82, radius, height, 12), marbleMat);
  shaft.position.y = height / 2;
  shaft.castShadow = true;
  g.add(shaft);
  // Belt / entablature ring
  const belt = new THREE.Mesh(makeCylinder(radius * 1.05, radius * 1.0, height * 0.06, 12), marbleMat);
  belt.position.y = height * 0.6;
  g.add(belt);
  // Drum
  const drum = new THREE.Mesh(makeCylinder(radius * 1.0, radius * 1.0, height * 0.14, 14), marbleMat);
  drum.position.y = height;
  g.add(drum);
  // Gold dome
  const dome = new THREE.Mesh(makeDome(radius * 1.1, 16, 0.6), goldMat);
  dome.position.y = height + height * 0.07;
  dome.castShadow = true;
  g.add(dome);
  // Finial spire
  const spire = new THREE.Mesh(makeCylinder(0.05, radius * 0.18, height * 0.28, 8), goldMat);
  spire.position.y = height + height * 0.07 + radius * 1.1 * 0.6 + height * 0.14;
  g.add(spire);
  g.position.set(x, baseY, z);
  parent.add(g);
}

// Colonnade ring around a point at baseY
function addColonnadeRing(parent, cx, cz, radius, colH, count, mat, baseY = 0) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const x = cx + Math.cos(a) * radius;
    const z = cz + Math.sin(a) * radius * 0.9;
    addColumn(parent, x, baseY, z, 0.55, colH, mat, 10);
    // Entablature segment
    const nextA = ((i + 1) / count) * Math.PI * 2;
    const nx = cx + Math.cos(nextA) * radius;
    const nz = cz + Math.sin(nextA) * radius * 0.9;
    const midX = (x + nx) / 2, midZ = (z + nz) / 2;
    const dist = Math.hypot(nx - x, nz - z);
    const lintel = new THREE.Mesh(makeBox(dist * 0.98, 0.55, 0.55), mat);
    lintel.position.set(midX, baseY + colH + 0.275, midZ);
    lintel.rotation.y = Math.atan2(nz - z, nx - x);
    parent.add(lintel);
  }
}

// Stepped platform / krepidoma
function addSteppedPlatform(parent, w, d, steps, stepH, mat) {
  for (let i = 0; i < steps; i++) {
    const sw = w - i * 2.5;
    const sd = d - i * 2.5;
    if (sw <= 0 || sd <= 0) break;
    const b = new THREE.Mesh(makeBox(sw, stepH, sd), mat);
    b.position.y = i * stepH + stepH / 2;
    b.receiveShadow = true;
    b.castShadow = true;
    parent.add(b);
  }
}

// Arched gateway (torus arch + posts)
function addArch(parent, x, z, angle, w, h, mat, goldMat) {
  const g = new THREE.Group();
  const hw = w / 2;
  [-hw, hw].forEach(ox => {
    const post = new THREE.Mesh(makeCylinder(0.9, 1.1, h * 1.6, 8), mat);
    post.position.set(ox, h * 0.8, 0);
    post.castShadow = true;
    g.add(post);
    const capDome = new THREE.Mesh(makeDome(1.3, 10, 0.55), goldMat);
    capDome.position.set(ox, h * 1.6, 0);
    g.add(capDome);
  });
  const archTorus = new THREE.Mesh(
    new THREE.TorusGeometry(hw * 0.9, 0.6, 8, 18, Math.PI), mat);
  archTorus.position.set(0, h * 1.35, 0);
  archTorus.castShadow = true;
  g.add(archTorus);
  g.position.set(x, 0, z);
  g.rotation.y = angle;
  parent.add(g);
}

// ─── LEVEL 1: CENTRAL CITADEL ───────────────────────────────────────────────

export function addCentralCitadel(root, marbleMat, goldMat) {
  const g = new THREE.Group();
  g.name = 'CentralCitadel';

  // Raised hill mound under citadel
  const hill = new THREE.Mesh(
    new THREE.SphereGeometry(100, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.35), marbleMat);
  hill.position.y = -8;
  hill.receiveShadow = true;
  g.add(hill);

  // ── 7-tier stepped pyramid base ──────────────────────────────────────────
  const tierCount = 7;
  const baseW = 110;
  const baseD = 95;
  const tierH = 9;
  const taper = 0.81;
  const tierYs = [];

  for (let i = 0; i < tierCount; i++) {
    const sc = Math.pow(taper, i);
    const tw = baseW * sc;
    const td = baseD * sc;
    const tier = new THREE.Mesh(makeBox(tw, tierH, td), marbleMat);
    const ty = i * tierH + tierH / 2;
    tier.position.y = ty;
    tier.castShadow = true;
    tier.receiveShadow = true;
    g.add(tier);
    tierYs.push(i * tierH + tierH);

    // Colonnade on each tier face (except top)
    if (i < tierCount - 2) {
      const colH = tierH * 0.85;
      const colR = 0.5;
      const frontCols = Math.max(4, Math.floor(tw / 9));
      const sideCols  = Math.max(4, Math.floor(td / 9));
      // Front face colonnade
      for (let c = 0; c < frontCols; c++) {
        const cx = -tw / 2 + (tw / (frontCols + 1)) * (c + 1);
        addColumn(g, cx, tierYs[i], td / 2 - 0.3, colR, colH, marbleMat, 8);
        addColumn(g, cx, tierYs[i], -td / 2 + 0.3, colR, colH, marbleMat, 8);
      }
      // Side colonnades
      for (let c = 0; c < sideCols; c++) {
        const cz = -td / 2 + (td / (sideCols + 1)) * (c + 1);
        addColumn(g, tw / 2 - 0.3, tierYs[i], cz, colR, colH, marbleMat, 8);
        addColumn(g, -tw / 2 + 0.3, tierYs[i], cz, colR, colH, marbleMat, 8);
      }
      // Entablature frieze band
      const friezeH = colH + 1.2;
      for (let face = 0; face < 4; face++) {
        const fa = face * Math.PI / 2;
        const fw = face % 2 === 0 ? tw : td;
        const fz = face % 2 === 0 ? td / 2 : tw / 2;
        const fMesh = new THREE.Mesh(makeBox(fw, 1.1, 0.7), marbleMat);
        if (face % 2 === 0) {
          fMesh.position.set(0, tierYs[i] + friezeH, (face < 2 ? 1 : -1) * fz);
        } else {
          fMesh.position.set((face === 1 ? 1 : -1) * fz, tierYs[i] + friezeH, 0);
          fMesh.rotation.y = Math.PI / 2;
        }
        g.add(fMesh);
      }
    }
  }

  // ── Grand stairways on all 4 sides ───────────────────────────────────────
  const totalH = tierCount * tierH;
  const stepCount = 22;
  const stairW = baseW * 0.30;
  [
    { dx: 0, dz: 1 }, { dx: 0, dz: -1 },
    { dx: 1, dz: 0 }, { dx: -1, dz: 0 },
  ].forEach(dir => {
    for (let s = 0; s < stepCount; s++) {
      const stepH = totalH / stepCount;
      const sw = stairW * (1 - s / stepCount * 0.45);
      const stepGeo = dir.dx !== 0
        ? makeBox(stepH * 0.75, stepH * 0.85, sw)
        : makeBox(sw, stepH * 0.85, stepH * 0.75);
      const step = new THREE.Mesh(stepGeo, marbleMat);
      const offset = (dir.dx !== 0 ? baseW : baseD) * 0.5 + (stepCount - s) * stepH * 0.75;
      step.position.set(
        dir.dx * offset, s * stepH + stepH / 2,
        dir.dz * offset
      );
      step.castShadow = true;
      step.receiveShadow = true;
      g.add(step);
      // Balustrade pillars
      if (s % 3 === 0) {
        const bh = stepH * 3.5;
        const bx = dir.dx !== 0 ? dir.dx * offset : offset * 0 + sw / 2 + 0.6;
        [-1, 1].forEach(side => {
          const pillar = new THREE.Mesh(makeCylinder(0.22, 0.28, bh, 6), marbleMat);
          if (dir.dx !== 0) {
            pillar.position.set(dir.dx * offset, s * stepH + bh / 2, side * sw / 2);
          } else {
            pillar.position.set(side * sw / 2, s * stepH + bh / 2, dir.dz * offset);
          }
          g.add(pillar);
        });
      }
    }
  });

  // ── Main palace hall on top ───────────────────────────────────────────────
  const palY = totalH;
  const topSc = Math.pow(taper, tierCount - 1);
  const topW = baseW * topSc;
  const topD = baseD * topSc;
  addMainPalace(g, palY, topW, topD, marbleMat, goldMat);

  root.add(g);
}

function addMainPalace(parent, baseY, topW, topD, marbleMat, goldMat) {
  // Main hall body
  const hall = new THREE.Mesh(makeBox(topW * 0.92, topW * 0.5, topD * 0.82), marbleMat);
  hall.position.y = baseY + topW * 0.25;
  hall.castShadow = true;
  parent.add(hall);

  // Second storey
  const hall2 = new THREE.Mesh(makeBox(topW * 0.68, topW * 0.28, topD * 0.58), marbleMat);
  hall2.position.y = baseY + topW * 0.5 + topW * 0.14;
  hall2.castShadow = true;
  parent.add(hall2);

  // Colonnade ring around hall at ground level
  addColonnadeRing(parent, 0, 0, topW * 0.52, topW * 0.42, 24, marbleMat, baseY);

  // Second colonnade ring around 2nd storey
  addColonnadeRing(parent, 0, 0, topW * 0.38, topW * 0.22, 16, marbleMat, baseY + topW * 0.5);

  // Entablature frieze
  const friezeY = baseY + topW * 0.5 + 0.7;
  [-1, 1].forEach(side => {
    const fz = side * topD * 0.41;
    const fr = new THREE.Mesh(makeBox(topW * 0.92, 1.4, 0.9), marbleMat);
    fr.position.set(0, friezeY, fz);
    parent.add(fr);
    const fr2 = new THREE.Mesh(makeBox(0.9, 1.4, topD * 0.82), marbleMat);
    fr2.position.set(side * topW * 0.46, friezeY, 0);
    parent.add(fr2);
  });

  // Central grand dome
  const dR = topW * 0.28;
  const domeY = baseY + topW * 0.5 + topW * 0.28;
  const domeDrum = new THREE.Mesh(makeCylinder(dR * 1.08, dR * 1.05, topW * 0.1, 22), marbleMat);
  domeDrum.position.y = domeY;
  parent.add(domeDrum);
  // Drum windows (decorative band)
  for (let w = 0; w < 12; w++) {
    const wa = (w / 12) * Math.PI * 2;
    const wb = new THREE.Mesh(makeBox(1.8, topW * 0.08, 0.4), marbleMat);
    wb.position.set(Math.cos(wa) * dR * 1.06, domeY, Math.sin(wa) * dR * 1.06);
    wb.rotation.y = wa;
    parent.add(wb);
  }
  const mainDome = new THREE.Mesh(makeDome(dR, 26, 0.62), goldMat);
  mainDome.position.y = domeY + topW * 0.1;
  mainDome.castShadow = true;
  parent.add(mainDome);
  // Grand spire
  const spireH = topW * 0.7;
  const spire = new THREE.Mesh(makeCylinder(0.5, dR * 0.22, spireH, 10), goldMat);
  spire.position.y = domeY + topW * 0.1 + dR * 0.62 + spireH / 2;
  spire.castShadow = true;
  parent.add(spire);
  // Spire orb
  const orb = new THREE.Mesh(new THREE.SphereGeometry(dR * 0.12, 10, 8), goldMat);
  orb.position.y = domeY + topW * 0.1 + dR * 0.62 + spireH + dR * 0.12;
  parent.add(orb);

  // 4 corner towers with gold domes
  const cornerR = topW * 0.41;
  [0.25, 0.75, 1.25, 1.75].forEach(frac => {
    const a = frac * Math.PI;
    const cx = Math.cos(a) * cornerR * 0.78;
    const cz = Math.sin(a) * cornerR * 0.78;
    addTower(parent, cx, cz, baseY, topW * 0.62, topW * 0.13, marbleMat, goldMat);
  });

  // 8 secondary domes arranged around main dome
  const secR2 = topD * 0.32;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const sx = Math.cos(a) * secR2;
    const sz = Math.sin(a) * secR2 * 0.85;
    const secDR = topW * 0.085;
    const secH = baseY + topW * 0.5 + topW * 0.12;
    const secDrum = new THREE.Mesh(makeCylinder(secDR, secDR, topW * 0.06, 10), marbleMat);
    secDrum.position.set(sx, secH, sz);
    parent.add(secDrum);
    const secDome = new THREE.Mesh(makeDome(secDR * 1.2, 12, 0.58), goldMat);
    secDome.position.set(sx, secH + topW * 0.06, sz);
    secDome.castShadow = true;
    parent.add(secDome);
  }

  // Ceremonial entrance portico (south)
  const porticoY = baseY;
  const porticoW = topW * 0.55;
  const porticoD = topD * 0.18;
  const portico = new THREE.Mesh(makeBox(porticoW, topW * 0.22, porticoD), marbleMat);
  portico.position.set(0, porticoY + topW * 0.11, topD * 0.41 + porticoD / 2);
  parent.add(portico);
  // 6-column portico façade
  for (let c = 0; c < 6; c++) {
    const cx = -porticoW * 0.42 + c * (porticoW * 0.84 / 5);
    addColumn(parent, cx, porticoY, topD * 0.41 + porticoD, 0.6, topW * 0.21, marbleMat, 10);
  }
  // Pediment triangle
  const pedGeo = new THREE.BufferGeometry();
  const pedVerts = new Float32Array([
    -porticoW / 2, 0, 0,
     porticoW / 2, 0, 0,
     0, topW * 0.12, 0,
  ]);
  pedGeo.setAttribute('position', new THREE.BufferAttribute(pedVerts, 3));
  pedGeo.setIndex([0, 1, 2]);
  pedGeo.computeVertexNormals();
  const pediment = new THREE.Mesh(pedGeo, marbleMat);
  pediment.position.set(0, porticoY + topW * 0.22, topD * 0.41 + porticoD);
  parent.add(pediment);
}

// ─── CONCENTRIC RING WALLS ───────────────────────────────────────────────────

export function addConcentricRingWalls(root, R, marbleMat, goldMat) {
  const rings = [
    { r: R * 0.22, h: 20, t: 4.0, towers: 8,  merlons: true },
    { r: R * 0.50, h: 15, t: 3.5, towers: 12, merlons: true },
    { r: R * 0.80, h: 11, t: 3.0, towers: 16, merlons: true },
  ];
  const segs = 72;

  rings.forEach(({ r, h, t, towers, merlons }) => {
    // Outer cylinder wall
    const outer = new THREE.Mesh(
      new THREE.CylinderGeometry(r + t / 2, r + t / 2, h, segs, 1, true), marbleMat);
    outer.position.y = h / 2;
    outer.castShadow = true;
    root.add(outer);
    // Inner cylinder wall
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(r - t / 2, r - t / 2, h, segs, 1, true), marbleMat);
    inner.position.y = h / 2;
    root.add(inner);
    // Top walk ring
    const top = new THREE.Mesh(
      new THREE.RingGeometry(r - t / 2, r + t / 2, segs), marbleMat);
    top.rotation.x = -Math.PI / 2;
    top.position.y = h;
    root.add(top);

    // Crenellations
    if (merlons) {
      const mc = Math.floor(r * 0.35);
      for (let m = 0; m < mc; m++) {
        const a = (m / mc) * Math.PI * 2;
        const mx = Math.cos(a) * r, mz = Math.sin(a) * r;
        const merlon = new THREE.Mesh(makeBox(t * 0.7, h * 0.18, 1.4), marbleMat);
        merlon.position.set(mx, h + h * 0.09, mz);
        merlon.rotation.y = a;
        root.add(merlon);
      }
    }

    // Ring road (channel between walls) — decorative concentric path
    const roadGeo = new THREE.RingGeometry(r - t / 2, r + t / 2, segs);
    const road = new THREE.Mesh(roadGeo, marbleMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.05;
    root.add(road);

    // Towers at equally-spaced positions
    for (let t2 = 0; t2 < towers; t2++) {
      const a = (t2 / towers) * Math.PI * 2;
      const tx = Math.cos(a) * r, tz = Math.sin(a) * r;
      addTower(root, tx, tz, 0, h * 1.65, t * 2.2, marbleMat, goldMat);
    }
  });
}

// ─── RADIAL BRIDGES ──────────────────────────────────────────────────────────

export function addRadialBridges(root, R, marbleMat) {
  const spokeCount = 6;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    addSpoke(root, angle, R, marbleMat);
  }
}

function addSpoke(root, angle, R, mat) {
  const g = new THREE.Group();
  const roadLen = R * 0.88;
  const roadW = 9;

  // Road deck
  const road = new THREE.Mesh(makeBox(roadW, 1.0, roadLen), mat);
  road.position.set(0, 0.5, roadLen / 2);
  road.receiveShadow = true;
  g.add(road);

  // Elevated bridge arches every ~30 units
  const archCount = Math.floor(roadLen / 30);
  for (let a = 0; a < archCount; a++) {
    const az = (a / archCount) * roadLen + 15;
    const archGeo = new THREE.TorusGeometry(roadW * 0.48, 0.55, 6, 14, Math.PI);
    const arch = new THREE.Mesh(archGeo, mat);
    arch.position.set(0, 0.5, az);
    arch.rotation.z = Math.PI;
    g.add(arch);
  }

  // Balustrade pillars
  for (let p = 0; p < 28; p++) {
    const pz = (p / 28) * roadLen + 5;
    [-roadW / 2 - 0.6, roadW / 2 + 0.6].forEach(px => {
      const pillar = new THREE.Mesh(makeCylinder(0.2, 0.25, 2.8, 6), mat);
      pillar.position.set(px, 0.5 + 1.4, pz);
      pillar.castShadow = true;
      g.add(pillar);
      // Railing cap
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 4), mat);
      cap.position.set(px, 0.5 + 2.8, pz);
      g.add(cap);
    });
    // Railing beam
    if (p < 27) {
      const nextPz = ((p + 1) / 28) * roadLen + 5;
      const railLen = Math.abs(nextPz - pz);
      [-roadW / 2 - 0.6, roadW / 2 + 0.6].forEach(px => {
        const rail = new THREE.Mesh(makeBox(0.15, 0.2, railLen), mat);
        rail.position.set(px, 0.5 + 2.8, (pz + nextPz) / 2);
        g.add(rail);
      });
    }
  }

  // Landmark arch gate at each ring crossing
  [R * 0.22, R * 0.50, R * 0.80].forEach(ringR => {
    const agw = 14;
    const aGeo = new THREE.TorusGeometry(agw * 0.45, 0.85, 8, 16, Math.PI);
    const archGate = new THREE.Mesh(aGeo, mat);
    archGate.position.set(0, 10, ringR);
    g.add(archGate);
  });

  g.rotation.y = -angle + Math.PI / 2;
  root.add(g);
}

// ─── LEVEL 2: INNER RING DISTRICT ────────────────────────────────────────────

export function addInnerRingDistrict(root, R, marbleMat, goldMat) {
  const rng = mulberry32(101);
  const rMin = R * 0.23, rMax = R * 0.49;
  const count = 55;

  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const r = rMin + rng() * (rMax - rMin);
    if (nearBridge(angle, r, 6, rMax)) continue;

    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const g = new THREE.Group();
    const t = Math.floor(rng() * 3);

    if (t === 0) {
      // Grand columned temple
      buildTemple(g, 18 + rng() * 16, 13 + rng() * 10, marbleMat, goldMat);
    } else if (t === 1) {
      // Domed civic hall
      buildDomicHall(g, 12 + rng() * 10, 10 + rng() * 8, marbleMat, goldMat);
    } else {
      // Administrative tower cluster
      buildTowerCluster(g, marbleMat, goldMat, rng);
    }

    g.position.set(x, 0, z);
    g.rotation.y = angle + Math.PI / 2;
    root.add(g);
  }
}

export function addMidRingDistrict(root, R, marbleMat, goldMat) {
  const rng = mulberry32(202);
  const rMin = R * 0.51, rMax = R * 0.79;
  const count = 80;

  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const r = rMin + rng() * (rMax - rMin);
    if (nearBridge(angle, r, 6, rMax)) continue;

    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const g = new THREE.Group();
    const t = Math.floor(rng() * 4);

    if (t === 0) {
      buildDomicHall(g, 8 + rng() * 8, 7 + rng() * 6, marbleMat, goldMat);
    } else if (t === 1) {
      buildSmallTemple(g, 10 + rng() * 8, marbleMat);
    } else if (t === 2) {
      buildTower(g, 3 + rng() * 3, 10 + rng() * 14, marbleMat, goldMat);
    } else {
      buildResidentialBlock(g, 6 + rng() * 8, 4 + rng() * 4, marbleMat, goldMat, rng);
    }

    g.position.set(x, 0, z);
    g.rotation.y = angle + Math.PI / 2;
    root.add(g);
  }
}

// ─── LEVEL 3: OUTER RING DISTRICT ────────────────────────────────────────────

export function addOuterRingDistrict(root, R, marbleMat, goldMat) {
  const rng = mulberry32(303);
  const rMin = R * 0.81, rMax = R * 0.98;
  const count = 45;

  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const r = rMin + rng() * (rMax - rMin);
    if (nearBridge(angle, r, 6, rMax)) continue;

    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const g = new THREE.Group();
    const t = Math.floor(rng() * 3);

    if (t === 0) {
      buildTower(g, 2 + rng() * 2, 8 + rng() * 10, marbleMat, goldMat);
    } else if (t === 1) {
      buildSmallTemple(g, 7 + rng() * 6, marbleMat);
    } else {
      buildWarehouse(g, 8 + rng() * 8, 3 + rng() * 3, marbleMat);
    }

    g.position.set(x, 0, z);
    g.rotation.y = angle + Math.PI / 2;
    root.add(g);
  }
}

// ─── LEVEL 4: OUTER PERIMETER WALLS ──────────────────────────────────────────

export function addOuterPerimeterWalls(root, R, marbleMat, goldMat) {
  const wr = R * 1.0;
  const wh = 10;
  const segs = 96;

  // Double wall — outer
  const outerWall = new THREE.Mesh(
    new THREE.CylinderGeometry(wr + 2, wr + 2, wh, segs, 1, true), marbleMat);
  outerWall.position.y = wh / 2;
  outerWall.castShadow = true;
  root.add(outerWall);
  // Inner face
  const innerWall = new THREE.Mesh(
    new THREE.CylinderGeometry(wr - 2, wr - 2, wh, segs, 1, true), marbleMat);
  innerWall.position.y = wh / 2;
  root.add(innerWall);
  // Top walkway
  const topWalk = new THREE.Mesh(new THREE.RingGeometry(wr - 2, wr + 2, segs), marbleMat);
  topWalk.rotation.x = -Math.PI / 2;
  topWalk.position.y = wh;
  root.add(topWalk);

  // Crenellations on outer perimeter
  const mc = Math.floor(wr * 0.28);
  for (let m = 0; m < mc; m++) {
    const a = (m / mc) * Math.PI * 2;
    const merlon = new THREE.Mesh(makeBox(4, wh * 0.2, 1.8), marbleMat);
    merlon.position.set(Math.cos(a) * wr, wh + wh * 0.1, Math.sin(a) * wr);
    merlon.rotation.y = a;
    root.add(merlon);
  }

  // 6 monumental gates
  for (let g = 0; g < 6; g++) {
    const angle = (g / 6) * Math.PI * 2;
    const gx = Math.cos(angle) * wr;
    const gz = Math.sin(angle) * wr;
    addArch(root, gx, gz, angle + Math.PI / 2, 16, wh, marbleMat, goldMat);
  }

  // 24 guard towers
  for (let t = 0; t < 24; t++) {
    const angle = (t / 24) * Math.PI * 2;
    addTower(root, Math.cos(angle) * wr, Math.sin(angle) * wr, 0, wh * 2.0, 4.2, marbleMat, goldMat);
  }
}

// ─── BUILDING TYPES ──────────────────────────────────────────────────────────

function buildTemple(parent, w, d, marbleMat, goldMat) {
  // 3-step krepidoma
  addSteppedPlatform(parent, w + 4, d + 4, 3, 1.0, marbleMat);
  const baseY = 3.0;
  // Cella walls
  const cellaW = w * 0.55, cellaD = d * 0.65;
  const wh = d * 0.55;
  [
    [0, cellaD / 2, cellaW, 0],
    [0, -cellaD / 2, cellaW, 0],
    [cellaW / 2, 0, 0.55, Math.PI / 2],
    [-cellaW / 2, 0, 0.55, Math.PI / 2],
  ].forEach(([cx, cz, len, ry]) => {
    const wall = new THREE.Mesh(
      ry === 0 ? makeBox(len, wh, 0.55) : makeBox(0.55, wh, cellaD), marbleMat);
    wall.position.set(cx, baseY + wh / 2, cz);
    wall.castShadow = true;
    parent.add(wall);
  });
  // Peristyle columns
  const frontCols = Math.max(4, Math.floor(w / 5));
  const sideCols = Math.max(4, Math.floor(d / 5));
  for (let c = 0; c < frontCols; c++) {
    const cx = -w / 2 + (w / (frontCols - 1)) * c;
    addColumn(parent, cx, baseY, d / 2, 0.55, wh, marbleMat, 10);
    addColumn(parent, cx, baseY, -d / 2, 0.55, wh, marbleMat, 10);
  }
  for (let c = 1; c < sideCols - 1; c++) {
    const cz = -d / 2 + (d / (sideCols - 1)) * c;
    addColumn(parent, w / 2, baseY, cz, 0.55, wh, marbleMat, 10);
    addColumn(parent, -w / 2, baseY, cz, 0.55, wh, marbleMat, 10);
  }
  // Pitched roof pediment
  const roofH = d * 0.22;
  const roofGeo = new THREE.BufferGeometry();
  const rv = new Float32Array([
    -w / 2, 0, -d / 2,  w / 2, 0, -d / 2,  0, roofH, 0,
    -w / 2, 0,  d / 2,  w / 2, 0,  d / 2,  0, roofH, 0,
    -w / 2, 0, -d / 2, -w / 2, 0,  d / 2, -w / 2, roofH * 0, 0,
     w / 2, 0, -d / 2,  w / 2, 0,  d / 2,  w / 2, roofH * 0, 0,
  ]);
  // Simplified roof with 2 sloping faces
  const roofL = new THREE.Mesh(makeBox(w + 0.5, 0.7, d + 0.5), marbleMat);
  roofL.position.y = baseY + wh + 0.35;
  parent.add(roofL);
  // Front/rear pediment triangles
  [-1, 1].forEach(side => {
    const pedW = w + 1;
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, pedW / 2, roofH, 3), marbleMat);
    ped.position.set(0, baseY + wh + 0.7 + roofH / 2, side * (d / 2 + 0.25));
    ped.rotation.y = Math.PI / 6;
    ped.rotation.z = Math.PI / 2;
    parent.add(ped);
  });
  // Roof ridge beam
  const ridge = new THREE.Mesh(makeBox(w * 1.05, 0.5, 1.0), marbleMat);
  ridge.position.y = baseY + wh + 0.7 + roofH;
  parent.add(ridge);
}

function buildSmallTemple(parent, w, marbleMat) {
  const d = w * 0.7;
  addSteppedPlatform(parent, w, d, 2, 0.7, marbleMat);
  const baseY = 1.4;
  const colH = w * 0.42;
  const colCount = 4;
  for (let c = 0; c < colCount; c++) {
    const cx = -w / 2 + (w / (colCount - 1)) * c;
    addColumn(parent, cx, baseY, d / 2, 0.38, colH, marbleMat, 8);
    addColumn(parent, cx, baseY, -d / 2, 0.38, colH, marbleMat, 8);
  }
  const hall = new THREE.Mesh(makeBox(w * 0.7, colH * 0.9, d * 0.6), marbleMat);
  hall.position.y = baseY + colH * 0.45;
  parent.add(hall);
  // Small dome
  const domeR = w * 0.18;
  const dome = new THREE.Mesh(makeDome(domeR, 12, 0.55), marbleMat);
  dome.position.y = baseY + colH * 0.9;
  parent.add(dome);
}

function buildDomicHall(parent, w, h, marbleMat, goldMat) {
  // Raised platform
  const plat = new THREE.Mesh(makeBox(w + 2, 1.2, w * 0.85 + 2), marbleMat);
  plat.position.y = 0.6;
  plat.receiveShadow = true;
  parent.add(plat);
  // Main body
  const body = new THREE.Mesh(makeBox(w, h, w * 0.85), marbleMat);
  body.position.y = 1.2 + h / 2;
  body.castShadow = true;
  parent.add(body);
  // Colonnade around body
  const colCount = Math.max(4, Math.floor(w / 4.5));
  const sideCount = Math.max(3, Math.floor(w * 0.85 / 4.5));
  for (let c = 0; c < colCount; c++) {
    const cx = -w / 2 + (w / (colCount - 1)) * c;
    addColumn(parent, cx, 1.2, w * 0.425, 0.45, h * 0.92, marbleMat, 8);
    addColumn(parent, cx, 1.2, -w * 0.425, 0.45, h * 0.92, marbleMat, 8);
  }
  for (let c = 1; c < sideCount - 1; c++) {
    const cz = -w * 0.425 + (w * 0.85 / (sideCount - 1)) * c;
    addColumn(parent, w / 2, 1.2, cz, 0.45, h * 0.92, marbleMat, 8);
    addColumn(parent, -w / 2, 1.2, cz, 0.45, h * 0.92, marbleMat, 8);
  }
  // Drum + dome
  const dR = w * 0.25;
  const drumH = h * 0.2;
  const dY = 1.2 + h;
  const drum = new THREE.Mesh(makeCylinder(dR, dR, drumH, 14), marbleMat);
  drum.position.y = dY;
  parent.add(drum);
  const dome = new THREE.Mesh(makeDome(dR * 1.15, 16, 0.6), goldMat);
  dome.position.y = dY + drumH;
  dome.castShadow = true;
  parent.add(dome);
  // Secondary domes (4 corner mini-domes)
  const sdR = w * 0.1;
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
    const sdrum = new THREE.Mesh(makeCylinder(sdR, sdR, h * 0.1, 10), marbleMat);
    sdrum.position.set(sx * w * 0.32, 1.2 + h, sz * w * 0.32 * 0.85);
    parent.add(sdrum);
    const sdome = new THREE.Mesh(makeDome(sdR * 1.2, 10, 0.55), goldMat);
    sdome.position.set(sx * w * 0.32, 1.2 + h + h * 0.1, sz * w * 0.32 * 0.85);
    parent.add(sdome);
  });
}

function buildTower(parent, r, h, marbleMat, goldMat) {
  const shaft = new THREE.Mesh(makeCylinder(r * 0.85, r, h, 10), marbleMat);
  shaft.position.y = h / 2;
  shaft.castShadow = true;
  parent.add(shaft);
  // Belt ring
  const belt = new THREE.Mesh(makeCylinder(r * 1.12, r * 1.08, h * 0.07, 10), marbleMat);
  belt.position.y = h * 0.62;
  parent.add(belt);
  // Drum
  const drum = new THREE.Mesh(makeCylinder(r * 1.05, r * 1.05, h * 0.12, 10), marbleMat);
  drum.position.y = h;
  parent.add(drum);
  // Gold dome
  const dome = new THREE.Mesh(makeDome(r * 1.2, 14, 0.58), goldMat);
  dome.position.y = h + h * 0.06;
  dome.castShadow = true;
  parent.add(dome);
  // Finial
  const finial = new THREE.Mesh(makeCylinder(0.04, r * 0.16, h * 0.22, 6), goldMat);
  finial.position.y = h + h * 0.06 + r * 1.2 * 0.58 + h * 0.11;
  parent.add(finial);
}

function buildTowerCluster(parent, marbleMat, goldMat, rng) {
  const towers = 3 + Math.floor(rng() * 3);
  const clusterR = 8 + rng() * 6;
  for (let i = 0; i < towers; i++) {
    const a = (i / towers) * Math.PI * 2;
    const r = 1.5 + rng() * 2;
    const h = 8 + rng() * 16;
    const sub = new THREE.Group();
    buildTower(sub, r, h, marbleMat, goldMat);
    sub.position.set(Math.cos(a) * clusterR * 0.5, 0, Math.sin(a) * clusterR * 0.5);
    parent.add(sub);
  }
}

function buildResidentialBlock(parent, w, h, marbleMat, goldMat, rng) {
  const body = new THREE.Mesh(makeBox(w, h, w * 0.75), marbleMat);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  parent.add(body);
  // Flat roof terrace with low wall
  const terrace = new THREE.Mesh(makeBox(w + 0.5, 0.5, w * 0.75 + 0.5), marbleMat);
  terrace.position.y = h + 0.25;
  parent.add(terrace);
  // Small dome or tower on one corner
  if (rng() > 0.5) {
    const dr = w * 0.15;
    const dome = new THREE.Mesh(makeDome(dr, 10, 0.55), goldMat);
    dome.position.set(w * 0.3, h + 0.5, 0);
    parent.add(dome);
  }
  // Arched windows (decorative insets)
  for (let side = 0; side < 2; side++) {
    for (let win = 0; win < 3; win++) {
      const wx = -w * 0.3 + win * w * 0.3;
      const wy = h * 0.4;
      const archR = w * 0.06;
      const archGeo = new THREE.TorusGeometry(archR, archR * 0.18, 5, 8, Math.PI);
      const winArch = new THREE.Mesh(archGeo, marbleMat);
      winArch.position.set(wx, wy + archR, side === 0 ? w * 0.375 : -w * 0.375);
      parent.add(winArch);
    }
  }
}

function buildWarehouse(parent, w, h, marbleMat) {
  const body = new THREE.Mesh(makeBox(w, h, w * 0.5), marbleMat);
  body.position.y = h / 2;
  body.castShadow = true;
  parent.add(body);
  // Shed roof
  const roofGeo = new THREE.CylinderGeometry(0.1, w * 0.55, h * 0.3, 3);
  const roof = new THREE.Mesh(roofGeo, marbleMat);
  roof.position.y = h + h * 0.15;
  roof.rotation.y = Math.PI / 6;
  roof.rotation.z = Math.PI / 2;
  parent.add(roof);
}

// ─── DEBRIS ───────────────────────────────────────────────────────────────────

export function addDebrisField(root, R, mat) {
  const g = new THREE.Group();
  g.name = 'Debris';
  for (let i = 0; i < 80; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * R * 0.95;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const type = Math.floor(Math.random() * 3);
    let geo;
    if (type === 0) {
      // Fallen column drum
      geo = makeCylinder(0.8 + Math.random() * 0.6, 1.0 + Math.random() * 0.4, 1.5 + Math.random() * 2, 10);
    } else if (type === 1) {
      geo = makeBox(2 + Math.random() * 5, 0.7 + Math.random() * 1.5, 1.5 + Math.random() * 3);
    } else {
      geo = new THREE.IcosahedronGeometry(0.8 + Math.random() * 1.5, 0);
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, (Math.random() - 0.6) * 1.5, z);
    mesh.rotation.set(
      (Math.random() - 0.5) * 1.2, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.9);
    mesh.castShadow = true;
    g.add(mesh);
  }
  root.add(g);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function nearBridge(angle, r, bridgeCount, rMax) {
  for (let b = 0; b < bridgeCount; b++) {
    const bAngle = (b / bridgeCount) * Math.PI * 2;
    const diff = Math.abs(((angle - bAngle + Math.PI) % (Math.PI * 2)) - Math.PI);
    if (diff < 0.13 && r < rMax * 0.96) return true;
  }
  return false;
}
