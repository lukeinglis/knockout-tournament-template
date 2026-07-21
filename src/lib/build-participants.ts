import type { UserRecord, PicksRecord, Participant } from "./types";

export function buildParticipantsFromKv(
  data: { user: UserRecord; picks: PicksRecord | null }[]
): Participant[] {
  return data.map(({ user, picks }) => ({
    id: user.id,
    name: user.name,
    groupPredictions: picks?.groupPredictions ?? [],
    bonusPicks: picks?.bonusPicks ?? {},
    knockoutPicks: picks?.knockoutPicks ?? [],
    tier2SubmittedAt: picks?.tier2SubmittedAt,
    tiebreaker: picks?.tiebreaker ?? { homeScore: 0, awayScore: 0 },
    points: { tier1Groups: 0, tier1Bonus: 0, tier2Bracket: 0, tier2Bonus: 0, total: 0 },
  }));
}
