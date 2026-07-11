import { GameState } from './state.js';
import { GameEngine } from './engine.js';

export const UI = {
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
                    GameEngine.makeChoice(index);
                };
                choicesContainer.appendChild(btn);
            });
        }
    },

    updateChapterTitle: function(title) {
        const titleContainer = document.getElementById('chapter-title');
        if (titleContainer) titleContainer.textContent = title;
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
            GameState.inventory.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item; // Can map to clues.json later
                inventoryList.appendChild(li);
            });
        }
    },

    updateHistory: function() {
        const log = document.getElementById('history-log');
        if (!log) return;
        log.innerHTML = '';
        GameState.history.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'history-item glass-panel';
            item.style.padding = '12px';
            item.style.borderLeft = '4px solid var(--accent-teal)';
            item.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9em; margin-bottom: 8px;">${entry.nodeText}</p>
                              <p style="color: var(--text-main); font-weight: bold;">> ${entry.choiceText}</p>`;
            log.appendChild(item);
        });
    },

    bindButtons: function() {
        const notebookBtn = document.getElementById('notebook-btn');
        const notebookModal = document.getElementById('notebook-modal');
        const closeModalBtn = document.getElementById('close-notebook-btn');

        if (notebookBtn && notebookModal) {
            notebookBtn.addEventListener('click', () => {
                this.updateNotebook();
                notebookModal.classList.remove('hidden');
            });
        }
        
        if (closeModalBtn && notebookModal) {
            closeModalBtn.addEventListener('click', () => {
                notebookModal.classList.add('hidden');
            });
        }

        const historyBtn = document.getElementById('history-btn');
        const historyModal = document.getElementById('history-modal');
        const closeHistoryBtn = document.getElementById('close-history-btn');

        if (historyBtn && historyModal) {
            historyBtn.addEventListener('click', () => {
                this.updateHistory();
                historyModal.classList.remove('hidden');
            });
        }
        
        if (closeHistoryBtn && historyModal) {
            closeHistoryBtn.addEventListener('click', () => {
                historyModal.classList.add('hidden');
            });
        }
    },

    init: function() {
        this.bindButtons();
    }
};
