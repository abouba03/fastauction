// app/api/bids/route.ts

import { createClient } from "@/lib/supabase/server-client";
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { auctionId, amount } = body;

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const displayName = (clerkUser?.firstName || clerkUser?.lastName)
      ? `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim()
      : clerkUser?.username || clerkUser?.emailAddresses?.[0]?.emailAddress || "Utilisateur";
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@example.com`;

    // Créer l'utilisateur s'il n'existe pas
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (!existingUser) {
      await supabase.from("users").insert({
        id: userId,
        email,
        name: displayName,
      });
    }

    // Vérifier l'enchère actuelle
    const { data: auction, error: auctionError } = await supabase
      .from("auctions")
      .select(`
        *,
        bids(
          amount
        )
      `)
      .eq("id", auctionId)
      .single();

    if (auctionError || !auction) {
      return NextResponse.json(
        { error: "Enchère non trouvée" },
        { status: 404 }
      );
    }

    // Trouver l'offre maximale actuelle
    const bids = auction.bids as Array<{ amount: number }>;
    const currentMax = bids.length > 0
      ? Math.max(...bids.map((b) => b.amount))
      : auction.start_price;

    if (amount <= currentMax) {
      return NextResponse.json(
        { error: "L'offre doit être supérieure à l'offre actuelle" },
        { status: 400 }
      );
    }

    // Créer la nouvelle offre
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .insert({
        auction_id: auctionId,
        user_id: userId,
        amount,
      })
      .select()
      .single();

    if (bidError) throw bidError;

    // Mettre à jour l'offre actuelle dans l'enchère et gérer l'extension de dernière seconde
    const now = new Date();
    const endTime = new Date(auction.end_time);
    const remainingMs = endTime.getTime() - now.getTime();

    // Si l'enchère est active et qu'il reste <= 10 secondes, étendre à 10 secondes
    const shouldExtend = auction.status === "active" && remainingMs <= 10_000 && remainingMs > 0;

    const newValues: Record<string, unknown> = { current_bid: amount };
    if (shouldExtend) {
      const extendedEnd = new Date(now.getTime() + 10_000).toISOString();
      newValues.end_time = extendedEnd;
    }

    const { error: updateError } = await supabase
      .from("auctions")
      .update(newValues)
      .eq("id", auctionId);

    if (updateError) throw updateError;

    return NextResponse.json(bid, { status: 201 });
  } catch (error: unknown) {
    console.error("Erreur lors de la création de l'offre:", error);

    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const auctionId = req.nextUrl.searchParams.get("auctionId");

    if (!auctionId) {
      return NextResponse.json(
        { error: "auctionId requis" },
        { status: 400 }
      );
    }

    const { data: bids, error } = await supabase
      .from("bids")
      .select(`
        *,
        user:users(*)
      `)
      .eq("auction_id", auctionId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(bids);
  } catch (error) {
    console.error("Erreur lors de la récupération des offres:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}