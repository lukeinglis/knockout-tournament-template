import { NextResponse } from "next/server";
import { getAllUsersWithPicks, isKvConfigured } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isKvConfigured()) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const data = await getAllUsersWithPicks();

  const participants = data.map(({ user, picks }) => ({
    id: user.id,
    name: user.name,
    hasTier1: (picks?.groupPredictions?.length ?? 0) > 0,
    hasTier2: picks?.tier2Submitted ?? false,
  }));

  return NextResponse.json(participants);
}
