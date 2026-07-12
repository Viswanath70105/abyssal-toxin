/**
 * Silent-safe asset pipeline for BGM, SFX, and CG placeholders.
 * Missing files / blocked autoplay never break the story.
 */

const musicCache = new Map();
const sfxCache = new Map();

let currentBgm = null;
let currentBgmId = null;
let currentCgPath = null;
let muted = false;
let bgmVolume = 0.35;
let sfxVolume = 0.55;

function dataUrl(relativePath) {
    const base = import.meta.env.BASE_URL || '/';
    return `${base}${relativePath.replace(/^\//, '')}`;
}

function musicSrc(id) {
    // Prefer assets under public via Vite base, with common extensions
    return dataUrl(`assets/music/${id}.mp3`);
}

function sfxSrc(id) {
    return dataUrl(`assets/audio/${id}.mp3`);
}

function cgSrc(pathOrId) {
    if (!pathOrId) return null;
    if (pathOrId.includes('/') || pathOrId.includes('.')) {
        return dataUrl(pathOrId.startsWith('assets/') ? pathOrId : `assets/images/${pathOrId}`);
    }
    return dataUrl(`assets/images/${pathOrId}.jpg`);
}

function safePlay(audio) {
    if (!audio || muted) return;
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
        p.catch(() => {
            /* autoplay policies / missing files — ignore */
        });
    }
}

export const Assets = {
    setMuted(value) {
        muted = Boolean(value);
        if (muted) {
            if (currentBgm) currentBgm.pause();
        } else if (currentBgm && currentBgmId) {
            safePlay(currentBgm);
        }
        try {
            localStorage.setItem('abyssal-toxin-muted', muted ? '1' : '0');
        } catch {
            /* ignore */
        }
    },

    isMuted() {
        return muted;
    },

    loadSettings() {
        try {
            muted = localStorage.getItem('abyssal-toxin-muted') === '1';
        } catch {
            muted = false;
        }
    },

    /**
     * @param {string|null|undefined} id - track id without extension
     * @param {{ loop?: boolean, fade?: boolean }} opts
     */
    playBgm(id, opts = {}) {
        if (!id) {
            this.stopBgm();
            return;
        }
        if (id === currentBgmId && currentBgm && !currentBgm.paused) return;

        this.stopBgm();
        currentBgmId = id;

        let audio = musicCache.get(id);
        if (!audio) {
            audio = new Audio(musicSrc(id));
            audio.loop = opts.loop !== false;
            audio.preload = 'auto';
            musicCache.set(id, audio);
        }

        audio.volume = bgmVolume;
        audio.loop = opts.loop !== false;
        currentBgm = audio;

        audio.onerror = () => {
            // File not present yet — stay silent
            if (currentBgmId === id) {
                currentBgm = null;
            }
        };

        safePlay(audio);
    },

    stopBgm() {
        if (currentBgm) {
            try {
                currentBgm.pause();
                currentBgm.currentTime = 0;
            } catch {
                /* ignore */
            }
        }
        currentBgm = null;
        currentBgmId = null;
    },

    /**
     * @param {string|null|undefined} id
     */
    playSfx(id) {
        if (!id || muted) return;

        let audio = sfxCache.get(id);
        if (!audio) {
            audio = new Audio(sfxSrc(id));
            audio.preload = 'auto';
            sfxCache.set(id, audio);
        }

        try {
            const instance = audio.cloneNode();
            instance.volume = sfxVolume;
            instance.onerror = () => {};
            safePlay(instance);
        } catch {
            /* ignore */
        }
    },

    /**
     * Show CG / portrait placeholder in #cg-layer.
     * @param {string|null|undefined} pathOrId
     * @param {string|null} [caption]
     */
    showCg(pathOrId, caption = null) {
        const layer = document.getElementById('cg-layer');
        const img = document.getElementById('cg-image');
        const cap = document.getElementById('cg-caption');
        const placeholder = document.getElementById('cg-placeholder');
        if (!layer) return;

        if (!pathOrId) {
            this.hideCg();
            return;
        }

        const src = cgSrc(pathOrId);
        currentCgPath = pathOrId;
        layer.classList.remove('hidden');
        layer.setAttribute('aria-hidden', 'false');

        if (cap) {
            cap.textContent = caption || '';
            cap.classList.toggle('hidden', !caption);
        }

        if (img && src) {
            img.classList.add('hidden');
            if (placeholder) {
                placeholder.classList.remove('hidden');
                placeholder.textContent = caption || `Visual: ${pathOrId}`;
            }

            img.onload = () => {
                img.classList.remove('hidden');
                if (placeholder) placeholder.classList.add('hidden');
            };
            img.onerror = () => {
                img.classList.add('hidden');
                if (placeholder) {
                    placeholder.classList.remove('hidden');
                    placeholder.textContent = caption || `CG placeholder · ${pathOrId}`;
                }
            };
            img.src = src;
            img.alt = caption || pathOrId;
        }
    },

    hideCg() {
        const layer = document.getElementById('cg-layer');
        const img = document.getElementById('cg-image');
        if (layer) {
            layer.classList.add('hidden');
            layer.setAttribute('aria-hidden', 'true');
        }
        if (img) {
            img.removeAttribute('src');
            img.classList.add('hidden');
        }
        currentCgPath = null;
    },

    /**
     * Apply optional node presentation fields: bgm, sfx, cg, cgCaption, location.
     * CG does not stick with a wrong room name — if this node has no cg, hide the layer.
     * Location is displayed by the HUD (not only as a CG caption).
     */
    applyNodePresentation(node) {
        if (!node) return;

        if (Object.prototype.hasOwnProperty.call(node, 'bgm')) {
            if (node.bgm) this.playBgm(node.bgm);
            else this.stopBgm();
        }

        if (node.sfx) {
            this.playSfx(node.sfx);
        }

        // Always resolve CG state per node so investigation rooms never keep a prior hangar/mess art
        if (node.cg) {
            const caption = node.cgCaption || node.location || null;
            this.showCg(node.cg, caption);
        } else {
            this.hideCg();
        }
    },

    /** Soft UI click for choices */
    playChoiceSfx() {
        this.playSfx('ui_select');
    }
};
