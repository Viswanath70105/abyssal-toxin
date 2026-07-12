import { GameState, hasClue, addClue, recordHistory } from './state.js';
import { UI } from './ui.js';

export const GameEngine = {
    currentNodeId: null,
    storyData: {},

    async loadChapterData(chapterId) {
        // e.g. "ch1" -> "chapter_1.json"
        // Ensure path resolves properly from base url
        const cleanId = chapterId.replace('ch', '');
        if (!cleanId) return;
        const url = import.meta.env?.BASE_URL 
            ? `${import.meta.env.BASE_URL}data/chapters/chapter_${cleanId}.json?t=${Date.now()}`
            : `/abyssal-toxin/data/chapters/chapter_${cleanId}.json?t=${Date.now()}`;
            
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            console.error("Failed to load chapter", chapterId);
            return;
        }
        const data = await response.json();
        Object.assign(this.storyData, data);
    },

    async start(nodeId) {
        await this.renderNode(nodeId);
    },

    async renderNode(nodeId) {
        this.currentNodeId = nodeId;
        let node = this.storyData[nodeId];
        
        if (!node) {
            // Try to load the chapter dynamically based on the prefix (e.g. "ch1_start" -> "ch1")
            const chapterId = nodeId.split('_')[0];
            await this.loadChapterData(chapterId);
            node = this.storyData[nodeId];
        }

        if (!node) {
            console.error(`Node ${nodeId} not found even after fetching.`);
            return;
        }

        // Update UI Chapter Title
        const chapterId = nodeId.split('_')[0];
        let title = "CHAPTER " + chapterId.replace('ch', '');
        if (chapterId === 'ch') title = "PREVIEW";
        UI.updateChapterTitle(title);

        const availableChoices = (node.choices || []).filter(choice => {
            if (choice.requiresClue && !hasClue(choice.requiresClue)) {
                return false;
            }
            return true;
        });

        UI.displayNode(node.text, availableChoices);
    },

    makeChoice(choiceIndex) {
        const node = this.storyData[this.currentNodeId];
        if (!node) return;

        const availableChoices = (node.choices || []).filter(choice => {
            if (choice.requiresClue && !hasClue(choice.requiresClue)) {
                return false;
            }
            return true;
        });

        const choice = availableChoices[choiceIndex];
        if (!choice) return;

        // Record history
        recordHistory(node.text, choice.text);

        // Execute data-driven logic
        if (choice.giveClue) {
            addClue(choice.giveClue);
        }

        if (choice.nextNodeId) {
            this.renderNode(choice.nextNodeId);
        }
    }
};
