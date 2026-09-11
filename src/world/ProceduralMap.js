import * as THREE from 'three';

export class ProceduralMap {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.createMap();
    this.createParticles();
  }

  createMap() {
    const maxInstances = 5000;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
    
    this.mapMesh = new THREE.InstancedMesh(geometry, material, maxInstances);
    this.mapMesh.castShadow = true;
    this.mapMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    let count = 0;
    const width = 60;
    const height = 70;

    for (let x = -width / 2; x < width / 2; x++) {
      for (let z = -height / 2; z < height / 2; z++) {
        if (count >= maxInstances) break;

        // Normalized coordinates
        const nx = x / (width / 2);
        const nz = z / (height / 2);

        // Approximate India shape (inverted triangle / diamond)
        let mask = false;
        if (nz > 0) {
          // South (tapering)
          if (Math.abs(nx) < (1.0 - nz) * 0.75) mask = true;
        } else {
          // North (wider top)
          if (Math.abs(nx) < (1.0 + nz * 1.2) * 0.85) mask = true;
        }

        if (mask && Math.random() > 0.15) {
          // Determine height and color based on region
          let h = 1;
          let hexColor = 0xffffff;

          if (nz < -0.4) {
            // North (Himalayas)
            h = Math.floor(Math.random() * 4) + 3; // Tall
            hexColor = Math.random() > 0.5 ? 0xffffff : 0xdddddd;
          } else if (nz > 0.3) {
            // South (Peninsula tip)
            h = Math.floor(Math.random() * 2) + 1; // Low
            hexColor = Math.random() > 0.5 ? 0x2e7d32 : 0x4caf50; // Lush greens
          } else {
            // Central
            h = Math.floor(Math.random() * 3) + 1; // Medium
            if (nx < -0.2) {
              hexColor = 0xf57c00; // West/Saffron
            } else if (nx > 0.2) {
              hexColor = 0x8d6e63; // East/Brown
            } else {
              hexColor = 0xffa726; // Central/Orange
            }
          }

          // Coastal edges (blue)
          const edgeDist = Math.abs(nx) / (nz > 0 ? (1.0 - nz) * 0.75 : (1.0 + nz * 1.2) * 0.85);
          if (edgeDist > 0.8 && Math.random() > 0.5) {
            h = 1;
            hexColor = 0x81d4fa;
          }

          // Stack voxels up to height
          for (let y = 0; y < h; y++) {
            if (count >= maxInstances) break;
            
            dummy.position.set(x, y, z);
            dummy.scale.set(0.95, 0.95, 0.95);
            dummy.updateMatrix();
            
            this.mapMesh.setMatrixAt(count, dummy.matrix);
            color.setHex(hexColor);
            
            // Add slight random color variation
            color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.05);
            this.mapMesh.setColorAt(count, color);
            
            count++;
          }
        }
      }
    }
    
    this.mapMesh.count = count;
    this.mapMesh.instanceMatrix.needsUpdate = true;
    this.mapMesh.instanceColor.needsUpdate = true;
    this.group.add(this.mapMesh);
  }

  createParticles() {
    const particleCount = 500;
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
    
    this.particles = new THREE.InstancedMesh(geometry, material, particleCount);
    
    this.particleData = [];
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    
    const colors = [0xff4081, 0xffd54f, 0x4fc3f7, 0x795548]; // pink, yellow, blue, brown
    
    for (let i = 0; i < particleCount; i++) {
      const radius = 25 + Math.random() * 50;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 40;
      const speed = (Math.random() * 0.005 + 0.001) * (Math.random() > 0.5 ? 1 : -1);
      const floatSpeed = Math.random() * 0.02 + 0.01;
      
      this.particleData.push({ radius, angle, y, speed, floatSpeed });
      
      dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.updateMatrix();
      
      this.particles.setMatrixAt(i, dummy.matrix);
      color.setHex(colors[Math.floor(Math.random() * colors.length)]);
      this.particles.setColorAt(i, color);
    }
    
    this.particles.instanceMatrix.needsUpdate = true;
    this.particles.instanceColor.needsUpdate = true;
    this.group.add(this.particles);
  }

  update(delta) {
    // Slow auto-rotation of the entire diorama
    this.group.rotation.y += 0.002;
    
    // Animate particles (drift upward and orbit)
    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.particleData.length; i++) {
      const data = this.particleData[i];
      data.angle += data.speed;
      data.y += data.floatSpeed;
      
      // Reset if too high
      if (data.y > 30) data.y = -30;
      
      dummy.position.set(Math.cos(data.angle) * data.radius, data.y, Math.sin(data.angle) * data.radius);
      dummy.rotation.x += 0.01;
      dummy.rotation.y += 0.02;
      dummy.updateMatrix();
      
      this.particles.setMatrixAt(i, dummy.matrix);
    }
    this.particles.instanceMatrix.needsUpdate = true;
  }

  setVisible(visible) {
    this.group.visible = visible;
  }
}
