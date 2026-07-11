window.UI = {
    displayNode: function(text, choices) {
        const storyTextContainer = document.getElementById('story-log');
        const choicesContainer = document.getElementById('choices-container');

        if (storyTextContainer) {
            storyTextContainer.textContent = text;
        }

        if (choicesContainer) {
            choicesContainer.innerHTML = '';
            choices.forEach((choice, index) => {
                const btn = document.createElement('button');
                btn.textContent = choice.text;
                btn.className = 'choice-btn';
                btn.onclick = () => {
                    window.GameEngine.makeChoice(index);
                };
                choicesContainer.appendChild(btn);
            });
        }
    },

    updateNotebook: function() {
        let inventoryList = document.getElementById('inventory-list');
        if (!inventoryList) {
            inventoryList = document.createElement('ul');
            inventoryList.id = 'inventory-list';
            const cluesTab = document.getElementById('clues-tab');
            if (cluesTab) cluesTab.appendChild(inventoryList);
        }
        
        if (inventoryList) {
            inventoryList.innerHTML = '';
            window.GameState.inventory.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                inventoryList.appendChild(li);
            });
        }
    },

    bindNotebookButton: function() {
        const notebookBtn = document.getElementById('notebook-btn');
        const notebookModal = document.getElementById('notebook-modal');
        const closeModalBtn = document.getElementById('close-notebook-btn');

        if (notebookBtn && notebookModal) {
            notebookBtn.addEventListener('click', () => {
                this.updateNotebook();
                notebookModal.style.display = 'block';
            });
        }
        
        if (closeModalBtn && notebookModal) {
            closeModalBtn.addEventListener('click', () => {
                notebookModal.style.display = 'none';
            });
        }
    },

    init: function() {
        this.bindNotebookButton();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.UI.init();
    // Start the game loop
    if (window.GameEngine) {
        window.GameEngine.renderNode("ch1_start");
    }
});
