# Contributing to The Great Desi Odyssey 🇮🇳

First off, thank you for considering contributing to **The Great Desi Odyssey**! We want to build the most epic, meme-filled, culturally rich virtual representation of India, and community contributions are the absolute best way to do that.

## 🤝 Code of Conduct

We are an inclusive, welcoming community. Whether you're adding a detailed monument or a niche regional meme, please ensure your contributions are:
1. **Respectful**: Celebrate the culture. Humor and memes are highly encouraged, but strictly avoid political, religious, or maliciously offensive content.
2. **Collaborative**: Be kind in code reviews and discussions. 

---

## 🛠️ How to Contribute (The Git Workflow)

1. **Fork** the repository to your own GitHub account.
2. **Clone** the project to your local machine:
   ```bash
   git clone https://github.com/your-username/thegreatdesiodyssey.git
   ```
3. **Create a Branch** for your feature or fix:
   ```bash
   git checkout -b feature/add-punjab-state
   ```
4. **Code** and test your changes locally (`npm run dev`).
5. **Commit** your changes with descriptive messages:
   ```bash
   git commit -m "feat: add Punjab state and Makki di Roti collectible"
   ```
6. **Push** to your fork and open a **Pull Request (PR)** against our `main` branch.

---

## 🗺️ The Low-Code State Contribution Guide

Not a Three.js expert? No problem! Our engine is designed to parse JSON schemas to generate new states, landmarks, and collectibles. You don't need to write complex WebGL code to add your home state to the map.

### Adding a New State via JSON

To add a new state, create a new JSON file under `public/content/states/` (e.g., `punjab.json`). The engine will automatically parse this schema and generate the world.

**Example: `punjab.json`**
```json
{
  "stateId": "punjab",
  "name": "Punjab",
  "zoneBounds": {
    "zMin": 160,
    "zMax": 260,
    "xMin": -80,
    "xMax": 80
  },
  "landmarks": [
    {
      "id": "tractor",
      "name": "Desi Tractor",
      "position": { "x": 10, "y": 0, "z": 200 },
      "voxels": [
        [0,0,0,"#000000"], [2,0,0,"#000000"],
        [0,1,0,"#FF0000"], [1,1,0,"#FF0000"], [2,1,0,"#FF0000"],
        [2,2,0,"#333333"]
      ]
    }
  ],
  "collectibles": [
    {
      "id": "makki_di_roti",
      "name": "Makki di Roti & Sarson da Saag",
      "icon": "🍲",
      "description": "🍲 Pure Desi Ghee power! +2x Strength for 15s!",
      "buff": { "type": "strength", "multiplier": 2.0, "duration": 15000 },
      "voxels": [
        [0,0,0,"#DAA520"], [1,0,0,"#DAA520"], [2,0,0,"#DAA520"],
        [0,0,1,"#DAA520"], [1,0,1,"#006400"], [2,0,1,"#DAA520"],
        [0,0,2,"#DAA520"], [1,0,2,"#DAA520"], [2,0,2,"#DAA520"]
      ]
    },
    {
      "id": "patiala_lassi",
      "name": "Patiala Lassi",
      "icon": "🥛",
      "description": "🥛 Heavy Lassi! +Max Stamina but slows movement slightly.",
      "buff": { "type": "stamina", "multiplier": 3.0, "duration": 20000 },
      "voxels": [
        [0,0,0,"#FFFFFF"], [1,0,0,"#FFFFFF"],
        [0,1,0,"#FFFFFF"], [1,1,0,"#FFFFFF"],
        [0,2,0,"#FFFFFF"], [1,2,0,"#FFFFFF"],
        [0.5,3,0,"#F5DEB3"]
      ]
    }
  ]
}
```

---

## 🧊 Procedural Voxel Asset Guide

We have a strict **Zero External Assets** policy. All models must be procedurally generated arrays of voxels. 

When defining a 3D object in JavaScript or JSON, use the `[x, y, z, hexColor]` format.

*   `x`, `y`, `z`: Integer coordinates relative to the object's origin.
*   `hexColor`: A valid hex string (e.g., `"#FF5500"`).

**Example: Building a simple 3x3 flag**
```javascript
const flagVoxels = [
  // Saffron top
  [0, 2, 0, "#FF9933"], [1, 2, 0, "#FF9933"], [2, 2, 0, "#FF9933"],
  // White middle
  [0, 1, 0, "#FFFFFF"], [1, 1, 0, "#000080"], [2, 1, 0, "#FFFFFF"], // Navy blue chakra in center
  // Green bottom
  [0, 0, 0, "#138808"], [1, 0, 0, "#138808"], [2, 0, 0, "#138808"]
];
```

*Tip: Use an online voxel editor (like MagicaVoxel) to plan your coordinates, then map them into an array!*

---

## ✅ Testing & Pull Request Checklist

Before submitting a Pull Request, please ensure you have completed the following:

- [ ] **Run locally**: Did you run `npm run dev` and ensure there are no console errors?
- [ ] **No Z-Fighting**: Check that your newly added voxel models don't flicker against the ground or other models.
- [ ] **Performance**: Did you reuse materials or utilize the `VoxelBuilder` properly? Ensure your additions don't drop the framerate below 60FPS.
- [ ] **Zero Placeholders**: Ensure you haven't left any `// TODO: add voxels here` comments in production files.
- [ ] **Formatting**: Ensure your code matches the existing style (2-space indents, vanilla ES Modules).

We can't wait to see what you build! Jai Hind! 🇮🇳
