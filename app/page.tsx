"use client";

import { useState, useEffect } from "react";
import { Search, ArrowRight, Code2, Layers, Zap } from "lucide-react";
import Link from "next/link";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ContainerTextFlip } from "@/component-lib/container-text-flip";
import { GlareCard } from "@/component-lib/glare-card";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.02)_1px,transparent_0)] bg-[size:24px_24px]" />

      <div className="relative">
        {/* Hero Section */}
        <main className="px-6 sm:px-8 lg:px-12 pt-16 pb-24">
          <div className="max-w-7xl mx-auto">
            <div
              className={`transition-all duration-1000 ${
                isLoaded
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-sm font-medium text-gray-700 mb-8">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Announcing v1.2 – Now with advanced theming
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
                  Build{" "}
                  <ContainerTextFlip
                    words={["better", "modern", "stylish", "awesome"]}
                  />{" "}
                  interfaces
                  <br />
                  <span className="text-gray-400">without the complexity</span>
                </h1>

                <p className="text-xl max-w-3xl mx-auto leading-relaxed mb-12">
                  A comprehensive design system with pre-built components,
                  utility classes, and smart defaults. Ship faster with less
                  code and consistent design patterns.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link
                    href={"/docs/getting-started"}
                    className="group flex items-center gap-3 px-8 py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>

                  <button className="flex items-center gap-3 px-8 py-4 border border-gray-200 rounded-xl font-semibold hover:border-gray-300 transition-all duration-200">
                    <Search className="w-5 h-5 text-gray-500" />
                    Quick search
                    <div className="flex items-center gap-1 ml-2">
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-500">
                        ⌘K
                      </kbd>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Code Example */}
            <div
              className={`transition-all duration-1000 delay-200 ${
                isLoaded
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <div className="bg-zinc-900 rounded-2xl p-8 mb-24 max-w-4xl mx-auto shadow-2xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="ml-4 text-gray-400 text-sm font-mono">
                    ButtonWrapper.tsx
                  </span>
                </div>
                <SyntaxHighlighter
                  language={"javascript"}
                  style={oneDark}
                  wrapLines={true}
                  wrapLongLines={true}
                >
                  {/* {codeContent} */}
                  {`import { Button } from "@/component-lib/button";

export const ButtonWrapper = () => {
  return (
    <div className="flex gap-4">
      <Button>Click Me!</Button>
      <Button className="bg-red-800 px-2 py-1 rounded-2xl cursor-pointer">
        Click Me!
      </Button>
      <Button className="border px-2 py-1 rounded-2xl cursor-pointer">
        Click Me!
      </Button>
    </div>
  );
};`}
                </SyntaxHighlighter>
              </div>
            </div>

            {/* Features Grid */}
            <div
              className={`transition-all duration-1000 delay-400 ${
                isLoaded
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">
                  Everything you need to ship fast
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Thoughtfully designed components and utilities that work
                  together seamlessly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                <GlareCard className="group p-8 rounded-2xl hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors duration-300">
                    <Layers className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Component Library
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Over 50 professionally designed components built with
                    accessibility and performance in mind.
                  </p>
                </GlareCard>

                <GlareCard className="group p-8 rounded-2xl hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-100 transition-colors duration-300">
                    <Code2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Utility Classes
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Comprehensive utility system for spacing, typography,
                    colors, and responsive design patterns.
                  </p>
                </GlareCard>

                <GlareCard className="group p-8 rounded-2xl hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-100 transition-colors duration-300">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibual mb-3">
                    Developer Experience
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    TypeScript support, excellent documentation, and tools that
                    make development a pleasure.
                  </p>
                </GlareCard>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 sm:px-8 lg:px-12 py-12">
          <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
            <p>
              © 2025 ComponentLib. Built with care for the developer community.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
