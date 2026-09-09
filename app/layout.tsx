import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "ClipType",
  description: "A high-dopamine, browser-based dictation typing game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${firaCode.variable} dark`}>
      <body className="bg-black text-gray-100 antialiased font-sans min-h-screen selection:bg-emerald-500/30">
        {children}
      </body>
    </html>
  );
}
