import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Redress — A Civic Remedy Protocol",
  description: "A decentralized complaint and compensation protocol where GenLayer validators decide the fair remedy, not just the winner.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="paper-grain min-h-screen">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
