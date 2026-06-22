import * as THREE from 'three';
import { Config } from '../core/Config.js';
import { mulberry32 } from '../utils/MathUtils.js';
import { createCoralReef } from './CoralGenerator.js';
import { createSeaweedField } from './SeaweedGenerator.js';
import { createRockField } from './RockGenerator.js';
import { createTerrain } from './TerrainGenerator.js';
import {
  addCentralCitadel,
  addConcentricRingWalls,
  addRadialBridges,
  addInnerRingDistrict,
  addMidRingDistrict,
  addOuterRingDistrict,
  addOuterPerimeterWalls,
  addDebrisField,
} from './ArchitectureKit.js';

export function buildCity(materials) {
  const root = new THREE.Group();
  root.name = 'Atlantis';
  const R = Config.city.radius; // 320

  // ── Ocean floor terrain ──────────────────────────────────────────────────
  const terrain = createTerrain(R, materials.rock);
  root.add(terrain);

  // ── LEVEL 4: Outermost perimeter circular walls + gates ──────────────────
  addOuterPerimeterWalls(root, R, materials.marble, materials.gold);

  // ── LEVEL 3: Outer ring — smaller domed structures, watchtowers, walls ───
  addOuterRingDistrict(root, R, materials.marble, materials.gold);

  // ── Concentric ring walls (3 rings) ──────────────────────────────────────
  addConcentricRingWalls(root, R, materials.marble, materials.gold);

  // ── LEVEL 2: Inner ring — large palaces, temples, admin buildings ─────────
  addInnerRingDistrict(root, R, materials.marble, materials.gold);

  // ── LEVEL 2 MID: Mid ring buildings ──────────────────────────────────────
  addMidRingDistrict(root, R, materials.marble, materials.gold);

  // ── Radial avenues and bridges between rings ──────────────────────────────
  addRadialBridges(root, R, materials.marble);

  // ── LEVEL 1: Central mega-citadel ────────────────────────────────────────
  addCentralCitadel(root, materials.marble, materials.gold);

  // ── Debris and ruins scattered throughout ────────────────────────────────
  addDebrisField(root, R, materials.marble);

  // ── Coral, seaweed, rocks ────────────────────────────────────────────────
  const coral = createCoralReef({ count: Config.quality.coralInstances, areaRadius: R * 1.4, cityRadius: R });
  root.add(coral);
  const seaweed = createSeaweedField({ count: Config.quality.seaweedInstances, areaRadius: R * 1.3, material: materials.seaweed });
  root.add(seaweed);
  const rocks = createRockField({ count: Config.quality.rockInstances, areaRadius: R * 1.4, material: materials.rock });
  root.add(rocks);

  return root;
}
