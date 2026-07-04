// Real, working templates only. The original proposal listed ~23 — building
// bespoke designs for all of them would mean inventing 20 designs with no
// spec to work from, so this stays at 3 genuine ones for now. Each entry's
// `component` key matches a template component in components/templates/.
export const TEMPLATE_CATALOG = [
  {
    id: "dashboard",
    name: "Productivity Dashboard",
    description:
      "The full daily view — priorities, timeline, meetings, notes, and trackers in one glance.",
    category: "Productivity",
    accentColor: "#B18BFF",
  },
  {
    id: "weekly",
    name: "Weekly Study Planner",
    description: "A 7-day grid with a running task list for each day.",
    category: "Student",
    accentColor: "#B7D64B",
  },
  {
    id: "minimal",
    name: "Minimal Planner",
    description: "One clean checklist. Nothing else on the page.",
    category: "Minimal",
    accentColor: "#9B9B9B",
  },
  {
    id: "botanical",
    name: "Botanical Study Planner",
    description: "A soft green, leaf-illustrated daily planner sheet.",
    category: "Illustrated",
    accentColor: "#6B8E5A",
  },
];

export function getTemplate(id) {
  return TEMPLATE_CATALOG.find((t) => t.id === id) ?? TEMPLATE_CATALOG[0];
}
