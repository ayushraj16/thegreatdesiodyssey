import * as THREE from 'three';
import { buildVoxelMesh } from '../../engine/VoxelBuilder.js';

export class KarnatakaDistricts {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
  }

  init() {
    // 1. Hampi Stone Chariot (x: 10, z: -20)
    const chariotVoxels = [
      // Base
      ...[...Array(6)].flatMap((_,x) => [...Array(8)].map((_,z) => [x, 0, z, '#A0937D'])),
      // Wheels
      [0,0,1,'#8c7c66'], [0,1,1,'#8c7c66'], [0,0,2,'#8c7c66'], [0,1,2,'#8c7c66'],
      [0,0,5,'#8c7c66'], [0,1,5,'#8c7c66'], [0,0,6,'#8c7c66'], [0,1,6,'#8c7c66'],
      [5,0,1,'#8c7c66'], [5,1,1,'#8c7c66'], [5,0,2,'#8c7c66'], [5,1,2,'#8c7c66'],
      [5,0,5,'#8c7c66'], [5,1,5,'#8c7c66'], [5,0,6,'#8c7c66'], [5,1,6,'#8c7c66'],
      // Pillars
      [1,1,1,'#A0937D'], [1,2,1,'#A0937D'], [1,3,1,'#A0937D'],
      [4,1,1,'#A0937D'], [4,2,1,'#A0937D'], [4,3,1,'#A0937D'],
      [1,1,6,'#A0937D'], [1,2,6,'#A0937D'], [1,3,6,'#A0937D'],
      [4,1,6,'#A0937D'], [4,2,6,'#A0937D'], [4,3,6,'#A0937D'],
      // Roof
      ...[...Array(6)].flatMap((_,x) => [...Array(8)].map((_,z) => [x, 4, z, '#8c7c66'])),
      ...[...Array(4)].flatMap((_,x) => [...Array(6)].map((_,z) => [x+1, 5, z+1, '#A0937D'])),
      ...[...Array(2)].flatMap((_,x) => [...Array(4)].map((_,z) => [x+2, 6, z+2, '#8c7c66']))
    ];
    const chariotMesh = buildVoxelMesh(chariotVoxels, 0.4);
    chariotMesh.position.set(10, 0, -20);
    this.scene.add(chariotMesh);

    // 2. Mysore Palace Gates (x: -15, z: 10)
    const gateVoxels = [];
    const gateColor = '#E3D8C4'; // light cream
    const domeColor = '#D4AF37'; // gold
    // Two pillars
    for(let y=0; y<10; y++) {
      gateVoxels.push([0,y,0,gateColor], [1,y,0,gateColor], [0,y,1,gateColor], [1,y,1,gateColor]);
      gateVoxels.push([8,y,0,gateColor], [9,y,0,gateColor], [8,y,1,gateColor], [9,y,1,gateColor]);
    }
    // Domes on pillars
    gateVoxels.push([0,10,0,domeColor], [1,10,0,domeColor], [0,10,1,domeColor], [1,10,1,domeColor], [0.5, 11, 0.5, domeColor]);
    gateVoxels.push([8,10,0,domeColor], [9,10,0,domeColor], [8,10,1,domeColor], [9,10,1,domeColor], [8.5, 11, 0.5, domeColor]);
    // Archway
    for(let x=2; x<8; x++) {
      gateVoxels.push([x, 7, 0, gateColor]);
      if(x > 2 && x < 7) gateVoxels.push([x, 8, 0, gateColor]);
      if(x > 3 && x < 6) gateVoxels.push([x, 9, 0, gateColor]);
    }
    const gateMesh = buildVoxelMesh(gateVoxels, 0.4);
    gateMesh.position.set(-15, 0, 10);
    this.scene.add(gateMesh);

    // 3. Bengaluru Tech Towers with Tabebuia Trees (x: 25, z: 30)
    const towerMat = new THREE.MeshLambertMaterial({ color: '#8899AA', transparent: true, opacity: 0.8 });
    const tower1 = new THREE.Mesh(new THREE.BoxGeometry(4, 20, 4), towerMat);
    tower1.position.set(25, 10, 30);
    this.scene.add(tower1);
    
    const tower2 = new THREE.Mesh(new THREE.BoxGeometry(5, 15, 5), towerMat);
    tower2.position.set(30, 7.5, 25);
    this.scene.add(tower2);

    // Tabebuia Tree (Pink flowers)
    const trunkMat = new THREE.MeshLambertMaterial({ color: '#5C4033' });
    const flowerMat = new THREE.MeshLambertMaterial({ color: '#FF66CC' });
    for (let i = 0; i < 3; i++) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3), trunkMat);
      trunk.position.set(22 + i*4, 1.5, 35 - i*2);
      this.scene.add(trunk);

      const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), flowerMat);
      canopy.position.set(22 + i*4, 3, 35 - i*2);
      this.scene.add(canopy);
    }
  }
}
