import type { Metadata } from "next";
import { tournament } from "../../../tournament.config";
import { getTier1MaxPoints, getTier2MaxPoints, getOverallMaxPoints, getTeamByCode } from "@/lib/config";
import { calculateAllPoints, calculatePotentialPoints, fuzzyPlayerMatch } from "@/lib/scoring";
import { getAllUsersWithPicks, getResults, isKvConfigured } from "@/lib/storage";
import { buildParticipantsFromKv } from "@/lib/build-participants";
import SortableTable from "@/components/leaderboard/SortableTable";

export const metadata: Metadata = {
  title: `Leaderboard | ${tournament.name}`,
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const tier1Max = getTier1MaxPoints();
  const tier2Max = getTier2MaxPoints();
  const overallMax = getOverallMaxPoints();

  let participants: import("@/lib/types").Participant[] = [];
  if (isKvConfigured()) {
    const kvData = await getAllUsersWithPicks();
    participants = buildParticipantsFromKv(kvData);
  }

  const results = isKvConfigured() ? await getResults() : null;

  const withPoints = calculateAllPoints(participants, results);

  const sorted = [...withPoints].sort((a, b) => {
    const totalDiff = b.calculatedPoints.total - a.calculatedPoints.total;
    if (totalDiff !== 0) return totalDiff;
    const tier1Diff =
      (b.calculatedPoints.tier1Groups + b.calculatedPoints.tier1Bonus) -
      (a.calculatedPoints.tier1Groups + a.calculatedPoints.tier1Bonus);
    if (tier1Diff !== 0) return tier1Diff;
    return a.name.localeCompare(b.name);
  });

  const ranked = sorted.map((p) => {
    const potential = calculatePotentialPoints(p, results);

    const bonusPicksDisplay = tournament.scoring.bonusPicks.map((bonusConfig) => {
      const pick = p.bonusPicks[bonusConfig.key] ?? "";
      const actual = results?.bonus?.[bonusConfig.key];
      let status: "earned" | "possible" | "lost" = "possible";
      if (actual) {
        if (bonusConfig.type === "player") {
          status = fuzzyPlayerMatch(pick, actual) ? "earned" : "lost";
        } else {
          const actuals = actual.split(",").map((s) => s.trim());
          status = actuals.includes(pick) ? "earned" : "lost";
        }
      }

      let displayPick = pick;
      if (bonusConfig.type === "team" && pick) {
        const team = getTeamByCode(pick);
        if (team) displayPick = `${team.flag} ${team.name}`;
      }

      return { key: bonusConfig.key, icon: bonusConfig.icon, label: bonusConfig.label, pick: displayPick, points: bonusConfig.points, status };
    });

    const finalRound = tournament.bracket.rounds.find((r) => r.key === "final");
    const finalPick = p.knockoutPicks.find((k) => k.round === "final" && k.matchNumber === 1);
    if (finalPick) {
      const finalResult = results?.knockout?.["final_1"];
      const team = getTeamByCode(finalPick.winner);
      bonusPicksDisplay.unshift({
        key: "_final",
        icon: "🏆",
        label: "Winner",
        pick: team ? `${team.flag} ${team.name}` : finalPick.winner,
        points: finalRound?.points ?? 10,
        status: finalResult ? (finalPick.winner === finalResult ? "earned" : "lost") : "possible",
      });
    }

    return {
      id: p.id,
      name: p.name,
      tier1Total: p.calculatedPoints.tier1Groups + p.calculatedPoints.tier1Bonus,
      tier2Total: p.calculatedPoints.tier2Bracket + p.calculatedPoints.tier2Bonus,
      total: p.calculatedPoints.total,
      maxPossible: potential.maximum,
      tiebreaker: p.tiebreaker,
      bonusPicks: bonusPicksDisplay,
    };
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <span className="text-xs text-gray-500">
          {participants.length} participants &middot; {overallMax} pts max
        </span>
      </div>

      {participants.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-5 py-12 text-center">
          <p className="text-gray-400 text-sm">No participants yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
          <SortableTable
            participants={ranked}
            tier1Max={tier1Max}
            tier2Max={tier2Max}
          />
        </div>
      )}
    </div>
  );
}
