"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { CopyButton } from "./CopyButton";
import { demoSources } from "./generated/sources";

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
  TabsWrapper: 300,
  RadioGroupWrapper: 160,
  CheckboxGroupWrapper: 140,
  NumberInputWrapper: 140,
  InputWrapper: 260,
  SelectWrapper: 220,
  DatePickerWrapper: 220,
  AccordionWrapper: 180,
  AlertWrapper: 160,
  ProgressWrapper: 140,
  BreadcrumbWrapper: 110,
  ToasterWrapper: 48,
  DialogWrapper: 48,
  ModalWrapper: 48,
  MenuWrapper: 60,
  TooltipWrapper: 60,
  ButtonWrapper: 60,
  ButtonVariantsWrapper: 230,
  SpinnerStatesWrapper: 250,
  CheckboxGroupsWrapper: 300,
  TabsVariantsWrapper: 380,
  BreadcrumbCollapseWrapper: 150,
  ModalSizesWrapper: 60,
  ModalGuardWrapper: 60,
  DialogTypesWrapper: 110,
  DialogAsyncWrapper: 110,
  SwitchVariantsWrapper: 190,
  RadioGroupVariantsWrapper: 280,
  RadioGroupCardsWrapper: 210,
  NumberInputVariantsWrapper: 210,
  NumberInputCurrencyWrapper: 200,
  InputVariantsWrapper: 400,
  OtpInputVariantsWrapper: 200,
  TextareaVariantsWrapper: 300,
  InputFormWrapper: 300,
  AlertVariantsWrapper: 300,
  BadgeVariantsWrapper: 200,
  AvatarVariantsWrapper: 200,
  ProgressVariantsWrapper: 200,
  AccordionVariantsWrapper: 280,
  DatePickerVariantsWrapper: 220,
  DatePickerLimitsWrapper: 170,
  DateRangePickerVariantsWrapper: 170,
  DatePickerFormWrapper: 260,
  FileUploaderChunkedWrapper: 420,
  FileUploaderValidationWrapper: 340,
  FileUploaderEditWrapper: 340,
  FileUploaderFormWrapper: 300,
  MenuSubmenusWrapper: 90,
  PopoverFiltersWrapper: 60,
  CardStatsWrapper: 480,
  SkeletonShapesWrapper: 90,
  ToasterTypesWrapper: 60,
  ToasterUpdatesWrapper: 60,
  ToasterQueueWrapper: 110,
  ToasterCustomWrapper: 60,
  DataGridApiWrapper: 700,
  DataGridServerWrapper: 620,
  SelectOptionsWrapper: 220,
  SelectServerWrapper: 220,
  SelectCreatableWrapper: 220,
  SelectFormWrapper: 260,
};

const DEFAULT_HEIGHT = 120;

/** Which demos get the full width in the playground grid. */
export const WIDE = new Set([
  "DataGridWrapper",
  "FileUploaderWrapper",
  "CardWrapper",
  "SkeletonWrapper",
  "DataGridApiWrapper",
  "DataGridServerWrapper",
  "CardStatsWrapper",
  "FileUploaderChunkedWrapper",
  "FileUploaderValidationWrapper",
  "FileUploaderEditWrapper",
  "InputVariantsWrapper",
  "TabsVariantsWrapper",
]);

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

/**
 * The example's own highlighted source, fetched the first time it is asked for.
 *
 * Each example is its own chunk, so opening one Code tab downloads that
 * example and nothing else. Highlighting happened at build time, which is why
 * there is no syntax highlighter in this bundle.
 */
const sourceCache = new Map<string, string>();

function useSource(name: string, wanted: boolean) {
  const [source, setSource] = useState<string | null>(() => sourceCache.get(name) ?? null);

  useEffect(() => {
    if (!wanted || source !== null) return;
    let live = true;
    void demoSources[name]?.().then((module) => {
      sourceCache.set(name, module.default);
      if (live) setSource(module.default);
    });
    return () => {
      live = false;
    };
  }, [wanted, source, name]);

  return source;
}

/** Wraps a demo in the framed "Live preview" card the docs pages show. */
export function preview<P extends object>(Component: ComponentType<P>, name: string) {
  const minHeight = HEIGHTS[name] ?? DEFAULT_HEIGHT;
  const label = `${name.replace(/Wrapper$/, "")} demo`;

  function Preview(props: P) {
    const [showCode, setShowCode] = useState(false);
    const source = useSource(name, showCode);

    return (
      <figure className="v2-demo" aria-label={label}>
        <div className="v2-demo-bar">
          <span className="v2-demo-dot" aria-hidden />
          Live preview
          {showCode && <CopyButton />}
          <div className="v2-demo-tabs" role="group" aria-label="Show the example as">
            <button
              type="button"
              className="v2-demo-tab"
              aria-pressed={!showCode}
              onClick={() => setShowCode(false)}
            >
              Preview
            </button>
            <button
              type="button"
              className="v2-demo-tab"
              aria-pressed={showCode}
              onClick={() => setShowCode(true)}
            >
              Code
            </button>
          </div>
        </div>

        {/*
          The preview stays mounted while the code shows. Unmounting it would
          throw away whatever the reader had typed or selected, and they are
          usually looking at the code to understand what they just did.
        */}
        <div className="v2-demo-stage" hidden={showCode}>
          <WhenVisible minHeight={minHeight}>
            <Component {...props} />
          </WhenVisible>
        </div>

        {showCode && (
          <div className="v2-demo-code">
            {source === null ? (
              <p className="v2-demo-code-loading">Loading source…</p>
            ) : (
              /*
               * Build-time output from our own source files, highlighted by
               * Shiki — not anything a reader or a request can influence.
               */
              <div dangerouslySetInnerHTML={{ __html: source }} />
            )}
          </div>
        )}
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
