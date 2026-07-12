import {
    GameState,
    loadGame,
    formatSaveTime,
    INFECTION,
    loadSettings,
    saveSettings
} from './state.js';
import { GameEngine } from './engine.js';
import { Assets } from './assets.js';

export const UI = {
    cluesDb: {},
    charactersDb: {},
    onContinue: null,
    onNewGame: null,
    onReturnToTitle: null,
    _newGameArmed: false,
    settings: { typewriter: true, typewriterCps: 42 },

    _typeTimer: null,
    _typeResolve: null,
    _typeFullText: '',
    _typeEl: null,
    _skipHandler: null,
    _awaitingContinue: false,
    _continueResolve: null,

    dataUrl(relativePath) {
        const base = import.meta.env.BASE_URL || '/';
        return `${base}${relativePath.replace(/^\//, '')}`;
    },

    async loadDatabase() {
        try {
            const [cluesRes, charsRes] = await Promise.all([
                fetch(this.dataUrl('data/clues.json')),
                fetch(this.dataUrl('data/characters.json'))
            ]);

            if (cluesRes.ok) {
                this.cluesDb = await cluesRes.json();
            } else {
                console.warn('Failed to load clues.json', cluesRes.status);
            }

            if (charsRes.ok) {
                this.charactersDb = await charsRes.json();
            } else {
                console.warn('Failed to load characters.json', charsRes.status);
            }
        } catch (err) {
            console.warn('Failed to load notebook databases:', err);
        }

        this.updateNotebook();
    },

    loadPresentationSettings() {
        this.settings = loadSettings();
        Assets.loadSettings();
        this.syncSettingsUI();
    },

    syncSettingsUI() {
        const twOn = this.settings.typewriter !== false;
        document.querySelectorAll('#toggle-typewriter, .hud-typewriter-sync').forEach((el) => {
            el.checked = twOn;
        });
        document.querySelectorAll('#toggle-mute, .toggle-mute').forEach((el) => {
            el.checked = Assets.isMuted();
        });
    },

    setTypewriterEnabled(enabled) {
        this.settings.typewriter = Boolean(enabled);
        saveSettings(this.settings);
        if (!enabled) this.skipTypewriter();
    },

    setInfectionAtmosphere(level = 0) {
        const body = document.body;
        if (!body) return;
        body.classList.remove(
            'infection-mild',
            'infection-moderate',
            'infection-severe',
            'infection-critical'
        );
        if (level >= INFECTION.CRITICAL) body.classList.add('infection-critical');
        else if (level >= INFECTION.SEVERE) body.classList.add('infection-severe');
        else if (level >= INFECTION.MODERATE) body.classList.add('infection-moderate');
        else if (level >= INFECTION.MILD) body.classList.add('infection-mild');
    },

    cancelTypewriter() {
        if (this._typeTimer) {
            clearInterval(this._typeTimer);
            this._typeTimer = null;
        }
        if (this._skipHandler) {
            document.removeEventListener('keydown', this._skipHandler);
            const story = document.getElementById('story-log');
            if (story) story.removeEventListener('click', this._skipHandler);
            this._skipHandler = null;
        }
        if (this._typeResolve) {
            const resolve = this._typeResolve;
            this._typeResolve = null;
            resolve();
        }
        this._typeEl = null;
        this._typeFullText = '';
    },

    skipTypewriter() {
        if (!this._typeEl || !this._typeFullText) {
            if (this._awaitingContinue) this.confirmContinue();
            return;
        }
        if (this._typeTimer) {
            clearInterval(this._typeTimer);
            this._typeTimer = null;
        }
        this._typeEl.textContent = this._typeFullText;
        this._typeEl.classList.remove('is-typing');
        if (this._skipHandler) {
            document.removeEventListener('keydown', this._skipHandler);
            const story = document.getElementById('story-log');
            if (story) story.removeEventListener('click', this._skipHandler);
            this._skipHandler = null;
        }
        if (this._typeResolve) {
            const resolve = this._typeResolve;
            this._typeResolve = null;
            resolve();
        }
    },

    /**
     * Typewriter reveal. Click story / Space / Enter skips to full text.
     */
    typeText(el, text) {
        this.cancelTypewriter();
        this._typeEl = el;
        this._typeFullText = text || '';

        if (!this.settings.typewriter || !text) {
            el.textContent = text || '';
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            this._typeResolve = resolve;
            let i = 0;
            el.textContent = '';
            el.classList.add('is-typing');

            const cps = Math.max(12, this.settings.typewriterCps || 42);
            const ms = Math.round(1000 / cps);

            this._skipHandler = (e) => {
                if (e.type === 'keydown') {
                    if (e.key !== ' ' && e.key !== 'Enter') return;
                    // Don't steal keys while typing in inputs (none now) or when modal open
                    if (document.querySelector('.modal-overlay:not(.hidden)')) return;
                    e.preventDefault();
                }
                this.skipTypewriter();
            };

            document.addEventListener('keydown', this._skipHandler);
            const story = document.getElementById('story-log');
            if (story) story.addEventListener('click', this._skipHandler);

            this._typeTimer = setInterval(() => {
                i += 1;
                el.textContent = text.slice(0, i);
                if (i >= text.length) {
                    clearInterval(this._typeTimer);
                    this._typeTimer = null;
                    el.classList.remove('is-typing');
                    if (this._skipHandler) {
                        document.removeEventListener('keydown', this._skipHandler);
                        if (story) story.removeEventListener('click', this._skipHandler);
                        this._skipHandler = null;
                    }
                    if (this._typeResolve) {
                        const r = this._typeResolve;
                        this._typeResolve = null;
                        r();
                    }
                }
            }, ms);
        });
    },

    /**
     * After text is fully revealed: either show choices, or wait for Continue.
     * For multi-choice: choices appear after typewriter (continue = choose).
     * For single "advance" style we still show the choice buttons.
     * Continue prompt used when isTerminal with no choices before restart buttons,
     * and as a hint under the text while typing.
     */
    showContinuePrompt(visible, label = 'Click or press Space to continue') {
        const prompt = document.getElementById('continue-prompt');
        if (!prompt) return;
        prompt.textContent = label;
        prompt.classList.toggle('hidden', !visible);
        prompt.setAttribute('aria-hidden', visible ? 'false' : 'true');
    },

    confirmContinue() {
        if (!this._awaitingContinue) return;
        this._awaitingContinue = false;
        this.showContinuePrompt(false);
        const contBtn = document.getElementById('reading-continue-btn');
        if (contBtn) contBtn.classList.add('hidden');
        if (this._continueResolve) {
            const r = this._continueResolve;
            this._continueResolve = null;
            r();
        }
    },

    waitForContinue(label) {
        this._awaitingContinue = true;
        this.showContinuePrompt(true, label);
        const contBtn = document.getElementById('reading-continue-btn');
        if (contBtn) {
            contBtn.classList.remove('hidden');
            contBtn.textContent = 'Continue';
        }
        return new Promise((resolve) => {
            this._continueResolve = resolve;
        });
    },

    /**
     * @param {{ text: string, speaker?: string|null, location?: string|null, choices: Array, isTerminal?: boolean, endingLabel?: string|null }} payload
     */
    async displayNode(payload) {
        const {
            text,
            speaker = null,
            location = null,
            choices = [],
            isTerminal = false,
            endingLabel = null
        } = payload;

        const storyTextContainer = document.getElementById('story-log');
        const choicesContainer = document.getElementById('choices-container');

        this.updateLocationLabel(location);

        // Hide choices while reading
        if (choicesContainer) {
            choicesContainer.replaceChildren();
            choicesContainer.classList.add('choices-locked');
        }

        const contBtn = document.getElementById('reading-continue-btn');
        if (contBtn) contBtn.classList.add('hidden');

        if (storyTextContainer) {
            storyTextContainer.replaceChildren();

            if (endingLabel) {
                const badge = document.createElement('div');
                badge.className = 'ending-badge';
                badge.textContent = endingLabel;
                storyTextContainer.appendChild(badge);
            }

            // In-panel location chip (accurate during investigation when CG is absent)
            if (location) {
                const locEl = document.createElement('div');
                locEl.className = 'story-location';
                locEl.textContent = location;
                storyTextContainer.appendChild(locEl);
            }

            if (speaker) {
                const speakerEl = document.createElement('div');
                speakerEl.className = 'story-speaker';
                speakerEl.textContent = speaker;
                storyTextContainer.appendChild(speakerEl);
            }

            const textEl = document.createElement('div');
            textEl.className = 'story-body';
            storyTextContainer.appendChild(textEl);

            this.showContinuePrompt(
                this.settings.typewriter,
                'Click text or press Space / Enter to skip'
            );

            await this.typeText(textEl, text);
            this.showContinuePrompt(false);
        }

        // Optional beat: brief continue when many choices (reading pause)
        // Only force an explicit Continue when there are zero story choices
        // and it's not a terminal restart screen — otherwise reveal choices.

        if (!choicesContainer) return;

        choicesContainer.classList.remove('choices-locked');
        choicesContainer.replaceChildren();

        choices.forEach((choice, index) => {
            // Support both legacy string choices and { text, disabled, visited }
            const text = typeof choice === 'string' ? choice : choice.text;
            const disabled = typeof choice === 'object' && choice.disabled === true;
            const visited = typeof choice === 'object' && choice.visited === true;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = text;
            btn.className = 'choice-btn glass-btn choice-enter';
            if (visited) btn.classList.add('choice-visited');
            if (disabled) {
                btn.disabled = true;
                btn.setAttribute('aria-disabled', 'true');
            }
            btn.style.animationDelay = `${Math.min(index * 0.05, 0.3)}s`;
            if (!disabled) {
                btn.addEventListener('click', () => {
                    GameEngine.makeChoice(index);
                });
            }
            choicesContainer.appendChild(btn);
        });

        // Terminal only when the engine says so, or there are literally no choices to show
        if (isTerminal || choices.length === 0) {
            const againBtn = document.createElement('button');
            againBtn.type = 'button';
            againBtn.className = 'choice-btn glass-btn';
            againBtn.textContent = 'Play Again';
            againBtn.addEventListener('click', () => {
                if (typeof this.onNewGame === 'function') this.onNewGame({ force: true });
            });
            choicesContainer.appendChild(againBtn);

            const titleBtn = document.createElement('button');
            titleBtn.type = 'button';
            titleBtn.className = 'choice-btn glass-btn';
            titleBtn.textContent = 'Return to Title';
            titleBtn.addEventListener('click', () => {
                if (typeof this.onReturnToTitle === 'function') this.onReturnToTitle();
            });
            choicesContainer.appendChild(titleBtn);
        }
    },

    showError(message) {
        this.cancelTypewriter();
        const storyTextContainer = document.getElementById('story-log');
        const choicesContainer = document.getElementById('choices-container');

        if (storyTextContainer) {
            storyTextContainer.replaceChildren();
            const err = document.createElement('div');
            err.className = 'story-error';
            err.textContent = message;
            storyTextContainer.appendChild(err);
        }

        if (choicesContainer) {
            choicesContainer.replaceChildren();
            choicesContainer.classList.remove('choices-locked');
            const titleBtn = document.createElement('button');
            titleBtn.type = 'button';
            titleBtn.className = 'choice-btn glass-btn';
            titleBtn.textContent = 'Return to Title';
            titleBtn.addEventListener('click', () => {
                if (typeof this.onReturnToTitle === 'function') this.onReturnToTitle();
            });
            choicesContainer.appendChild(titleBtn);
        }
    },

    updateChapterTitle(title) {
        const titleContainer = document.getElementById('chapter-title');
        if (titleContainer) titleContainer.textContent = title;
    },

    /**
     * Location label in the HUD — where the player is right now (investigation rooms, etc.).
     */
    updateLocationLabel(location) {
        const el = document.getElementById('location-label');
        if (!el) return;
        if (location && String(location).trim()) {
            el.textContent = String(location).trim();
            el.classList.remove('is-empty');
        } else {
            el.textContent = '';
            el.classList.add('is-empty');
        }
    },

    switchTab(targetId) {
        const tabs = document.querySelectorAll('.tab-btn');
        const panes = document.querySelectorAll('.tab-pane');

        tabs.forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.target === targetId);
        });

        panes.forEach((pane) => {
            pane.classList.toggle('active', pane.id === targetId);
        });
    },

    updateNotebook() {
        this.renderSuspects();
        this.renderClues();
    },

    renderSuspects() {
        const suspectsTab = document.getElementById('suspects-tab');
        if (!suspectsTab) return;

        suspectsTab.replaceChildren();

        const characters = Object.values(this.charactersDb || {});
        if (characters.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'notebook-empty';
            empty.textContent = 'No personnel files loaded.';
            suspectsTab.appendChild(empty);
            return;
        }

        characters.forEach((char) => {
            const card = document.createElement('div');
            card.className = 'notebook-item';

            const name = document.createElement('h3');
            name.className = 'notebook-item-title';
            name.textContent = char.name || char.id || 'Unknown';

            const role = document.createElement('p');
            role.className = 'notebook-item-meta';
            role.textContent = char.role || 'Unknown role';

            const status = document.createElement('span');
            status.className = 'notebook-tag';
            status.textContent = (char.status || 'unknown').toUpperCase();

            card.appendChild(name);
            card.appendChild(role);
            card.appendChild(status);
            suspectsTab.appendChild(card);
        });
    },

    renderClues() {
        const cluesTab = document.getElementById('clues-tab');
        if (!cluesTab) return;

        cluesTab.replaceChildren();

        if (!GameState.inventory.length) {
            const empty = document.createElement('p');
            empty.className = 'notebook-empty';
            empty.textContent = 'No evidence collected yet. Investigate the station.';
            cluesTab.appendChild(empty);
            return;
        }

        GameState.inventory.forEach((clueId) => {
            const meta = this.cluesDb[clueId] || {
                id: clueId,
                name: clueId,
                description: 'Uncatalogued evidence.',
                category: 'Unknown'
            };

            const card = document.createElement('div');
            card.className = 'notebook-item';

            const title = document.createElement('h3');
            title.className = 'notebook-item-title';
            title.textContent = meta.name || clueId;

            const category = document.createElement('span');
            category.className = 'notebook-tag';
            category.textContent = meta.category || 'Unknown';

            const desc = document.createElement('p');
            desc.className = 'notebook-item-desc';
            desc.textContent = meta.description || '';

            card.appendChild(title);
            card.appendChild(category);
            card.appendChild(desc);
            cluesTab.appendChild(card);
        });
    },

    updateHistory() {
        const log = document.getElementById('history-log');
        if (!log) return;

        log.replaceChildren();

        if (!GameState.history.length) {
            const empty = document.createElement('p');
            empty.className = 'notebook-empty';
            empty.textContent = 'No transcript entries yet.';
            log.appendChild(empty);
            return;
        }

        GameState.history.forEach((entry) => {
            const item = document.createElement('div');
            item.className = 'history-item glass-panel';

            // New format
            if (entry.type === 'node') {
                if (entry.location) {
                    const loc = document.createElement('p');
                    loc.className = 'history-location';
                    loc.textContent = entry.location;
                    item.appendChild(loc);
                }
                if (entry.speaker) {
                    const sp = document.createElement('p');
                    sp.className = 'history-speaker';
                    sp.textContent = entry.speaker;
                    item.appendChild(sp);
                }
                const nodeP = document.createElement('p');
                nodeP.className = 'history-node-text';
                nodeP.textContent = entry.text || '';
                item.appendChild(nodeP);
            } else if (entry.type === 'choice') {
                const choiceP = document.createElement('p');
                choiceP.className = 'history-choice-text';
                choiceP.textContent = `> ${entry.text || ''}`;
                item.appendChild(choiceP);
            } else {
                // Legacy { nodeText, choiceText }
                if (entry.nodeText) {
                    const nodeP = document.createElement('p');
                    nodeP.className = 'history-node-text';
                    nodeP.textContent = entry.nodeText;
                    item.appendChild(nodeP);
                }
                if (entry.choiceText) {
                    const choiceP = document.createElement('p');
                    choiceP.className = 'history-choice-text';
                    choiceP.textContent = `> ${entry.choiceText}`;
                    item.appendChild(choiceP);
                }
            }

            log.appendChild(item);
        });

        // Keep scrolled to latest
        log.scrollTop = log.scrollHeight;
    },

    openModal(modal) {
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
    },

    closeModal(modal) {
        if (!modal) return;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    },

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach((modal) => {
            this.closeModal(modal);
        });
    },

    showTitleScreen({ hasSave = false, savedAt = null } = {}) {
        const titleScreen = document.getElementById('title-screen');
        const gameContainer = document.getElementById('game-container');
        const hud = document.getElementById('hud');
        const continueBtn = document.getElementById('continue-btn');
        const newGameBtn = document.getElementById('new-game-btn');
        const saveStatus = document.getElementById('save-status');

        this.closeAllModals();
        this.cancelTypewriter();
        this._newGameArmed = false;
        Assets.hideCg();

        if (titleScreen) titleScreen.classList.remove('hidden');
        if (gameContainer) gameContainer.classList.add('hidden');
        if (hud) hud.classList.add('hidden');

        if (continueBtn) {
            continueBtn.classList.toggle('hidden', !hasSave);
        }

        if (saveStatus) {
            if (hasSave) {
                const when = formatSaveTime(savedAt);
                saveStatus.textContent = when
                    ? `Saved progress found · ${when}`
                    : 'Saved progress found on this device';
                saveStatus.classList.remove('hidden');
            } else {
                saveStatus.textContent = '';
                saveStatus.classList.add('hidden');
            }
        }

        if (newGameBtn) {
            newGameBtn.textContent = hasSave ? 'New Game' : 'Begin Descent';
        }

        this.syncSettingsUI();
    },

    showGameScreen() {
        const titleScreen = document.getElementById('title-screen');
        const gameContainer = document.getElementById('game-container');
        const hud = document.getElementById('hud');

        if (titleScreen) titleScreen.classList.add('hidden');
        if (gameContainer) gameContainer.classList.remove('hidden');
        if (hud) hud.classList.remove('hidden');
        this._newGameArmed = false;

        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) {
            const save = loadGame();
            newGameBtn.textContent = save ? 'New Game' : 'Begin Descent';
        }
        this.syncSettingsUI();
    },

    bindButtons() {
        const notebookBtn = document.getElementById('notebook-btn');
        const notebookModal = document.getElementById('notebook-modal');
        const closeModalBtn = document.getElementById('close-notebook-btn');

        if (notebookBtn && notebookModal) {
            notebookBtn.addEventListener('click', () => {
                this.updateNotebook();
                this.openModal(notebookModal);
            });
        }

        if (closeModalBtn && notebookModal) {
            closeModalBtn.addEventListener('click', () => {
                this.closeModal(notebookModal);
            });
        }

        const historyBtn = document.getElementById('history-btn');
        const historyModal = document.getElementById('history-modal');
        const closeHistoryBtn = document.getElementById('close-history-btn');

        if (historyBtn && historyModal) {
            historyBtn.addEventListener('click', () => {
                this.updateHistory();
                this.openModal(historyModal);
            });
        }

        if (closeHistoryBtn && historyModal) {
            closeHistoryBtn.addEventListener('click', () => {
                this.closeModal(historyModal);
            });
        }

        document.querySelectorAll('.modal-overlay').forEach((overlay) => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal(overlay);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = [...document.querySelectorAll('.modal-overlay')].find(
                    (m) => !m.classList.contains('hidden')
                );
                if (openModal) {
                    e.preventDefault();
                    this.closeModal(openModal);
                }
                return;
            }

            // Global continue / skip while reading
            if (
                (e.key === ' ' || e.key === 'Enter') &&
                this._awaitingContinue &&
                !document.querySelector('.modal-overlay:not(.hidden)')
            ) {
                e.preventDefault();
                this.confirmContinue();
            }
        });

        document.querySelectorAll('.tab-btn').forEach((tab) => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.target;
                if (target) this.switchTab(target);
            });
        });

        const continueBtn = document.getElementById('continue-btn');
        const newGameBtn = document.getElementById('new-game-btn');

        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                if (typeof this.onContinue === 'function') this.onContinue();
            });
        }

        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                const save = loadGame();
                if (save && !this._newGameArmed) {
                    this._newGameArmed = true;
                    newGameBtn.textContent = 'Confirm: Erase Save?';
                    newGameBtn.classList.add('danger-confirm');
                    return;
                }
                this._newGameArmed = false;
                newGameBtn.classList.remove('danger-confirm');
                if (typeof this.onNewGame === 'function') this.onNewGame({ force: true });
            });
        }

        const readingContinue = document.getElementById('reading-continue-btn');
        if (readingContinue) {
            readingContinue.addEventListener('click', () => this.confirmContinue());
        }

        // Settings toggles (title + HUD)
        const syncTypewriterChecks = (checked) => {
            document
                .querySelectorAll('#toggle-typewriter, .hud-typewriter-sync')
                .forEach((el) => {
                    el.checked = checked;
                });
        };

        document.querySelectorAll('#toggle-typewriter, .hud-typewriter-sync').forEach((el) => {
            el.addEventListener('change', () => {
                this.setTypewriterEnabled(el.checked);
                syncTypewriterChecks(el.checked);
            });
        });

        document.querySelectorAll('#toggle-mute, .toggle-mute').forEach((el) => {
            el.addEventListener('change', () => {
                Assets.setMuted(el.checked);
                document.querySelectorAll('#toggle-mute, .toggle-mute').forEach((other) => {
                    if (other !== el) other.checked = el.checked;
                });
            });
        });
    },

    init(handlers = {}) {
        this.onContinue = handlers.onContinue || null;
        this.onNewGame = handlers.onNewGame || null;
        this.onReturnToTitle = handlers.onReturnToTitle || null;
        this.loadPresentationSettings();
        this.bindButtons();
    }
};
