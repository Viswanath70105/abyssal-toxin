import {
    addClue,
    recordChoiceTranscript,
    recordNodeTranscript,
    saveGame,
    applyEffects,
    meetsRequirements,
    resolveNodeText,
    resolveEndingNodeId,
    getInfection,
    getFlag,
    setFlag,
    advanceToChapter
} from './state.js';
import { UI } from './ui.js';
import { Assets } from './assets.js';

export const GameEngine = {
    currentNodeId: null,
    storyData: {},
    isBusy: false,
    loadedChapters: new Set(),
    /** True while typewriter is running / waiting for reveal */
    reading: false,

    dataUrl(relativePath) {
        const base = import.meta.env.BASE_URL || '/';
        return `${base}${relativePath.replace(/^\//, '')}`;
    },

    chapterKeyFromNodeId(nodeId) {
        if (!nodeId) return null;
        if (nodeId === 'game_over') return 'ch15';
        const match = String(nodeId).match(/^(ch\d+)/i);
        return match ? match[1].toLowerCase() : null;
    },

    async loadChapterData(chapterKey) {
        if (!chapterKey) return false;
        if (this.loadedChapters.has(chapterKey) && Object.keys(this.storyData).length) {
            const hasAnyFromChapter = Object.keys(this.storyData).some(
                (id) => id === 'game_over' || id.startsWith(chapterKey + '_')
            );
            if (hasAnyFromChapter) return true;
        }

        const cleanId = chapterKey.replace(/^ch/i, '');
        if (!cleanId) return false;

        const url = this.dataUrl(`data/chapters/chapter_${cleanId}.json`);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            Object.assign(this.storyData, data);
            this.loadedChapters.add(chapterKey);
            return true;
        } catch (err) {
            console.error('Failed to load chapter', chapterKey, err);
            UI.showError(
                `Could not load chapter data (${chapterKey}). Check your connection and try again.`
            );
            return false;
        }
    },

    async ensureNode(nodeId) {
        if (this.storyData[nodeId]) {
            return this.storyData[nodeId];
        }

        const chapterKey = this.chapterKeyFromNodeId(nodeId);
        if (!chapterKey) {
            return null;
        }

        await this.loadChapterData(chapterKey);
        return this.storyData[nodeId] || null;
    },

    getAvailableChoices(node) {
        return (node.choices || []).filter((choice) =>
            meetsRequirements(choice.requires, choice.requiresClue || null)
        );
    },

    applyNodeEnterEffects(node, nodeId) {
        if (!node?.effects) return;

        if (node.effectsOnce) {
            const key = `visited_${nodeId}`;
            if (getFlag(key)) return;
            applyEffects(node.effects);
            setFlag(key, true);
            return;
        }

        applyEffects(node.effects);
    },

    async start(nodeId) {
        this.storyData = {};
        this.loadedChapters.clear();
        this.isBusy = false;
        this.reading = false;
        UI.cancelTypewriter();
        await this.renderNode(nodeId);
    },

    async renderNode(nodeId) {
        this.isBusy = true;
        this.reading = true;
        this.currentNodeId = nodeId;

        let node = await this.ensureNode(nodeId);

        if (!node) {
            console.error(`Node ${nodeId} not found even after fetching.`);
            UI.showError(
                `Story node "${nodeId}" could not be found. Your save may be from an older version — try starting a new game.`
            );
            this.isBusy = false;
            this.reading = false;
            return;
        }

        if (typeof node.chapter === 'number') {
            advanceToChapter(node.chapter);
        }

        this.applyNodeEnterEffects(node, nodeId);

        // Silent-safe BGM / SFX / CG
        Assets.applyNodePresentation(node);

        if (node.resolveEnding === true) {
            const endingId = resolveEndingNodeId();
            this.isBusy = false;
            this.reading = false;
            await this.renderNode(endingId);
            return;
        }

        const chapterKey = this.chapterKeyFromNodeId(nodeId);
        let title = 'ABYSSAL TOXIN';
        if (nodeId === 'game_over' || node.isEnding) {
            title = node.endingTitle || 'THE END';
        } else if (chapterKey) {
            title = 'CHAPTER ' + chapterKey.replace(/^ch/i, '');
        }
        UI.updateChapterTitle(title);

        const availableChoices = this.getAvailableChoices(node);
        const displayText = resolveNodeText(node);
        const speaker = node.speaker || null;

        // Full transcript: log scene when entered (not only after choice)
        recordNodeTranscript({
            speaker,
            text: displayText,
            nodeId
        });

        if (typeof UI.setInfectionAtmosphere === 'function') {
            UI.setInfectionAtmosphere(getInfection());
        }

        // Reading layer: typewriter then reveal choices
        await UI.displayNode({
            text: displayText,
            speaker,
            choices: availableChoices,
            isTerminal: availableChoices.length === 0 || node.isEnding === true,
            endingLabel: node.endingTitle || null
        });

        this.reading = false;
        saveGame(nodeId);
        this.isBusy = false;
    },

    makeChoice(choiceIndex) {
        if (this.isBusy || this.reading) return;

        const node = this.storyData[this.currentNodeId];
        if (!node) return;

        const availableChoices = this.getAvailableChoices(node);
        const choice = availableChoices[choiceIndex];
        if (!choice) return;

        this.isBusy = true;

        recordChoiceTranscript(choice.text);
        Assets.playChoiceSfx();

        if (choice.sfx) {
            Assets.playSfx(choice.sfx);
        }

        if (choice.giveClue) {
            addClue(choice.giveClue);
        }

        if (choice.effects) {
            applyEffects(choice.effects);
        }

        let nextId = choice.nextNodeId;

        if (choice.resolveEnding === true) {
            nextId = resolveEndingNodeId();
        }

        if (nextId) {
            this.renderNode(nextId);
        } else {
            this.isBusy = false;
        }
    }
};
