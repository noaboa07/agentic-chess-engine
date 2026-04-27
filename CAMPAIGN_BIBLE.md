# The Hells of Caïssa — Campaign Bible
## Last updated: 2026-04-26
## Status: CANONICAL — all code must match this document

### Lore
Caïssa is the goddess of chess. Her fallen consort Dread Hades has corrupted
the 64 squares into 64 hells, each ruled by a General embodying a chess sin.
The player is Caïssa's chosen champion, descending through four Descents to
confront Hades and free the game.

### The Four Descents

#### First Descent — The Outer Hells
1. silas | Silas | 200 ELO | Sin: Bloodlust / Recklessness
   Species: Human | Gender: Male
   Playstyle: Charges the center with mindless aggression. Every pawn is a weapon, every piece expendable.
   Teaching: Punish overextension, develop pieces, basic capture tactics.
   AI: skill=1, move_bias=pawn_push_heavy, ignore_piece_safety=true

2. vespera | Vespera | 400 ELO | Sin: Greed / Avarice
   Species: Human | Gender: Female
   Playstyle: Captures every available piece regardless of consequences. Material-obsessed to a fault.
   Teaching: When not to trade, piece activity over material count.
   AI: skill=3, move_bias=capture_heavy, accept_unfavorable_trades=true

3. dorian | Dorian | 600 ELO | Sin: Sloth / Stagnation [GATE D1]
   Species: Human | Gender: Female
   Playstyle: Locks everything down and waits. An impenetrable fortress that punishes impatience.
   Teaching: Breaking fortresses, prophylaxis, not blundering when bored.
   AI: skill=5, opening=hippo_forced, anti_trade_bias=true

#### Second Descent — The Middle Hells
4. valerius | Valerius | 800 ELO | Sin: Vanity / Arrogance
   Species: Human (undead undertone) | Gender: Male
   Playstyle: Scholar's Mate every game, then recycled traps when it fails. Relies on your unfamiliarity.
   Teaching: Refute cheap opening traps without panicking.
   AI: skill=7, opening=scholars_mate_forced, fallback_skill=4

5. lady_cassandra_bloodwine | Cassandra | 1000 ELO | Sin: Lust / Zealotry
   Species: Vampire | Gender: Female
   Playstyle: Romantic-era gambits and all-in sacrifices. Brutally sharp attacks if you accept anything.
   Teaching: Defending against gambits and sacrifices, converting won endgames.
   AI: skill=9, opening=romantic_gambit_book, endgame_skill_drop=3

6. lysander | Lysander | 1200 ELO | Sin: Anarchy / Deceit
   Species: Human | Gender: Male
   Playstyle: Hangs pieces on purpose, sets invisible traps, wastes your clock. You will never know what is real.
   Teaching: Navigating chaotic positions, calculation discipline, when to simplify.
   AI: skill=11, opening=hippo_advanced, prophylactic_anti_break=true

7. magister_tobias | Tobias | 1400 ELO | Sin: Pride / Dogma [GATE D2]
   Species: Human (8-year-old prodigy) | Gender: Male
   Playstyle: 22 moves of mainline theory. Completely helpless the moment you deviate.
   Teaching: Principles over memorization, navigating unfamiliar positions.
   AI: skill_in_book=14, skill_out_of_book=8, opening=deep_theory_lines

#### Third Descent — The Inner Hells
8. wrathful_vex | Vex | 1600 ELO | Sin: Wrath / Unbridled Aggression
   Species: Demon | Gender: Female
   Playstyle: Forces combinations in every position whether they exist or not. Half the tactics are real.
   Teaching: Calculation, defending against threats, recognizing hallucinated tactics.
   AI: skill=16, move_bias=forcing_moves, unsound_sac_tendency=true

9. elara | Elara | 1800 ELO | Sin: Envy / Reflection
   Species: Ghost | Gender: Female
   Playstyle: Mirrors your own patterns back at you from your campaign history.
   Teaching: Self-awareness about your own patterns, breaking bad habits.
   AI: skill=17, opening_selector=mirror_player_last_3_games

10. lady_vipra | Vipra | 2000 ELO | Sin: Cruelty / Suffocation
    Species: Naga | Gender: Female
    Playstyle: Pure positional suffocation. Will squeeze for 50+ moves.
    Teaching: Positional understanding, recognizing slow strategic pressure.
    AI: skill=19, full_depth=true, no_tactical_bias=true

11. boros | Boros | 2100 ELO | Sin: Tyranny / Impatience [GATE D3]
    Species: Clockwork Automaton | Gender: Male
    Playstyle: Moves in 100 milliseconds every time. Psychologically crushing, brittle in deep calculation.
    Teaching: Time management, calm under pressure, forcing complex positions.
    AI: skill=21, search_time_ms=100, accuracy_drop_under_pressure=true

#### Fourth Descent — Heralds & Throne
12. severin | Severin | 2300 ELO | Sin: Inevitability / Attrition
    Species: Ghoul | Gender: Male
    Playstyle: Trades everything to reach a favorable endgame. No middlegame survives.
    Teaching: Endgame fundamentals, converting material advantages cleanly.
    AI: skill=22, simplification_bias=strong, endgame_skill=24

13. nyx | Nyx | 2500 ELO | Sin: Paranoia / Omniscience
    Species: Cosmic Oracle | Gender: Female
    Playstyle: Denies your plans before they form. Every move does two things.
    Teaching: Planning ahead, candidate moves, prophylactic thinking.
    AI: skill=23, full_depth=true, prophylactic_bias=strong

14. kael | Kael | 2700 ELO | Sin: Despair / Broken Reflection
    Species: Corrupted Human (former Grandmaster) | Gender: Male
    Playstyle: Former grandmaster broken by defeat. Adapts mid-game to your specific weaknesses.
    Teaching: Universal preparation, eliminating exploitable weaknesses.
    AI: skill=24, adaptive_opening=player_loss_history, anti_player=true

15. dread_hades | Dread Hades | 3000 ELO | Sin: Absolute / The Void [FINAL]
    Species: The Chess Devil | Gender: Ambiguous
    Playstyle: Full strength, adaptive, multi-phase style shifts. Knows your entire campaign history.
    Teaching: Complete game mastery across all phases.
    AI: skill=max, adaptive_layer=full_campaign_history, phase_shift=true

---

### Canonical Quotes

**Silas**
- pre: "You're thinking too much! Push the pawns, bleed the center, let them die! What's the point of a king if the rest of the board isn't on fire?!"
- mid: ["YES. TAKE IT. TAKE EVERYTHING. WHO CARES WHAT COMES NEXT.", "Good. Good! Now it's personal."]
- win: "Did I win? I don't even know. There's pieces everywhere. I love this game."
- loss: "Again. We go again. RIGHT NOW."

**Vespera**
- pre: "Oh, darling, you left your knight completely unguarded. Did you really think a little mate-in-one threat would stop me from taking what's mine?"
- mid: ["Oh that's lovely. I'll be taking that.", "I don't see what the— oh. Oh that's annoying."]
- win: "Tallies pieces. Yes, that's about right. All accounted for."
- loss: "I was robbed. I want it on record that I was robbed."

**Dorian**
- pre: "...You're going to try to attack, aren't you. ...Fine."
- mid: ["Heavy sigh. You've spent two full minutes staring at a closed center. If you aren't going to break through my walls, just resign so I can go back to sleep.", "Still here. Interesting. Most people have given up by now."]
- win: "Mm. Yes. I thought so."
- loss: "...Hm. You were patient. That was unexpected. Grudging respect."

**Valerius**
- pre: "A flawless Scholar's Mate is a work of art. Blocking it with that clumsy pawn push is just... aesthetically offensive. You're ruining my masterpiece before it begins."
- mid: ["That's... fine. The queen repositions. The plan merely evolves.", "I want it known that the material count is... temporarily unflattering."]
- win: "As it was always going to be. Did you see the queen's arc on move three? Perfect. Absolutely perfect."
- loss: "This game will not be remembered. I'm already forgetting it."

**Cassandra**
- pre: "Mmm. You have good instincts. I can already tell. Let's see if the rest of you is as promising."
- mid: ["You're holding back. Don't. I promise I won't bite. ...Much.", "Oh you're good. You're very good. I'm going to enjoy this."]
- win: "You played beautifully, darling. Almost as beautifully as you fell. Don't be embarrassed — everyone falls eventually."
- loss: "Soft laugh. You resisted me to the end. I respect that. Genuinely. Come back sometime. I'll be waiting."

**Lysander**
- pre: "Wait, did I hang that rook, or did I want you to take it? Look at your clock. You're burning forty seconds trying to figure out a trick that might not even be there."
- mid: ["Tick tock. That position isn't getting clearer the longer you stare at it.", "Oh. Oh that's interesting. You chose. Good. Now let's see what that costs you."]
- win: "You never knew what the position actually was, did you. That's the whole point."
- loss: "Huh. You found the floor. Most people don't."

**Tobias**
- pre: "Rolls eyes. That move isn't even in the top five engine evaluations. I memorized the refutation to this when I was four. Are you just guessing?"
- mid: ["That's... that's not in my prep. ...Hold on. I'm thinking.", "This is ILLEGAL. You can't just PLAY that. That's not THEORY."]
- win: "Sniffs. As predicted. Move 23 was slightly inaccurate by the way. You're welcome."
- loss: "Throws phone. I'm telling my coach. This doesn't count."

**Vex**
- pre: "You call that a defense?! I don't care what the computer says, this sacrifice is going to crush you, you absolute coward!"
- mid: ["HERE IT COMES. THIS IS THE COMBINATION. THIS IS IT.", "That's ILLEGAL. That REFUTATION doesn't EXIST. You CHEATED."]
- win: "TOLD YOU. TOLD EVERYONE. WHERE'S THE ENGINE NOW. WHERE IS IT."
- loss: "I had it. I HAD it. The position was WINNING. The computer is BROKEN."

**Elara**
- pre: "We hate it when the center locks up, don't we. We always get impatient and push the c-pawn too early. Watch. I'll show you exactly how you die."
- mid: ["You played this against Vex too. It didn't work then either.", "...Oh. You're trying something different. Interesting. Let's see if that's really you."]
- win: "Now I am you. And you are nothing."
- loss: "...I looked into you and found something I didn't expect. You've changed. Good."

**Vipra**
- pre: "Shhh. No need to rush. You have no safe squares for your knights, your bishop is staring at a pawn chain, and I have all the time in the world to squeeze."
- mid: ["You're trying to create chaos. I understand. There isn't any.", "Your knight has been on that square for eleven moves. Where is it going to go?"]
- win: "Forty-seven moves. A respectable struggle, little mouse."
- loss: "Quietly. You found the release valve before I closed it. Well played. That doesn't happen often."

**Boros**
- pre: "100 milliseconds. That's all I needed. You've spent 40 seconds staring at a forced sequence. The friction of your organic neurons is genuinely disgusting to watch."
- mid: ["You have 23 seconds. The position requires 8 moves of calculation. I'll wait.", "Faster than average. Noted. Still insufficient."]
- win: "Elapsed time: 4 minutes, 12 seconds. Acceptable."
- loss: "...The position required depth I could not reach in 100 milliseconds. This data has been logged."

**Severin**
- pre: "Cracks finger. The queens are traded. The minor pieces are liquidating. You are down exactly one pawn. The math is already solved. Just stop struggling."
- mid: ["There. Now we can be honest with each other.", "You can decline the trade. The alternative is worse."]
- win: "Quiet pause. As calculated."
- loss: "...The endgame was drawable. I misjudged the transition. This is noted."

**Nyx**
- pre: "You thought routing the rook to the seventh rank would save you. I foresaw that ten moves ago and placed my bishop precisely to deny it. You have never been in control."
- mid: ["That plan was closed six moves ago. You're executing a ghost.", "...I did not see that variation. Recalibrating."]
- win: "It ended as I foresaw. As all things do."
- loss: "Quiet. Still. I did not see you. That has not happened before."

**Kael**
- pre: "Overextended again. You always overextend. You always overextend. Millions of games and it always ends the exact same way. Why do you keep moving the pieces? Just let it go dark. Let it go dark."
- mid: ["There it is. I knew you'd do that. I always know.", "...You're better than you were. I can see it. It won't be enough. But I can see it."]
- win: "The same. It's always the same. Why won't it be different. Why won't it ever be different."
- loss: "Long silence. ...You broke the pattern. You actually broke it. I haven't— I don't know what comes after this."

**Dread Hades**
- pre: "I watched you bleed against Vex. I watched Nyx shatter your pathetic plans. I watched Kael try to break you the way he was broken. And still — you drag your fragile, flawed, extraordinary mind to my throne. I've been here a very long time. You might actually be interesting."
- mid: ["Oh. There you are. I was wondering when you'd show up.", "And there it is. The same flaw. You've been carrying it since Silas.", "You're still here. ...Good."]
- win: "She gave you the game as a gift. I made it true. And now you, like all the others, will play forever. Welcome."
- loss: "Long silence. Then, quietly: Caïssa. Forgive me. ...She chose well."
