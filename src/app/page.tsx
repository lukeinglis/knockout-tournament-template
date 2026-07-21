import { tournament } from "../../tournament.config";
import { getTier1MaxPoints, getTier2MaxPoints, getOverallMaxPoints } from "@/lib/config";
import { getResults, isKvConfigured } from "@/lib/storage";
import BracketDisplay from "@/components/bracket/BracketDisplay";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tier1Max = getTier1MaxPoints();
  const tier2Max = getTier2MaxPoints();
  const overallMax = getOverallMaxPoints();

  const results = isKvConfigured() ? await getResults() : null;
  const hasKnockoutResults = results?.knockout && Object.keys(results.knockout).length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">{tournament.name}</h1>
        <p className="text-gray-400">{tournament.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-6 text-center">
          <p className="text-xs uppercase tracking-wider text-accent mb-1">Tier 1: Groups</p>
          <p className="text-3xl font-bold text-accent">{tier1Max}</p>
          <p className="text-xs text-gray-500 mt-1">max points</p>
        </div>
        <div className="rounded-lg border border-gold/20 bg-gold/5 p-6 text-center">
          <p className="text-xs uppercase tracking-wider text-gold mb-1">Tier 2: Knockout</p>
          <p className="text-3xl font-bold text-gold">{tier2Max}</p>
          <p className="text-xs text-gray-500 mt-1">max points</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center">
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Overall Max</p>
          <p className="text-3xl font-bold text-white">{overallMax}</p>
          <p className="text-xs text-gray-500 mt-1">total points</p>
        </div>
      </div>

      {hasKnockoutResults && (
        <div className="rounded-lg border border-gold/20 bg-gold/5 p-6 mb-8">
          <h2 className="font-bold text-lg mb-4 text-gold">Knockout Bracket</h2>
          <BracketDisplay results={results} />
        </div>
      )}

      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
        <h2 className="font-bold text-lg mb-4">Tournament Setup</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <dt className="text-gray-400">Teams</dt>
          <dd>{tournament.teams.length}</dd>
          <dt className="text-gray-400">Groups</dt>
          <dd>{tournament.groups.labels.length} groups of {tournament.groups.size}</dd>
          <dt className="text-gray-400">Knockout Rounds</dt>
          <dd>{tournament.bracket.rounds.map((r) => r.label).join(", ")}</dd>
          <dt className="text-gray-400">Bonus Picks</dt>
          <dd>{tournament.scoring.bonusPicks.map((b) => b.label).join(", ")}</dd>
          <dt className="text-gray-400">Picks Deadline (Tier 1)</dt>
          <dd>{new Date(tournament.dates.tier1Deadline).toLocaleDateString()}</dd>
          {tournament.dates.tier2Opens && (
            <>
              <dt className="text-gray-400">Picks Deadline (Tier 2)</dt>
              <dd>{new Date(tournament.dates.tier2Deadline).toLocaleDateString()}</dd>
            </>
          )}
        </dl>
      </div>

      <div className="mt-8 text-center">
        <a
          href="/join"
          className="inline-block px-6 py-3 bg-pitch text-white font-bold rounded-lg hover:bg-pitch/80 transition-colors"
        >
          Join the Contest
        </a>
      </div>
    </div>
  );
}
