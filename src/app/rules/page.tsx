import type { Metadata } from "next";
import { tournament } from "../../../tournament.config";
import { getTier1MaxPoints, getTier2MaxPoints, getOverallMaxPoints } from "@/lib/config";

export const metadata: Metadata = {
  title: `Rules | ${tournament.name}`,
};

export default function RulesPage() {
  const tier1Max = getTier1MaxPoints();
  const tier2Max = getTier2MaxPoints();
  const overallMax = getOverallMaxPoints();

  const tier1Bonuses = tournament.scoring.bonusPicks.filter((b) => b.tier === 1);
  const tier2Bonuses = tournament.scoring.bonusPicks.filter((b) => b.tier === 2);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Rules</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-bold text-accent mb-3">Overview</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            {tournament.name} is a two-tier prediction contest.
            Predict group standings before the tournament starts (Tier 1),
            then fill out the knockout bracket before the knockout stage begins (Tier 2).
            Maximum possible score: <strong>{overallMax} points</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-accent mb-3">
            Tier 1: Group Stage ({tier1Max} pts max)
          </h2>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-3 text-sm">
            <div>
              <h3 className="font-bold mb-1">Group Predictions ({tournament.groups.labels.length} groups of {tournament.groups.size})</h3>
              <ul className="list-disc list-inside text-gray-400 space-y-1">
                <li>Exact position: <strong className="text-accent">{tournament.scoring.groupExactPosition} pts</strong> per team</li>
                <li>Right bucket (advance/exit): <strong className="text-accent">{tournament.scoring.groupRightBucket} pt</strong> per team</li>
                <li>Max per group: {tournament.groups.size * tournament.scoring.groupExactPosition} pts</li>
              </ul>
            </div>
            {tier1Bonuses.length > 0 && (
              <div>
                <h3 className="font-bold mb-1">Bonus Picks</h3>
                <ul className="list-disc list-inside text-gray-400 space-y-1">
                  {tier1Bonuses.map((b) => (
                    <li key={b.key}>{b.icon} {b.label}: <strong className="text-accent">{b.points} pts</strong></li>
                  ))}
                </ul>
              </div>
            )}
            <div className="border-t border-white/5 pt-2">
              <p className="text-gray-400">
                Deadline: <strong className="text-white">{new Date(tournament.dates.tier1Deadline).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong>
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gold mb-3">
            Tier 2: Knockout Bracket ({tier2Max} pts max)
          </h2>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-3 text-sm">
            <div>
              <h3 className="font-bold mb-1">Bracket Predictions</h3>
              <ul className="list-disc list-inside text-gray-400 space-y-1">
                {tournament.bracket.rounds.map((r) => (
                  <li key={r.key}>
                    {r.label}: {r.matches} {r.matches === 1 ? "match" : "matches"} x <strong className="text-gold">{r.points} pts</strong> = {r.matches * r.points} pts
                  </li>
                ))}
              </ul>
            </div>
            {tier2Bonuses.length > 0 && (
              <div>
                <h3 className="font-bold mb-1">Bonus Picks</h3>
                <ul className="list-disc list-inside text-gray-400 space-y-1">
                  {tier2Bonuses.map((b) => (
                    <li key={b.key}>{b.icon} {b.label}: <strong className="text-gold">{b.points} pts</strong></li>
                  ))}
                </ul>
              </div>
            )}
            <div className="border-t border-white/5 pt-2">
              <p className="text-gray-400">
                Deadline: <strong className="text-white">{new Date(tournament.dates.tier2Deadline).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong>
              </p>
              <p className="text-xs text-gray-600 mt-1">Once submitted, knockout picks cannot be edited.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">Tiebreaker</h2>
          <p className="text-sm text-gray-400">
            {tournament.scoring.tiebreaker.label}: If participants are tied on total points,
            the one who correctly predicted the tournament winner ranks first, followed by
            whose final score prediction is closest to the actual result.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">Late Submissions</h2>
          <p className="text-sm text-gray-400">
            Knockout picks submitted after the deadline receive reduced scoring:
            matches already played earn 0 points, and teams involved in those matches
            earn {tournament.scoring.lateSubmissionPenalty.taintedTeam * 100}% points in future rounds.
          </p>
        </section>
      </div>
    </div>
  );
}
