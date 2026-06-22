import * as THREE from 'three';

class AssetLoaderImpl {
  constructor() {
    this.manager = new THREE.LoadingManager();
    this.textureLoader = new THREE.TextureLoader(this.manager);
    this.cache = new Map();
  }

  loadTexture(url, { srgb = false, repeat = [1, 1] } = {}) {
    if (this.cache.has(url)) return this.cache.get(url);
    const tex = this.textureLoader.load(url);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(url, tex);
    return tex;
  }

  onProgress(callback) {
    this.manager.onProgress = callback;
  }

  onLoad(callback) {
    this.manager.onLoad = callback;
  }
}

export const AssetLoader = new AssetLoaderImpl();
