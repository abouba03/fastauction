// app/api/auctions/[id]/route.ts

import { createClient } from "@/lib/supabase/server-client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const supabase = await createClient();
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await (ctx.params as Promise<{ id: string }>);
    const body = await req.json();
    const { title, description, endTime, status } = body as {
      title?: string;
      description?: string;
      endTime?: string;
      status?: string;
    };

    // Vérifier propriété
    const { data: auction, error: readErr } = await supabase
      .from("auctions")
      .select("id, user_id")
      .eq("id", id)
      .single();
    if (readErr || !auction) return NextResponse.json({ error: "Enchère introuvable" }, { status: 404 });
    if (auction.user_id !== userId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const updates: Record<string, unknown> = {};
    if (typeof title === "string") updates.title = title;
    if (typeof description === "string") updates.description = description;
    if (typeof endTime === "string") updates.end_time = new Date(endTime).toISOString();
    if (typeof status === "string") updates.status = status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
    }

    const { data: updated, error: updErr } = await supabase
      .from("auctions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (updErr) throw updErr;

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH auction:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const supabase = await createClient();
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await (ctx.params as Promise<{ id: string }>);

    // Vérifier propriété
    const { data: auction, error: readErr } = await supabase
      .from("auctions")
      .select("id, user_id")
      .eq("id", id)
      .single();
    if (readErr || !auction) return NextResponse.json({ error: "Enchère introuvable" }, { status: 404 });
    if (auction.user_id !== userId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    // Supprimer d'abord les offres si pas de cascade
    await supabase.from("bids").delete().eq("auction_id", id);

    const { error: delErr } = await supabase.from("auctions").delete().eq("id", id);
    if (delErr) throw delErr;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erreur DELETE auction:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
