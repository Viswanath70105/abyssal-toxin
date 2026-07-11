window.GameState = {
    inventory: [],
    trust: {},
    hiddenInfection: 0,
    flags: {}
};

window.addClue = function(id) {
    if (!window.hasClue(id)) {
        window.GameState.inventory.push(id);
    }
};

window.hasClue = function(id) {
    return window.GameState.inventory.includes(id);
};

window.setFlag = function(key, val) {
    window.GameState.flags[key] = val;
};
