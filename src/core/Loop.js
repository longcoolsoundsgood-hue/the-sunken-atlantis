export class Loop {
  constructor(updateCallback) {
    this.updateCallback = updateCallback;
    this.running = false;
    this.lastTime = 0;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this._tick);
  }

  stop() {
    this.running = false;
  }

  _tick(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.updateCallback(dt, now / 1000);
    requestAnimationFrame(this._tick);
  }
}
