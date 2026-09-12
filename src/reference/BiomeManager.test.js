import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { BiomeManager, terrainHeight, riverX, biomeAt } from './BiomeManager.js';

function finish(manager, focus, time = 120) {
  for (let i = 0; i < 100; i++) {
    manager.update(focus, time);
    const wanted = manager.descriptors.filter(d => manager.distance(d, focus) <= manager.loadRadius);
    if (wanted.every(d => manager.chunks.get(d.key)?.root)) return;
  }
  throw new Error('Streaming failed to converge');
}

function fingerprint(manager) {
  const result = [];
  for (const [key, chunk] of manager.chunks) chunk.root?.traverse(object => {
    if (object.isInstancedMesh) result.push([key, object.material.color.getHex(), Array.from(object.instanceMatrix.array)]);
  });
  return result;
}

test('reference orientation and a continuous water corridor', () => {
  assert.equal(biomeAt(-64, -64), 'maharashtra');
  assert.equal(biomeAt(64, -64), 'karnataka');
  assert.equal(biomeAt(-64, 64), 'kerala');
  for (let z = -128; z < 128; z++) assert.ok(terrainHeight(riverX(z), z) < 0);
});

test('same seed regenerates identical GPU instance transforms after eviction', () => {
  const scene = new THREE.Scene();
  const manager = new BiomeManager(scene, { loadRadius: 35, unloadRadius: 60, budgetMs: 20 });
  const focus = new THREE.Vector3(-65, 0, -45);
  finish(manager, focus); const before = fingerprint(manager);
  assert.ok(before.length > 0);
  let releases = 0;
  scene.traverse(object => object.geometry?.addEventListener('dispose', () => releases++));
  manager.update(new THREE.Vector3(1000, 0, 1000), 120);
  assert.equal(manager.chunks.size, 0); assert.equal(scene.children.length, 0); assert.ok(releases > 0);
  finish(manager, focus); assert.deepEqual(fingerprint(manager), before);
  manager.dispose(); manager.dispose(); assert.equal(scene.children.length, 0);
});

test('cancel pending generation and keep entity animation tied to world time', () => {
  const scene = new THREE.Scene();
  const manager = new BiomeManager(scene, { loadRadius: 90, unloadRadius: 110, budgetMs: .001 });
  manager.update(new THREE.Vector3(-64, 0, -60), 55);
  const initial = manager.actors.get('train').position.clone();
  manager.update(new THREE.Vector3(-64, 0, -60), 55);
  assert.deepEqual(manager.actors.get('train').position, initial);
  manager.update(new THREE.Vector3(1000, 0, 1000), 55);
  assert.equal(manager.chunks.size, 0); assert.equal(manager.actors.size, 0);
  manager.dispose(); assert.equal(scene.children.length, 0);
});
