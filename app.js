// ==========================================
// THE ABYSSAL TOXIN — App Controller
// ==========================================

const ENDING_META = {
    survivor: { label: "ENDING 1: THE WHISTLEBLOWER", class: "survivor" },
    madness:  { label: "ENDING 2: THE ABYSSAL MADNESS", class: "madness" },
    corporate:{ label: "ENDING 3: THE CORPORATE ASSET", class: "corporate" },
    crush:    { label: "ENDING 4: THE CRUSH DEPTH", class: "crush" }
};

class Game {
    constructor() {
        this.history = [];
        this.storyLog = [];
        this.titleScreen = document.getElementById("titleScreen");
        this.gameContainer = document.getElementById("gameContainer");
        this.storyLogEl = document.getElementById("storyLog");
        this.restartBar = document.getElementById("restartBar");
        this.startBtn = document.getElementById("startBtn");
        this.restartBtn = document.getElementById("restartBtn");

        this.startBtn.addEventListener("click", () => this.startGame());
        this.restartBtn.addEventListener("click", () => this.restart());
        this.createParticles();
    }

    createParticles() {
        const container = document.getElementById("particles");
        for (let i = 0; i < 12; i++) {
            const p = document.createElement("div");
            p.classList.add("particle");
            p.style.left = Math.random() * 100 + "%";
            p.style.animationDuration = (12 + Math.random() * 20) + "s";
            p.style.animationDelay = (Math.random() * 15) + "s";
            p.style.width = "1px";
            p.style.height = "1px";
            container.appendChild(p);
        }
    }

    startGame() {
        this.titleScreen.classList.add("hidden");
        this.gameContainer.classList.add("active");
        this.restartBar.classList.add("visible");

        setTimeout(() => {
            this.renderNode("start");
        }, 400);
    }

    renderNode(nodeId) {
        const nodeBuilder = storyData[nodeId];
        if (!nodeBuilder) return;

        const node = nodeBuilder(this.history);
        this.history.push(node.id);
        this.storyLog.push(node);

        // Dim all previous segments
        const previousSegments = this.storyLogEl.querySelectorAll(".story-segment");
        previousSegments.forEach(seg => seg.classList.add("past"));

        // Create new segment
        const segment = document.createElement("div");
        segment.classList.add("story-segment");
        segment.dataset.nodeId = node.id;

        // Ending badge
        if (node.ending) {
            const meta = ENDING_META[node.ending];
            const badge = document.createElement("div");
            badge.classList.add("ending-badge", meta.class);
            badge.textContent = meta.label;
            segment.appendChild(badge);
        }

        // Story text
        const textEl = document.createElement("div");
        textEl.classList.add("story-text");
        const paragraphs = node.text.split("\n").filter(p => p.trim());
        paragraphs.forEach(p => {
            const pEl = document.createElement("p");
            pEl.textContent = p.trim();
            textEl.appendChild(pEl);
        });
        segment.appendChild(textEl);

        // Choices
        if (node.choices.length > 0) {
            const choicesContainer = document.createElement("div");
            choicesContainer.classList.add("choices-container");

            node.choices.forEach(choice => {
                const btn = document.createElement("button");
                btn.classList.add("choice-btn");
                btn.innerHTML = `<span>${choice.text}</span>`;
                btn.addEventListener("click", () => {
                    this.makeChoice(segment, choicesContainer, choice);
                });
                choicesContainer.appendChild(btn);
            });

            segment.appendChild(choicesContainer);
        }

        this.storyLogEl.appendChild(segment);

        // Scroll to new segment
        setTimeout(() => {
            segment.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    }

    makeChoice(segment, choicesContainer, choice) {
        // Remove choices
        choicesContainer.remove();

        // Show the choice the player made
        const choiceLabel = document.createElement("div");
        choiceLabel.classList.add("choice-made");
        choiceLabel.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            <span>${choice.text}</span>
        `;
        segment.appendChild(choiceLabel);

        // Render next node
        setTimeout(() => {
            this.renderNode(choice.nextNodeId);
        }, 300);
    }

    restart() {
        this.history = [];
        this.storyLog = [];
        this.storyLogEl.innerHTML = "";
        this.gameContainer.classList.remove("active");
        this.restartBar.classList.remove("visible");
        this.titleScreen.classList.remove("hidden");
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    new Game();
});
