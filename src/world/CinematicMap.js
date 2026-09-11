import * as THREE from 'three';

export class CinematicMap {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    
    // Base colors for regions mimicking the image
    const colors = [
      0x4a7c59, // Kerala/South (Green)
      0xffa500, // Maharashtra/West (Orange)
      0xd81b60, // Central (Magenta/Pink)
      0xe53935, // North/Delhi (Red)
      0x43a047, // East (Green)
      0xfbc02d, // Punjab (Yellow)
      0x1e88e5  // Coast/Water borders (Blue)
    ];

    // Procedural generation of a stylized, contiguous India map
    // We will build it on a grid, using a simple masking function to approximate the shape
    const gridSize = 1.0;
    const width = 60;
    const height = 70;
    
    // Calculate total valid voxels to size the InstancedMesh correctly
    let validCount = 0;
    const validPositions = [];
    
    for (let x = -width / 2; x < width / 2; x++) {
      for (let z = -height / 2; z < height / 2; z++) {
        // Simple shape approximation (diamond-ish with wider top)
        const nx = x / (width / 2);
        const nz = z / (height / 2);
        
        // Very basic mask for "India" shape
        let mask = false;
        if (nz > 0) {
          // South (tapering triangle)
          if (Math.abs(nx) < (1.0 - nz) * 0.7) mask = true;
        } else {
          // North (wider, diamond top)
          if (Math.abs(nx) < (1.0 + nz * 1.5) * 0.9) mask = true;
        }
        
        // Add some noise/fracturing at the edges
        if (mask && Math.random() > 0.1) {
          const depth = Math.floor(Math.random() * 3) + 1;
          for (let y = 0; y < depth; y++) {
            validPositions.push({ x: x * gridSize, y: y * gridSize, z: z * gridSize, nx, nz });
            validCount++;
          }
        }
      }
    }

    // Create InstancedMesh
    const geometry = new THREE.BoxGeometry(gridSize, gridSize, gridSize);
    // Bevel edges for voxel look using a simple standard material
    const material = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      metalness: 0.1,
    });
    
    this.mesh = new THREE.InstancedMesh(geometry, material, validCount + 500); // 500 extra for landmarks
    
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    
    let i = 0;
    for (const pos of validPositions) {
      dummy.position.set(pos.x, pos.y, pos.z);
      
      // Random slight scale variation
      const scale = 0.95;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      
      this.mesh.setMatrixAt(i, dummy.matrix);
      
      // Assign regional colors based on normalized coordinates
      let regionIndex = 0;
      if (pos.nz > 0.4) regionIndex = 0; // South
      else if (pos.nx < -0.3 && pos.nz < 0.2) regionIndex = 1; // West
      else if (pos.nz > -0.2 && pos.nz <= 0.4) regionIndex = 2; // Central
      else if (pos.nz < -0.5) regionIndex = 3; // North
      else if (pos.nx > 0.3) regionIndex = 4; // East
      else regionIndex = 5;
      
      // Add a bit of color noise
      color.setHex(colors[regionIndex]);
      color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
      
      this.mesh.setColorAt(i, color);
      i++;
    }

    // Store base count before landmarks
    this.baseCount = i;
    
    // Add some "landmarks" as taller voxel stacks
    const addLandmark = (x, z, height, hexColor, widthScale=1) => {
      for(let y=0; y<height; y++) {
        dummy.position.set(x, y, z);
        dummy.scale.set(widthScale, 1, widthScale);
        dummy.updateMatrix();
        this.mesh.setMatrixAt(i, dummy.matrix);
        color.setHex(hexColor);
        this.mesh.setColorAt(i, color);
        i++;
      }
    };

    // Red Fort (North)
    addLandmark(0, -25, 8, 0xb71c1c, 1.5);
    addLandmark(-1, -25, 6, 0xb71c1c);
    addLandmark(1, -25, 6, 0xb71c1c);
    
    // Mumbai Skyline (West)
    addLandmark(-15, -5, 12, 0x90caf9, 1.2);
    addLandmark(-13, -6, 15, 0xe3f2fd, 1.0);
    addLandmark(-16, -4, 9, 0xbbdefb, 1.0);

    // Temple Gopuram (South)
    addLandmark(0, 20, 4, 0xffa000, 2);
    addLandmark(0, 21, 3, 0xffa000, 1.5);
    addLandmark(0, 22, 2, 0xffa000, 1.0);

    // Howrah Bridge (East)
    addLandmark(15, -10, 6, 0xb0bec5);
    addLandmark(20, -10, 6, 0xb0bec5);
    
    this.mesh.count = i; // Update final count
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
    
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.group.add(this.mesh);
    this.scene.add(this.group);
  }

  update(time) {
    // Subtle sine-wave bobbing
    this.group.position.y = Math.sin(time * 0.5) * 1.5;
    // Primary slow rotation
    this.group.rotation.y = time * 0.05;
  }

  setVisible(visible) {
    this.group.visible = visible;
  }
}
