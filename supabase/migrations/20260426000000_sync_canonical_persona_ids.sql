-- Sync canonical persona IDs — generated 2026-04-26
-- DO NOT RUN without reviewing existing production data first.
-- Five persona IDs were shortened to match the Campaign Bible canonical spec.
-- Old ID                       → New ID
-- magister_tobias_the_pedant   → magister_tobias
-- lady_vipra_the_coiled        → lady_vipra
-- boros_the_time_devourer      → boros
-- the_reaper_of_pawns          → the_reaper
-- oracle_nyx_the_paranoid      → oracle_nyx

BEGIN;

UPDATE public.campaign_progress SET persona_id = 'magister_tobias' WHERE persona_id = 'magister_tobias_the_pedant';
UPDATE public.campaign_progress SET persona_id = 'lady_vipra'       WHERE persona_id = 'lady_vipra_the_coiled';
UPDATE public.campaign_progress SET persona_id = 'boros'            WHERE persona_id = 'boros_the_time_devourer';
UPDATE public.campaign_progress SET persona_id = 'the_reaper'       WHERE persona_id = 'the_reaper_of_pawns';
UPDATE public.campaign_progress SET persona_id = 'oracle_nyx'       WHERE persona_id = 'oracle_nyx_the_paranoid';

UPDATE public.games SET opponent_id = 'magister_tobias' WHERE opponent_id = 'magister_tobias_the_pedant';
UPDATE public.games SET opponent_id = 'lady_vipra'       WHERE opponent_id = 'lady_vipra_the_coiled';
UPDATE public.games SET opponent_id = 'boros'            WHERE opponent_id = 'boros_the_time_devourer';
UPDATE public.games SET opponent_id = 'the_reaper'       WHERE opponent_id = 'the_reaper_of_pawns';
UPDATE public.games SET opponent_id = 'oracle_nyx'       WHERE opponent_id = 'oracle_nyx_the_paranoid';

COMMIT;
