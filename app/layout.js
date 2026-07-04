import "./globals.css";
import { Inter, Caveat } from "next/font/google";

export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-caveat",
});

export const metadata = {
  title: "Study Planner",
  description: "A minimal daily dashboard for staying on top of your studies.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${caveat.variable}`}>
      <body
        className="bg-bg text-text"
        style={{ fontFamily: "var(--font-inter), 'SF Pro Display', sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}