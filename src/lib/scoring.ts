import { tournament, getKnockoutRoundPoints, getAllBracketMatches } from "./config";
import type { Participant, Points, TournamentResults, GroupPrediction } from "./types";

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function fuzzyPlayerMatch(pick: string, actual: string): boolean {
  if (!pick || !actual) return false;
  const a = normalizeName(pick);
  const b = normalizeName(actual);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const aLast = a.split(" ").pop() ?? "";
  const bLast = b.split(" ").pop() ?? "";
  if (aLast.length >= 3 && aLast === bLast) return true;
  return false;
}

export function getEliminatedTeams(knockoutResults: Record<string, string>): Set<string> {
  const eliminated = new Set<string>();
  const allMatches = getAllBracketMatches();
  const firstRound = tournament.bracket.rounds[0]?.key ?? "";

  for (const [key, winner] of Object.entries(knockoutResults)) {
    if (key.startsWith(`${firstRound}_`)) {
      const num = parseInt(key.replace(`${firstRound}_`, ""), 10);
      const matchup = tournament.bracket.firstRoundMatchups.find((m) => m.matchNumber === num);
      if (matchup) {
        const homeTeam = knockoutResults[key] === matchup.home ? null : matchup.home;
        const awayTeam = knockoutResults[key] === matchup.away ? null : matchup.away;
        if (homeTeam && homeTeam !== winner) eliminated.add(homeTeam);
        if (awayTeam && awayTeam !== winner) eliminated.add(awayTeam);
      }
    } else {
      const match = allMatches.find((m) => m.key === key);
      if (match?.feeders) {
        for (const feederKey of match.feeders) {
          const feederWinner = knockoutResults[feederKey];
          if (feederWinner && feederWinner !== winner) {
            eliminated.add(feederWinner);
          }
        }
      }
    }
  }

  return eliminated;
}

export function scoreGroupPrediction(
  prediction: GroupPrediction,
  actual: string[]
): number {
  let points = 0;
  const { groupExactPosition, groupRightBucket } = tournament.scoring;
  const advanceCount = tournament.groups.advanceCount;

  for (let i = 0; i < prediction.order.length; i++) {
    const predicted = prediction.order[i];
    const actualPosition = actual.indexOf(predicted);
    if (actualPosition === -1) continue;

    if (actualPosition === i) {
      points += groupExactPosition;
    } else {
      const predictedAdvances = i < advanceCount;
      const actualAdvances = actualPosition < advanceCount;
      if (predictedAdvances === actualAdvances) {
        points += groupRightBucket;
      }
    }
  }
  return points;
}

export function scoreTier1Groups(
  participant: Participant,
  results: TournamentResults | null
): number {
  if (!results?.groups) return 0;
  let total = 0;
  for (const gp of participant.groupPredictions) {
    const actual = results.groups[gp.group];
    if (actual) {
      total += scoreGroupPrediction(gp, actual);
    }
  }
  return total;
}

export function scoreTier1Bonus(
  participant: Participant,
  results: TournamentResults | null
): number {
  if (!results?.bonus) return 0;
  let points = 0;

  for (const bonusConfig of tournament.scoring.bonusPicks) {
    if (bonusConfig.tier !== 1) continue;
    const pick = participant.bonusPicks[bonusConfig.key];
    const actual = results.bonus[bonusConfig.key];
    if (!pick || !actual) continue;

    if (bonusConfig.type === "player") {
      if (fuzzyPlayerMatch(pick, actual)) points += bonusConfig.points;
    } else {
      const actuals = actual.split(",").map((s) => s.trim());
      if (actuals.includes(pick)) points += bonusConfig.points;
    }
  }
  return points;
}

export function scoreTier2Bracket(
  participant: Participant,
  results: TournamentResults | null
): number {
  if (!results?.knockout) return 0;
  const roundPoints = getKnockoutRoundPoints();

  const taintedTeams = new Set<string>();
  const missedMatches = new Set<string>();
  const deadline = new Date(tournament.dates.tier2Deadline);
  const submittedAt = participant.tier2SubmittedAt
    ? new Date(participant.tier2SubmittedAt)
    : null;
  const isLate = submittedAt && submittedAt > deadline;

  if (isLate) {
    const firstRound = tournament.bracket.rounds[0]?.key ?? "";
    for (const matchup of tournament.bracket.firstRoundMatchups) {
      const key = `${firstRound}_${matchup.matchNumber}`;
      if (results.knockout[key]) {
        missedMatches.add(key);
        taintedTeams.add(matchup.home);
        taintedTeams.add(matchup.away);
      }
    }
  }

  let points = 0;
  for (const pick of participant.knockoutPicks) {
    const key = `${pick.round}_${pick.matchNumber}`;
    const actualWinner = results.knockout[key];
    if (!actualWinner || pick.winner !== actualWinner) continue;

    const pts = roundPoints[pick.round] ?? 0;
    if (missedMatches.has(key)) {
      continue;
    } else if (taintedTeams.has(pick.winner)) {
      points += Math.floor(pts * tournament.scoring.lateSubmissionPenalty.taintedTeam);
    } else {
      points += pts;
    }
  }
  return points;
}

export function scoreTier2Bonus(
  participant: Participant,
  results: TournamentResults | null
): number {
  if (!results?.bonus) return 0;
  let points = 0;

  for (const bonusConfig of tournament.scoring.bonusPicks) {
    if (bonusConfig.tier !== 2) continue;
    const pick = participant.bonusPicks[bonusConfig.key];
    const actual = results.bonus[bonusConfig.key];
    if (!pick || !actual) continue;

    if (bonusConfig.type === "player") {
      if (fuzzyPlayerMatch(pick, actual)) points += bonusConfig.points;
    } else {
      const actuals = actual.split(",").map((s) => s.trim());
      if (actuals.includes(pick)) points += bonusConfig.points;
    }
  }
  return points;
}

export function calculatePoints(
  participant: Participant,
  results: TournamentResults | null
): Points {
  const tier1Groups = scoreTier1Groups(participant, results);
  const tier1Bonus = scoreTier1Bonus(participant, results);
  const tier2Bracket = scoreTier2Bracket(participant, results);
  const tier2Bonus = scoreTier2Bonus(participant, results);
  const total = tier1Groups + tier1Bonus + tier2Bracket + tier2Bonus;
  return { tier1Groups, tier1Bonus, tier2Bracket, tier2Bonus, total };
}

export function calculateAllPoints(
  participants: Participant[],
  results: TournamentResults | null
): (Participant & { calculatedPoints: Points })[] {
  return participants.map((p) => ({
    ...p,
    calculatedPoints: calculatePoints(p, results),
  }));
}

export interface PotentialPoints {
  earned: number;
  remaining: number;
  maximum: number;
}

export function calculatePotentialPoints(
  participant: Participant,
  results: TournamentResults | null
): PotentialPoints {
  const earned = calculatePoints(participant, results);
  let remaining = 0;
  const { groupExactPosition } = tournament.scoring;

  for (const gp of participant.groupPredictions) {
    if (!results?.groups?.[gp.group]) {
      remaining += tournament.groups.size * groupExactPosition;
    }
  }

  const eliminatedTeams = results?.knockout
    ? getEliminatedTeams(results.knockout)
    : new Set<string>();
  const roundPoints = getKnockoutRoundPoints();

  for (const pick of participant.knockoutPicks) {
    const key = `${pick.round}_${pick.matchNumber}`;
    const actualWinner = results?.knockout?.[key];
    if (!actualWinner && !eliminatedTeams.has(pick.winner)) {
      remaining += roundPoints[pick.round] ?? 0;
    }
  }

  for (const bonusConfig of tournament.scoring.bonusPicks) {
    const pick = participant.bonusPicks[bonusConfig.key];
    const actual = results?.bonus?.[bonusConfig.key];
    if (!actual && pick) {
      remaining += bonusConfig.points;
    }
  }

  return {
    earned: earned.total,
    remaining,
    maximum: earned.total + remaining,
  };
}
