// Import styles so Vite bundles them
import '../css/animations.css';
import '../css/main.css';
import '../css/notebook.css';

import {
    GameState,
    loadGame,
    applySave,
    clearSave,
    resetGameState,
    hasSave
} from './state.js';
import { GameEngine } from './engine.js';
import { UI } from './ui.js';
import { Assets } from './assets.js';

// Debug hooks
window.GameState = GameState;
window.GameEngine = GameEngine;
window.UI = UI;
window.Assets = Assets;

function returnToTitle() {
    const save = loadGame();
    UI.showTitleScreen({
        hasSave: Boolean(save),
        savedAt: save?.savedAt ?? null
    });
}

async function continueGame() {
    const save = loadGame();
    if (!save) {
        returnToTitle();
        return;
    }

    applySave(save);
    UI.updateNotebook();
    UI.updateHistory();
    UI.showGameScreen();
    await GameEngine.start(save.nodeId);
}

async function startNewGame({ force = false } = {}) {
    if (hasSave() && !force) {
        returnToTitle();
        return;
    }

    clearSave();
    resetGameState();
    UI.updateNotebook();
    UI.updateHistory();
    UI.showGameScreen();
    await GameEngine.start('ch1_start');
}

document.addEventListener('DOMContentLoaded', async () => {
    UI.init({
        onContinue: () => {
            continueGame();
        },
        onNewGame: (opts) => {
            startNewGame(opts);
        },
        onReturnToTitle: () => {
            returnToTitle();
        }
    });

    await UI.loadDatabase();

    const save = loadGame();
    UI.showTitleScreen({
        hasSave: Boolean(save),
        savedAt: save?.savedAt ?? null
    });
});
