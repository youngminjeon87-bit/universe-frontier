import type { Metadata } from "next";
import { Press_Start_2P, Space_Grotesk } from "next/font/google";
import "./globals.css";

const pixelFont = Press_Start_2P({
  weight: "400",
  variable: "--font-pixel",
  subsets: ["latin"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Universe Frontier — 디지털 우주 소유권",
  description: "브라우저에서 우주를 탐험하고, 행성을 발견하고, 소유하세요.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pixelFont.variable} ${bodyFont.variable} h-full`}
    >
      <body className="min-h-full bg-space text-star-white antialiased">
        {children}
      </body>
    </html>
  );
}
