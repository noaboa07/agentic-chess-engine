-- Rename persona IDs — v3 (persona redesign)

-- campaign_progress
UPDATE campaign_progress SET persona_id = 'silas'    WHERE persona_id = 'pawnstorm_petey';
UPDATE campaign_progress SET persona_id = 'vespera'  WHERE persona_id = 'grizelda_the_greedy';
UPDATE campaign_progress SET persona_id = 'dorian'   WHERE persona_id = 'brother_oedric';
UPDATE campaign_progress SET persona_id = 'valerius' WHERE persona_id = 'sir_vance_the_vain';
UPDATE campaign_progress SET persona_id = 'lysander' WHERE persona_id = 'the_hippomancer';
UPDATE campaign_progress SET persona_id = 'elara'    WHERE persona_id = 'the_mirror_maiden';
UPDATE campaign_progress SET persona_id = 'severin'  WHERE persona_id = 'the_reaper';
UPDATE campaign_progress SET persona_id = 'kael'     WHERE persona_id = 'the_fallen_champion';
UPDATE campaign_progress SET persona_id = 'nyx'      WHERE persona_id = 'oracle_nyx';

-- games.opponent_id
UPDATE games SET opponent_id = 'silas'    WHERE opponent_id = 'pawnstorm_petey';
UPDATE games SET opponent_id = 'vespera'  WHERE opponent_id = 'grizelda_the_greedy';
UPDATE games SET opponent_id = 'dorian'   WHERE opponent_id = 'brother_oedric';
UPDATE games SET opponent_id = 'valerius' WHERE opponent_id = 'sir_vance_the_vain';
UPDATE games SET opponent_id = 'lysander' WHERE opponent_id = 'the_hippomancer';
UPDATE games SET opponent_id = 'elara'    WHERE opponent_id = 'the_mirror_maiden';
UPDATE games SET opponent_id = 'severin'  WHERE opponent_id = 'the_reaper';
UPDATE games SET opponent_id = 'kael'     WHERE opponent_id = 'the_fallen_champion';
UPDATE games SET opponent_id = 'nyx'      WHERE opponent_id = 'oracle_nyx';
