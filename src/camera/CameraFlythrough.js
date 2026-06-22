import * as THREE from 'three';

const PATHS = [
  {
    name: 'GodViewApproach',
    points: [[-200, 340, 560], [-80, 240, 360], [20, 170, 200], [0, 140, 120]],
    focus: new THREE.Vector3(0, 30, 0),
    duration: 22,
  },
  {
    name: 'CitadelCloseup',
    points: [[100, 100, 320], [50, 70, 180], [0, 50, 80], [-30, 42, 40]],
    focus: new THREE.Vector3(0, 60, 0),
    duration: 18,
  },
  {
    name: 'WallGlide',
    points: [[-300, 50, 120], [-200, 35, 70], [-100, 22, 10], [0, 20, -80]],
    focus: new THREE.Vector3(0, 18, 0),
    duration: 16,
  },
  {
    name: 'CenterOrbit',
    points: [[180, 65, 0], [0, 68, 180], [-180, 65, 0], [0, 68, -180], [180, 65, 0]],
    focus: new THREE.Vector3(0, 35, 0),
    duration: 24,
  },
  {
    name: 'PalaceSwoop',
    points: [[60, 200, 200], [20, 140, 100], [-20, 90, 40], [0, 60, -20]],
    focus: new THREE.Vector3(0, 80, 0),
    duration: 16,
  },
];

export class CameraFlythrough {
  constructor(camera) {
    this.camera = camera;
    this.curves = PATHS.map(p => ({
      ...p,
      curve: new THREE.CatmullRomCurve3(p.points.map(pt => new THREE.Vector3(...pt))),
    }));
    this.totalDuration = this.curves.reduce((s, p) => s + p.duration, 0);
    this.elapsed = 0;
    this.active  = false;
  }

  start() { this.elapsed = 0; this.active = true; }
  stop()  { this.active = false; }

  update(dt) {
    if (!this.active) return;
    this.elapsed += dt;
    let t = this.elapsed % this.totalDuration;
    for (const seg of this.curves) {
      if (t <= seg.duration) {
        const u = THREE.MathUtils.smoothstep(t / seg.duration, 0, 1);
        const pt = seg.curve.getPointAt(Math.min(u, 0.9999));
        this.camera.position.copy(pt);
        this.camera.lookAt(seg.focus);
        return;
      }
      t -= seg.duration;
    }
  }
}
