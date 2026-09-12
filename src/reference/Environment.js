import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { WORLD } from './BiomeManager.js';

function waterNormals(size = 128) {
  const data = new Uint8Array(size * size * 4);
  const normal = new THREE.Vector3();
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size * Math.PI * 2, v = y / size * Math.PI * 2;
    // Analytic derivatives of periodic waves: seamless in both texture axes.
    const dx = .22 * Math.cos(3 * u + 2 * v) + .12 * Math.cos(7 * u - 4 * v);
    const dy = .15 * Math.cos(3 * u + 2 * v) - .09 * Math.cos(7 * u - 4 * v);
    normal.set(-dx, -dy, 1).normalize();
    const i = (y * size + x) * 4;
    data[i] = Math.round((normal.x * .5 + .5) * 255);
    data[i + 1] = Math.round((normal.y * .5 + .5) * 255);
    data[i + 2] = Math.round((normal.z * .5 + .5) * 255); data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true; texture.repeat.set(24, 24); texture.needsUpdate = true;
  return texture;
}

/** Owns lighting, sky IBL, water and postprocessing, but not renderer/camera. */
export class Environment {
  constructor({ scene, renderer, camera, ambientOcclusion = true, pixelRatio = 1.5 }) {
    this.scene = scene; this.renderer = renderer; this.camera = camera;
    this.pixelRatio = pixelRatio; this.disposed = false;
    this.previous = { background: scene.background, environment: scene.environment, environmentIntensity: scene.environmentIntensity, fog: scene.fog,
      toneMapping: renderer.toneMapping, exposure: renderer.toneMappingExposure,
      outputColorSpace: renderer.outputColorSpace, shadows: renderer.shadowMap.enabled,
      shadowType: renderer.shadowMap.type, pixelRatio: renderer.getPixelRatio() };
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    scene.background = new THREE.Color('#9fc8e0'); scene.fog = new THREE.Fog('#9fc8e0', 320, 850);
    this.sun = new THREE.DirectionalLight('#fff0d3', 3.2);
    this.sun.position.set(-110, 180, 65); this.sun.castShadow = true;
    const shadowSize = Math.min(2048, renderer.capabilities.maxTextureSize);
    this.sun.shadow.mapSize.set(shadowSize, shadowSize);
    Object.assign(this.sun.shadow.camera, { left: -190, right: 190, top: 190, bottom: -190, near: 1, far: 500 });
    this.sun.shadow.camera.updateProjectionMatrix();
    this.sun.shadow.normalBias = .15; this.sun.shadow.bias = -.00015;
    this.fill = new THREE.HemisphereLight('#d8edff', '#816343', .65);
    scene.add(this.sun, this.sun.target, this.fill);

    // PMREM is generated once. Water and tech towers receive actual sky reflections.
    const skyScene = new THREE.Scene(), sky = new Sky();
    sky.scale.setScalar(1000);
    const uniforms = sky.material.uniforms;
    uniforms.turbidity.value = 2.5; uniforms.rayleigh.value = 1.3;
    uniforms.mieCoefficient.value = .004; uniforms.mieDirectionalG.value = .8;
    uniforms.sunPosition.value.copy(this.sun.position).normalize(); skyScene.add(sky);
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.skyTarget = pmrem.fromScene(skyScene, .04, .1, 2000);
    scene.environment = this.skyTarget.texture;
    scene.environmentIntensity = .25;
    pmrem.dispose(); sky.geometry.dispose(); sky.material.dispose();

    this.normals = waterNormals();
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(256, 256), new THREE.MeshStandardMaterial({
      color: '#147aab', roughness: .19, metalness: .12, envMapIntensity: 1.7,
      normalMap: this.normals, normalScale: new THREE.Vector2(.55, .55),
    }));
    this.water.name = 'shared-river-and-backwaters';
    this.water.rotation.x = -Math.PI / 2; this.water.position.y = WORLD.waterY;
    this.water.receiveShadow = true; scene.add(this.water);
    // One continuous surface; land columns occlude it and carve the winding banks.
    // Opaque water avoids transparent sorting and depth/SSAO disagreements.
    this.composer = new EffectComposer(renderer);
    this.renderPass = new RenderPass(scene, camera); this.composer.addPass(this.renderPass);
    if (ambientOcclusion) {
      this.ao = new SSAOPass(scene, camera, 1, 1, 16);
      this.ao.kernelRadius = 3; this.ao.minDistance = .001; this.ao.maxDistance = .04;
      this.composer.addPass(this.ao);
    }
    // Tone mapping and output conversion occur once, after AO in linear color space.
    this.output = new OutputPass(); this.composer.addPass(this.output);
  }
  resize(width, height, devicePixelRatio = window.devicePixelRatio || 1) {
    if (this.disposed) return;
    const w = Math.max(1, width), h = Math.max(1, height);
    const ratio = Math.max(.5, Math.min(devicePixelRatio, this.pixelRatio));
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(ratio); this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(ratio); this.composer.setSize(w, h);
  }
  update(seconds) {
    this.normals.offset.set((seconds * .012) % 1, (seconds * .007) % 1);
  }
  render(deltaSeconds) { if (!this.disposed) this.composer.render(deltaSeconds); }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.water.removeFromParent(); this.water.geometry.dispose(); this.water.material.dispose(); this.normals.dispose();
    this.sun.removeFromParent(); this.sun.target.removeFromParent(); this.fill.removeFromParent();
    this.sun.shadow.dispose();
    this.composer.passes.forEach(pass => pass.dispose()); this.composer.dispose();
    Object.assign(this.scene, { background: this.previous.background, environment: this.previous.environment, environmentIntensity: this.previous.environmentIntensity, fog: this.previous.fog });
    this.skyTarget.dispose();
    this.renderer.toneMapping = this.previous.toneMapping; this.renderer.toneMappingExposure = this.previous.exposure;
    this.renderer.outputColorSpace = this.previous.outputColorSpace;
    this.renderer.shadowMap.enabled = this.previous.shadows; this.renderer.shadowMap.type = this.previous.shadowType;
    this.renderer.setPixelRatio(this.previous.pixelRatio);
  }
}
