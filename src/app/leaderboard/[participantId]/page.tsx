import { tournament } from "../../../../tournament.config";
import { getTeamByCode, getTier1MaxPoints, getTier2MaxPoints } from "@/lib/config";
import { calculatePoints } from "@/lib/scoring";
import { getUserById, getUserByName, getPicks, getResults, isKvConfigured } from "@/lib/storage";
import { buildParticipantsFromKv } from "@/lib/build-participants";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ParticipantDetailPage({ params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params;

  if (!isKvConfigured()) {
    return <div className="p-8 text-center text-gray-400">Storage not configured</div>;
  }

  const nameLower = await getUserById(participantId);
  if (!nameLower) {
    return <div className="p-8 text-center text-gray-400">Participant not found</div>;
  }

  const user = await getUserByName(nameLower);
  if (!user) {
    return <div className="p-8 text-center text-gray-400">User not found</div>;
  }

  const picks = await getPicks(participantId);
  const results = await getResults();

  const [participant] = buildParticipantsFromKv([{ user, picks }]);
  const points = calculatePoints(participant, results);
  const tier1Max = getTier1MaxPoints();
  const tier2Max = getTier2MaxPoints();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/leaderboard" className="text-sm text-gray-400 hover:text-white transition-colors mb-4 inline-block">
        &larr; Back to Leaderboard
      </Link>

      <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
      <p className="text-sm text-gray-400 mb-6">
        Total: <span className="text-white font-bold">{points.total}</span> pts
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 text-center">
          <p className="text-xs text-accent uppercase">Tier 1</p>
          <p className="text-2xl font-bold text-accent">{points.tier1Groups + points.tier1Bonus}</p>
          <p className="text-xs text-gray-500">/{tier1Max}</p>
        </div>
        <div className="rounded-lg border border-gold/20 bg-gold/5 p-4 text-center">
          <p className="text-xs text-gold uppercase">Tier 2</p>
          <p className="text-2xl font-bold text-gold">{points.tier2Bracket + points.tier2Bonus}</p>
          <p className="text-xs text-gray-500">/{tier2Max}</p>
        </div>
      </div>

      {participant.groupPredictions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-accent mb-3">Group Predictions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {participant.groupPredictions.map((gp) => {
              const actual = results?.groups?.[gp.group];
              return (
                <div key={gp.group} className="rounded border border-white/10 bg-white/[0.02] p-3">
                  <h3 className="font-bold text-xs text-gray-500 mb-1">Group {gp.group}</h3>
                  {gp.order.map((code, i) => {
                    const team = getTeamByCode(code);
                    const actualPos = actual?.indexOf(code) ?? -1;
                    const isExact = actualPos === i;
                    const isBucket = !isExact && actual && (i < tournament.groups.advanceCount) === (actualPos < tournament.groups.advanceCount) && actualPos !== -1;
                    return (
                      <div key={code} className={`text-xs py-0.5 ${isExact ? "text-green-400" : isBucket ? "text-yellow-400" : actual ? "text-gray-600" : "text-gray-400"}`}>
                        {i + 1}. {team?.flag} {team?.name ?? code}
                        {isExact && " +3"}
                        {isBucket && " +1"}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {participant.knockoutPicks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gold mb-3">Knockout Picks</h2>
          <div className="space-y-1">
            {participant.knockoutPicks.map((pick) => {
              const key = `${pick.round}_${pick.matchNumber}`;
              const actualWinner = results?.knockout?.[key];
              const isCorrect = actualWinner === pick.winner;
              const isWrong = actualWinner && actualWinner !== pick.winner;
              const team = getTeamByCode(pick.winner);
              const roundConfig = tournament.bracket.rounds.find((r) => r.key === pick.round);
              return (
                <div key={key} className={`text-sm px-3 py-2 rounded ${isCorrect ? "bg-accent/10 text-accent" : isWrong ? "bg-red-500/10 text-red-400 line-through" : "text-gray-400"}`}>
                  <span className="text-xs text-gray-600 mr-2">{roundConfig?.label ?? pick.round}</span>
                  {team?.flag} {team?.name ?? pick.winner}
                  {isCorrect && <span className="ml-2 text-green-500">+{roundConfig?.points}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold mb-3">Bonus Picks</h2>
        <div className="space-y-1">
          {tournament.scoring.bonusPicks.map((bonus) => {
            const pick = participant.bonusPicks[bonus.key];
            if (!pick) return null;
            const actual = results?.bonus?.[bonus.key];
            let displayPick = pick;
            if (bonus.type === "team") {
              const team = getTeamByCode(pick);
              if (team) displayPick = `${team.flag} ${team.name}`;
            }
            const isCorrect = actual && (bonus.type === "player"
              ? pick.toLowerCase().includes(actual.toLowerCase()) || actual.toLowerCase().includes(pick.toLowerCase())
              : actual.split(",").map(s => s.trim()).includes(pick));
            return (
              <div key={bonus.key} className={`text-sm px-3 py-2 rounded ${isCorrect ? "bg-accent/10 text-accent" : actual ? "bg-red-500/10 text-red-400 line-through" : "text-gray-400"}`}>
                {bonus.icon} {bonus.label}: {displayPick}
                {isCorrect && <span className="ml-2 text-green-500">+{bonus.points}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
