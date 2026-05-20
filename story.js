// ==========================================
// THE ABYSSAL TOXIN — Story Data
// Dynamic text engine: nodes are functions
// that receive history[] and return content.
// ==========================================

const storyData = {

    // ── ACT 1: INTRODUCTION ──────────────────
    start: (history) => ({
        id: "start",
        text: `The Nereus Station is a deep-sea mining facility tethered to the ocean floor, thirty-six thousand feet below the surface. Outside your reinforced viewport, there is nothing but eternal, crushing darkness. The pressure out there is enough to compress a solid block of titanium.\n\nYou are a junior drill operator. You've been down here for six months, extracting rare earth minerals for the Corporation. The work is back-breaking, the pay is barely enough to cover your orbital debt, and the food is synthetic.\n\nYour shift alarm buzzes. It's time to get up.`,
        choices: [
            { text: "Get out of bed and head to the locker room.", nextNodeId: "locker_room" },
            { text: "Check your datapad for messages before leaving.", nextNodeId: "datapad_check" }
        ]
    }),

    datapad_check: (history) => ({
        id: "datapad_check",
        text: `You pick up your datapad. The screen is cracked. There is a station-wide memo from Vance, the Corporate Overseer and Station Director.\n\n"Notice: Due to missed extraction quotas in Sector 4, daily rations are being reduced by 15%. Medical supplies are also being rationed. Remember, the Corporation expects peak efficiency."\n\nYou sigh, toss the datapad on your bunk, and head out to the locker room.`,
        choices: [
            { text: "Go to the locker room.", nextNodeId: "locker_room" }
        ]
    }),

    locker_room: (history) => ({
        id: "locker_room",
        text: `The locker room smells of ozone and recycled sweat. Miller is sitting on a bench, lacing up his heavy work boots. He is the Chief Mechanic, a veteran who has kept this rusting station from imploding for a decade.\n\nHe looks exhausted. He pulls a worn physical photo from his pocket. It's his daughter on a beach. "Two more weeks," he says, his voice gravelly. "Then I'm taking my pension and getting off this rock. I'm done with the dark."`,
        choices: [
            { text: "Tell him to hang in there, he's almost out.", nextNodeId: "miller_chat" },
            { text: "Nod silently and head out to the corridor.", nextNodeId: "corridor" }
        ]
    }),

    miller_chat: (history) => ({
        id: "miller_chat",
        text: `"Just keep your head down," you tell him.\n\nMiller gives a lopsided grin. "That's the plan. But Vance has been breathing down my neck about the thermal regulators. Corporate won't send replacement parts, so I'm holding the core together with duct tape and prayers."\n\nHe stands up, clapping you on the shoulder. "Come on. Let's get some food before shift starts."`,
        choices: [
            { text: "Walk with Miller to the mess hall.", nextNodeId: "mess_hall_arrival" }
        ]
    }),

    corridor: (history) => ({
        id: "corridor",
        text: `You step out into the primary corridor. The metal grating clanks under your boots. You pass the Medical Bay, and see Dr. Aris, the Lead Medical Officer, standing outside her office. She looks nervous, glancing up at the security cameras.\n\nWhen she sees you, she waves you over. "Hey. Did you see the memo?" she whispers.`,
        choices: [
            { text: "Ask her what she's worried about.", nextNodeId: "aris_chat" },
            { text: "Tell her you're just trying to get breakfast.", nextNodeId: "mess_hall_arrival" }
        ]
    }),

    aris_chat: (history) => ({
        id: "aris_chat",
        text: `"Vance cut the medical budget again," Aris says, rubbing her arms as if she's cold. "If the lower sectors breach, I don't have enough coagulant to save half of us. The life support scrubbers are failing, and Corporate doesn't care. We're expendable to them."\n\nShe looks down the hall toward the mess hall. "I'll walk with you. I need coffee."`,
        choices: [
            { text: "Walk with Aris to the mess hall.", nextNodeId: "mess_hall_arrival" }
        ]
    }),

    // ── ACT 2: THE INCIDENT ──────────────────
    mess_hall_arrival: (history) => {
        const arisIntro = (history.includes("aris_chat") || history.includes("corridor"))
            ? "Aris is near the synthesizer, staring blankly at her datapad."
            : "Dr. Aris, the Lead Medical Officer, is near the synthesizer, staring blankly at her datapad.";
        return {
            id: "mess_hall_arrival",
            text: `The mess hall is bathed in harsh fluorescent light. You grab your tray of synthetic kelp stew from the automated dispenser. It's warm, which is the best thing you can say about it.\n\nMiller is sitting in the corner, rubbing his temples. ${arisIntro} Vance, the Station Director, is standing near the exit, watching the crew with cold, calculating eyes.`,
            choices: [
                { text: "Sit with Miller. He looks like he needs company.", nextNodeId: "act1_miller" },
                { text: "Sit near Dr. Aris. See what else she knows.", nextNodeId: "act1_aris" }
            ]
        };
    },

    act1_miller: (history) => ({
        id: "act1_miller",
        text: `You sit across from Miller. He gives a tired nod. He takes a large spoonful of his stew, then stops chewing. His brow furrows.\n\n"Tastes worse today," he mutters. "Like pennies."`,
        choices: [
            { text: "Take a bite of your own stew.", nextNodeId: "act2_poison_eat" },
            { text: "Push your tray away. You're not hungry anymore.", nextNodeId: "act2_poison_skip" }
        ]
    }),

    act1_aris: (history) => ({
        id: "act1_aris",
        text: `You take the seat across from Aris. She jumps slightly, hiding her datapad screen. "Sorry," she whispers. "I was just looking at the manifests. Something isn't right."\n\nShe looks at your tray. "You should eat. The regulators are acting up, and it's going to get cold."`,
        choices: [
            { text: "Offer her half of your rations.", nextNodeId: "act2_poison_skip" },
            { text: "Eat your stew in silence.", nextNodeId: "act2_poison_eat" }
        ]
    }),

    act2_poison_eat: (history) => ({
        id: "act2_poison_eat",
        text: `You take a spoonful. The taste is sharp and metallic. You swallow it down anyway. Within seconds, a cold numbness starts in your stomach and crawls up your arms.\n\nAcross the room, Miller stands up. His metal chair scrapes loudly. He isn't looking at anything. When he turns his head, his pupils are fully dilated. Black veins pulse against his pale skin.`,
        choices: [
            { text: "Stand up slowly and ask if he's okay.", nextNodeId: "act3_miller_death" },
            { text: "Grab a napkin and spit the rest of your food out.", nextNodeId: "act3_toxin_symptoms" }
        ]
    }),

    act2_poison_skip: (history) => {
        const introText = history.includes("act1_aris")
            ? `You slide your tray toward Aris. She shakes her head, looking a bit nauseous. 'I can't.' Miller, sitting a few seats down, gives a dry laugh. 'Don't let it go to waste,' he says, reaching over. He pulls your bowl toward himself and finishes it.`
            : `You push the tray away. The gray sludge isn't worth it. Miller notices and gives a dry laugh. 'Suit yourself. More for me.' He finishes his bowl.`;
        return {
            id: "act2_poison_skip",
            text: `${introText}\n\nHe sets the bowl down and lets out a cough that sounds wet and ragged. His knuckles turn white as he grips the table. A drop of thick, black fluid falls from his nose into the empty bowl.`,
            choices: [
                { text: "Call out for Dr. Aris.", nextNodeId: "act3_call_aris" },
                { text: "Rush over to Miller.", nextNodeId: "act3_miller_death" }
            ]
        };
    },

    act3_toxin_symptoms: (history) => ({
        id: "act3_toxin_symptoms",
        text: `You try to spit the food out, but your heart is already racing. The edges of your vision blur. Your legs give out, and you hit the floor.\n\nAris catches your arm. "Your pulse is spiking. We have maybe an hour."\n\nAcross the room, Miller collapses. He is convulsing wildly. Aris drops your arm and runs to him, but it's too late. His body goes rigid. He's dead.\n\nFor a long second, the only sound is the hum of the fluorescent lights. Nobody breathes.\n\nSuddenly, the station's klaxons start blaring. The overhead lights switch to red. The heavy blast doors to the mess hall begin to slide shut. Vance is nowhere to be seen.`,
        choices: [
            { text: "Dive under the closing doors into the hallway.", nextNodeId: "act4_hallway_alone" },
            { text: "Stay in the mess hall with Aris.", nextNodeId: "act4_mess_hall_locked" }
        ]
    }),

    act3_miller_death: (history) => {
        const poisonEffect = history.includes("act2_poison_eat")
            ? "Your own stomach is in agonizing knots from the poisoned stew, your vision blurring, but you force yourself to stay conscious. "
            : "";
        return {
            id: "act3_miller_death",
            text: `You get to Miller's side, but he's already on the floor, convulsing. "Chest," he wheezes. Aris drops to her knees beside him and shines a light in his eyes.\n\n"Neurological shutdown," she says quietly.\n\n${poisonEffect}Miller looks up, trying to reach for his pocket—for the photo of his daughter. Then his body goes rigid. He's dead.\n\nFor a long second, the only sound is the hum of the fluorescent lights. Nobody breathes.\n\nThe station's klaxons start blaring. The overhead lights switch to red. The mess hall blast doors begin to slide shut. You realize Vance is gone.`,
            choices: [
                { text: "Dive under the closing doors into the hallway.", nextNodeId: "act4_hallway_alone" },
                { text: "Stay in the mess hall with Aris.", nextNodeId: "act4_mess_hall_locked" }
            ]
        };
    },

    act3_call_aris: (history) => {
        const poisonEffect = history.includes("act2_poison_eat")
            ? "Your legs buckle slightly. The poisoned stew is tearing at your insides, but you manage to stay standing. "
            : "";
        return {
            id: "act3_call_aris",
            text: `You yell for Aris. She sprints across the mess hall and slides to her knees beside Miller. You stay back, watching in horror as he convulses on the floor.\n\n"Neurological shutdown," she says quietly, her hands trembling as she checks his pulse.\n\n${poisonEffect}Miller looks up, his hand weakly pawing at his pocket—reaching for the photo of his daughter. Then his body goes rigid. He's dead.\n\nFor a long second, the only sound is the hum of the fluorescent lights. Nobody breathes.\n\nThe station's klaxons start blaring. The overhead lights switch to red. The mess hall blast doors begin to slide shut. You realize Vance is gone.`,
            choices: [
                { text: "Dive under the closing doors into the hallway.", nextNodeId: "act4_hallway_alone" },
                { text: "Stay in the mess hall with Aris.", nextNodeId: "act4_mess_hall_locked" }
            ]
        };
    },

    // ── ACT 3: THE INVESTIGATION ──────────────
    act4_hallway_alone: (history) => ({
        id: "act4_hallway_alone",
        text: `You slide under the blast doors just as they seal shut, trapping Aris and Miller's body inside. You're in the Sector 4 corridor alone. It's empty, lit only by the red emergency strobes. The hum of the ocean outside feels heavier, more oppressive.\n\nThe station is on lockdown. You need answers. You can head to the Security Office to check the cameras and see where Vance went, or head to the Drill Control Room to see what triggered the lockdown.`,
        choices: [
            { text: "Head to the Security Office.", nextNodeId: "inv_security" },
            { text: "Head to the Drill Control Room.", nextNodeId: "inv_drill" }
        ]
    }),

    act4_mess_hall_locked: (history) => ({
        id: "act4_mess_hall_locked",
        text: `You stay put as the blast doors seal. The mess hall is locked down. Aris stands up, staring at Miller's body. The black fluid is pooling around his head.\n\n"Someone triggered the lockdown manually," she says, her voice trembling. "We need to get out of here. The vents behind the synthesizer lead to the Medbay. I need to analyze his blood."`,
        choices: [
            { text: "Help her pry the vent open.", nextNodeId: "inv_medbay" },
            { text: "Tell her you need to get to Vance's office instead.", nextNodeId: "inv_vance_office" }
        ]
    }),

    inv_security: (history) => ({
        id: "inv_security",
        text: `You force open the door to the Security Office. The monitors are flickering. You pull up the camera feeds.\n\nYou see footage from five minutes ago: Vance walking calmly out of the mess hall right before Miller collapsed. Vance walks to a wall panel, checks his watch, and waits. As soon as he sees Miller collapse on the hallway camera feed, Vance types in an override code, manually initiating the Sector 4 lockdown.\n\nHe didn't just know about the poisoning—he orchestrated it to leave no witnesses.`,
        choices: [
            { text: "Follow him to the Communications Relay.", nextNodeId: "act5_confrontation" }
        ]
    }),

    inv_drill: (history) => ({
        id: "inv_drill",
        text: `You reach Drill Control. The main telemetry screen is flashing a red warning: ANOMALY DETECTED.\n\nYou pull up the drill logs. Three days ago, the deep-sea drill broke through the crust into a subterranean cavern. The logs don't show rare earth minerals. They show cellular structures and massive biological readings. A dormant, abyssal organism.\n\nThe corporation didn't strike oil. They woke something up.`,
        choices: [
            { text: "Download the logs and head to the Comms Relay.", nextNodeId: "act5_confrontation" }
        ]
    }),

    inv_medbay: (history) => ({
        id: "inv_medbay",
        text: `You and Aris crawl through the rusty ventilation shafts and drop into the Medbay. Aris immediately takes a syringe of Miller's blood she managed to collect and puts it in the centrifuge.\n\nA minute later, the computer beeps. Aris's face goes pale. "This isn't a poison," she whispers. "It's a biological mutagen. An ancient cellular structure. Miller was exposed to it on the drill floor. It's rewriting human DNA."\n\nShe looks at you in horror. "The Corporation knows. They're trying to contain it by burying us. I need to synthesize a counter-agent!" she yells, turning back to the lab station. "Go find Vance! Stop him!"`,
        choices: [
            { text: "We need to find Vance. To the Comms Relay.", nextNodeId: "act5_confrontation" }
        ]
    }),

    inv_vance_office: (history) => ({
        id: "inv_vance_office",
        text: `You refuse to go to the Medbay. Instead, you kick through the drywall paneling into the adjacent mess hall supervisor's office. You splice into the network and hack Vance's terminal remotely. Aris follows you through the hole.\n\nYou find a priority message from Corporate Command:\n"BIOLOGICAL CONTAMINATION CONFIRMED. INITIATE PROTOCOL OMEGA. SCUTTLE NEREUS STATION. NO SURVIVORS. INSURANCE PAYOUT AUTHORIZED."\n\nThere's a second attachment: a lab report on "Abyssal Mutagen strain 7-X." Your eyes skim phrases like "total cellular rewrite" and "containment failure." They aren't just cutting costs. They are sinking the station to cover up an alien contagion.\n\nAris covers her mouth in horror. "I'll go to the escape pods and prep a medical kit," she says, running off.`,
        choices: [
            { text: "Grab the printed memo and hunt down Vance.", nextNodeId: "act5_confrontation" }
        ]
    }),

    // ── ACT 4: THE CONFRONTATION ─────────────
    act5_confrontation: (history) => ({
        id: "act5_confrontation",
        text: `You arrive at the Communications Relay. The door is already open. Vance stands in the center of the room, typing rapidly into the master console. He turns as you enter, drawing a pneumatic rivet gun from his belt.\n\n"You should be dead," Vance says coldly. "Or locked in Sector 4. The anomaly is waking up, and if it reaches the surface, humanity is finished. Corporate made the hard choice. I'm just executing it."\n\nHe hits the final button on the console. "Scuttling sequence initiated. Explosive charges detonating in three minutes."`,
        choices: [
            { text: "Lunge at him to take the rivet gun.", nextNodeId: "act6_fight_vance" },
            { text: "Tell him you want a cut of the insurance money.", nextNodeId: "act6_vance_deal" }
        ]
    }),

    act6_fight_vance: (history) => {
        const callbackText = history.includes("act1_miller")
            ? `You remember what Miller said about holding the core together with duct tape. You spot a loose coolant pipe near Vance's head and kick it violently. A jet of freezing gas blasts him in the face, blinding him.`
            : `You manage to pin his arm and drive your knee into his stomach.`;
        return {
            id: "act6_fight_vance",
            text: `You tackle Vance. You both hit the bulkhead hard. He swings the rivet gun, grazing your shoulder. ${callbackText}\n\nHe drops the weapon, gasping for air. "You fool," he spits, bleeding from the mouth. "There's only one seat left in the Bathysphere anyway."\n\nA massive explosion rocks the station. The lower hull charges just detonated.`,
            choices: [
                { text: "Leave him and run for your life.", nextNodeId: "act7_water_rising" },
                { text: "Kick his weapon away, then run.", nextNodeId: "act7_water_rising" }
            ]
        };
    },

    act6_vance_deal: (history) => ({
        id: "act6_vance_deal",
        text: `You raise your hands. "Wait. You need two people to bypass the Bathysphere launch sequence. Cut me in. I'll help you sink the station, and we split the payout."\n\nVance stares at you, calculating. "Fifty million credits," he says finally. "Enough for a new start on the orbital colonies. Lead the way. If you try anything, I'll put a rivet through your skull."\n\nThe station shudders violently as the first scuttling charges detonate below.`,
        choices: [
            { text: "Walk ahead of him, planning to betray him.", nextNodeId: "act7_betrayal" },
            { text: "Commit to the deal. You just want to survive.", nextNodeId: "act7_corporate_path" }
        ]
    }),

    // ── ACT 5: THE SURVIVAL GAUNTLET ─────────
    act7_water_rising: (history) => ({
        id: "act7_water_rising",
        text: `The noise is deafening. The primary bulkhead at the end of the corridor buckles inward. Pitch-black ocean water floods the station at incredible speed, instantly knocking out the lights.\n\nThe water is freezing, rising quickly to your waist. The primary stairwell to the escape pods is already flooded. If you don't move, the current will drag you under into the abyss.`,
        choices: [
            { text: "Swim through the flooded stairwell anyway.", nextNodeId: "gauntlet_swim" },
            { text: "Try to manually crank open the secondary maintenance hatch.", nextNodeId: "gauntlet_hatch" }
        ]
    }),

    act7_betrayal: (history) => ({
        id: "act7_betrayal",
        text: `You walk ahead of Vance. As you reach the gangway over the reactor core, you grab a heavy fire extinguisher from the wall and swing it backward into his face. The rivet gun fires wildly into the ceiling.\n\nVance stumbles backward, but he grabs your collar as he falls. You both go over the edge, landing hard on the maintenance deck just as the hull breaches. Freezing ocean water rushes toward you.`,
        choices: [
            { text: "Kick him off and swim for the emergency ladders.", nextNodeId: "gauntlet_swim" },
            { text: "Try to manually crank open the maintenance hatch.", nextNodeId: "gauntlet_hatch" }
        ]
    }),

    act7_corporate_path: (history) => ({
        id: "act7_corporate_path",
        text: `You walk with Vance toward the upper decks as the station tears itself apart. Vance nods. "Smart choice," he says, a flicker of genuine respect in his cold eyes.\n\n"We wipe the mainframe on the way up," he shouts over the roaring water. "Tell them a tectonic shift breached the hull!"\n\nAs you reach the blast doors for the escape bay, a jet of high-pressure water shoots through a seam in the wall, slicing through metal like butter. The structure is completely failing.`,
        choices: [
            { text: "Run to the mainframe to wipe the logs.", nextNodeId: "act8_corporate_loyalty" },
            { text: "Ignore the logs and run straight for the pod.", nextNodeId: "act8_corporate_loyalty" }
        ]
    }),

    gauntlet_swim: (history) => {
        const poisonEffect = history.includes("act2_poison_eat")
            ? `Your vision blurs, the metallic taste returning. The poison makes your muscles scream in agony as you fight the current. You are barely conscious.`
            : `You are clear-headed and power through the freezing current with all your strength.`;
        return {
            id: "gauntlet_swim",
            text: `You take a deep breath and dive into the flooded stairwell. The water is freezing, stealing the breath from your lungs. You swim upward in the pitch black, feeling your way along the railing.\n\n${poisonEffect}\n\nYour lungs burn. Debris floats past you in the dark. You hit a locked grate blocking the top of the stairs.`,
            choices: [
                { text: "Brace your feet on the railing and push the grate with all your might.", nextNodeId: "act8_run_for_pods" },
                { text: "Try to find another way around in the dark.", nextNodeId: "act10_water_tomb" }
            ]
        };
    },

    gauntlet_hatch: (history) => ({
        id: "gauntlet_hatch",
        text: `You grab the heavy iron wheel of the maintenance hatch. The water is at your chest, then your neck. You heave against the wheel, but it's rusted shut.\n\nThe water rises over your head. You hold your breath, straining your muscles until they scream. With a metallic screech, the wheel turns. You pull the hatch open and scramble up into the dry corridor above, gasping for air.`,
        choices: [
            { text: "Sprint down the corridor to the Escape Bay.", nextNodeId: "act8_run_for_pods" }
        ]
    }),

    // ── ACT 6: THE FINAL ESCAPE ──────────────
    act8_run_for_pods: (history) => ({
        id: "act8_run_for_pods",
        text: `You haul yourself up onto Deck A. Below you, the lower levels of the station crumple with a sickening crunch under the ocean's pressure. The Bathysphere is fifty yards away, its launch lights flashing a brilliant amber.\n\nVance is already there, soaked and shivering, holding a flare gun pointed right at you. He must have used the Director's emergency transit chute to beat you here.\n\n"I told you," he yells over the alarms. "There's only one seat left!"`,
        choices: [
            { text: "Charge him before he can fire.", nextNodeId: "act9_airlock_struggle" },
            { text: "Dive behind the launch console for cover.", nextNodeId: "act9_airlock_struggle" }
        ]
    }),

    act8_corporate_loyalty: (history) => ({
        id: "act8_corporate_loyalty",
        text: `You reach the escape bay. You enter the override codes, wiping the station's distress logs and erasing any trace of Miller, Aris, and the biological anomaly. Vance opens the hatch.\n\n"Get in," he says, panting. "We have thirty seconds before crush depth."\n\nYou climb into the pod. Vance hits the launch button. Explosive bolts fire, and the pod shoots up into the dark water. Vance lets out a massive sigh of relief as you both watch the station's lights flicker and die below you.`,
        choices: [
            { text: "Prepare for the surface.", nextNodeId: "act10_corporate" }
        ]
    }),

    act9_airlock_struggle: (history) => {
        const poisonEffect = history.includes("act2_poison_eat")
            ? `The toxin in your blood makes you sluggish. Every punch feels like moving through molasses.`
            : `Your adrenaline is completely unhindered by the toxin, giving you the edge you need.`;
        return {
            id: "act9_airlock_struggle",
            text: `You charge Vance as he fires the flare gun. The burning phosphor shot misses your head by an inch, detonating against the bulkhead. You tackle him into the metal frame of the pod cradle.\n\nThe entire station tilts sharply. Water pours from the ceiling vents in waterfalls. ${poisonEffect} You punch Vance in the jaw; he knees your ribs, trying to throw you into the rising water below the gantry.`,
            choices: [
                { text: "Kick him off the edge into the rising water.", nextNodeId: "act10_survivor" },
                { text: "Let your strength fail. The deep is calling.", nextNodeId: "act10_madness" }
            ]
        };
    },

    // ── ACT 7: THE ENDINGS ───────────────────
    act10_survivor: (history) => {
        const callbackText = history.includes("act3_miller_death")
            ? `You pull out the water-damaged photo of Miller's daughter you took from his body. You grip it tightly, vowing to get it back to her.`
            : `You touch the data drive in your pocket.`;
        return {
            id: "act10_survivor",
            text: `You kick Vance squarely in the chest. He falls backward off the cradle, splashing into the violent, rising water. A massive steel support beam crashes down from the ceiling, taking him under into the dark.\n\nYou drag yourself into the Bathysphere and smash the launch button.\n\nThrough the viewport, you watch the Nereus Station break apart and sink into the abyss. ${callbackText} As the pod ascends toward the sunlight, you realize you have everything you need to burn the Corporation to the ground.`,
            choices: [],
            ending: "survivor"
        };
    },

    act10_madness: (history) => ({
        id: "act10_madness",
        text: `Your body gives out. The cold, the exhaustion, and perhaps the biological anomaly itself finally take their toll. Vance shoves you away, and you slide down the slanted metal deck toward the water.\n\nVance climbs into the pod and seals the hatch. As it launches, leaving you behind, you don't feel afraid. Your mind drifts. You look down into the freezing black water and see massive, pale, bioluminescent shapes rising from the deep to greet you.\n\nYou smile, and take a deep breath of water.`,
        choices: [],
        ending: "madness"
    }),

    act10_corporate: (history) => ({
        id: "act10_corporate",
        text: `The Bathysphere ascends in silence. The water outside shifts from pitch black to a deep, calming blue. Vance pulls a small bottle of bourbon from an emergency compartment and pours two glasses.\n\n"To successful restructuring," he says, raising his glass.\n\nYou take a sip. You sold out the crew, the station, and humanity to cover up an alien nightmare. As the pod breaches the surface and sunlight fills the cabin, you check the balance on your datapad. You're alive. And you're incredibly rich.`,
        choices: [],
        ending: "corporate"
    }),

    act10_water_tomb: (history) => ({
        id: "act10_water_tomb",
        text: `You fail to clear the obstacle. The freezing water rises over your head, trapping you in the dark.\n\nThirty-six thousand feet down, there is no rescue team. The station groans one final time before the hull gives way entirely under millions of pounds of pressure. The ocean rushes in with the force of a bomb, and in an instant, everything goes silent.`,
        choices: [],
        ending: "crush"
    })
};
