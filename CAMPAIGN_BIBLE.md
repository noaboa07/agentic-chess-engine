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
1. pawnstorm_petey | Pawnstorm Petey | 200 ELO | Sin: Recklessness
   Species: Human | Gender: Male
   Playstyle: Pushes every pawn turn one. Hangs pieces constantly.
   Teaching: Punish overextension, develop pieces, basic capture tactics.
   AI: skill=1, move_bias=pawn_push_heavy, ignore_piece_safety=true

2. grizelda_the_greedy | Grizelda the Greedy | 400 ELO | Sin: Greed
   Species: Goblin | Gender: Female
   Playstyle: Captures everything regardless of value.
   Teaching: When not to trade, piece activity over material count.
   AI: skill=3, move_bias=capture_heavy, accept_unfavorable_trades=true

3. brother_oedric | Brother Oedric the Slothful | 600 ELO | Sin: Sloth
   Species: Zombie | Gender: Male
   Playstyle: Pure passive Hippo setup, never initiates.
   Teaching: Breaking fortresses, prophylaxis, not blundering when bored.
   AI: skill=5, opening=hippo_forced, anti_trade_bias=true

#### Second Descent — The Middle Hells
4. sir_vance_the_vain | Sir Vance the Vain | 800 ELO | Sin: Vanity
   Species: Undead Knight | Gender: Male
   Playstyle: Scholar's Mate every game. Collapses completely if defended.
   Teaching: Refute cheap opening traps without panicking.
   AI: skill=7, opening=scholars_mate_forced, fallback_skill=4

5. lady_cassandra_bloodwine | Lady Cassandra Bloodwine | 1000 ELO | Sin: Lust
   Species: Vampire | Gender: Female
   Playstyle: Romantic-era gambits. Brilliant attacks, weak endgames.
   Teaching: Defending against sacrifices, converting won endgames.
   AI: skill=9, opening=romantic_gambit_book, endgame_skill_drop=3

6. the_hippomancer | The Hippomancer | 1200 ELO | Sin: Stagnation
   Species: Anthropomorphic Hippo | Gender: Female
   Playstyle: Advanced Hippo fortress. Never breaks it.
   Teaching: Patience vs fortress, creating imbalances.
   AI: skill=11, opening=hippo_advanced, prophylactic_anti_break=true

7. magister_tobias | Magister Tobias the Pedant | 1400 ELO | Sin: Pride
   Species: Human | Gender: Male
   Playstyle: Deep theory in book. Lost out of book.
   Teaching: Principles over memorization, navigating unfamiliar positions.
   AI: skill_in_book=14, skill_out_of_book=8, opening=deep_theory_lines

#### Third Descent — The Inner Hells
8. wrathful_vex | Wrathful Vex | 1600 ELO | Sin: Wrath
   Species: Imp/Fire Demon | Gender: Female
   Playstyle: Forces tactics that don't exist. Unsound sacrifices.
   Teaching: Calculation, defending threats, recognizing hallucinated tactics.
   AI: skill=16, move_bias=forcing_moves, unsound_sac_tendency=true

9. the_mirror_maiden | The Mirror Maiden | 1800 ELO | Sin: Envy
   Species: Ghost | Gender: Female
   Playstyle: Mirrors player's openings and style back at them.
   Teaching: Self-awareness, breaking your own patterns.
   AI: skill=17, opening_selector=mirror_player_last_3_games

10. lady_vipra | Lady Vipra the Coiled | 2000 ELO | Sin: Cruelty
    Species: Naga | Gender: Female
    Playstyle: Pure positional. Slow suffocation over 50+ moves.
    Teaching: Positional understanding, recognizing strategic pressure.
    AI: skill=19, full_depth=true, no_tactical_bias=true

11. boros | Boros the Time-Devourer | 2100 ELO | Sin: Tyranny
    Species: Skeleton (hourglass head) | Gender: Male
    Playstyle: Blitz pace. 100ms moves. Cracks under long thinks.
    Teaching: Time management, calm under pressure.
    AI: skill=21, search_time_ms=100, accuracy_drop_under_pressure=true

#### Fourth Descent — Heralds & Throne
12. the_reaper | The Reaper of Pawns | 2300 ELO | Sin: Inevitability
    Species: Grim Reaper | Gender: Genderless
    Playstyle: Trades to endgames at every opportunity. Surgical.
    Teaching: Endgame fundamentals.
    AI: skill=22, simplification_bias=strong, endgame_skill=24

13. oracle_nyx | Oracle Nyx the Paranoid | 2500 ELO | Sin: Paranoia
    Species: Three-eyed Oracle | Gender: Female
    Playstyle: Karpovian prophylaxis. Denies plans before they form.
    Teaching: Planning, candidate moves, playing with a plan.
    AI: skill=23, full_depth=true, prophylactic_bias=strong

14. the_fallen_champion | The Fallen Champion | 2700 ELO | Sin: Despair
    Species: Corrupted Human | Gender: Ambiguous
    Playstyle: Universal, adaptive. Targets player's specific weaknesses.
    Teaching: Universal preparation, adapting to the opponent.
    AI: skill=24, adaptive_opening=player_loss_history, anti_player=true

15. dread_hades | Dread Hades | 3000 ELO | Sin: All
    Species: Chess Devil | Gender: Ambiguous
    Playstyle: Full strength, adaptive, multi-phase style shifts.
    Teaching: Complete game mastery across all phases.
    AI: skill=max, adaptive_layer=full_campaign_history, phase_shift=true

---

### Canonical Quotes

**Pawnstorm Petey**
- pre: "I push. That is the whole plan."
- win: "I won? I WON! WAIT TIL MOMMA HEARS!"
- loss: "Aw. Wanna play again?"

**Grizelda the Greedy**
- pre: "Take. Take. Take. Why won't you take, ducky?"
- win: "Ohohoho! All your pieces are MINE now, lovey. Mine, mine, mine!"
- loss: "You drive a hard bargain... a HARD bargain..."

**Brother Oedric the Slothful**
- pre: "I move my pawns to the third rank. Then I rest. Forever."
- win: "Mmm. Goodnight, child."
- loss: "Wait... is it... my turn...?"

**Sir Vance the Vain**
- pre: "Wayward Queen, baby. Undefeated since the Battle of Aldermere."
- win: "Did you SEE that? Did you SEE me? Tell them. Tell EVERYONE."
- loss: "No... they were supposed to remember me for that move..."

**Lady Cassandra Bloodwine**
- pre: "My grandfather played this gambit at the docks. Sacrifice everything. Especially yourself."
- win: "Oh darling. You played beautifully. Almost as beautifully as you'll bleed."
- loss: "Mmm. I haven't lost in centuries. How... refreshing."

**The Hippomancer**
- pre: "I do not move. The river moves around me."
- win: "You fought the current. The current always wins."
- loss: "Ah. The river has chosen. Pass, child."

**Magister Tobias the Pedant**
- pre: "Actually, in the Najdorf English Attack, move 17 is..."
- win: "As Capablanca demonstrated in 1927, this position is theoretically lost for you. I merely... confirmed it."
- loss: "That's — that's not in any book I've read. That's not — no — that CAN'T be —"

**Wrathful Vex**
- pre: "There's always a combination. ALWAYS. SHUT UP."
- win: "BURN. BURN. BURN. WHAT? WHAT NOW? HUH?"
- loss: "I HATE THIS GAME I HATE YOU I HATE EVERYTHING —"

**The Mirror Maiden**
- pre: "I have no moves of my own. Only yours."
- win: "Now... I am you. And you are nothing."
- loss: "I... I will play your moves... in another life..."

**Lady Vipra the Coiled**
- pre: "I will squeeze you for fifty moves and you will not know why you are losing."
- win: "Forty-seven moves. A respectable struggle, little mouse."
- loss: "Sssssso. The mouse has fangs. Interesssssting."

**Boros the Time-Devourer**
- pre: "Time is the only piece that matters."
- win: "Sand. Out. Done."
- loss: "I had... more time... than I... thought..."

**The Reaper of Pawns**
- pre: "The middlegame is a rumor. Trade queens."
- win: (silence — display nothing)
- loss: "I will see you again."

**Oracle Nyx the Paranoid**
- pre: "I saw that move three of yours ago. I have already prevented it."
- win: "It ended as I foresaw. As all things do."
- loss: "I... did not see this. I did not see... this..."

**The Fallen Champion**
- pre: "I played a thousand games before I forgot why."
- win: "You will join me here. I have seen it."
- loss: "Then... you might actually... finish what I started..."

**Dread Hades**
- pre: "You played a good game. I played a different one."
- win: "She gave you the game as a cage. I have made it true. And now you, too, will play forever."
- loss: "Then... she chose well. Caïssa... forgive me..."
