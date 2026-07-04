// Layout configs for image-backed "sheet" templates. Coordinates are
// fractions of the cropped image's own width/height, so positioning stays
// correct regardless of what size the image renders at.
//
// VERIFICATION STATUS: only `botanical` has been through the full process —
// table grid coordinates confirmed by drawing a debug overlay directly onto
// the source image and visually checking every line lands on a real border,
// not just computed and trusted. The other 10 are NOT wired up yet; adding
// each one is the same process (see template_processing/ scripts), just not
// done yet for these. Do not add entries here without going through that
// same verification — a wrong entry looks like a template until someone
// types into a field and the text lands in the wrong place.

export const SHEET_LAYOUTS = {
  botanical: {
    image: "/templates/botanical.png",
    imageSize: { width: 694, height: 981 },
    textColor: "#2d4a2d",
    fields: {
      name: { x: 0.16, y: 0.172, w: 0.42, h: 0.02 },
      date: { x: 0.62, y: 0.172, w: 0.23, h: 0.02 },
      goal1: { x: 0.16, y: 0.288, w: 0.30, h: 0.02 },
      goal2: { x: 0.55, y: 0.288, w: 0.30, h: 0.02 },
      quote: { x: 0.16, y: 0.858, w: 0.69, h: 0.02 },
    },
    table: {
      top: 0.371,
      bottom: 0.800,
      left: 0.098,
      right: 0.918,
      rows: 13,
      // column boundaries as fractions of table width: Time | Subject/Task | Notes | Completed
      colFracs: [0, 0.19, 0.46, 0.73, 1.0],
    },
  },
};

export function getSheetLayout(templateId) {
  return SHEET_LAYOUTS[templateId] || null;
}
