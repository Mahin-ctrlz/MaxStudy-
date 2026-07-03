import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

// Deliberately a LIGHT theme, not the app's dark UI. The on-screen dashboard
// is #101010 background with light text — printing that as-is would mean a
// nearly solid black page, which wastes ink/toner and is a bad experience
// for something meant to be printed and written on. This keeps the same
// accent purple/green from the design system, used sparingly as small tags
// rather than large fills, so it still feels like the same product.
const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottom: "2pt solid #B18BFF",
    paddingBottom: 10,
  },
  title: { fontSize: 18, fontWeight: 700 },
  date: { fontSize: 10, color: "#666666" },
  row: { flexDirection: "row", gap: 16, marginBottom: 16 },
  column: { flex: 1 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#444444",
  },
  card: {
    border: "1pt solid #dddddd",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  taskRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  checkbox: {
    width: 9,
    height: 9,
    border: "1pt solid #999999",
    borderRadius: 2,
    marginRight: 6,
  },
  checkboxDone: {
    width: 9,
    height: 9,
    backgroundColor: "#B18BFF",
    borderRadius: 2,
    marginRight: 6,
  },
  taskText: { fontSize: 10 },
  taskTextDone: { fontSize: 10, color: "#999999", textDecoration: "line-through" },
  meetingRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  goalBox: {
    backgroundColor: "#faf8ff",
    border: "1pt solid #B18BFF",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  goalText: { fontSize: 11, fontStyle: "italic" },
  note: { fontSize: 10, marginBottom: 5 },
  emptyText: { fontSize: 9, color: "#999999", fontStyle: "italic" },
});

function TaskList({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return <Text style={styles.emptyText}>Nothing here.</Text>;
  }
  return (
    <>
      {tasks.map((t) => (
        <View key={t.id} style={styles.taskRow}>
          <View style={t.done ? styles.checkboxDone : styles.checkbox} />
          <Text style={t.done ? styles.taskTextDone : styles.taskText}>{t.name}</Text>
        </View>
      ))}
    </>
  );
}

export default function PlannerPDFDocument({
  plannerName = "Study Planner",
  priorityTasks = [],
  dueNextTasks = [],
  meetings = [],
  notes = [],
  daily = {},
}) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{plannerName}</Text>
          <Text style={styles.date}>{today}</Text>
        </View>

        {daily?.goal_text ? (
          <View style={styles.goalBox}>
            <Text style={styles.goalText}>{daily.goal_text}</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Priorities</Text>
            <View style={styles.card}>
              <TaskList tasks={priorityTasks} />
            </View>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Due Next</Text>
            <View style={styles.card}>
              <TaskList tasks={dueNextTasks} />
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Meetings</Text>
        <View style={styles.card}>
          {meetings.length === 0 ? (
            <Text style={styles.emptyText}>No meetings scheduled.</Text>
          ) : (
            meetings.map((m) => (
              <View key={m.id} style={styles.meetingRow}>
                <Text style={{ fontSize: 10, color: m.cancelled ? "#999999" : "#1a1a1a" }}>
                  {m.time}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: m.cancelled ? "#999999" : "#1a1a1a",
                    textDecoration: m.cancelled ? "line-through" : "none",
                  }}
                >
                  {m.name}
                </Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Notes</Text>
        <View style={styles.card}>
          {notes.length === 0 ? (
            <Text style={styles.emptyText}>No notes.</Text>
          ) : (
            notes.map((n) => (
              <Text key={n.id} style={styles.note}>
                • {n.content}
              </Text>
            ))
          )}
        </View>
      </Page>
    </Document>
  );
}
