import React from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { GameUI, createUIStore } from './GameUI.jsx';
import { BiomeManager } from './BiomeManager.js';
import { Environment } from './Environment.js';
import { Player } from './Player.js';
import { BridgeManager } from './BridgeManager.js';
import { HoardingManager } from './HoardingManager.js';
import { ItemManager } from './ItemManager.js';

/** Mount into a sized container. Transport ownership stays with the caller.
 * getWorldTime returns seconds relative to a shared session epoch, not Unix time.
 * subscribePing(callback) reports measured RTT in ms, null on disconnect, and returns unsubscribe.
 */
export function mountReferenceGame(container, { getWorldTime, subscribePing, onSelect } = {}) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
  canvas.setAttribute('aria-label', 'The Great Desi Odyssey three-state world');
  const overlay = document.createElement('div'); container.append(canvas, overlay);
  const scene = new THREE.Scene();
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (error) { canvas.remove(); overlay.remove(); throw error; }
  const camera = new THREE.PerspectiveCamera(42, 1, 1, 900);
  const biomes = new BiomeManager(scene);
  const bridges = new BridgeManager(scene);
  const player = new Player(scene, camera, bridges);
  const hoardings = new HoardingManager(scene);
  let environment = new Environment({ scene, renderer, camera });
  const store = createUIStore(); const ui = createRoot(overlay);
  const items = new ItemManager(scene, { onCollect: item => store.set({ score: item.score, collected: item.collected, lastPickup: `${item.name} +${item.points}` }) });
  store.set({ total: items.total });
  ui.render(<GameUI store={store} onSelect={onSelect} />);
  const unsubscribePing = subscribePing?.(rtt => {
    store.set({ pingMs: Number.isFinite(rtt) && rtt >= 0 ? rtt : null });
  });
  const resize = () => environment.resize(container.clientWidth, container.clientHeight);
  const observer = new ResizeObserver(resize); observer.observe(container); resize();
  const started = performance.now(); let last = started, sampleStart = started, frames = 0, disposed = false, lost = false, animationFrame = 0;
  const mapFocus = new THREE.Vector3(0, 0, -7);
  const frame = now => {
    if (disposed || lost) return;
    animationFrame = requestAnimationFrame(frame);
    if (document.hidden) return;
    const delta = Math.min((now - last) / 1000, .1); last = now;
    const seconds = getWorldTime ? getWorldTime() : (now - started) / 1000;
    player.update(delta);
    biomes.update(player.mapMode ? mapFocus : player.position, seconds);
    items.update(seconds, player.bounds);
    environment.update(seconds); environment.render(delta);
    frames++;
    if (now - sampleStart >= 500) {
      store.set({ fps: frames * 1000 / (now - sampleStart) }); frames = 0; sampleStart = now;
    }
  };
  const resetSampling = () => { last = sampleStart = performance.now(); frames = 0; store.set({ fps: null }); if (document.hidden) player.blur(); };
  const contextLost = event => { event.preventDefault(); lost = true; cancelAnimationFrame(animationFrame); player.blur(); resetSampling(); };
  const contextRestored = () => {
    // Rebuild generated render-target contents after WebGL resource restoration.
    environment.dispose();
    environment = new Environment({ scene, renderer, camera });
    resize(); lost = false; resetSampling(); animationFrame = requestAnimationFrame(frame);
  };
  canvas.addEventListener('webglcontextlost', contextLost); canvas.addEventListener('webglcontextrestored', contextRestored);
  document.addEventListener('visibilitychange', resetSampling); animationFrame = requestAnimationFrame(frame);
  return {
    scene, camera, biomes, store, player, bridges, items, hoardings,
    dispose() {
      if (disposed) return; disposed = true;
      cancelAnimationFrame(animationFrame); observer.disconnect(); unsubscribePing?.();
      document.removeEventListener('visibilitychange', resetSampling);
      canvas.removeEventListener('webglcontextlost', contextLost); canvas.removeEventListener('webglcontextrestored', contextRestored);
      ui.unmount(); player.dispose(); items.dispose(); hoardings.dispose(); bridges.dispose(); biomes.dispose(); environment.dispose(); renderer.dispose();
      canvas.remove(); overlay.remove();
    },
  };
}

const container = document.getElementById('reference-game');
if (container) {
  try {
    const game = mountReferenceGame(container);
    if (import.meta.hot) import.meta.hot.dispose(() => game.dispose());
    // Explicit diagnostic access only in development.
    if (import.meta.env.DEV) window.referenceGame = game;
  } catch (error) {
    container.textContent = `Unable to start WebGL: ${error.message}`;
    console.error(error);
  }
}
