const SAVE_KEY = 'abyssal-toxin-save';
const SAVE_VERSION = 1;

/** Infection thresholds used for presentation and ending gates. */
export const INFECTION = {
    MILD: 15,
    MODERATE: 35,
    SEVERE: 55,
    CRITICAL: 75
};

/**
 * Station decay schedule — permanent losses as chapters advance.
 * Locations use requires.flags: { decay_X: false } while still open.
 * After the threshold chapter starts, decay_X becomes true and those choices vanish
 * (or swap to "ruined" flavor nodes that require decay_X: true).
 */
export const STATION_DECAY_SCHEDULE = [
    // From chapter 6 onward: Sector B permanently flooded
    { fromChapter: 6, flags: { decay_sector_b: true } },
    // From chapter 7: deep mess / dry storage contaminated or sealed
    { fromChapter: 7, flags: { decay_mess_deep: true } },
    // From chapter 8: main power failure — dark zones, limited systems
    { fromChapter: 8, flags: { decay_main_power: true } },
    // From chapter 10: crew deck partially collapsed
    { fromChapter: 10, flags: { decay_crew_deck: true } },
    // From chapter 11: lower maintenance fully submerged
    { fromChapter: 11, flags: { decay_lower_flood: true } },
    // From chapter 14: scuttle countdown — many areas unreachable
    { fromChapter: 14, flags: { decay_scuttle: true } }
];

/**
 * Advance story chapter counter and apply cumulative station decay.
 * Safe to call repeatedly for the same chapter.
 */
export function advanceToChapter(chapterNum) {
    if (typeof chapterNum !== 'number' || chapterNum < 1) return;

    const prev = typeof GameState.flags.currentChapter === 'number'
        ? GameState.flags.currentChapter
        : 0;

    if (chapterNum > prev) {
        GameState.flags.currentChapter = chapterNum;
    } else if (!GameState.flags.currentChapter) {
        GameState.flags.currentChapter = chapterNum;
    }

    const current = GameState.flags.currentChapter || chapterNum;

    for (const rule of STATION_DECAY_SCHEDULE) {
        if (current >= rule.fromChapter && rule.flags) {
            Object.entries(rule.flags).forEach(([key, val]) => {
                GameState.flags[key] = val;
            });
        }
    }
}

export function getCurrentChapter() {
    return typeof GameState.flags.currentChapter === 'number'
        ? GameState.flags.currentChapter
        : 1;
}

/** True if a decay flag is active (location lost). */
export function isDecayed(flagKey) {
    return GameState.flags[flagKey] === true;
}

export const GameState = {
    inventory: [],
    trust: {},
    hiddenInfection: 0,
    flags: {},
    history: []
};

export function createEmptyState() {
    return {
        inventory: [],
        trust: {},
        hiddenInfection: 0,
        flags: {},
        history: []
    };
}

export function resetGameState() {
    const empty = createEmptyState();
    GameState.inventory = empty.inventory;
    GameState.trust = empty.trust;
    GameState.hiddenInfection = empty.hiddenInfection;
    GameState.flags = empty.flags;
    GameState.history = empty.history;
}

export function addClue(id) {
    if (!id || hasClue(id)) return false;
    GameState.inventory.push(id);
    if (window.UI) window.UI.updateNotebook();
    return true;
}

export function hasClue(id) {
    return GameState.inventory.includes(id);
}

export function hasAllClues(ids = []) {
    return ids.every((id) => hasClue(id));
}

export function hasAnyClue(ids = []) {
    return ids.some((id) => hasClue(id));
}

export function setFlag(key, val) {
    GameState.flags[key] = val;
}

export function getFlag(key) {
    return GameState.flags[key];
}

export function adjustTrust(character, delta) {
    if (!character || !delta) return;
    const current = GameState.trust[character] || 0;
    GameState.trust[character] = current + delta;
}

export function getTrust(character) {
    return GameState.trust[character] || 0;
}

export function adjustInfection(delta) {
    if (!delta) return;
    GameState.hiddenInfection = Math.max(
        0,
        Math.min(100, GameState.hiddenInfection + delta)
    );
}

export function getInfection() {
    return GameState.hiddenInfection;
}

/**
 * Apply data-driven effects from a node or choice.
 * Supports: giveClue, giveClues, flags, trust, infection
 */
export function applyEffects(effects) {
    if (!effects || typeof effects !== 'object') return;

    if (effects.giveClue) {
        addClue(effects.giveClue);
    }

    if (Array.isArray(effects.giveClues)) {
        effects.giveClues.forEach((id) => addClue(id));
    }

    if (effects.flags && typeof effects.flags === 'object') {
        Object.entries(effects.flags).forEach(([key, val]) => {
            GameState.flags[key] = val;
        });
    }

    if (effects.trust && typeof effects.trust === 'object') {
        Object.entries(effects.trust).forEach(([who, delta]) => {
            adjustTrust(who, delta);
        });
    }

    if (typeof effects.infection === 'number') {
        adjustInfection(effects.infection);
    }
}

/**
 * Evaluate whether a choice (or gate) is available.
 * Supports modern `requires` object and legacy requiresClue / giveClue on choice.
 *
 * requires: {
 *   clues: string[],          // all required
 *   cluesAny: string[],       // at least one
 *   flags: { key: expected },
 *   minTrust: { char: n },
 *   maxTrust: { char: n },
 *   minInfection: number,
 *   maxInfection: number
 * }
 */
export function meetsRequirements(requires, legacyRequiresClue = null) {
    if (legacyRequiresClue && !hasClue(legacyRequiresClue)) {
        return false;
    }

    if (!requires || typeof requires !== 'object') {
        return true;
    }

    if (Array.isArray(requires.clues) && !hasAllClues(requires.clues)) {
        return false;
    }

    if (Array.isArray(requires.cluesAny) && requires.cluesAny.length > 0) {
        if (!hasAnyClue(requires.cluesAny)) return false;
    }

    if (requires.flags && typeof requires.flags === 'object') {
        for (const [key, expected] of Object.entries(requires.flags)) {
            const actual = GameState.flags[key];
            // Treat missing flags as false so requires.flags: { x: false } works.
            if (expected === false) {
                if (actual === true) return false;
            } else if (actual !== expected) {
                return false;
            }
        }
    }

    if (requires.minTrust && typeof requires.minTrust === 'object') {
        for (const [who, min] of Object.entries(requires.minTrust)) {
            if (getTrust(who) < min) return false;
        }
    }

    if (requires.maxTrust && typeof requires.maxTrust === 'object') {
        for (const [who, max] of Object.entries(requires.maxTrust)) {
            if (getTrust(who) > max) return false;
        }
    }

    if (typeof requires.minInfection === 'number') {
        if (getInfection() < requires.minInfection) return false;
    }

    if (typeof requires.maxInfection === 'number') {
        if (getInfection() > requires.maxInfection) return false;
    }

    return true;
}

/**
 * Pick node text, applying infection-warped variants when defined.
 * textVariants: [{ minInfection, text }] — highest matching threshold wins.
 */
export function resolveNodeText(node) {
    if (!node) return '';
    let text = node.text || '';

    if (Array.isArray(node.textVariants) && node.textVariants.length) {
        const infection = getInfection();
        const matches = node.textVariants
            .filter((v) => typeof v.minInfection === 'number' && infection >= v.minInfection)
            .sort((a, b) => b.minInfection - a.minInfection);
        if (matches[0]?.text) {
            text = matches[0].text;
        }
    }

    return text;
}

/**
 * State-driven ending resolution for the climax.
 * Returns a chapter 15 ending node id.
 */
export function resolveEndingNodeId() {
    const infection = getInfection();
    const flags = GameState.flags;

    // Critical infection: organism hijacks the player's will
    if (infection >= INFECTION.CRITICAL || flags.embrace_infection === true) {
        return 'ch15_ending_patient_zero';
    }

    // High infection with incomplete understanding → still doomed transformation
    if (infection >= INFECTION.SEVERE && !hasClue('scuttling_auth_log')) {
        return 'ch15_ending_patient_zero';
    }

    // Martyr path: player consciously yields after understanding the threat
    if (flags.chose_martyr === true) {
        return 'ch15_ending_abyssal_grave';
    }

    // Survivor with allies / evidence → cleaner escape
    if (flags.chose_fight === true || flags.chose_witness === true) {
        const allies =
            (flags.otto_ally === true ? 1 : 0) +
            (flags.david_ally === true ? 1 : 0) +
            (flags.saved_otto === true || flags.saved_chloe === true ? 1 : 0);
        const evidence =
            (hasClue('scuttling_auth_log') ? 1 : 0) +
            (hasClue('unsent_transmission') ? 1 : 0) +
            (hasClue('drill_telemetry') ? 1 : 0) +
            (hasClue('family_photo_note') ? 1 : 0);

        if (
            (flags.fair_detective === true || flags.chose_witness === true) &&
            allies >= 1 &&
            evidence >= 2 &&
            infection < INFECTION.MODERATE
        ) {
            return 'ch15_ending_whistleblower';
        }
        if (allies >= 2 && evidence >= 2 && infection < INFECTION.MODERATE) {
            return 'ch15_ending_whistleblower';
        }
        return 'ch15_ending_surface_tension';
    }

    // Default: yield to the dark
    return 'ch15_ending_abyssal_grave';
}

/**
 * Full transcript log.
 * Entries:
 *   { type: 'node', speaker?, text, nodeId? }
 *   { type: 'choice', text }
 * Legacy { nodeText, choiceText } still rendered by UI.
 */
export function recordNodeTranscript({
    speaker = null,
    text = '',
    nodeId = null,
    location = null
} = {}) {
    if (!text) return;
    GameState.history.push({
        type: 'node',
        speaker: speaker || null,
        text,
        nodeId: nodeId || null,
        location: location || null
    });
    // Cap transcript length for localStorage safety
    if (GameState.history.length > 400) {
        GameState.history.splice(0, GameState.history.length - 400);
    }
    if (window.UI) window.UI.updateHistory();
}

export function recordChoiceTranscript(choiceText) {
    if (!choiceText) return;
    GameState.history.push({
        type: 'choice',
        text: choiceText
    });
    if (GameState.history.length > 400) {
        GameState.history.splice(0, GameState.history.length - 400);
    }
    if (window.UI) window.UI.updateHistory();
}

/** @deprecated Prefer recordNodeTranscript + recordChoiceTranscript */
export function recordHistory(nodeText, choiceText) {
    if (nodeText) {
        recordNodeTranscript({ text: nodeText });
    }
    if (choiceText) {
        recordChoiceTranscript(choiceText);
    }
}

/** Reading / presentation preferences (separate from game save). */
const SETTINGS_KEY = 'abyssal-toxin-settings';

export function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) {
            return { typewriter: true, typewriterCps: 42 };
        }
        const data = JSON.parse(raw);
        return {
            typewriter: data.typewriter !== false,
            typewriterCps: typeof data.typewriterCps === 'number' ? data.typewriterCps : 42
        };
    } catch {
        return { typewriter: true, typewriterCps: 42 };
    }
}

export function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        /* ignore */
    }
}

/**
 * Persist progress to this browser's localStorage (per visitor, per device).
 * @param {string} nodeId
 */
export function saveGame(nodeId) {
    if (!nodeId) return;

    const payload = {
        v: SAVE_VERSION,
        nodeId,
        state: {
            inventory: [...GameState.inventory],
            trust: { ...GameState.trust },
            hiddenInfection: GameState.hiddenInfection,
            flags: { ...GameState.flags },
            history: GameState.history.map((entry) => ({ ...entry }))
        },
        savedAt: Date.now()
    };

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch (err) {
        console.warn('Failed to save game (storage full or blocked):', err);
    }
}

/**
 * @returns {{ v: number, nodeId: string, state: object, savedAt: number } | null}
 */
export function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;

        const data = JSON.parse(raw);
        if (!data || data.v !== SAVE_VERSION || typeof data.nodeId !== 'string') {
            return null;
        }

        return data;
    } catch (err) {
        console.warn('Failed to load save:', err);
        return null;
    }
}

/**
 * Apply a loaded save blob into the live GameState.
 * @param {{ state: object }} save
 */
export function applySave(save) {
    if (!save?.state) return;

    const s = save.state;
    GameState.inventory = Array.isArray(s.inventory) ? [...s.inventory] : [];
    GameState.trust = s.trust && typeof s.trust === 'object' ? { ...s.trust } : {};
    GameState.hiddenInfection = typeof s.hiddenInfection === 'number' ? s.hiddenInfection : 0;
    GameState.flags = s.flags && typeof s.flags === 'object' ? { ...s.flags } : {};
    GameState.history = Array.isArray(s.history)
        ? s.history.map((entry) => ({ ...entry }))
        : [];
}

export function clearSave() {
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch (err) {
        console.warn('Failed to clear save:', err);
    }
}

export function hasSave() {
    return loadGame() !== null;
}

export function formatSaveTime(savedAt) {
    if (!savedAt) return '';
    try {
        return new Date(savedAt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    } catch {
        return '';
    }
}
