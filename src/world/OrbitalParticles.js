import * as THREE from 'three';

export class OrbitalParticles {
  constructor(scene) {
    this.scene = scene;
    
    const particleCount = 3000;
    // Simple voxel geometry for particles
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshStandardMaterial({
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x4422ff,
      emissiveIntensity: 0.2
    });
    
    this.mesh = new THREE.InstancedMesh(geometry, material, particleCount);
    
    this.particleData = [];
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    
    const palette = [0xff9933, 0xffffff, 0x138808, 0xffb703, 0x8ecae6, 0xce93d8];
    
    for (let i = 0; i < particleCount; i++) {
      // Orbital parameters
      const radius = 30 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * 40;
      
      const speed = (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1);
      
      this.particleData.push({ radius, theta, yOffset, speed });
      
      dummy.position.set(
        Math.cos(theta) * radius,
        yOffset,
        Math.sin(theta) * radius
      );
      
      // Random rotation
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.updateMatrix();
      
      this.mesh.setMatrixAt(i, dummy.matrix);
      
      color.setHex(palette[Math.floor(Math.random() * palette.length)]);
      this.mesh.setColorAt(i, color);
    }
    
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
    
    this.scene.add(this.mesh);
  }

  update(time) {
    if (!this.mesh.visible) return;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.particleData.length; i++) {
      const data = this.particleData[i];
      data.theta += data.speed;
      
      dummy.position.set(
        Math.cos(data.theta) * data.radius,
        data.yOffset + Math.sin(time * 2 + i) * 2, // Slight individual bobbing
        Math.sin(data.theta) * data.radius
      );
      
      dummy.rotation.x += 0.01;
      dummy.rotation.y += 0.02;
      
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  setVisible(visible) {
    this.mesh.visible = visible;
  }
}
