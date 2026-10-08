"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { 
  Loader2, 
  AlertCircle, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw 
} from "lucide-react";

interface MermaidChartProps {
  code: string;
}

export function MermaidChart({ code }: MermaidChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { theme } = useTheme();

  // Zoom & Pan States
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset function to restore original scale and position
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.15, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.15, 0.5));
  };

  // Mouse drag events for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only drag with left mouse button
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mermaid Rendering Lifecycle
  useEffect(() => {
    let active = true;

    async function renderChart() {
      if (!active) return;
      setLoading(true);
      setError(null);
      resetView(); // reset view on new diagram load
      
      try {
        const mermaid = (await import("mermaid")).default;
        const isDark = theme === "dark";
        
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          securityLevel: "loose",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          themeVariables: {
            background: isDark ? "#0f172a" : "#f8fafc", // slate-900 / slate-50
            primaryColor: isDark ? "#38bdf8" : "#0284c7", // sky-400 / sky-600
            primaryTextColor: isDark ? "#f8fafc" : "#0f172a",
            lineColor: isDark ? "#334155" : "#e2e8f0", // slate-700 / slate-200
            secondaryColor: isDark ? "#1e293b" : "#f1f5f9", // slate-800 / slate-100
            tertiaryColor: isDark ? "#1e293b" : "#f1f5f9",
          },
        });

        const id = `mermaid-svg-${Math.floor(Math.random() * 1000000)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code.trim());
        
        if (active) {
          setSvg(renderedSvg);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Mermaid parsing/rendering error:", err);
        if (active) {
          const errMsg = err instanceof Error ? err.message : String(err);
          setError(errMsg || "An error occurred while compiling the Mermaid diagram syntax.");
          setLoading(false);
        }
      }
    }

    renderChart();

    return () => {
      active = false;
    };
  }, [code, theme]);

  // Non-passive wheel event listener to support zoom on hover without page scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !svg) return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 0.08;
      setScale((prev) => {
        const newScale = e.deltaY < 0 ? prev + zoomFactor : prev - zoomFactor;
        return Math.max(0.5, Math.min(newScale, 3));
      });
    };

    container.addEventListener("wheel", handleWheelEvent, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheelEvent);
    };
  }, [svg]);

  // Exit fullscreen with ESC
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  return (
    <>
      <div
        className={`relative my-8 border border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-slate-900/50 overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? "fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 p-6 md:p-10"
            : "max-w-full"
        }`}
      >
        {/* Header toolbar */}
        <div className="flex flex-wrap gap-3 justify-between items-center px-5 py-3 border-b border-gray-200/60 dark:border-gray-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase">
              Interactive Diagram
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Interactive Control Buttons */}
            {!loading && !error && svg && (
              <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 rounded-lg p-0.5 shadow-sm">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-[10px] font-mono font-medium px-2 text-gray-400 dark:text-gray-500 min-w-[36px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 mx-1" />
                <button
                  onClick={resetView}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Reset Zoom & Pan"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            )}

            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer shadow-sm"
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "View Fullscreen"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 size={13} />
                  <span className="hidden sm:inline">Exit</span>
                </>
              ) : (
                <>
                  <Maximize2 size={13} />
                  <span className="hidden sm:inline">Fullscreen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Zoom & Pan Container */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={resetView}
          className={`relative flex items-center justify-center p-6 md:p-8 w-full overflow-hidden select-none bg-white/30 dark:bg-slate-900/10 ${
            isFullscreen ? "flex-1" : "min-h-[300px] max-h-[550px]"
          } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        >
          {loading && (
            <div className="flex flex-col items-center gap-3 py-12 text-gray-500 dark:text-gray-400">
              <Loader2 className="animate-spin text-blue-500 dark:text-sky-400" size={28} />
              <span className="text-xs font-semibold tracking-wider uppercase opacity-85">
                Compiling diagram...
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-4 p-5 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/30 max-w-2xl shadow-sm">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-red-800 dark:text-red-400">
                  Mermaid Syntax Compilation Error
                </h4>
                <p className="text-xs text-red-700 dark:text-red-300 font-mono bg-red-500/5 p-3 rounded-lg border border-red-500/10 whitespace-pre-wrap break-all leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
          )}

          {!loading && !error && svg && (
            <div
              ref={transformRef}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "center center",
              }}
              className={`w-full max-w-full flex justify-center transition-transform duration-75 ease-out
                [&>svg]:w-full [&>svg]:h-auto
                [&_rect]:rx-[6px] [&_rect]:ry-[6px] 
                dark:[&_text]:fill-slate-100 dark:[&_rect]:fill-slate-800/80 dark:[&_rect]:stroke-slate-700 
                dark:[&_.edgePath_path]:stroke-slate-500 dark:[&_.marker]:stroke-slate-500 dark:[&_.marker]:fill-slate-500 
                dark:[&_.edgeLabel_rect]:fill-slate-900 dark:[&_.label]:text-slate-100
                ${isFullscreen ? "max-h-full" : "max-h-[500px]"}`}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          )}

          {/* Interactive Hint Overlay */}
          {!loading && !error && svg && (
            <div className="absolute bottom-3 right-3 pointer-events-none bg-slate-900/60 dark:bg-slate-950/60 px-3 py-1.5 rounded-md backdrop-blur-sm shadow-sm border border-white/5 text-[10px] font-medium text-gray-200 dark:text-gray-300 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-300">
              Drag to Pan • Scroll to Zoom • Dbl-Click to Reset
            </div>
          )}
        </div>
      </div>
    </>
  );
}
