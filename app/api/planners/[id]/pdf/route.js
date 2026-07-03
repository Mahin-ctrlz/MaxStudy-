import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import PlannerPDFDocument from "@/components/PlannerPDFDocument";

export async function GET(request, { params }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: plannerId } = await params;

  const { data: planner, error: plannerError } = await supabase
    .from("planners")
    .select("*")
    .eq("id", plannerId)
    .eq("user_id", user.id)
    .single();

  if (plannerError || !planner) {
    return NextResponse.json({ error: "Planner not found" }, { status: 404 });
  }

  if (planner.template_id !== "dashboard") {
    // Only the Dashboard template has a PDF layout built right now — the
    // route returns a clear error rather than silently exporting a blank
    // or wrong-looking page for Weekly/Minimal planners.
    return NextResponse.json(
      { error: "PDF export isn't available for this template yet." },
      { status: 400 }
    );
  }

  const [priorityTasks, dueNextTasks, meetings, notes, dailyRows] = await Promise.all([
    supabase.from("tasks").select("*").eq("planner_id", plannerId).eq("kind", "priority").order("sort_order"),
    supabase.from("tasks").select("*").eq("planner_id", plannerId).eq("kind", "due_next").order("sort_order"),
    supabase.from("meetings").select("*").eq("planner_id", plannerId).order("sort_order"),
    supabase.from("notes").select("*").eq("planner_id", plannerId).order("sort_order"),
    supabase
      .from("daily_state")
      .select("*")
      .eq("planner_id", plannerId)
      .eq("date", new Date().toISOString().slice(0, 10))
      .maybeSingle(),
  ]);

  const doc = React.createElement(PlannerPDFDocument, {
    plannerName: planner.name,
    priorityTasks: priorityTasks.data || [],
    dueNextTasks: dueNextTasks.data || [],
    meetings: meetings.data || [],
    notes: notes.data || [],
    daily: dailyRows.data || {},
  });

  const stream = await pdf(doc).toBuffer();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);

  const filename = `${planner.name.replace(/[^a-z0-9]/gi, "_") || "study-planner"}.pdf`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
