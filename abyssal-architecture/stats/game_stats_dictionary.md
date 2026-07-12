# Abyssal Toxin - Game Stats Dictionary

This document details the core mechanical statistics tracked by the Abyssal Toxin engine during a playthrough. These stats are stored dynamically in `state.js` under `GameState` and are modified or checked across the chapter JSON files.

## 1. Infection (`hiddenInfection`)
**Type**: Integer (Hidden)
**Default**: `0`

**Purpose**: Tracks the physical and psychological toll the Abyssal Toxin takes on the player character. It serves as the primary branching mechanic for the game's endings and horror elements.

**Mechanics**:
- **Increase (`addInfection: X`)**: Gained through reckless actions, physical exposure to spores, or leaning into the hive mind's influence.
- **Decrease (`addInfection: -X`)**: Reduced by taking precautions (e.g., using a rebreather) or taking medical suppressants (Dr. Aris's prototype cure).
- **Checks (`requiresMinInfection: X`, `requiresMaxInfection: X`)**: High infection unlocks darker dialogue paths (e.g., listening to the swarm, Patient Zero ending). Low infection is required for the "clean" survival ending (Surface Tension).

## 2. Trust (`trust`)
**Type**: Dictionary / Key-Value Map
**Default**: `{}` (Characters are added dynamically when trust is first modified)

**Purpose**: Tracks the player's relationship with surviving crew members on Nereus Station. It affects who is willing to help the player, open locked doors, or share critical information.

**Mechanics**:
- **Modify (`modifyTrust: { character: "Name", amount: X }`)**: Trust can increase or decrease based on dialogue choices (e.g., being sympathetic vs. accusatory) or actions (e.g., saving someone).
- **Checks (`requiresTrust: { character: "Name", min: X, max: Y }`)**: The engine filters choices based on these thresholds. For example, Dr. Aris will only open Medbay if David's trust is high enough to grant the player his security codes.

**Key Characters Tracked**:
- **Miller**: Monitored heavily in Act 1 before his death.
- **David**: Key for accessing Security and Medbay overrides.
- **Otto**: Influences how much information he shares about the missing food.
- **Chloe**: Psychological stability tied to trust; affects her panic levels in Comms.
- **Arthur**: Determines whether he helps stabilize the station or gives up completely in Engineering.

## 3. Flags (`flags`)
**Type**: Dictionary / Key-Value Map (Booleans/Strings)
**Default**: `{}`

**Purpose**: Tracks binary or specific event milestones. If an event happens, a flag is set, unlocking permanent consequences down the line.

**Mechanics**:
- **Set (`setFlag: { key: "name", value: true }`)**: Triggers when the player makes a pivotal decision or finds a critical item.
- **Checks (`requiresFlag: { key: "name", value: true/false }`)**: Ensures narrative continuity.

**Key Flags**:
- `has_rebreather`: Necessary for surviving underwater segments without taking massive infection damage.
- `maya_trusts_you`: Determines if the player can save the stowaway child in Act 2.
- `found_canister`: Unlocks unique dialogue pathways regarding corporate smuggling.
- `understands_swarm`: Unlocks peaceful resolution with Miller's husk in Act 3.
- `david_survived` / `maya_survived` / `lone_survivor`: Used for ending permutations and epilogue text.

## 4. Inventory / Clues (`inventory`)
**Type**: Array of Strings
**Default**: `[]`

**Purpose**: Tracks physical clues gathered during investigations. Used to piece together the overarching mystery of Nereus Station.

**Mechanics**:
- **Add (`giveClue: "clue_id"`)**: Added to the Detective Notebook UI.
- **Checks (`requiresClue: "clue_id"`)**: Can unlock specific deduction options in the dialogue.

**Key Clues**:
- `glowing_mud`: Found on Miller's boots.
- `server_wipe_audit`: Proves David deleted security footage.
- `miller_debt`: Reveals Miller's financial motives for smuggling the toxin.
