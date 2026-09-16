import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import FloatingChatbot from "./components/ChatBot";
import { ThemeProvider } from "./components/ThemeProvider";
import { siteConfig } from "@/site.config";
import Link from "next/link";

export const metadata: Metadata = {
  title: siteConfig.metadata.title,
  description: siteConfig.metadata.description,
  keywords: siteConfig.metadata.keywords,
  authors: siteConfig.metadata.authors,
  creator: siteConfig.metadata.creator,
  openGraph: siteConfig.metadata.openGraph,
  twitter: siteConfig.metadata.twitter,
  metadataBase: new URL(siteConfig.baseUrl),
};

const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

const Banner = () => (
  <div className="bg-blue-600 text-white text-center py-2 px-4 w-full text-xs sticky top-0 z-150">
    <p>
      2.0.0-Beta components are available for testing and feedback. Please note
      that these components are experimental and may undergo changes that could
      affect your code. Use them at your own risk.{" "}
      <Link
        href="https://gramprokit.vercel.app/docs/comboboxbeta#combobox-select-multiselectbeta"
        className="underline"
      >
        Learn more
      </Link>
    </p>
  </div>
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <Banner />
        <ThemeProvider>
          <Navbar />
          <FloatingChatbot />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
