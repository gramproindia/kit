"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import dynamic from "next/dynamic";

/*
 * Live demos are the heaviest part of a page (the grid demo builds 100k rows).
 * Each one is a separate chunk that loads only when its preview scrolls near
 * the viewport, so reading the docs never waits on them.
 *
 * Export names carry the `Beta` suffix the MDX uses; the wrapper files
 * themselves keep the plain names they are generated with.
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

const DataGridDemo = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/DataGridWrapper"), { ssr: false, loading: Placeholder }),
  520,
  "Data grid demo",
);
/** The Data Grid page still uses <DemoGrid />; both names render the same demo. */
export const DemoGrid = DataGridDemo;
export const DataGridWrapperBeta = DataGridDemo;

export const SelectWrapper = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/SelectWrapper"), { ssr: false, loading: Placeholder }),
  120,
  "Select demo",
);

export const MultiSelectWrapper = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/MultiSelectWrapper"), { ssr: false, loading: Placeholder }),
  120,
  "MultiSelect demo",
);

export const DatePickerWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/DatePickerWrapper"), { ssr: false, loading: Placeholder }),
  120,
  "DatePicker demo",
);

export const DateRangePickerWrapper = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/DateRangePickerWrapper"), { ssr: false, loading: Placeholder }),
  120,
  "DateRangePicker demo",
);

export const FileUploaderWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/FileUploaderWrapper"), { ssr: false, loading: Placeholder }),
  220,
  "File uploader demo",
);

export const ToasterWrapper = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/ToasterWrapper"), { ssr: false, loading: Placeholder }),
  48,
  "Toaster demo",
);

export const InputWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/InputWrapper"), { ssr: false, loading: Placeholder }),
  140,
  "Input demo",
);

export const OtpInputWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/OtpInputWrapper"), { ssr: false, loading: Placeholder }),
  100,
  "OtpInput demo",
);

export const TextareaWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/TextareaWrapper"), { ssr: false, loading: Placeholder }),
  160,
  "Textarea demo",
);

export const DialogWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/DialogWrapper"), { ssr: false, loading: Placeholder }),
  48,
  "Dialog demo",
);

export const ModalWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/ModalWrapper"), { ssr: false, loading: Placeholder }),
  48,
  "Modal demo",
);

export const ButtonWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/ButtonWrapper"), { ssr: false, loading: Placeholder }),
  60,
  "Button demo",
);

export const CheckboxWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/CheckboxWrapper"), { ssr: false, loading: Placeholder }),
  80,
  "Checkbox demo",
);

export const CheckboxGroupWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/CheckboxGroupWrapper"), { ssr: false, loading: Placeholder }),
  140,
  "CheckboxGroup demo",
);

export const BreadcrumbWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/BreadcrumbWrapper"), { ssr: false, loading: Placeholder }),
  40,
  "Breadcrumb demo",
);

export const TabsWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/TabsWrapper"), { ssr: false, loading: Placeholder }),
  160,
  "Tabs demo",
);

export const SpinnerWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/SpinnerWrapper"), { ssr: false, loading: Placeholder }),
  120,
  "Spinner demo",
);

export const CardWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/CardWrapper"), { ssr: false, loading: Placeholder }),
  220,
  "Card demo",
);

export const MenuWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/MenuWrapper"), { ssr: false, loading: Placeholder }),
  60,
  "Menu demo",
);

export const PopoverWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/PopoverWrapper"), { ssr: false, loading: Placeholder }),
  80,
  "Popover demo",
);

export const SkeletonWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/SkeletonWrapper"), { ssr: false, loading: Placeholder }),
  200,
  "Skeleton demo",
);

export const TooltipWrapperBeta = preview(
  dynamic(() => import("@/app/components/examples/2.0.0/TooltipWrapper"), { ssr: false, loading: Placeholder }),
  60,
  "Tooltip demo",
);

export const MermaidChart = dynamic(
  () => import("@/app/components/MermaidChart").then((m) => m.MermaidChart),
  { ssr: false, loading: Placeholder },
);
