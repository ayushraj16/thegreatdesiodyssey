import * as THREE from 'three';

// ── Sky gradient shader ───────────────────────────────────────────────────────
const SKY_VERT = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const SKY_FRAG = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uGround;
  varying vec3 vWorldPos;
  void main() {
    vec3 dir = normalize(vWorldPos);
    float h = dir.y;
    vec3 col;
    if (h > 0.0) {
      col = mix(uHorizon, uTop, pow(h, 0.6));
    } else {
      col = mix(uHorizon, uGround, pow(-h, 0.4));
    }
    gl_FragColor = vec4(col, 1.0);
  }
`;

export class Environment {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
  }

  init() {
    this._buildSky();
    this._buildClouds();
  }

  _buildSky() {
    const uniforms = {
      // Daylight Cyan Blue
      uTop: { value: new THREE.Color('#29b6f6') },
      uHorizon: { value: new THREE.Color('#81d4fa') },
      uGround: { value: new THREE.Color('#c8b080') }
    };
    const skyGeo = new THREE.SphereGeometry(200, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      uniforms,
      side: THREE.BackSide,
      depthWrite: false
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  _buildClouds() {
    const cloudMat = new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true });

    for (let i = 0; i < 20; i++) {
      const cloudGroup = new THREE.Group();

      // 3-5 voxels per cloud
      const numVoxels = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < numVoxels; j++) {
        const size = 1 + Math.random() * 2;
        const box = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), cloudMat);
        box.position.set(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 3
        );
        cloudGroup.add(box);
      }

      // Initial position
      cloudGroup.position.set(
        -150 + Math.random() * 300,
        35 + Math.random() * 10,
        -200 + Math.random() * 400
      );

      // Speed
      cloudGroup.userData.speed = 0.5 + Math.random() * 1.5;

      this.scene.add(cloudGroup);
      this.clouds.push(cloudGroup);
    }
  }

  update(elapsed, delta) {
    // Usually delta is not passed to environment in this project, we'll use delta if passed or fixed
    const dt = delta || 0.016;
    for (const cloud of this.clouds) {
      cloud.position.x += cloud.userData.speed * dt;
      // Wrap around boundaries (assuming map is roughly [-150, 150] in X)
      if (cloud.position.x > 150) {
        cloud.position.x = -150;
      }
    }
  }
}
