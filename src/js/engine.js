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
    reading: false,
    currentLocation: null,
    /** Room entered from an investigation hub (survives sub-nodes until return to hub). */
    activeInvestigationRoom: null,

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

    // ── Investigation visit system ─────────────────────────────────

    /** Stable key for a room action (one-visit inside a room). */
    actionVisitFlag(roomId, visitKey) {
        return `visited_action_${roomId}__${visitKey}`;
    },

    /** Hub location locked only after room fully cleared + return. */
    hubRoomClearedFlag(roomId) {
        return `cleared_hub_room_${roomId}`;
    },

    getVisitKey(choice) {
        if (choice.visitKey) return String(choice.visitKey);
        if (choice.nextNodeId) return String(choice.nextNodeId);
        return null;
    },

    isRoomExit(choice) {
        return choice?.roomExit === true || choice?.hubExit === true;
    },

    /**
     * One-visit room action: investigationRoom, not an exit, not revisitAllowed.
     */
    isOneVisitRoomAction(node, choice) {
        if (!node?.investigationRoom || !choice) return false;
        if (this.isRoomExit(choice)) return false;
        if (choice.revisitAllowed === true) return false;
        return true;
    },

    isRoomActionVisited(roomId, choice) {
        const key = this.getVisitKey(choice);
        if (!roomId || !key) return false;
        return getFlag(this.actionVisitFlag(roomId, key)) === true;
    },

    /**
     * Keys that must be visited to clear a room (for hub lock).
     * Uses node.clearWhenVisited or derives from non-exit choices.
     */
    getRoomClearKeys(roomNode, roomId) {
        if (Array.isArray(roomNode.clearWhenVisited) && roomNode.clearWhenVisited.length) {
            return roomNode.clearWhenVisited.map(String);
        }
        const keys = [];
        for (const c of roomNode.choices || []) {
            if (this.isRoomExit(c)) continue;
            if (c.revisitAllowed) continue;
            const k = this.getVisitKey(c);
            if (k && !keys.includes(k)) keys.push(k);
        }
        return keys;
    },

    isRoomFullyCleared(roomId) {
        const room = this.storyData[roomId];
        if (!room?.investigationRoom) return false;
        const keys = this.getRoomClearKeys(room, roomId);
        if (!keys.length) {
            // No actions defined — treat as cleared once entered-and-exited via flag set on exit
            return getFlag(this.hubRoomClearedFlag(roomId)) === true;
        }
        const mode = room.clearMode === 'any' ? 'any' : 'all';
        if (mode === 'any') {
            return keys.some((k) => getFlag(this.actionVisitFlag(roomId, k)) === true);
        }
        return keys.every((k) => getFlag(this.actionVisitFlag(roomId, k)) === true);
    },

    /**
     * Hub location greys only when its target room is fully cleared.
     */
    isHubLocationLocked(choice) {
        const roomId = choice?.nextNodeId;
        if (!roomId) return false;
        return getFlag(this.hubRoomClearedFlag(roomId)) === true;
    },

    getAvailableChoices(node) {
        return (node.choices || []).filter((choice) =>
            meetsRequirements(choice.requires, choice.requiresClue || null)
        );
    },

    /**
     * Display choices: hide failed requirements; grey visited room actions
     * or cleared hub locations.
     */
    getDisplayChoices(node) {
        const raw = node?.choices || [];
        const roomId = this.currentNodeId;
        const out = [];

        for (const choice of raw) {
            if (!meetsRequirements(choice.requires, choice.requiresClue || null)) {
                continue;
            }

            let visited = false;
            let disabled = false;

            if (node.investigationHub && !this.isRoomExit(choice) && !choice.revisitAllowed) {
                // Hub: lock only after room fully investigated
                if (this.isHubLocationLocked(choice)) {
                    visited = true;
                    disabled = true;
                }
            } else if (node.investigationRoom && this.isOneVisitRoomAction(node, choice)) {
                if (this.isRoomActionVisited(roomId, choice)) {
                    visited = true;
                    disabled = true;
                }
            }

            out.push({ choice, disabled, visited });
        }

        return out;
    },

    isHubNodeId(nodeId) {
        if (!nodeId) return false;
        if (this.storyData[nodeId]?.investigationHub) return true;
        return /_hub$/i.test(nodeId);
    },

    /**
     * Mark room actions; lock hub location only when room is fully cleared AND player returns to hub.
     */
    applyInvestigationVisit(node, nodeId, choice) {
        if (!choice) return;

        const nextId = choice.nextNodeId;

        // Entering a room from the hub — remember it across sub-nodes
        if (node?.investigationHub && nextId && !choice.hubExit) {
            this.activeInvestigationRoom = nextId;
        }

        // Inside investigation room: mark one-visit actions
        if (node?.investigationRoom && this.isOneVisitRoomAction(node, choice)) {
            const visitKey = this.getVisitKey(choice);
            if (visitKey) {
                setFlag(this.actionVisitFlag(nodeId, visitKey), true);
            }
        }

        // Returning to hub: lock that room's hub option only if fully investigated
        if (this.isHubNodeId(nextId)) {
            const roomId = node?.investigationRoom ? nodeId : this.activeInvestigationRoom;
            if (roomId && this.isRoomFullyCleared(roomId)) {
                setFlag(this.hubRoomClearedFlag(roomId), true);
            }
            this.activeInvestigationRoom = null;
        }
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

    resolveLocation(node, nodeId) {
        if (node?.location && String(node.location).trim()) {
            return String(node.location).trim();
        }
        if (node?.cgCaption && String(node.cgCaption).trim()) {
            return String(node.cgCaption).trim();
        }
        if (nodeId && /_(start|hub|end)$/i.test(nodeId)) {
            return node?.location || this.currentLocation || null;
        }
        return this.currentLocation || null;
    },

    async start(nodeId) {
        this.storyData = {};
        this.loadedChapters.clear();
        this.isBusy = false;
        this.reading = false;
        this.currentLocation = null;
        this.activeInvestigationRoom = null;
        UI.cancelTypewriter();
        if (typeof UI.updateLocationLabel === 'function') {
            UI.updateLocationLabel(null);
        }
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

        const location = this.resolveLocation(node, nodeId);
        this.currentLocation = location;
        if (typeof UI.updateLocationLabel === 'function') {
            UI.updateLocationLabel(location);
        }

        const displayChoices = this.getDisplayChoices(node);
        const displayText = resolveNodeText(node);
        const speaker = node.speaker || null;

        recordNodeTranscript({
            speaker,
            text: displayText,
            nodeId,
            location
        });

        if (typeof UI.setInfectionAtmosphere === 'function') {
            UI.setInfectionAtmosphere(getInfection());
        }

        await UI.displayNode({
            text: displayText,
            speaker,
            location,
            choices: displayChoices.map((entry) => ({
                text: entry.visited
                    ? `${entry.choice.text} (already searched)`
                    : entry.choice.text,
                disabled: entry.disabled,
                visited: entry.visited
            })),
            isTerminal: displayChoices.length === 0 || node.isEnding === true,
            endingLabel: node.endingTitle || null
        });

        this.reading = false;
        saveGame(nodeId);
        this.isBusy = false;
    },

    makeChoice(choiceIndex) {
        if (this.isBusy || this.reading) return;

        const nodeId = this.currentNodeId;
        const node = this.storyData[nodeId];
        if (!node) return;

        const displayChoices = this.getDisplayChoices(node);
        const entry = displayChoices[choiceIndex];
        if (!entry || entry.disabled) return;

        const choice = entry.choice;
        if (!choice) return;

        this.isBusy = true;

        this.applyInvestigationVisit(node, nodeId, choice);

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
