import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET /api/calendar
export async function GET(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const plannerId = searchParams.get("plannerId");

    let query = supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", user.id)
      .order("start_time", { ascending: true });

    if (plannerId) {
      query = query.eq("planner_id", plannerId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/calendar
export async function POST(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      planner_id,
      title,
      description,
      start_time,
      end_time,
      all_day,
      color,
    } = body;

    if (!title || !start_time) {
      return NextResponse.json(
        { error: "Title and start_time are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("calendar_events")
      .insert({
        planner_id,
        user_id: user.id,
        title,
        description,
        start_time,
        end_time,
        all_day: all_day ?? false,
        color: color ?? "#3b82f6",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}