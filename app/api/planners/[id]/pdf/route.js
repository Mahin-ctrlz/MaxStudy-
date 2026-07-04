import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import PlannerPDFDocument from "@/components/PlannerPDFDocument";
import WeeklyPDFDocument from "@/components/WeeklyPDFDocument";
import MinimalPDFDocument from "@/components/MinimalPDFDocument";

const PDF_CAPABLE_TEMPLATES = new Set(["dashboard", "weekly", "minimal"]);

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

  if (!PDF_CAPABLE_TEMPLATES.has(planner.template_id)) {
    // Minimal and the illustrated sheet templates don't have a PDF layout
    // built yet — the route returns a clear error rather than silently
    // exporting a blank or wrong-looking page.
    return NextResponse.json(
      { error: "PDF export isn't available for this template yet." },
      { status: 400 }
    );
  }

  let doc;

  if (planner.template_id === "weekly") {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("planner_id", plannerId)
      .eq("kind", "weekly");

    doc = React.createElement(WeeklyPDFDocument, {
      plannerName: planner.name,
      tasks: tasks || [],
    });
  } else if (planner.template_id === "minimal") {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("planner_id", plannerId)
      .eq("kind", "minimal")
      .order("sort_order");

    doc = React.createElement(MinimalPDFDocument, {
      plannerName: planner.name,
      tasks: tasks || [],
    });
  } else {
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

    doc = React.createElement(PlannerPDFDocument, {
      plannerName: planner.name,
      priorityTasks: priorityTasks.data || [],
      dueNextTasks: dueNextTasks.data || [],
      meetings: meetings.data || [],
      notes: notes.data || [],
      daily: dailyRows.data || {},
    });
  }

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
