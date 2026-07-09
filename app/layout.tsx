import type { Metadata } from "next";
import { Inter, Rowdies } from "next/font/google";
import "./globals.css";

const rowdies = Rowdies({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-rowdies",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "YuiDen | AI Settlement for Solar Communities",
  description:
    "HSP-aligned AI settlement layer for Japan's post-FIT solar communities on HashKey Chain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${rowdies.variable} ${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
