import { NextRequest, NextResponse } from "next/server";
import { getUserByName, getUserByEmail, createUser, addParticipant, isKvConfigured } from "@/lib/storage";
import { generateId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!isKvConfigured()) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const { name, email } = await req.json();
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const nameLower = name.trim().toLowerCase();
  const emailLower = email.trim().toLowerCase();

  const existingByName = await getUserByName(nameLower);
  if (existingByName) {
    if (existingByName.emailLower === emailLower) {
      return NextResponse.json({ id: existingByName.id, name: existingByName.name });
    }
    return NextResponse.json({ error: "Name already taken" }, { status: 409 });
  }

  const existingByEmail = await getUserByEmail(emailLower);
  if (existingByEmail) {
    return NextResponse.json({ error: "Email already registered under a different name" }, { status: 409 });
  }

  const id = generateId();
  const user = {
    id,
    name: name.trim(),
    nameLower,
    email: email.trim(),
    emailLower,
    createdAt: new Date().toISOString(),
  };

  await createUser(user);
  await addParticipant(id);

  return NextResponse.json({ id, name: user.name }, { status: 201 });
}
