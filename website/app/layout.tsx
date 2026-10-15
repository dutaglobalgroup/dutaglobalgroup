import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monitoring Pembangunan Proyek Konstruksi",
  description: "Dashboard WebGIS monitoring dan pengelolaan proyek Aceh.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/logo-monitoring.png",
    shortcut: "/logo-monitoring.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
