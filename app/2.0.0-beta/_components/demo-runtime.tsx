"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import dynamic from "next/dynamic";

/*
 * Shared plumbing for the live demos. The demos themselves are generated into
 * generated/demos.tsx from the wrapper files on disk.
 *
 * Each demo is its own chunk and only mounts when its preview scrolls near the
 * viewport — the grid demo alone builds 100k rows.
 */

/** Reserved height per demo, so the page does not jump while they mount. */
const HEIGHTS: Record<string, number> = {
  DataGridWrapper: 520,
  FileUploaderWrapper: 220,
  SkeletonWrapper: 200,
  CardWrapper: 220,
  SwitchWrapper: 200,
  SpinnerWrapper: 200,
  TextareaWrapper: 160,
  TabsWrapper: 160,
  RadioGroupWrapper: 160,
  CheckboxGroupWrapper: 140,
  NumberInputWrapper: 140,
  InputWrapper: 140,
  AccordionWrapper: 180,
  AlertWrapper: 160,
  ProgressWrapper: 140,
  BreadcrumbWrapper: 40,
  ToasterWrapper: 48,
  DialogWrapper: 48,
  ModalWrapper: 48,
  MenuWrapper: 60,
  TooltipWrapper: 60,
  ButtonWrapper: 60,
};

const DEFAULT_HEIGHT = 120;

/** Which demos get the full width in the playground grid. */
export const WIDE = new Set(["DataGridWrapper", "FileUploaderWrapper", "CardWrapper", "SkeletonWrapper"]);

export function Placeholder() {
  return <div className="v2-demo-skeleton" aria-hidden />;
}

export function WhenVisible({ children, minHeight }: { children: ReactNode; minHeight: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight }}>
      {visible ? children : <Placeholder />}
    </div>
  );
}

/** Wraps a demo in the framed "Live preview" card the docs pages show. */
export function preview<P extends object>(Component: ComponentType<P>, name: string) {
  const minHeight = HEIGHTS[name] ?? DEFAULT_HEIGHT;
  const label = `${name.replace(/Wrapper$/, "")} demo`;

  function Preview(props: P) {
    return (
      <figure className="v2-demo" aria-label={label}>
        <div className="v2-demo-bar">
          <span className="v2-demo-dot" aria-hidden />
          Live preview
        </div>
        <div className="v2-demo-stage">
          <WhenVisible minHeight={minHeight}>
            <Component {...props} />
          </WhenVisible>
        </div>
      </figure>
    );
  }
  Preview.displayName = `Preview(${label})`;
  return Preview;
}

export function heightOf(name: string) {
  return HEIGHTS[name] ?? DEFAULT_HEIGHT;
}

export const MermaidChart = dynamic(() => import("@/app/components/MermaidChart").then((m) => m.MermaidChart), {
  ssr: false,
  loading: Placeholder,
});
