"use client";

import { tournament } from "../../../tournament.config";
import type { TournamentResults } from "@/lib/types";

interface BracketDisplayProps {
  results: TournamentResults | null;
  compact?: boolean;
}

export default function BracketDisplay({ results, compact }: BracketDisplayProps) {
  const rounds = tournament.bracket.rounds;
  const firstRoundKey = rounds[0]?.key ?? "";

  function getMatchTeams(round: string, matchNumber: number): [string | null, string | null] {
    const matchKey = `${round}_${matchNumber}`;

    if (round === firstRoundKey) {
      const matchup = tournament.bracket.firstRoundMatchups.find((m) => m.matchNumber === matchNumber);
      return matchup ? [matchup.home, matchup.away] : [null, null];
    }

    const path = tournament.bracket.paths.find((p) => p.to === matchKey);
    if (!path) return [null, null];

    const home = results?.knockout?.[path.from[0]] ?? null;
    const away = results?.knockout?.[path.from[1]] ?? null;
    return [home, away];
  }

  const eliminatedTeams = new Set<string>();
  if (results?.knockout) {
    for (const [, winner] of Object.entries(results.knockout)) {
      for (const round of rounds) {
        for (let i = 1; i <= round.matches; i++) {
          const [home, away] = getMatchTeams(round.key, i);
          const key = `${round.key}_${i}`;
          const matchWinner = results.knockout[key];
          if (matchWinner) {
            if (home && home !== matchWinner) eliminatedTeams.add(home);
            if (away && away !== matchWinner) eliminatedTeams.add(away);
          }
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      {rounds.map((round) => (
        <div key={round.key}>
          <h3 className={`font-bold mb-2 ${compact ? "text-xs text-gray-500" : "text-sm text-gold"}`}>
            {round.label}
          </h3>
          <div className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
            {Array.from({ length: round.matches }, (_, i) => {
              const matchNumber = i + 1;
              const matchKey = `${round.key}_${matchNumber}`;
              const [home, away] = getMatchTeams(round.key, matchNumber);
              const winner = results?.knockout?.[matchKey];

              const homeTeam = home ? tournament.teams.find((t) => t.code === home) : null;
              const awayTeam = away ? tournament.teams.find((t) => t.code === away) : null;

              return (
                <div key={matchKey} className="rounded border border-white/10 bg-white/[0.02] p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`flex-1 ${winner === home ? "text-accent font-bold" : eliminatedTeams.has(home ?? "") ? "text-red-400/50 line-through" : "text-gray-300"}`}>
                      {homeTeam ? `${homeTeam.flag} ${homeTeam.name}` : home ?? "TBD"}
                    </span>
                    <span className="text-gray-700 text-xs">vs</span>
                    <span className={`flex-1 text-right ${winner === away ? "text-accent font-bold" : eliminatedTeams.has(away ?? "") ? "text-red-400/50 line-through" : "text-gray-300"}`}>
                      {awayTeam ? `${awayTeam.flag} ${awayTeam.name}` : away ?? "TBD"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
