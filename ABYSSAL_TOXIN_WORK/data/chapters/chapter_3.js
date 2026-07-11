window.storyData = window.storyData || {};

Object.assign(window.storyData, {
    "ch3_hub": {
        text: "You stand in the main central corridor (Sector A). The station is quiet, the tension palpable. You need to gather evidence. Where do you want to investigate?",
        choices: [
            {
                text: "Go to Security Hub",
                nextNodeId: "ch3_security"
            },
            {
                text: "Go to Mess Hall",
                nextNodeId: "ch3_mess_hall"
            },
            {
                text: "Go to Medbay",
                nextNodeId: "ch3_medbay"
            },
            {
                text: "Review findings and rest (End Chapter)",
                nextNodeId: "ch3_end"
            }
        ]
    },
    "ch3_security": {
        text: "You enter the Security Hub. David is glaring at a bank of monitors, sweating profusely. 'What do you want? I'm busy locking down the sectors.'",
        speaker: "David",
        choices: [
            {
                text: "Sneak a peek at his terminal.",
                nextNodeId: "ch3_security_terminal"
            },
            {
                text: "Ask him about the cameras.",
                nextNodeId: "ch3_security_ask"
            },
            {
                text: "Return to corridor.",
                nextNodeId: "ch3_hub"
            }
        ]
    },
    "ch3_security_ask": {
        text: "'The cameras in the lower decks are down. They've been down for two days. Probably corrosion. Nothing I can do about it now.' He refuses to make eye contact.",
        speaker: "David",
        choices: [
            {
                text: "Return to corridor.",
                nextNodeId: "ch3_hub"
            }
        ]
    },
    "ch3_security_terminal": {
        text: "While David is distracted by a comms ping, you glance at the main terminal log. You spot a 'Server Wipe Audit'. It clearly shows David's credentials were used to manually scrub all camera feeds in the lower decks 48 hours ago.",
        choices: [
            {
                text: "Download the log to your PDA (Gain Clue: Server Wipe Audit).",
                nextNodeId: "ch3_security_clue_get",
                onChoose: (state) => {
                    if (window.GameLogic && window.GameLogic.addClue) {
                        window.GameLogic.addClue('server_wipe_audit');
                    } else if (state && state.addClue) {
                        state.addClue('server_wipe_audit');
                    }
                }
            },
            {
                text: "Return to corridor.",
                nextNodeId: "ch3_hub"
            }
        ]
    },
    "ch3_security_clue_get": {
        text: "You quietly download the audit log. David deleted the footage. But why? To cover up Miller's murder, or something else?",
        choices: [
            {
                text: "Return to corridor.",
                nextNodeId: "ch3_hub"
            }
        ]
    },
    "ch3_mess_hall": {
        text: "The Mess Hall is sealed off with crime scene tape. It's eerily quiet. The tipped-over pot of stew is still there.",
        choices: [
            {
                text: "Look around the pantry.",
                nextNodeId: "ch3_mess_pantry"
            },
            {
                text: "Return to corridor.",
                nextNodeId: "ch3_hub"
            }
        ]
    },
    "ch3_mess_pantry": {
        text: "You pry open the pantry door. It's suspiciously bare. For a station this size, there should be months of high-calorie rations, but huge quantities are missing. Did Otto steal them?",
        choices: [
            {
                text: "Return to corridor.",
                nextNodeId: "ch3_hub"
            }
        ]
    },
    "ch3_medbay": {
        text: "Medbay is locked, but you can see Dr. Aris pacing frantically through the reinforced glass. She's talking to herself, holding a vial that seems to be glowing faintly green.",
        choices: [
            {
                text: "Try to open the door.",
                nextNodeId: "ch3_medbay_locked"
            },
            {
                text: "Return to corridor.",
                nextNodeId: "ch3_hub"
            }
        ]
    },
    "ch3_medbay_locked": {
        text: "The door is sealed tight. 'Biohazard lockdown,' the automated voice chimes. You'll need to find a way in later.",
        choices: [
            {
                text: "Return to corridor.",
                nextNodeId: "ch3_hub"
            }
        ]
    },
    "ch3_end": {
        text: "You retreat to your quarters to process the information. Miller is dead. The stew was poisoned. The security logs are wiped. Everyone has something to hide, and the station is slowly falling apart around you.",
        choices: [
            {
                text: "End of Chapter 3 Preview",
                nextNodeId: "ch_preview_end"
            }
        ]
    },
    "ch_preview_end": {
        text: "Thanks for playing the preview!",
        choices: []
    }
});
