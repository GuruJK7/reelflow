import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReelFlow — Reels listos para Instagram",
  description:
    "Subí un video crudo y obtené un Reel con silencios recortados y subtítulos animados en español, en el formato que elijas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-reelflow-bg text-reelflow-text antialiased reelflow-gradient">
        {children}
      </body>
    </html>
  );
}
