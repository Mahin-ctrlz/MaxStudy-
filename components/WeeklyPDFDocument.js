import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica", fontSize: 9, color: "#1a1a1a" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottom: "2pt solid #B7D64B",
    paddingBottom: 8,
  },
  title: { fontSize: 16, fontWeight: 700 },
  date: { fontSize: 9, color: "#666666" },
  grid: { flexDirection: "row", gap: 6 },
  column: {
    flex: 1,
    border: "1pt solid #dddddd",
    borderRadius: 4,
    padding: 6,
  },
  dayLabel: { fontSize: 10, fontWeight: 700, marginBottom: 6 },
  taskRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  checkbox: {
    width: 7,
    height: 7,
    border: "1pt solid #999999",
    borderRadius: 1,
    marginRight: 4,
    marginTop: 1,
  },
  checkboxDone: {
    width: 7,
    height: 7,
    backgroundColor: "#B7D64B",
    borderRadius: 1,
    marginRight: 4,
    marginTop: 1,
  },
  taskText: { fontSize: 8, flex: 1 },
  taskTextDone: { fontSize: 8, flex: 1, color: "#999999", textDecoration: "line-through" },
  emptyText: { fontSize: 8, color: "#999999", fontStyle: "italic" },
});

export default function WeeklyPDFDocument({ plannerName = "Weekly Planner", tasks = [] }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{plannerName}</Text>
          <Text style={styles.date}>{today}</Text>
        </View>

        <View style={styles.grid}>
          {DAYS.map((label, i) => {
            const dayTasks = tasks.filter((t) => t.day_of_week === i);
            return (
              <View key={label} style={styles.column}>
                <Text style={styles.dayLabel}>{label}</Text>
                {dayTasks.length === 0 ? (
                  <Text style={styles.emptyText}>Nothing here.</Text>
                ) : (
                  dayTasks.map((t) => (
                    <View key={t.id} style={styles.taskRow}>
                      <View style={t.done ? styles.checkboxDone : styles.checkbox} />
                      <Text style={t.done ? styles.taskTextDone : styles.taskText}>{t.name}</Text>
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
}
