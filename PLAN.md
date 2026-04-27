# The Hells of Caïssa — Project Plan & Campaign Bible
*Canonical reference for all character, lore, code, and design decisions.*

---

## Lore

In the beginning there were 64 squares, and Caïssa, goddess of the game, walked between them. She gave mortals chess as a gift — a mirror in which to see their own minds. For a thousand years the game was holy.

Then came Dread Hades, her fallen consort. Once a player of perfect understanding, he grew to hate the game's purity. He shattered the board into 64 hells, one for each square, and claimed dominion over them. He found mortals and creatures who already carried the seeds of corruption and twisted them into his Generals, each lord of their own hell, each embodying a single chess sin.

Caïssa, weakened, can no longer descend herself. She has chosen a champion: the player. You begin at the outermost hell and descend, square by square, general by general, toward Hades' throne at the 64th hell. With every victory, a soul is freed and a piece of the board is restored. With every defeat, you learn.

The final confrontation is not against a stronger player. It is against the corruption of chess itself.

---

## Progression: The Four Descents

| Descent | Generals | Visual Identity | Biome Family |
|---|---|---|---|
| First Descent: The Outer Hells | 3 | Earthy, grimy, mortal corruption | Caves, ruins, swamps |
| Second Descent: The Middle Hells | 4 | Cursed gothic, undeath, decay | Cathedrals, crypts, libraries |
| Third Descent: The Inner Hells | 4 | Hellfire, void, otherworldly | Volcanic, abyssal, spectral |
| Fourth Descent: The Heralds & Throne | 4 | Mythic, terrifying, divine-evil | Throne realms, broken board, void |

**Total: 14 Generals + Dread Hades (final boss) = 15 fights**

---

## Roster

### First Descent — The Outer Hells

#### `pawnstorm_petey` — Pawnstorm Petey
- **Species:** human · **Gender:** male · **Age:** late teens
- **Sin:** Recklessness · **ELO:** 200
- **Personality:** Dumb, eager, friendly. Doesn't know he's in hell. Thinks the player is his new friend who's come to play. Hades barely had to corrupt him — he was already this way.
- **Pre-game:** "I push. That is the whole plan."
- **Victory:** "I won? I WON! WAIT TIL MOMMA HEARS!"
- **Defeat:** "Aw. Wanna play again?"
- **Teaching:** Punish overextension, develop pieces, basic capture tactics.
- **AI:** `{ stockfish_skill: 1, search_time_ms: 500, move_bias: "pawn_push_heavy", ignore_piece_safety: true }`
- **Biome:** Crude torchlit cave with charcoal pawn-drawings on the walls. Chess board carved into a flat boulder.
- **Music:** Single tribal drum, simple bone flute melody. Almost cheerful.
- **Unlock requires:** null (first)

#### `grizelda_the_greedy` — Grizelda the Greedy
- **Species:** goblin · **Gender:** female · **Age:** ancient
- **Sin:** Greed · **ELO:** 400
- **Personality:** Cackling, ring-laden, sycophantic. Calls the player "ducky" and "lovey." Tries to swap pieces during the handshake. Offers "deals" mid-game.
- **Pre-game:** "Take. Take. Take. Why won't you take, ducky?"
- **Victory:** "Ohohoho! All your pieces are MINE now, lovey. Mine, mine, mine!"
- **Defeat:** "You drive a hard bargain... a HARD bargain..."
- **Teaching:** When not to trade, piece activity over material count.
- **AI:** `{ stockfish_skill: 3, search_time_ms: 600, move_bias: "capture_heavy", accept_unfavorable_trades: true }`
- **Biome:** Subterranean black-market bazaar lit by hanging lanterns, stalls of stolen goods. Board on a stolen chest.
- **Music:** Plucky strings, off-key bazaar flute, jingling coins layered into percussion.
- **Unlock requires:** `pawnstorm_petey`

#### `brother_oedric` — Brother Oedric the Slothful
- **Species:** zombie · **Gender:** male · **Age:** undead (was 60s in life)
- **Sin:** Sloth · **ELO:** 600
- **Personality:** Half-decomposed, eyes closed, mumbles excuses. Genuinely believes he's still pious. Forgets it's his turn. "Just five more minutes."
- **Pre-game:** "I move my pawns to the third rank. Then I rest. Forever."
- **Victory:** "Mmm. Goodnight, child."
- **Defeat:** "Wait... is it... my turn...?"
- **Teaching:** How to break down a fortress, prophylaxis, not blundering when bored.
- **AI:** `{ stockfish_skill: 5, search_time_ms: 800, opening: "hippo_setup_forced", move_bias: "anti_trade", anti_break_bias: true }`
- **Biome:** Crumbling overgrown monastery, half-sunk into a swamp. Vines through stained glass, moss on the pews. Board on a moldering altar.
- **Music:** Slow Gregorian chant in a dead language, droning organ, distant tolling bell.
- **Unlock requires:** `grizelda_the_greedy`

---

### Second Descent — The Middle Hells

#### `sir_vance_the_vain` — Sir Vance the Vain
- **Species:** undead knight · **Gender:** male · **Age:** ageless (died 300 years ago)
- **Sin:** Vanity · **ELO:** 800
- **Personality:** Handsome corpse-knight in pristine armor. Died executing a perfect Scholar's Mate 300 years ago. Has been chasing that high ever since. His hair is perfect.
- **Pre-game:** "Wayward Queen, baby. Undefeated since the Battle of Aldermere."
- **Victory:** "Did you SEE that? Did you SEE me? Tell them. Tell EVERYONE."
- **Defeat:** "No... they were supposed to remember me for that move..."
- **Teaching:** Refute cheap opening traps without panicking.
- **AI:** `{ stockfish_skill: 7, search_time_ms: 1000, opening: "scholars_mate_forced", fallback_skill: 4 }`
- **Biome:** Silent tournament tent, banners faded and torn, candles guttering, ghostly applause from invisible spectators. He's been holding this tournament alone for centuries.
- **Music:** Lone medieval harp, distant ghostly cheers, single repeating melody he can't stop hearing.
- **Unlock requires:** `brother_oedric`

#### `lady_cassandra_bloodwine` — Lady Cassandra Bloodwine
- **Species:** vampire · **Gender:** female · **Age:** ageless
- **Sin:** Lust · **ELO:** 1000
- **Personality:** Pale, fanged, draped in bloodred silks. Bored aristocrat. Flirts with the player constantly. Sacrifices pieces for the romance of it. Will compliment your jawline mid-blunder.
- **Pre-game:** "My grandfather played this gambit at the docks. Sacrifice everything. Especially yourself."
- **Victory:** "Oh darling. You played beautifully. Almost as beautifully as you'll bleed."
- **Defeat:** "Mmm. I haven't lost in centuries. How... refreshing."
- **Teaching:** Defending against sacrifices, converting won endgames.
- **AI:** `{ stockfish_skill: 9, search_time_ms: 1200, opening: "romantic_gambit_book", move_bias: "attacking", endgame_skill_drop: 3 }`
- **Biome:** Candlelit gothic salon, red velvet drapes, chaise lounge, wineglass of "wine" on the table. The board is between two glasses — one for her, one for you.
- **Music:** Slow seductive cello, harpsichord, breathy female vocalizations in minor key.
- **Unlock requires:** `sir_vance_the_vain`

#### `the_hippomancer` — The Hippomancer
- **Species:** anthropomorphic armored hippo · **Gender:** female · **Age:** ancient
- **Sin:** Stagnation (not malicious — Hades couldn't fully corrupt her, just trapped her) · **ELO:** 1200
- **Personality:** Massive, calm, speaks in koans. Greets the player with serene respect. The first general the player might feel bad defeating.
- **Pre-game:** "I do not move. The river moves around me."
- **Victory:** "You fought the current. The current always wins."
- **Defeat:** "Ah. The river has chosen. Pass, child."
- **Teaching:** Breaking down advanced fortresses, advanced prophylaxis.
- **AI:** `{ stockfish_skill: 11, search_time_ms: 1500, opening: "hippo_setup_advanced", move_bias: "prophylactic_anti_break" }`
- **Biome:** Vast still pond at the bottom of an underground cavern. She sits half-submerged. Board floats on a lily pad. Light filters from a hole in the cavern ceiling.
- **Music:** Deep low brass drones, water-drop percussion, single distant flute. Meditative, almost holy.
- **Unlock requires:** `lady_cassandra_bloodwine`

#### `magister_tobias_the_pedant` — Magister Tobias the Pedant
- **Species:** human · **Gender:** male · **Age:** 40s
- **Sin:** Pride (intellectual) · **ELO:** 1400
- **Personality:** Insufferable. Pince-nez glasses, ink-stained fingers. Lectures the player on the correct response to their opening. Corrects moves while they're being made. Devastated when forced into a sideline.
- **Pre-game:** "Actually, in the Najdorf English Attack, move 17 is..."
- **Victory:** "As Capablanca demonstrated in 1927, this position is theoretically lost for you. I merely... confirmed it."
- **Defeat:** "That's — that's not in any book I've read. That's not — no — that CAN'T be — "
- **Teaching:** Principles over memorization, navigating unfamiliar positions.
- **AI:** `{ stockfish_skill: 14, in_book_skill: 14, out_of_book_skill: 8, opening_book: "deep_theory_lines" }`
- **Biome:** Burning library — endless shelves of chess books, some on fire, ash falling like snow. He doesn't notice. Board on a podium covered in annotated games.
- **Music:** Quill-on-parchment scratching, page-turns, fugue on solo violin, distant crackling fire.
- **Unlock requires:** `the_hippomancer`

---

### Third Descent — The Inner Hells

#### `wrathful_vex` — Wrathful Vex
- **Species:** imp · **Gender:** female · **Age:** ageless
- **Sin:** Wrath · **ELO:** 1500
- **Personality:** Small, fast, furious. Literally on fire. Insults the player constantly in a high-pitched scream. Slams pieces. Throws her king when she loses.
- **Pre-game:** "There's always a combination. ALWAYS. SHUT UP."
- **Victory:** "BURN. BURN. BURN. WHAT? WHAT NOW? HUH?"
- **Defeat:** "I HATE THIS GAME I HATE YOU I HATE EVERYTHING — "
- **Teaching:** Calculation, defending against threats, recognizing when there is no tactic.
- **AI:** `{ stockfish_skill: 16, search_time_ms: 800, move_bias: "forcing_moves_heavy", unsound_sac_tendency: true }`
- **Biome:** Volcanic chamber, board carved from cooling lava, magma rivers in background, pieces glow red-hot.
- **Music:** Aggressive distorted strings, demonic choir whispers, sudden percussion hits like punches.
- **Unlock requires:** `magister_tobias_the_pedant`

#### `the_mirror_maiden` — The Mirror Maiden
- **Species:** ghost · **Gender:** female · **Age:** undead (died young)
- **Sin:** Envy · **ELO:** 1600
- **Personality:** Translucent, sad, jealous of the living. Plays the player's own openings back at them, copies their style. Whispers the player's own thoughts back. Was a chess prodigy in life, died of envy.
- **Pre-game:** "I have no moves of my own. Only yours."
- **Victory:** "Now... I am you. And you are nothing."
- **Defeat:** "I... I will play your moves... in another life..."
- **Teaching:** Self-awareness, breaking your own patterns.
- **AI:** `{ stockfish_skill: 17, search_time_ms: 1500, opening_selector: "mirror_player_last_3_games", middlegame_style: "positional_stockfish" }` — **TODO: requires player_history module**
- **Biome:** Hall of mirrors in a fog-drowned void. Every reflection is the player's own. Mirrored board surface.
- **Music:** Reversed piano notes, ethereal female humming, echo of the player's previous victory music slightly off-key.
- **Unlock requires:** `wrathful_vex`

#### `lady_vipra_the_coiled` — Lady Vipra, the Coiled
- **Species:** naga · **Gender:** female · **Age:** ageless
- **Sin:** Cruelty · **ELO:** 1800
- **Personality:** Cold, methodical, surgical. Slit pupils, forked tongue, charcoal robes. Never insults — just slowly dismantles over 60 moves. The cruelty is in the patience.
- **Pre-game:** "I will squeeze you for fifty moves and you will not know why you are losing."
- **Victory:** "Forty-seven moves. A respectable struggle, little mouse."
- **Defeat:** "Sssssso. The mouse has fangs. Interesssssting."
- **Teaching:** Positional understanding, recognizing slow strategic pressure.
- **AI:** `{ stockfish_skill: 19, search_time_ms: 2500, full_depth: true, no_tactical_bias: true, endgame_priority: true }`
- **Biome:** Abyssal underwater grotto, dark coral, bioluminescent fish. Board on a slab of black stone.
- **Music:** Subharmonic bass drones, distant whale-song-like vocals, slow rhythmic hiss like breath through teeth.
- **Unlock requires:** `the_mirror_maiden`

#### `boros_the_time_devourer` — Boros the Time-Devourer
- **Species:** skeleton · **Gender:** male · **Age:** undead (eternal)
- **Sin:** Tyranny (of the clock) · **ELO:** 2000
- **Personality:** Skeleton in tattered black robes. Head is a literal hourglass — sand drains from skull to skull as he plays. Speaks in clipped sentences. Plays at impossible speed.
- **Pre-game:** "Time is the only piece that matters."
- **Victory:** "Sand. Out. Done."
- **Defeat:** "I had... more time... than I... thought..."
- **Teaching:** Time management, calm under pressure, punishing speed-induced inaccuracy.
- **AI:** `{ stockfish_skill: 21, search_time_ms: 100, accuracy_drops_under_long_player_thinks: true }`
- **Biome:** Clockwork hell — giant gears turning slowly, hourglasses of every size lining the walls, sand falling everywhere. Board has a built-in clock with screaming faces on the buttons.
- **Music:** Tick-tock percussion accelerating with game progress, frantic harpsichord, sound of pouring sand.
- **Unlock requires:** `lady_vipra_the_coiled`

---

### Fourth Descent — The Heralds & Throne

#### `the_reaper_of_pawns` — The Reaper of Pawns
- **Species:** reaper · **Gender:** genderless · **Age:** eternal
- **Sin:** Inevitability · **ELO:** 2200
- **Personality:** Silent during play. Hooded, faceless except for two cold pinpricks of light where eyes should be. Carries a scythe of polished bone. Says nothing during the game. Says one sentence if defeated.
- **Pre-game:** "The middlegame is a rumor. Trade queens."
- **Victory:** (silence)
- **Defeat:** "I will see you again."
- **Teaching:** Endgame fundamentals.
- **AI:** `{ stockfish_skill: 22, search_time_ms: 3000, simplification_bias: "strong", endgame_skill: 24 }`
- **Biome:** Frozen battlefield at twilight, broken statues of ancient chess masters half-buried in snow, crows watching from ruins. Board on a stone tomb.
- **Music:** Solo cello dirge, distant crow calls, wind, no percussion. Devastating restraint.
- **Unlock requires:** `boros_the_time_devourer`

#### `oracle_nyx_the_paranoid` — Oracle Nyx the Paranoid
- **Species:** oracle · **Gender:** female · **Age:** ancient
- **Sin:** Paranoia · **ELO:** 2400
- **Personality:** Pale, blindfolded, three burning eyes glowing through the cloth. Sees every move three turns ahead. Every sentence ends with "...as I foresaw." Genuinely tragic — sees so much she's drowning in possibilities.
- **Pre-game:** "I saw that move three of yours ago. I have already prevented it."
- **Victory:** "It ended as I foresaw. As all things do."
- **Defeat:** "I... did not see this. I did not see... this..."
- **Teaching:** Planning, candidate moves, playing with a plan instead of reacting.
- **AI:** `{ stockfish_skill: 23, search_time_ms: 4000, full_depth: true, prophylactic_move_bias: "strong" }`
- **Biome:** Celestial observatory at the edge of the void. Stars through a shattered glass dome, constellations arranged in chess patterns. Board on a brass orrery.
- **Music:** Distant choral aaahs, ethereal high strings, single tolling bell on every move she makes.
- **Unlock requires:** `the_reaper_of_pawns`

#### `the_fallen_champion` — The Fallen Champion
- **Species:** corrupted human · **Gender:** ambiguous · **Age:** ageless
- **Sin:** Despair · **ELO:** 2600
- **Personality:** Caïssa's previous champion, who descended before the player and failed. Hades broke them. Looks like the player would in 20 years if they fail. Knows every weakness. Speaks softly.
- **Pre-game:** "I played a thousand games before I forgot why."
- **Victory:** "You will join me here. I have seen it."
- **Defeat:** "Then... you might actually... finish what I started..."
- **Teaching:** Self-awareness about your own weaknesses.
- **AI:** `{ stockfish_skill: 24, search_time_ms: 5000, adaptive_opening_selector: "player_loss_history", anti_player_logic: true }` — **TODO: requires player_history module**
- **Biome:** Throne room half-rendered, floor still under construction, broken pieces strewn around a half-collapsed throne. They are sitting on it as if it was always theirs.
- **Music:** Distorted, sadder version of Caïssa's main theme. Player's victory melody in minor key, alone on piano.
- **Unlock requires:** `oracle_nyx_the_paranoid`

#### `dread_hades` — Dread Hades, the Chess Devil
- **Species:** chess devil · **Gender:** ambiguous · **Age:** eternal
- **Sin:** All · **ELO:** full strength Stockfish
- **Personality:** Tall, horned, cloaked in a shifting void edged with gold. Crown of broken chess pieces from every champion he's defeated. Eyes like burning checkered voids. Soft-spoken. Genuinely believes he liberated chess from Caïssa's tyranny of purity.
- **Pre-game:** "You played a good game. I played a different one."
- **Victory:** "She gave you the game as a cage. I have made it true. And now you, too, will play forever."
- **Defeat:** "Then... she chose well. Caïssa... forgive me..."
- **Teaching:** There's no one trick left. You must be a complete player.
- **AI:** `{ stockfish_skill: max, search_time_ms: 8000, adaptive_layer: "full_campaign_history", phase_shift_on_disadvantage: true, multi_style_engine: true }` — **TODO: requires player_history module + multi_style_engine**
- **Biome:** Throne suspended over the void, infinite chessboard stretching below. Throne built from bones of every defeated general. Caïssa's broken statue lies behind him.
- **Music:** Full orchestral choir in a dead language, demonic male and female voices intertwined. Melody contains fragments of every prior general's theme, twisted into one. Builds to crescendo on the final move.
- **Unlock requires:** `the_fallen_champion`

---

## Roster Quick Reference

| # | ID | Name | Sin | Descent | ELO | Species | Gender |
|---|---|---|---|---|---|---|---|
| 1 | pawnstorm_petey | Pawnstorm Petey | Recklessness | 1 | 200 | human | male |
| 2 | grizelda_the_greedy | Grizelda the Greedy | Greed | 1 | 400 | goblin | female |
| 3 | brother_oedric | Brother Oedric | Sloth | 1 | 600 | zombie | male |
| 4 | sir_vance_the_vain | Sir Vance the Vain | Vanity | 2 | 800 | undead knight | male |
| 5 | lady_cassandra_bloodwine | Lady Cassandra Bloodwine | Lust | 2 | 1000 | vampire | female |
| 6 | the_hippomancer | The Hippomancer | Stagnation | 2 | 1200 | hippo anthro | female |
| 7 | magister_tobias_the_pedant | Magister Tobias | Pride | 2 | 1400 | human | male |
| 8 | wrathful_vex | Wrathful Vex | Wrath | 3 | 1500 | imp | female |
| 9 | the_mirror_maiden | The Mirror Maiden | Envy | 3 | 1600 | ghost | female |
| 10 | lady_vipra_the_coiled | Lady Vipra | Cruelty | 3 | 1800 | naga | female |
| 11 | boros_the_time_devourer | Boros the Time-Devourer | Tyranny | 3 | 2000 | skeleton | male |
| 12 | the_reaper_of_pawns | The Reaper of Pawns | Inevitability | 4 | 2200 | reaper | genderless |
| 13 | oracle_nyx_the_paranoid | Oracle Nyx | Paranoia | 4 | 2400 | oracle | female |
| 14 | the_fallen_champion | The Fallen Champion | Despair | 4 | 2600 | corrupted human | ambiguous |
| 15 | dread_hades | Dread Hades | All | 4 | max | chess devil | ambiguous |

**Gender split (excluding genderless/ambiguous): 7F / 5M** across the 12 gendered generals.

---

## TODO Stubs (features requiring infrastructure not yet built)

- `// TODO: requires player_history module` — adaptive opening selection for Mirror Maiden, Fallen Champion, Dread Hades
- `// TODO: requires biome_renderer` — per-general visual biome rendering
- `// TODO: requires music_system` — dynamic music switching per general and per game phase
- `// TODO: requires dialogue_system` — victory/defeat/mid-game quote triggers

---

## Archive History

| Date | File | Contents |
|---|---|---|
| 2026-04-26 | `frontend/archive/legacy_noah_roster.ts` | Original 13 Noah characters (frontend) |
| 2026-04-26 | `backend/archive/legacy_noah_roster.py` | Original 13 Noah characters (backend) |
| 2026-04-26 | `frontend/archive/generals_v1.ts` | 13-general interim roster (Petey–Magnus Noah) |
| 2026-04-26 | `backend/archive/generals_v1_backend.py` | 13-general interim roster (backend) |

---

## Architecture

```
Browser (Next.js 14 App Router)
  └── AuthContext · AchievementContext · GameContext
      └── HTTP REST → FastAPI (Python 3.11)
          ├── Stockfish (local) · Groq LLM · ElevenLabs TTS
          └── Supabase (PostgreSQL + RLS)
               users · games · campaign_progress · user_achievements
```

## Key Design Invariants

- **No mid-game DB writes** — move history in React state; single batch JSONB insert via `acknowledgeGameOver()` only
- **Deferred game-over** — `concludeGame()` sets flag only; `acknowledgeGameOver()` is the sole DB commit point
- **RLS everywhere** — all Supabase queries use authenticated `uid`; no admin bypass on frontend
- **LLM gating** — Groq fires on CPL thresholds, explicit user action, or significant events; never per-move
- **Gold accent only** — `#E8B931` used exclusively for primary CTAs, stat numerals, hover accents
- **chess.js v1** — `move()` does NOT accept UCI strings; use `uciToMove()` helper
- **Scroll pattern** — `body { overflow: hidden }` in globals.css; each page uses `h-full overflow-y-auto` on its outer div
- **Z-index hierarchy** — achievement toasts `z-[200]`, settings modal `z-[190]`, gear button `z-[185]`
