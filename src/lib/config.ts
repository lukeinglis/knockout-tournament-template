import { tournament } from "../../tournament.config";
import type { TournamentPhase, TeamConfig } from "./types";

export { tournament };

export function getTeamByCode(code: string): TeamConfig | undefined {
  return tournament.teams.find((t) => t.code === code);
}

export function getTeamsByGroup(): Record<string, TeamConfig[]> {
  const groups: Record<string, TeamConfig[]> = {};
  for (const team of tournament.teams) {
    if (!groups[team.group]) groups[team.group] = [];
    groups[team.group].push(team);
  }
  return groups;
}

export function getKnockoutRoundPoints(): Record<string, number> {
  const pts: Record<string, number> = {};
  for (const round of tournament.bracket.rounds) {
    pts[round.key] = round.points;
  }
  return pts;
}

export function getKnockoutRoundMatchCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const round of tournament.bracket.rounds) {
    counts[round.key] = round.matches;
  }
  return counts;
}

export function getTier1MaxPoints(): number {
  const groupMax =
    tournament.groups.labels.length *
    tournament.groups.size *
    tournament.scoring.groupExactPosition;
  const bonusMax = tournament.scoring.bonusPicks
    .filter((b) => b.tier === 1)
    .reduce((sum, b) => sum + b.points, 0);
  return groupMax + bonusMax;
}

export function getTier2MaxPoints(): number {
  const bracketMax = tournament.bracket.rounds.reduce(
    (sum, r) => sum + r.matches * r.points,
    0
  );
  const bonusMax = tournament.scoring.bonusPicks
    .filter((b) => b.tier === 2)
    .reduce((sum, b) => sum + b.points, 0);
  return bracketMax + bonusMax;
}

export function getOverallMaxPoints(): number {
  return getTier1MaxPoints() + getTier2MaxPoints();
}

export function getCurrentPhase(): TournamentPhase {
  const now = new Date();
  const dates = tournament.dates;

  if (now >= new Date(dates.tournamentEnd)) return "complete";
  if (dates.tier2Opens && now >= new Date(dates.tier2Opens)) return "knockout";
  if (now >= new Date(dates.tier1Deadline)) return "group_stage";
  return "pre_tournament";
}

export function areTier1PicksRevealed(): boolean {
  return new Date() >= new Date(tournament.dates.tier1Reveal);
}

export function isTier1PicksOpen(): boolean {
  const now = new Date();
  const opens = tournament.dates.tier1Opens;
  if (opens && now < new Date(opens)) return false;
  return now < new Date(tournament.dates.tier1Deadline);
}

export function isTier2PicksOpen(): boolean {
  const now = new Date();
  const opens = tournament.dates.tier2Opens;
  if (!opens) return false;
  return now >= new Date(opens) && now < new Date(tournament.dates.tier2Deadline);
}

export function isTournamentComplete(): boolean {
  return getCurrentPhase() === "complete";
}

export function isAdmin(email: string): boolean {
  return tournament.admins.some(
    (a) => a.toLowerCase() === email.toLowerCase()
  );
}

export function getFirstKnockoutRound(): string {
  return tournament.bracket.rounds[0]?.key ?? "";
}

export function getBracketFeeders(matchKey: string): [string, string] | null {
  const path = tournament.bracket.paths.find((p) => p.to === matchKey);
  return path ? path.from : null;
}

export function getAllBracketMatches(): { key: string; round: string; matchNumber: number; feeders: [string, string] | null }[] {
  const matches: { key: string; round: string; matchNumber: number; feeders: [string, string] | null }[] = [];

  const firstRound = getFirstKnockoutRound();
  for (const matchup of tournament.bracket.firstRoundMatchups) {
    const key = `${firstRound}_${matchup.matchNumber}`;
    matches.push({ key, round: firstRound, matchNumber: matchup.matchNumber, feeders: null });
  }

  for (const path of tournament.bracket.paths) {
    const parts = path.to.split("_");
    const matchNumber = parseInt(parts[parts.length - 1], 10);
    const round = parts.slice(0, -1).join("_");
    matches.push({ key: path.to, round, matchNumber, feeders: path.from });
  }

  return matches;
}
