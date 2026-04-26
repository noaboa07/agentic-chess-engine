export interface OpeningExplorerEntry {
  eco: string;
  name: string;
  mainLine: string[];
  whitePlan: string;
  blackPlan: string;
  watchOut: string;
}

export const OPENING_EXPLORER: OpeningExplorerEntry[] = [
  {
    eco: 'C20', name: "King's Pawn Opening",
    mainLine: ['e4', 'e5'],
    whitePlan: 'Control the center, develop knights and bishops quickly, castle kingside.',
    blackPlan: 'Mirror the center, equalize, then fight for the initiative.',
    watchOut: "Don't move the same piece twice in the opening — tempo matters.",
  },
  {
    eco: 'C60', name: 'Ruy Lopez',
    mainLine: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'],
    whitePlan: 'Pressure the e5 pawn indirectly, build a strong pawn center, target long-term positional advantage.',
    blackPlan: 'Break the pin with ...a6, free the queenside, fight for d5.',
    watchOut: 'The Fried Liver idea on f7 — keep your f6 knight defended.',
  },
  {
    eco: 'C44', name: "Scotch Game",
    mainLine: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'],
    whitePlan: 'Open the center immediately, seize space, active piece play.',
    blackPlan: 'Develop actively after ...exd4, aim for counterplay on the queenside.',
    watchOut: 'The Mieses variation can lead to sharp tactics — know your theory.',
  },
  {
    eco: 'B20', name: 'Sicilian Defense',
    mainLine: ['e4', 'c5'],
    whitePlan: 'Attack kingside with f4-f5, use the open d-file after d4, launch a kingside assault.',
    blackPlan: 'Counterattack on the queenside using the half-open c-file and ...d5 break.',
    watchOut: 'The Alapin (2.c3) sidesteps theory — be ready to equalise positionally.',
  },
  {
    eco: 'B90', name: 'Sicilian Najdorf',
    mainLine: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
    whitePlan: 'Launch the English Attack (Be3/f3/g4) or the Classical attack, aim at the kingside.',
    blackPlan: '...b5, ...Bb7, and queenside pressure; the ...e5 break to gain space.',
    watchOut: 'The poisoned pawn variation (6.Bg5 e6 7.f4 Qb6) is razor sharp — study it or avoid it.',
  },
  {
    eco: 'C01', name: 'French Defense',
    mainLine: ['e4', 'e6', 'd4', 'd5'],
    whitePlan: 'Build a strong pawn chain, attack the kingside once Black is cramped.',
    blackPlan: 'Counter with ...c5 to attack the pawn chain at the base, fight for d5.',
    watchOut: "The bad c8 bishop is Black's main headache — activate it via ...b6 or ...f6.",
  },
  {
    eco: 'B10', name: 'Caro-Kann Defense',
    mainLine: ['e4', 'c6', 'd4', 'd5'],
    whitePlan: 'Gain space in the center, exploit weak dark squares after cxd5.',
    blackPlan: 'Solid structure, avoid early weaknesses, recapture with the c-pawn to keep the light-square bishop active.',
    watchOut: "The Fantasy Variation (3.f3) is aggressive — don't panic, play solidly.",
  },
  {
    eco: 'D00', name: "Queen's Pawn Opening",
    mainLine: ['d4', 'd5'],
    whitePlan: 'Control d4 and e4, develop pieces harmoniously, avoid early exchanges.',
    blackPlan: 'Maintain the d5 pawn, develop actively, avoid getting cramped.',
    watchOut: 'Premature pawn breaks (...c5 without preparation) can backfire quickly.',
  },
  {
    eco: 'D06', name: "Queen's Gambit",
    mainLine: ['d4', 'd5', 'c4'],
    whitePlan: 'Trade the c-pawn for central control, develop queenside minor pieces, target the isolated d-pawn.',
    blackPlan: 'Accept (dxc4) or decline — if declining, play ...e6 and ...Nf6 solidly.',
    watchOut: "Accepting the gambit (QGA) requires knowing the ...a6 or ...c5 pawn breaks to hold the material.",
  },
  {
    eco: 'D43', name: "Semi-Slav Defense",
    mainLine: ['d4', 'd5', 'c4', 'c6', 'Nc3', 'Nf6', 'Nf3', 'e6'],
    whitePlan: 'Open the position with e4, target the backward e6 pawn, use the open c-file.',
    blackPlan: 'Counterattack with ...dxc4 and ...b5, pursue the Meran or Botvinnik setups.',
    watchOut: 'The Botvinnik variation is extremely sharp — one tempo off can be losing.',
  },
  {
    eco: 'A45', name: "Indian Game",
    mainLine: ['d4', 'Nf6'],
    whitePlan: 'Control the center with pawns, prevent Black\'s ...e5 break, aim for c4-e4.',
    blackPlan: 'Fianchetto the bishop (g6/Bg7), put pressure on d4 from a distance.',
    watchOut: "Allowing ...Ne4 without preparation gives Black strong central control.",
  },
  {
    eco: 'E60', name: "King's Indian Defense",
    mainLine: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6'],
    whitePlan: 'Advance f4-f5, control the queenside with c4-c5-c6, siege the kingside.',
    blackPlan: 'Attack with ...e5-f5 in the Classical, or ...c5 in the Sämisch — dynamic counterplay.',
    watchOut: "The bishop on g7 is Black's power piece — White should try to block the long diagonal.",
  },
  {
    eco: 'E00', name: "Catalan Opening",
    mainLine: ['d4', 'Nf6', 'c4', 'e6', 'g3', 'd5', 'Bg2'],
    whitePlan: 'Use the g2 bishop to pressure d5/b7, slowly absorb the c4 gambit, build a lasting advantage.',
    blackPlan: 'Accept the gambit and hold with ...a6/...b5, or decline and equalize positionally.',
    watchOut: "The long diagonal bishop is White's main weapon — don't let it operate freely.",
  },
  {
    eco: 'A15', name: "English Opening",
    mainLine: ['c4'],
    whitePlan: 'Control d5, fianchetto the king bishop, build a flexible pawn structure.',
    blackPlan: 'Respond symmetrically (...c5) or stake out the center with ...e5 or ...d5.',
    watchOut: 'The English can transpose to many other openings — stay alert to pawn structure.',
  },
  {
    eco: 'A00', name: "Polish Opening",
    mainLine: ['b4'],
    whitePlan: 'Disrupt development with an early b4, fianchetto the queen bishop, play irregular positions.',
    blackPlan: 'Accept the pawn or ignore it — ...e5 or ...d5 seizes the center immediately.',
    watchOut: "White's early b4 concedes center space — punish it with active central pawns.",
  },
  {
    eco: 'C50', name: 'Italian Game',
    mainLine: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'],
    whitePlan: 'Develop bishops actively, castle quickly, build slow pressure via d3 and c3.',
    blackPlan: 'Play ...Bc5 and fight for the center with ...d6 or the sharp ...f5.',
    watchOut: "The Fried Liver Attack (Ng5-Nxf7) is a famous trap — don't play ...Nf6 without knowing the defense.",
  },
  {
    eco: 'C46', name: "Four Knights Game",
    mainLine: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6'],
    whitePlan: 'Control the center with all four knights, expand with d4, transition into a favorable middlegame.',
    blackPlan: 'Play the Spanish variation (...Bb4) for equality, or the Belgrade Gambit for complications.',
    watchOut: 'The Halloween Gambit (Nxe5) sacrifices a piece for wild compensation — know the refutation.',
  },
  {
    eco: 'B00', name: "Nimzowitsch Defense",
    mainLine: ['e4', 'Nc6'],
    whitePlan: 'Attack the knight with d4-d5, seize space, exploit Black\'s unusual setup.',
    blackPlan: 'Restrain e5, prepare ...d5 or ...e5 breaks after development.',
    watchOut: "Allowing ...d5 without challenge gives Black a strong center despite the irregular move order.",
  },
  {
    eco: 'A10', name: "English Symmetrical",
    mainLine: ['c4', 'c5'],
    whitePlan: 'Play Nf3, g3, Bg2 and build the Hedgehog setup or aim for d4.',
    blackPlan: 'Mirror the setup or break with ...b5 to unbalance immediately.',
    watchOut: "In the Hedgehog, Black's ...b5 break can be devastating if White isn't careful.",
  },
  {
    eco: 'B07', name: "Pirc Defense",
    mainLine: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6'],
    whitePlan: 'Attack with f4-f5, or the Austrian Attack (f4/e5), seize kingside space.',
    blackPlan: 'Fianchetto Bg7, counterattack in the center or queenside once White overextends.',
    watchOut: "White's kingside attack can be overwhelming — Black must counterattack quickly.",
  },
];

export function findOpeningEntry(openingName: string): OpeningExplorerEntry | null {
  if (!openingName) return null;
  const namePart = openingName.includes('·') ? openingName.split('·')[1]?.trim() : openingName.trim();
  if (!namePart) return null;
  const lower = namePart.toLowerCase();
  return OPENING_EXPLORER.find(e => e.name.toLowerCase() === lower)
    ?? OPENING_EXPLORER.find(e => lower.includes(e.name.toLowerCase()))
    ?? OPENING_EXPLORER.find(e => e.name.toLowerCase().includes(lower.split(' ')[0] ?? ''))
    ?? null;
}
