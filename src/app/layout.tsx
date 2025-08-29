import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoL Patch Downloader",
  description: "Téléchargeur de patches League of Legends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
