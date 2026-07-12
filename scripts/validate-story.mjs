#!/usr/bin/env node
/**
 * validate-story.mjs
 * Graph + schema checks for Abyssal Toxin chapter JSON.
 * Exit 0 = OK, Exit 1 = hard errors.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const chaptersDir = join(root, 'public/data/chapters');
const cluesPath = join(root, 'public/data/clues.json');
const charsPath = join(root, 'public/data/characters.json');
const START = 'ch1_start';

const errors = [];
const warnings = [];

function loadJson(path, label) {
    try {
        return JSON.parse(readFileSync(path, 'utf8'));
    } catch (err) {
        errors.push(`Failed to parse ${label}: ${err.message}`);
        return null;
    }
}

const cluesDb = loadJson(cluesPath, 'clues.json') || {};
const charsDb = loadJson(charsPath, 'characters.json') || {};

const chapterFiles = readdirSync(chaptersDir)
    .filter((f) => f.endsWith('.json'))
    .sort();

const allNodes = new Map();

function collectCluesFromEffects(effects, sink) {
    if (!effects || typeof effects !== 'object') return;
    if (effects.giveClue) sink.add(effects.giveClue);
    if (Array.isArray(effects.giveClues)) {
        effects.giveClues.forEach((id) => sink.add(id));
    }
}

function collectCluesFromRequires(requires, sink) {
    if (!requires || typeof requires !== 'object') return;
    if (Array.isArray(requires.clues)) requires.clues.forEach((id) => sink.add(id));
    if (Array.isArray(requires.cluesAny)) requires.cluesAny.forEach((id) => sink.add(id));
}

for (const file of chapterFiles) {
    const data = loadJson(join(chaptersDir, file), file);
    if (!data || typeof data !== 'object') continue;

    for (const [id, node] of Object.entries(data)) {
        if (allNodes.has(id)) {
            errors.push(`Duplicate node id "${id}" in ${file} (also in ${allNodes.get(id).file})`);
        }
        allNodes.set(id, { file, node });

        if (!node || typeof node !== 'object') {
            errors.push(`${file} / ${id}: node is not an object`);
            continue;
        }

        if (typeof node.text !== 'string' || !node.text.trim()) {
            // resolveEnding router nodes may have placeholder text
            if (!node.resolveEnding) {
                errors.push(`${file} / ${id}: missing or empty "text"`);
            }
        }

        if (node.choices !== undefined && !Array.isArray(node.choices)) {
            errors.push(`${file} / ${id}: "choices" must be an array`);
            continue;
        }

        const choices = node.choices || [];
        const isRouter = node.resolveEnding === true;
        const isTerminal = node.isEnding === true || choices.length === 0;

        if (!isRouter && !isTerminal && choices.length === 0) {
            warnings.push(`${file} / ${id}: no choices and not marked isEnding/resolveEnding`);
        }

        for (let i = 0; i < choices.length; i++) {
            const c = choices[i];
            if (!c || typeof c !== 'object') {
                errors.push(`${file} / ${id}: choice[${i}] is not an object`);
                continue;
            }
            if (typeof c.text !== 'string' || !c.text.trim()) {
                errors.push(`${file} / ${id}: choice[${i}] missing "text"`);
            }
            if (!c.resolveEnding && (typeof c.nextNodeId !== 'string' || !c.nextNodeId.trim())) {
                errors.push(`${file} / ${id}: choice[${i}] missing "nextNodeId"`);
            }
        }
    }
}

const cluesGiven = new Set();
const cluesRequired = new Set();

for (const [id, { file, node }] of allNodes) {
    collectCluesFromEffects(node.effects, cluesGiven);

    for (const c of node.choices || []) {
        if (c.giveClue) cluesGiven.add(c.giveClue);
        if (c.requiresClue) cluesRequired.add(c.requiresClue);
        collectCluesFromEffects(c.effects, cluesGiven);
        collectCluesFromRequires(c.requires, cluesRequired);

        if (c.nextNodeId && !allNodes.has(c.nextNodeId)) {
            errors.push(`${file} / ${id}: nextNodeId "${c.nextNodeId}" does not exist`);
        }
    }
}

// Known engine-resolved ending targets (not always linked via nextNodeId)
const ENGINE_ENDINGS = [
    'ch15_ending_patient_zero',
    'ch15_ending_abyssal_grave',
    'ch15_ending_surface_tension',
    'ch15_ending_whistleblower'
];
for (const endingId of ENGINE_ENDINGS) {
    if (!allNodes.has(endingId)) {
        errors.push(`Engine ending node missing: ${endingId}`);
    }
}

// Reachability from start (static edges only — gated choices still count as edges)
if (!allNodes.has(START)) {
    errors.push(`Start node "${START}" not found`);
} else {
    const reached = new Set();
    const queue = [START];
    while (queue.length) {
        const id = queue.shift();
        if (reached.has(id)) continue;
        reached.add(id);
        const entry = allNodes.get(id);
        if (!entry) continue;

        if (entry.node.resolveEnding === true) {
            for (const endingId of ENGINE_ENDINGS) {
                if (!reached.has(endingId)) queue.push(endingId);
            }
        }

        for (const c of entry.node.choices || []) {
            if (c.resolveEnding === true) {
                for (const endingId of ENGINE_ENDINGS) {
                    if (!reached.has(endingId)) queue.push(endingId);
                }
            }
            if (c.nextNodeId && allNodes.has(c.nextNodeId) && !reached.has(c.nextNodeId)) {
                queue.push(c.nextNodeId);
            }
        }
    }

    const orphans = [...allNodes.keys()].filter((id) => !reached.has(id));
    if (orphans.length) {
        warnings.push(
            `${orphans.length} node(s) unreachable from ${START} (static graph): ${orphans.slice(0, 15).join(', ')}${orphans.length > 15 ? '…' : ''}`
        );
    }

    console.log(`Nodes: ${allNodes.size} | Reachable (static) from ${START}: ${reached.size}`);
}

for (const id of cluesGiven) {
    if (!cluesDb[id]) {
        warnings.push(`giveClue "${id}" is not defined in clues.json`);
    }
}
for (const id of cluesRequired) {
    if (!cluesDb[id]) {
        warnings.push(`requiresClue/requires "${id}" is not defined in clues.json`);
    }
    if (!cluesGiven.has(id)) {
        warnings.push(`required clue "${id}" is never granted via giveClue/effects`);
    }
}

const unusedClues = Object.keys(cluesDb).filter((id) => !cluesGiven.has(id) && !cluesRequired.has(id));
if (unusedClues.length) {
    warnings.push(`clues.json entries never referenced: ${unusedClues.join(', ')}`);
}

if (Object.keys(cluesDb).length === 0) {
    warnings.push('clues.json is empty or missing');
}
if (Object.keys(charsDb).length === 0) {
    warnings.push('characters.json is empty or missing');
}

const terminals = [...allNodes.entries()].filter(
    ([, v]) => !(v.node.choices || []).length && !v.node.resolveEnding
);
console.log(`Terminal nodes: ${terminals.map(([id]) => id).join(', ') || '(none)'}`);
console.log(`Clues given (${cluesGiven.size}): ${[...cluesGiven].sort().join(', ') || '(none)'}`);
console.log(`Clues required (${cluesRequired.size}): ${[...cluesRequired].sort().join(', ') || '(none)'}`);

if (warnings.length) {
    console.log('\nWarnings:');
    for (const w of warnings) console.log(`  ⚠  ${w}`);
}

if (errors.length) {
    console.error('\nErrors:');
    for (const e of errors) console.error(`  ✖  ${e}`);
    console.error(`\nValidation FAILED with ${errors.length} error(s).`);
    process.exit(1);
}

console.log(`\nValidation OK (${chapterFiles.length} chapter files, ${warnings.length} warning(s)).`);
process.exit(0);
