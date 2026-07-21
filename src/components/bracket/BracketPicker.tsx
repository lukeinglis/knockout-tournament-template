"use client";

import { useState, useCallback } from "react";
import { tournament } from "../../../tournament.config";
import type { KnockoutPick } from "@/lib/types";

interface BracketPickerProps {
  initialPicks: KnockoutPick[];
  onSave: (picks: KnockoutPick[]) => Promise<void>;
  saving: boolean;
  disabled?: boolean;
}

export default function BracketPicker({ initialPicks, onSave, saving, disabled }: BracketPickerProps) {
  const [picks, setPicks] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const pick of initialPicks) {
      map[`${pick.round}_${pick.matchNumber}`] = pick.winner;
    }
    return map;
  });

  const rounds = tournament.bracket.rounds;
  const firstRoundKey = rounds[0]?.key ?? "";

  const getMatchTeams = useCallback((round: string, matchNumber: number): [string | null, string | null] => {
    const matchKey = `${round}_${matchNumber}`;

    if (round === firstRoundKey) {
      const matchup = tournament.bracket.firstRoundMatchups.find((m) => m.matchNumber === matchNumber);
      return matchup ? [matchup.home, matchup.away] : [null, null];
    }

    const path = tournament.bracket.paths.find((p) => p.to === matchKey);
    if (!path) return [null, null];

    const home = picks[path.from[0]] ?? null;
    const away = picks[path.from[1]] ?? null;
    return [home, away];
  }, [picks, firstRoundKey]);

  function selectWinner(round: string, matchNumber: number, winner: string) {
    if (disabled) return;
    const key = `${round}_${matchNumber}`;
    const newPicks = { ...picks };

    const oldWinner = newPicks[key];
    newPicks[key] = winner;

    if (oldWinner && oldWinner !== winner) {
      clearDownstream(newPicks, key, oldWinner);
    }

    setPicks(newPicks);
  }

  function clearDownstream(p: Record<string, string>, changedKey: string, oldTeam: string) {
    for (const path of tournament.bracket.paths) {
      if (path.from.includes(changedKey)) {
        const destWinner = p[path.to];
        if (destWinner === oldTeam) {
          delete p[path.to];
          clearDownstream(p, path.to, oldTeam);
        }
      }
    }
  }

  function handleSave() {
    const knockoutPicks: KnockoutPick[] = Object.entries(picks).map(([key, winner]) => {
      const parts = key.split("_");
      const matchNumber = parseInt(parts[parts.length - 1], 10);
      const round = parts.slice(0, -1).join("_");
      return { round, matchNumber, winner };
    });
    onSave(knockoutPicks);
  }

  const totalMatches = rounds.reduce((sum, r) => sum + r.matches, 0);
  const pickedCount = Object.keys(picks).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">
          {pickedCount}/{totalMatches} matches picked
        </p>
        {!disabled && (
          <button
            onClick={handleSave}
            disabled={saving || pickedCount === 0}
            className="px-6 py-2 bg-gold/20 text-gold font-bold rounded-lg border border-gold/40 hover:bg-gold/30 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Submit Bracket"}
          </button>
        )}
      </div>

      <div className="space-y-6">
        {rounds.map((round) => (
          <div key={round.key}>
            <h3 className="font-bold text-sm text-gold mb-2">
              {round.label} ({round.points} pts each)
            </h3>
            <div className="grid gap-2">
              {Array.from({ length: round.matches }, (_, i) => {
                const matchNumber = i + 1;
                const matchKey = `${round.key}_${matchNumber}`;
                const [home, away] = getMatchTeams(round.key, matchNumber);
                const winner = picks[matchKey];

                const homeTeam = home ? tournament.teams.find((t) => t.code === home) : null;
                const awayTeam = away ? tournament.teams.find((t) => t.code === away) : null;

                return (
                  <div key={matchKey} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                    <div className="text-[10px] text-gray-600 mb-1">{matchKey}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => home && selectWinner(round.key, matchNumber, home)}
                        disabled={!home || disabled}
                        className={`flex-1 px-3 py-2.5 rounded text-sm font-medium transition-all ${
                          winner === home && home
                            ? "bg-gold/20 text-gold border border-gold/40"
                            : home
                            ? "hover:bg-white/5 text-gray-300 border border-transparent"
                            : "text-gray-700 border border-transparent cursor-default"
                        }`}
                      >
                        {homeTeam ? `${homeTeam.flag} ${homeTeam.name}` : home ?? "TBD"}
                      </button>
                      <span className="text-gray-600 self-center text-xs">vs</span>
                      <button
                        onClick={() => away && selectWinner(round.key, matchNumber, away)}
                        disabled={!away || disabled}
                        className={`flex-1 px-3 py-2.5 rounded text-sm font-medium transition-all ${
                          winner === away && away
                            ? "bg-gold/20 text-gold border border-gold/40"
                            : away
                            ? "hover:bg-white/5 text-gray-300 border border-transparent"
                            : "text-gray-700 border border-transparent cursor-default"
                        }`}
                      >
                        {awayTeam ? `${awayTeam.flag} ${awayTeam.name}` : away ?? "TBD"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
