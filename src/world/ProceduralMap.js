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

    const INDIA_MAP = [
      "                      HHH                         ",
      "                     HHHHH                        ",
      "                    HHHHHHH                       ",
      "                    HHHHHHH                       ",
      "                   HHHHHHHHH                      ",
      "                  HHHHHHHHHHH                     ",
      "                  HHHHHHHHHHH                     ",
      "                 HHHHHHHHHHHHH                    ",
      "                HHHHHHHHHHHHHHH                   ",
      "               HHHHHHHHHHHHHHHHHH                 ",
      "               HHHHHHHHHHHHHHHHHHH                ",
      "             DDDHHHHPPPPPPPHHHHHHHH               ",
      "            DDDDDDPPPPPPPPPPHHHHHHHH              ",
      "           DDDDDDDPPPPPPPPPPPPHHHHHHH    NNNN     ",
      "          DDDDDDDDPPPPPPPPPPPPPHHHHHHH  NNNNNN    ",
      "         DDDDDDDDDPPPPPPPPPPPPPPHHHHHHHHNNNNNNN   ",
      "        DDDDDDDDDDPPPPPPPPPPPPPPPPHHHHHHNNNNNNNN  ",
      "       DDDDDDDDDDDPPPPPPPPPPPPPPPPPPHHHNNNNNNNNN  ",
      "      DDDDDDDDDDDDPPPPPPPPPPPPPPPPPPPPNNNNNNNNNN  ",
      "     DDDDDDDDDDDDDPPPPPPPPPPPPPPPPPPPPPNNNNNNNN   ",
      "    DDDDDDDDDDDDDDPPPPPPPPPPPPPPPPPPPPP NNNNN     ",
      "   DDDDDDDDDDDDDPPPPPPPPPPPPPPPPPPPPPPP           ",
      "   DDDDDDDDDDDPPPPPPPPPPPPPPPPPPPPPPPP            ",
      "    DDDDDDDPPPPPPPPPPPPPPPPPPPPPPPPPPP            ",
      "      DDPPPPPPPPPPPPPPPPPPPPPPPPPPPPP             ",
      "        PPPPPPPPPPPPPPPPPPPPPPPPPPPP              ",
      "         PPPPPPPPPPPPPPPPPPPPPPPPPP               ",
      "          PPPPPPPPPPPPPPPPPPPPPPPP                ",
      "          PPPPPPPPPPPPPPPPPPPPPPP                 ",
      "           PPPPPPPPPPPPPPPPPPPPPP                 ",
      "           PPPPPPPPPPPPPPPPPPPPP                  ",
      "            PPPPPPPPPPPPPPPPPPPP                  ",
      "            PPPPPPPPPPPPPPPPPPP                   ",
      "             PPPPPPPPPPPPPPPPP                    ",
      "             PPPPPPPPPPPPPPPP                     ",
      "              PPPPPPPPPPPPPP                      ",
      "              PPPPPPPPPPPPP                       ",
      "               PPPPPPPPPPPP                       ",
      "               PPPPPPPPPPP                        ",
      "                PPPPPPPPP                         ",
      "                PPPPPPPP                          ",
      "                 PPPPPP                           ",
      "                 PPPPP                            ",
      "                  PPP                             ",
      "                  PPP                             ",
      "                   P                              "
    ];

    let count = 0;
    const rows = INDIA_MAP.length;
    const cols = INDIA_MAP[0].length;
    
    // Center offset
    const offsetX = cols / 2;
    const offsetZ = rows / 2;

    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (count >= maxInstances) break;

        const char = INDIA_MAP[z][x];
        if (char === ' ') continue;

        // Skip some voxels for texture
        if (Math.random() < 0.1) continue;

        let h = 1;
        let hexColor = 0xffffff;

        switch(char) {
          case 'H': // Himalayas
            h = Math.floor(Math.random() * 4) + 3;
            hexColor = Math.random() > 0.5 ? 0xffffff : 0xdddddd;
            break;
          case 'D': // Desert
            h = Math.floor(Math.random() * 2) + 1;
            hexColor = Math.random() > 0.5 ? 0xf57c00 : 0xffb74d;
            break;
          case 'P': // Peninsula / Central
            h = Math.floor(Math.random() * 3) + 1;
            // Add regional variation
            if (x < cols/2 && z > rows/2) {
               hexColor = Math.random() > 0.5 ? 0x2e7d32 : 0x4caf50; // Western Ghats / Kerala
            } else if (z < rows/2) {
               hexColor = Math.random() > 0.5 ? 0xffa726 : 0x8d6e63; // Central India
            } else {
               hexColor = Math.random() > 0.5 ? 0x66bb6a : 0x8d6e63; // East coast / Deccan
            }
            break;
          case 'N': // Northeast
            h = Math.floor(Math.random() * 3) + 2;
            hexColor = Math.random() > 0.5 ? 0x388e3c : 0x1b5e20;
            break;
        }

        // Add edge water rarely
        if (Math.random() < 0.05 && char !== 'H') {
            h = 1;
            hexColor = 0x81d4fa;
        }

        const worldX = x - offsetX;
        const worldZ = z - offsetZ;

        // Stack voxels up to height
        for (let y = 0; y < h; y++) {
          if (count >= maxInstances) break;
          
          dummy.position.set(worldX, y, worldZ);
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
    
    this.mapMesh.count = count;
    this.mapMesh.instanceMatrix.needsUpdate = true;
    this.mapMesh.instanceColor.needsUpdate = true;
    this.group.add(this.mapMesh);
  }

  createParticles() {
    const particleCount = 150; // Reduced count for a cleaner look
    const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    // Subtle, elegant colors for the cream background
    const material = new THREE.MeshLambertMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.6 
    });
    
    this.particles = new THREE.InstancedMesh(geometry, material, particleCount);
    
    this.particleData = [];
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    
    // Soft golds, warm whites, and light terracotta
    const colors = [0xffd700, 0xffffff, 0xffe0b2, 0xffab91]; 
    
    for (let i = 0; i < particleCount; i++) {
      const radius = 30 + Math.random() * 40;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 50;
      const speed = (Math.random() * 0.002 + 0.001) * (Math.random() > 0.5 ? 1 : -1);
      const floatSpeed = Math.random() * 0.01 + 0.005;
      
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

    if (this.particles) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < this.particleData.length; i++) {
        const data = this.particleData[i];
        data.angle += data.speed;
        data.y += data.floatSpeed;
        
        if (data.y > 35) data.y = -35;
        
        dummy.position.set(Math.cos(data.angle) * data.radius, data.y, Math.sin(data.angle) * data.radius);
        dummy.rotation.x += 0.01;
        dummy.rotation.y += 0.02;
        dummy.updateMatrix();
        
        this.particles.setMatrixAt(i, dummy.matrix);
      }
      this.particles.instanceMatrix.needsUpdate = true;
    }
  }

  setVisible(visible) {
    this.group.visible = visible;
  }
}
