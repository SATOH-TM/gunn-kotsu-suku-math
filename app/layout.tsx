import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ぴったり10をつくろう！ | すくすく数学",
  description: "遊びながら四則演算に親しむ、すくすく数学の学習ゲーム。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/gunn-kotsu-suku-math/favicon.svg",
    shortcut: "/gunn-kotsu-suku-math/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
