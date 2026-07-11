window.storyData = window.storyData || {};

class Engine {
    constructor() {
        this.currentNodeId = null;
    }

    renderNode(nodeId) {
        this.currentNodeId = nodeId;
        const node = window.storyData[nodeId];
        
        if (!node) {
            console.error(`Node ${nodeId} not found.`);
            return;
        }

        // Filter choices based on requiresClue
        const availableChoices = (node.choices || []).filter(choice => {
            if (choice.requiresClue && !window.hasClue(choice.requiresClue)) {
                return false;
            }
            return true;
        });

        // Trigger UI render
        if (window.UI) {
            window.UI.displayNode(node.text, availableChoices);
        }
    }

    makeChoice(choiceIndex) {
        const node = window.storyData[this.currentNodeId];
        if (!node) return;

        const availableChoices = (node.choices || []).filter(choice => {
            if (choice.requiresClue && !window.hasClue(choice.requiresClue)) {
                return false;
            }
            return true;
        });

        const choice = availableChoices[choiceIndex];
        if (!choice) return;

        if (typeof choice.onChoose === 'function') {
            choice.onChoose(window.GameState);
        }

        if (choice.nextNodeId) {
            this.renderNode(choice.nextNodeId);
        }
    }
}

window.GameEngine = new Engine();
