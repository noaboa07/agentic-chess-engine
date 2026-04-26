// Mirror of /api/elo/calculate logic in main.py
function calculateElo(
  playerElo: number,
  opponentElo: number,
  result: string,
  gamesPlayed: number,
): { newElo: number; delta: number; kFactor: number } {
  const k = gamesPlayed < 20 ? 40 : playerElo >= 2400 ? 10 : 20;
  const expected = 1.0 / (1.0 + Math.pow(10, (opponentElo - playerElo) / 400.0));
  const score = ({ win: 1.0, loss: 0.0, draw: 0.5, resigned: 0.0 } as Record<string, number>)[result] ?? 0.0;
  const rawDelta = Math.round(k * (score - expected));
  const newElo = Math.max(100, playerElo + rawDelta);
  return { newElo, delta: newElo - playerElo, kFactor: k };
}

describe('Elo calculation — K-factor', () => {
  test('new player (< 20 games) uses K=40', () => {
    expect(calculateElo(1000, 1000, 'win', 5).kFactor).toBe(40);
  });

  test('boundary: 19 games → K=40', () => {
    expect(calculateElo(1000, 1000, 'win', 19).kFactor).toBe(40);
  });

  test('boundary: 20 games → K=20', () => {
    expect(calculateElo(1000, 1000, 'win', 20).kFactor).toBe(20);
  });

  test('high-rated player (≥ 2400) uses K=10', () => {
    expect(calculateElo(2400, 2400, 'win', 100).kFactor).toBe(10);
  });

  test('just below 2400 uses K=20', () => {
    expect(calculateElo(2399, 2399, 'win', 100).kFactor).toBe(20);
  });
});

describe('Elo calculation — outcomes', () => {
  test('win against equal opponent gains Elo', () => {
    expect(calculateElo(1000, 1000, 'win', 30).delta).toBeGreaterThan(0);
  });

  test('loss against equal opponent loses Elo', () => {
    expect(calculateElo(1000, 1000, 'loss', 30).delta).toBeLessThan(0);
  });

  test('draw against equal opponent is neutral', () => {
    expect(calculateElo(1000, 1000, 'draw', 30).delta).toBe(0);
  });

  test('resigned has same delta as loss', () => {
    const loss = calculateElo(1000, 1000, 'loss', 30).delta;
    const resigned = calculateElo(1000, 1000, 'resigned', 30).delta;
    expect(resigned).toBe(loss);
  });
});

describe('Elo calculation — floor', () => {
  test('Elo cannot drop below 100', () => {
    expect(calculateElo(100, 3000, 'loss', 30).newElo).toBe(100);
  });

  test('floor does not apply when above 100', () => {
    expect(calculateElo(500, 500, 'loss', 30).newElo).toBeGreaterThan(100);
  });
});

describe('Elo calculation — upset bonus', () => {
  test('beating a much stronger opponent gains more Elo', () => {
    const vsStrong = calculateElo(1000, 1400, 'win', 30).delta;
    const vsEqual  = calculateElo(1000, 1000, 'win', 30).delta;
    expect(vsStrong).toBeGreaterThan(vsEqual);
  });

  test('losing to a much weaker opponent costs more Elo', () => {
    const vsWeak  = calculateElo(1000, 600,  'loss', 30).delta;
    const vsEqual = calculateElo(1000, 1000, 'loss', 30).delta;
    expect(vsWeak).toBeLessThan(vsEqual);
  });
});
