import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import FloatingChatbot from "./components/ChatBot";
import { ThemeProvider } from "./components/ThemeProvider";
import { siteConfig } from "@/site.config";

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
        <ThemeProvider>
          <Navbar />
          <FloatingChatbot />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
