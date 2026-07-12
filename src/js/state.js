export const GameState = {
    inventory: [],
    trust: {},
    hiddenInfection: 0,
    flags: {},
    history: []
};

export function addClue(id) {
    if (!hasClue(id)) {
        GameState.inventory.push(id);
        if (window.UI) window.UI.updateNotebook();
    }
}

export function hasClue(id) {
    return GameState.inventory.includes(id);
}

export function setFlag(key, val) {
    GameState.flags[key] = val;
}

export function getFlag(key) {
    return GameState.flags[key];
}

export function addInfection(amount) {
    GameState.hiddenInfection += amount;
}

export function getInfection() {
    return GameState.hiddenInfection;
}

export function modifyTrust(character, amount) {
    if (typeof GameState.trust[character] === 'undefined') {
        GameState.trust[character] = 0;
    }
    GameState.trust[character] += amount;
}

export function getTrust(character) {
    return GameState.trust[character] || 0;
}

export function recordHistory(nodeText, choiceText) {
    GameState.history.push({ nodeText, choiceText });
    if (window.UI) window.UI.updateHistory();
}
