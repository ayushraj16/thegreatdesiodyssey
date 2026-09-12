import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Player, tileHeight } from './Player.js';
import { BridgeManager, BRIDGES } from './BridgeManager.js';
import { ItemManager, FOOD_ITEMS } from './ItemManager.js';
import { biomeAt } from './BiomeManager.js';

function setup(spawn) {
  const scene = new THREE.Scene(), bridges = new BridgeManager(scene);
  const player = new Player(scene, new THREE.PerspectiveCamera(), bridges, { inputTarget: new EventTarget(), spawn });
  return { scene, bridges, player, dispose() { player.dispose(); bridges.dispose(); } };
}

test('walk across every arched bridge in both directions without falling', () => {
  for (const bridge of BRIDGES) for (const direction of [-1, 1]) {
    const axis = bridge.axis;
    const spawn = new THREE.Vector3(bridge.x, 3, bridge.z);
    spawn[axis] -= direction * (bridge.length / 2 + 1);
    spawn.y = tileHeight(spawn.x, spawn.z);
    const game = setup(spawn), { player } = game;
    player.keys.add(axis === 'x' ? direction === 1 ? 'KeyD' : 'KeyA' : direction === 1 ? 'KeyS' : 'KeyW');
    for (let i = 0; i < 360; i++) {
      player.update(1 / 60);
      assert.ok(player.position.y >= 2.9, `${bridge.id} fell through at ${player.position.toArray()}`);
      const distance = direction * (player.position[axis] - bridge[axis]);
      if (distance > bridge.length / 2 + 1) break;
    }
    assert.ok(direction * (player.position[axis] - bridge[axis]) > bridge.length / 2, `${bridge.id} failed to cross`);
    game.dispose();
  }
});

test('jump rises and lands; blur clears input; river fall respawns', () => {
  const game = setup(new THREE.Vector3(-42, 3, -20)), { player } = game;
  player.jumpQueued = true; player.update(.1); assert.ok(player.position.y > 3);
  for (let i = 0; i < 120; i++) player.update(1 / 60);
  assert.ok(player.grounded); assert.equal(player.position.y, 3);
  player.keys.add('KeyD'); player.blur(); assert.equal(player.keys.size, 0);
  player.position.set(0, -6, 0); player.update(1 / 60); assert.deepEqual(player.position, player.spawn);
  game.dispose();
});

test('food definitions, valid biome placement and one-shot AABB scoring', () => {
  assert.deepEqual(FOOD_ITEMS.map(f => f.points), [10, 15, 15, 20, 10, 25, 30]);
  const scene = new THREE.Scene(), events = [], manager = new ItemManager(scene, { onCollect: item => events.push(item) });
  assert.equal(manager.items.size, 35);
  for (const item of manager.items.values()) {
    assert.equal(biomeAt(item.mesh.position.x,item.mesh.position.z), item.definition.biome);
    assert.ok(tileHeight(item.mesh.position.x,item.mesh.position.z) >= 0);
  }
  const item = manager.items.get('vada-pav:0'), p = item.mesh.position;
  const bounds = new THREE.Box3(new THREE.Vector3(p.x-1,3,p.z-1), new THREE.Vector3(p.x+1,8,p.z+1));
  manager.update(0, bounds); manager.update(0, bounds);
  assert.equal(manager.score, 10); assert.equal(events.length, 1); assert.equal(manager.items.size, 34);
  manager.dispose(); manager.dispose(); assert.equal(scene.children.length, 0);
});

test('normalized diagonal motion and consistent movement across frame rates', () => {
  const run = (keys, dt) => {
    const game = setup(new THREE.Vector3(-65,3,0)); keys.forEach(key => game.player.keys.add(key));
    for (let t = 0; t < 1 - 1e-6; t += dt) game.player.update(dt);
    const distance = game.player.position.distanceTo(game.player.spawn); game.dispose(); return distance;
  };
  assert.ok(Math.abs(run(['KeyD'],1/60) - run(['KeyD','KeyW'],1/60)) < .05);
  assert.ok(Math.abs(run(['KeyD'],1/30) - run(['KeyD'],1/120)) < .05);
});
