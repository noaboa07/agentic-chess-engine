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

export function detectOpeningFull(fen: string): string | null {
  const epd = fenToEpd(fen);
  const entry = eco[epd];
  if (entry) return entry.code ? `${entry.code} · ${entry.name}` : entry.name;

  // Fallback: python-chess sets en passant square after every double pawn push
  // even when no capture is possible. ECO databases often store '-' instead.
  const parts = epd.split(' ');
  if (parts[3] !== '-') {
    parts[3] = '-';
    const normalized = eco[parts.join(' ')];
    if (normalized) return normalized.code ? `${normalized.code} · ${normalized.name}` : normalized.name;
  }

  return null;
}
