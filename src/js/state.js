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

export function recordHistory(nodeText, choiceText) {
    GameState.history.push({ nodeText, choiceText });
    if (window.UI) window.UI.updateHistory();
}
