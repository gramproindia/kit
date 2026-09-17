"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import dynamic from "next/dynamic";

/*
 * Live demos are the heaviest part of a page (the grid demo builds 100k rows).
 * Each one is a separate chunk that loads only when its preview scrolls near
 * the viewport, so reading the docs never waits on them.
 */

function Placeholder() {
  return <div className="v2-demo-skeleton" aria-hidden />;
}

function WhenVisible({ children, minHeight }: { children: ReactNode; minHeight: number }) {
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

function preview<P extends object>(Component: ComponentType<P>, minHeight: number, label: string) {
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

export const DemoGrid = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/demogrid"), { ssr: false, loading: Placeholder }),
  520,
  "Data grid demo",
);

export const SelectWrapper = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/combobox/SelectWrapper"), { ssr: false, loading: Placeholder }),
  120,
  "Select demo",
);

export const MultiSelectWrapper = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/combobox/MultiSelectWrapper"), { ssr: false, loading: Placeholder }),
  120,
  "MultiSelect demo",
);

export const DatePickerWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/datepicker/DatePickerWrapper"), { ssr: false, loading: Placeholder }),
  120,
  "DatePicker demo",
);

export const DateRangePickerWrapper = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/datepicker/DateRangePickerWrapper"), { ssr: false, loading: Placeholder }),
  120,
  "DateRangePicker demo",
);

export const FileUploaderWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/fileuploader/FileUploaderWrapper"), { ssr: false, loading: Placeholder }),
  220,
  "File uploader demo",
);

export const ToasterWrapper = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/toaster/ToasterWrapper"), { ssr: false, loading: Placeholder }),
  48,
  "Toaster demo",
);

export const MermaidChart = dynamic(
  () => import("@/app/components/MermaidChart").then((m) => m.MermaidChart),
  { ssr: false, loading: Placeholder },
);
