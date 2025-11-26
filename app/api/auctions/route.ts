// app/api/auctions/route.ts

import { createClient } from "@/lib/supabase/server-client";
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const mine = req.nextUrl.searchParams.get("mine");
    const { userId } = await auth();
    
    let query = supabase
      .from("auctions")
      .select(`
        *,
        user:users(*),
        bids(
          *,
          user:users(*)
        )
      `)
      .order("created_at", { ascending: false });

    if (mine && mine !== "0") {
      if (!userId) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }
      query = query.eq("user_id", userId);
    }

    const { data: auctions, error } = await query;

    if (error) throw error;

    return NextResponse.json(auctions);
  } catch (error) {
    console.error("Erreur lors de la récupération des enchères:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { title, description, startPrice, endTime } = body;

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

    // Créer l'enchère
    const { data: auction, error } = await supabase
      .from("auctions")
      .insert({
        title,
        description,
        start_price: startPrice,
        current_bid: startPrice,
        start_time: new Date().toISOString(),
        end_time: new Date(endTime).toISOString(),
        user_id: userId,
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(auction, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'enchère:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}