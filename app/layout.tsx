import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import FloatingChatbot from "./components/ChatBot";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GramproKit Docs",
  description: "By Research and Development Team, Grampro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* <div className="fixed inset-0 w-full h-full -z-10">
          <Image
            src={"/flies.svg"}
            className="w-full h-full object-cover"
            alt="flies"
            fill
          />
        </div> */}

        <Navbar />
        <FloatingChatbot />
        {children}
      </body>
    </html>
  );
}
