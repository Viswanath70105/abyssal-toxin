# Abyssal Toxin - Branching Guide & Walkthrough

This document outlines all major narrative branches, state variables (Infection, Trust, Flags), and how to achieve the specific endings in the game.

## 1. Key State Variables

### Infection (`hiddenInfection`)
Your Infection level is the most critical hidden stat. It dictates how attuned you become to the Abyssal Toxin swarm, affecting what dialogue choices you see and which endings you can unlock.
*   **Chapter 1**: Examining the glowing mud adds `+5`.
*   **Chapter 2**: Using the rebreather when sealing the door reduces infection by `-5`.
*   **Chapter 3**: Hotwiring Miller's locker and finding the canister adds `+10`.
*   **Chapter 5**: Looking at the creature in the Archives adds `+15`. Running blindly instead of blinding it adds `+20`.
*   **Chapter 6**: Listening closely to the radio broadcast adds `+10`.
*   **Chapter 7**: Using David's codes to get the prototype cure reduces infection by `-15`. Trying to force the lock fails and adds `+20` from spore exposure.
*   **Chapter 8**: Listening to the swarm's memories adds `+5`.
*   **Chapter 10**: Saving Maya requires swimming through infected water, adding `+10`.
*   **Chapter 11**: Diving without a rebreather adds `+25`. Fighting Miller's husk directly adds `+10`.

### Trust
Your relationships dictate who helps you and who you can save.
*   **Miller**: Friendly intro (+1), Cold intro (-1). Abandoning him in Chapter 2 (-10).
*   **David**: Aggressive questioning (-2). Recording his confession (-5). Saving his life in Chapter 10 (+20). Note: You need non-negative trust (`>= 0`) with David to use his codes in Chapter 7.
*   **Otto**: Accusing him of theft (-5). Calming him down (+2).
*   **Chloe**: Comforting her in Comms (+5). Blaming her (-10).
*   **Arthur**: Helping him stabilize the drill (+10). Punching him (-10).

### Flags (Crucial Decisions)
*   **`has_rebreather`**: Acquired in Chapter 2. Unlocks the ability to reduce infection after Miller's death and safely dive in Chapter 11.
*   **`found_canister`**: Acquired in Chapter 3. Unlocks unique dialogue confronting Dr. Aris in Chapter 7.
*   **`maya_trusts_you`**: Achieved by coaxing Maya out gently in Chapter 4. **Required** to save Maya in Chapter 10.
*   **`understands_swarm`**: Acquired by listening to the swarm in Chapter 8 (requires `Infection >= 20`). Unlocks the ability to peacefully spare Miller's husk in Chapter 11.
*   **`david_survived` / `maya_survived` / `lone_survivor`**: Granted in Chapter 10 based on who you save.

---

## 2. Chapter-by-Chapter Branching

**Chapter 1-2**: Determines early Miller trust and if you acquire the `has_rebreather` flag.
**Chapter 3**: Focuses on investigation. Hotwiring the locker gives `found_canister` but costs `+10` Infection. Pushing David lowers his trust.
**Chapter 4**: You must be gentle with Maya to get the `maya_trusts_you` flag.
**Chapter 5**: Sneaking through the Archives cleanly avoids massive infection penalties (`+20` if you run blindly, `+15` if you stare at the creature).
**Chapter 6**: A high infection player (`>= 15`) can choose to listen to the radio to attune to the swarm.
**Chapter 7**: If you have positive trust with David (`>= 0`), you can access the Medbay to get the cure (`-15` Infection). If you pushed/accused him in Chapter 3, you are locked out and suffer a massive `+20` Infection penalty.
**Chapter 8**: If your infection is `>= 20`, you can listen to the swarm's memories, granting the `understands_swarm` flag.
**Chapter 9**: Choose whether to redeem Arthur (Trust `+10`) or punish him (Trust `-10`).
**Chapter 10 (The Assimilation - Major Branch)**:
*   *Save David*: Requires Trust `>= 0`. Grants `david_survived`.
*   *Save Maya*: Requires `maya_trusts_you`. Grants `maya_survived`, adds `+10` Infection.
*   *Save Yourself*: Grants `lone_survivor`.
**Chapter 11 (Dark Water)**: 
*   If you have `has_rebreather`, you dive safely. Otherwise, `+25` Infection.
*   When confronting Miller's husk: If you have `understands_swarm`, you can spare him peacefully. Otherwise, you must fight (`+10` Infection).

---

## 3. How to Unlock the Endings (Chapter 15)

In Chapter 15, you confront Gideon Stroud at the final escape pod. The ending you receive depends entirely on your Infection level.

### Ending A: Surface Tension
**Requirements**: Low Infection (Must NOT have `Infection >= 10`).
**How to get it**: Play cautiously. Use the rebreather in Ch 2 & 11. Do not stare at the creature in Ch 5. Get the cure in Ch 7 (meaning you must be nice to David in Ch 3).
**Outcome**: Gideon sees you are clean. He lowers his weapon and holds the door, allowing you to escape to the surface unscathed.

### Ending B: Surface Tension (Wounded)
**Requirements**: Moderate Infection (`Infection < 30`).
**How to get it**: This is the default failure state if you try to reason with Gideon but your infection is `>= 10`, or if you simply choose to fight him for the pod.
**Outcome**: You wrestle Gideon into the pod and launch, but he shoots you in the shoulder. You survive, but carry the physical and mental scars.

### Ending C: Patient Zero
**Requirements**: High Infection (`Infection >= 30`).
**How to get it**: Lean into the infection. Examine the mud (Ch 1), hotwire the locker (Ch 3), look at the creature (Ch 5), fail to get the cure (Ch 7), save Maya (Ch 10), and dive without a rebreather (Ch 11).
**Outcome**: A unique dialogue option unlocks where the Abyssal Toxin swarm speaks through you. You consume Gideon effortlessly and take the pod to the surface, bringing the infection to Earth.

### Ending D: The Abyssal Grave
**Requirements**: Any.
**How to get it**: Choose to accept Gideon's logic at the end.
**Outcome**: You lay down your arms. You and Gideon watch the station doors buckle, sacrificing yourselves so the organism never reaches the surface.
