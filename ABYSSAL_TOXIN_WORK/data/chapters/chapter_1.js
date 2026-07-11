window.storyData = window.storyData || {};

Object.assign(window.storyData, {
    "ch1_start": {
        text: "The descent to Nereus Station was rough. The bathysphere groaned under the immense pressure of the abyss. As the airlock cycles with a heavy hiss, you step onto the damp steel grating of the main hangar. A burly man with grease on his overalls approaches you, offering a calloused hand.",
        speaker: "Miller",
        choices: [
            {
                text: "Shake his hand. 'Good to finally be here.'",
                nextNodeId: "ch1_miller_intro"
            },
            {
                text: "Ignore his hand. 'Just point me to my quarters.'",
                nextNodeId: "ch1_miller_cold"
            }
        ]
    },
    "ch1_miller_intro": {
        text: "'Welcome to the bottom of the world, kid. I'm Miller, Chief Mechanic. Don't mind the groaning of the bulkheads, she talks a lot but holds together fine.' He chuckles, but you notice a slight tremor in his hand.",
        speaker: "Miller",
        choices: [
            {
                text: "'Are the structural warnings I read about serious?'",
                nextNodeId: "ch1_miller_warning"
            },
            {
                text: "'Who else should I meet?'",
                nextNodeId: "ch1_meet_aris"
            }
        ]
    },
    "ch1_miller_cold": {
        text: "Miller drops his hand with a sigh. 'Right to business, huh? Corporate really knows how to pick 'em. I'm Miller, Chief Mechanic. Try not to break anything I have to fix.'",
        speaker: "Miller",
        choices: [
            {
                text: "'I'm just here to do a job.'",
                nextNodeId: "ch1_meet_aris"
            },
            {
                text: "'My apologies. The ride down was stressful.'",
                nextNodeId: "ch1_miller_warning"
            }
        ]
    },
    "ch1_miller_warning": {
        text: "'Ah, Corporate exaggerates. We patch the leaks. Besides, we all want that hazard pay bonus, right? Just keep your head down and do your shifts.' He points down the corridor.",
        speaker: "Miller",
        choices: [
            {
                text: "Head down the corridor to Medbay.",
                nextNodeId: "ch1_meet_aris"
            }
        ]
    },
    "ch1_meet_aris": {
        text: "You arrive at the Medbay. The sterile white lights hum loudly. Dr. Aris is intensely focused on a datapad, seemingly ignoring the violent thrashing of an infected lab rat in a containment unit.",
        speaker: "Dr. Aris",
        choices: [
            {
                text: "'Dr. Aris? I'm the new arrival.'",
                nextNodeId: "ch1_aris_greet"
            }
        ]
    },
    "ch1_aris_greet": {
        text: "She jumps slightly, hiding the datapad behind her back. 'Oh! Yes. Welcome. Sorry, I'm... very busy with some routine sample analysis. Just a severe Vitamin D deficiency among the lower deck crew. Nothing to worry about.'",
        speaker: "Dr. Aris",
        choices: [
            {
                text: "'Vitamin D deficiency? Down here?'",
                nextNodeId: "ch1_aris_defensive"
            },
            {
                text: "'I'll let you get back to it then.'",
                nextNodeId: "ch1_end"
            }
        ]
    },
    "ch1_aris_defensive": {
        text: "'Yes, exactly. Lack of sunlight. Obviously. Now, if you don't mind, I have critical... filing to do.' She practically shoves you out of the Medbay.",
        speaker: "Dr. Aris",
        choices: [
            {
                text: "Leave the Medbay and settle in.",
                nextNodeId: "ch1_end"
            }
        ]
    },
    "ch1_end": {
        text: "You head to your quarters, the unease settling in your stomach. The station groans again, a deep, metallic wail that vibrates through your boots. Something is wrong on Nereus Station.",
        choices: [
            {
                text: "Rest for the night.",
                nextNodeId: "ch2_start"
            }
        ]
    }
});
