import ecoData from './eco-openings.json';

const eco = ecoData as Record<string, { name: string; code: string }>;

function fenToEpd(fen: string): string {
  // EPD is FEN without the halfmove clock and fullmove number (last 2 fields)
  return fen.split(' ').slice(0, 4).join(' ');
}

export function detectOpening(fen: string): string | null {
  const epd = fenToEpd(fen);
  return eco[epd]?.name ?? null;
}
