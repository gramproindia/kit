import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import FloatingChatbot from "@/app/components/ChatBot";
import { V2_BASE } from "@/app/2.0.0-beta/_lib/config";

const Banner = () => (
  <div className="sticky top-0 z-150 w-full bg-blue-600 px-4 py-2 text-center text-xs text-white">
    <p>
      <span className="font-semibold">GramproKit 2.0.0 Beta is here.</span>{" "}
      Explore the rebuilt components on the new docs site. Beta components are
      experimental and may change.{" "}
      <Link
        href={V2_BASE}
        className="inline-flex items-center gap-1 font-semibold underline underline-offset-2"
      >
        Visit 2.0.0 Beta docs
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
