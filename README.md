<div align="center">
  <img src="https://via.placeholder.com/150/FF9933/FFFFFF?text=GDO" alt="The Great Desi Odyssey Logo" width="120" height="120">
  
  # THE GREAT DESI ODYSSEY 🇮🇳

  **A 3D Voxel Journey Across Indian States, Landmarks & Meme Lore.**

  [![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
  [![License](https://img.shields.io/badge/license-Custom-blue.svg)](#license--ip-notice)
  [![Vite](https://img.shields.io/badge/vite-%5E5.4.0-646CFF?logo=vite&logoColor=white)](#)
  [![Three.js](https://img.shields.io/badge/three.js-r170-black?logo=three.js&logoColor=white)](#)
  [![Discord](https://img.shields.io/discord/1234567890?color=5865F2&label=Discord&logo=discord&logoColor=white)](https://discord.gg/wCgUdZppd)
  <a href="https://buymeacoffee.com/aayushraj1q" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 28px !important;width: 100px !important;" ></a>
  [**▶ Play the Live Demo**](https://desiodyssey.pixellon.in)  |  [**💬 Join our Discord Community**](https://discord.gg/wCgUdZppd)
</div>

---

## 📖 Game Vision

Our grand vision is to build an immersive, living virtual universe celebrating India’s multi-layered cultural tapestry, regional diversity, and iconic internet meme culture.

**[Read the full Game Vision (The Virtual Universe of Bharat) here.](./VISION.md)**

---

## 🗺️ Current Map & Biomes

Our Z-axis aligned map currently features three fully realized regions:

### 🚂 Maharashtra (The Starting Hub)
* **Platform 1 — Mumbai Central**: The spawn area featuring a continuous railway track, bustling chai stalls, and a moving local train.
* **Marine Drive**: The iconic Queen's Necklace promenade bordering the Arabian Sea.
* **Gateway of India & Taj Mahal Palace**: The grand colonial-era archway and the legendary luxury hotel.

### 🛕 Karnataka (The Cultural Bridge)
* **Hampi Stone Chariot**: An intricately detailed voxel recreation of the UNESCO World Heritage monument.
* **Mysore Palace Gates**: The grand cream-and-gold entryways to the royal city.
* **Bengaluru Tech Towers**: Modern glass facades surrounded by blooming pink Tabebuia trees.

### 🌴 Kerala (God's Own Country)
* **Fort Kochi Coast**: Featuring the famous Chinese fishing nets overlooking the water.
* **Alappuzha Backwaters**: Board a traditional boat and sail across interactive water bodies.
* **Munnar Tea Hills**: Rolling, procedurally-damped hills that challenge your climbing physics.

---

## 🎮 Controls & UI Guide

| Action | Keybinding |
| :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` or Arrow Keys |
| **Look Around** | Mouse (GTA-style pointer lock) |
| **Jump** | `Spacebar` |
| **Interact / Board Boat** | `E` |
| **Aerial Map** | `M` (Opens a real-time tracking blueprint) |
| **Fast Travel** | `T` (Opens the directory for instant teleportation) |

*Note: Clicking anywhere on the game canvas locks your mouse. Press `ESC` to unlock.*

---

## 🛠️ Technical Architecture (How to Build)

### Tech Stack
- **Engine**: Pure [Three.js](https://threejs.org/) (`three`) WebGL rendering.
- **Build Tool**: [Vite](https://vitejs.dev/) for blazing-fast HMR and optimized bundling.
- **Architecture**: Vanilla JavaScript (ES Modules). No heavy frameworks like React/Vue for maximum performance.
- **Assets**: 100% Procedurally generated. We **do not use** `.gltf` or `.obj` files. Everything is built at runtime using our custom `VoxelBuilder`.

### Directory Structure
```text
desi-odyssey/
├── public/                 # Static assets (fonts, icons)
│   └── content/states/     # JSON schemas for low-code state additions
├── src/
│   ├── engine/             # Core systems (Physics, PlayerController, Collectibles)
│   ├── world/              # Environment, Train, Water, Hoardings
│   │   ├── landmarks/      # State-agnostic large monuments
│   │   └── zones/          # State-specific logic (Maharashtra, Kerala, Karnataka)
│   ├── ui/                 # HTML overlays (MapModal, TravelModal, LandingScreen)
│   └── main.js             # Entry point and game loop
├── index.html              # Main DOM structure and CSS
└── package.json            # Dependencies
```

### Local Development Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/thegreatdesiodyssey.git
   cd desi-odyssey
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`.

### Deployment
This project is a static site and can be deployed easily to Vercel, Netlify, or GitHub Pages.
```bash
npm run build
```
Upload the resulting `dist/` folder to your hosting provider.

---

## 🚀 Roadmap & Future Expansion

*   **New States**: Punjab (Golden Temple), Delhi (India Gate), West Bengal (Howrah Bridge), and Tamil Nadu (Meenakshi Temple).
*   **Multiplayer**: WebSockets integration to see other players' avatars exploring the map.
*   **Audio**: Chiptune-style regional background music and 8-bit sound effects (e.g., train horns, item pickup chimes).
*   **Meme Unlocks**: Collect rare items to unlock avatar skins (e.g., "Bhupendra Jogi" shades or a "Gamcha" cape).

---

## 💬 Community

We’d love to have you in our community! Come hang out, share your voxel creations, report bugs, or just share your favorite desi memes with us.

[**Join our Discord Server**](https://discord.gg/wCgUdZppd) 🚀

---

## ⚖️ License & IP Notice

**Copyright © 2026 pixellon.in. All Rights Reserved.**

While the source code for *The Great Desi Odyssey* is made publicly available to encourage open-source community contributions, learning, and collaboration, **all commercial rights, intellectual property, branding, trademarks, and game assets belong strictly to pixellon.in**. 

You may fork this repository for personal, non-commercial use or to submit pull requests back to the main project. However, you may not monetize, re-distribute, or re-publish this game or its underlying engine as your own product without explicit written permission from the IP holders.
