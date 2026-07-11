// Import styles so Vite bundles them
import '../css/animations.css';
import '../css/main.css';
import '../css/notebook.css';

// Import our ES6 modules
import { GameState } from './state.js';
import { GameEngine } from './engine.js';
import { UI } from './ui.js';

// Setup global access for debugging (optional)
window.GameState = GameState;
window.GameEngine = GameEngine;
window.UI = UI;

document.addEventListener('DOMContentLoaded', () => {
    UI.init();
    // Fetch chapters from public/data dynamically now
    GameEngine.start("ch1_start");
});
