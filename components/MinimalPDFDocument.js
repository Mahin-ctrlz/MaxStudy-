import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, color: "#1a1a1a" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    borderBottom: "2pt solid #9B9B9B",
    paddingBottom: 10,
  },
  title: { fontSize: 18, fontWeight: 700 },
  date: { fontSize: 10, color: "#666666" },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottom: "1pt solid #eeeeee",
  },
  checkbox: {
    width: 10,
    height: 10,
    border: "1pt solid #999999",
    borderRadius: 2,
    marginRight: 10,
  },
  checkboxDone: {
    width: 10,
    height: 10,
    backgroundColor: "#9B9B9B",
    borderRadius: 2,
    marginRight: 10,
  },
  taskText: { fontSize: 11 },
  taskTextDone: { fontSize: 11, color: "#999999", textDecoration: "line-through" },
  emptyText: { fontSize: 10, color: "#999999", fontStyle: "italic" },
});

export default function MinimalPDFDocument({ plannerName = "Minimal Planner", tasks = [] }) {
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

        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>Nothing here.</Text>
        ) : (
          tasks.map((t) => (
            <View key={t.id} style={styles.taskRow}>
              <View style={t.done ? styles.checkboxDone : styles.checkbox} />
              <Text style={t.done ? styles.taskTextDone : styles.taskText}>{t.name}</Text>
            </View>
          ))
        )}
      </Page>
    </Document>
  );
}
