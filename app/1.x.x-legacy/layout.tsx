import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import FloatingChatbot from "@/app/components/ChatBot";

const Banner = () => (
  <div className="sticky top-0 z-150 w-full bg-blue-600 px-4 py-2 text-center text-xs text-white">
    <p>
      <span className="font-semibold">These are the 1.x (legacy) docs.</span>{" "}
      GramproKit 2.0 is the current version.{" "}
      <Link href="/" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
        Go to the current docs
        <ArrowRight className="size-3" aria-hidden />
      </Link>
    </p>
  </div>
);

export default function LegacyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Banner />
      <Navbar />
      <FloatingChatbot />
      {children}
    </>
  );
}
