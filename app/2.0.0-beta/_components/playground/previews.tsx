"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

/*
 * Every component, reusing the same demo wrappers the docs pages use, so the
 * playground never drifts from them. Each one is its own chunk and only mounts
 * when it scrolls into view — the grid alone builds 100k rows.
 */

const loading = () => <div className="v2-demo-skeleton" style={{ minHeight: 64 }} aria-hidden />;

const Button = dynamic(() => import("@/app/components/examples/2.0.0/ButtonWrapper"), { ssr: false, loading });
const Input = dynamic(() => import("@/app/components/examples/2.0.0/InputWrapper"), { ssr: false, loading });
const OtpInput = dynamic(() => import("@/app/components/examples/2.0.0/OtpInputWrapper"), { ssr: false, loading });
const NumberInput = dynamic(() => import("@/app/components/examples/2.0.0/NumberInputWrapper"), { ssr: false, loading });
const Textarea = dynamic(() => import("@/app/components/examples/2.0.0/TextareaWrapper"), { ssr: false, loading });
const Checkbox = dynamic(() => import("@/app/components/examples/2.0.0/CheckboxWrapper"), { ssr: false, loading });
const CheckboxGroup = dynamic(() => import("@/app/components/examples/2.0.0/CheckboxGroupWrapper"), { ssr: false, loading });
const RadioGroup = dynamic(() => import("@/app/components/examples/2.0.0/RadioGroupWrapper"), { ssr: false, loading });
const Switch = dynamic(() => import("@/app/components/examples/2.0.0/SwitchWrapper"), { ssr: false, loading });
const Select = dynamic(() => import("@/app/components/examples/2.0.0/SelectWrapper"), { ssr: false, loading });
const MultiSelect = dynamic(() => import("@/app/components/examples/2.0.0/MultiSelectWrapper"), { ssr: false, loading });
const DatePicker = dynamic(() => import("@/app/components/examples/2.0.0/DatePickerWrapper"), { ssr: false, loading });
const DateRangePicker = dynamic(() => import("@/app/components/examples/2.0.0/DateRangePickerWrapper"), { ssr: false, loading });
const FileUploader = dynamic(() => import("@/app/components/examples/2.0.0/FileUploaderWrapper"), { ssr: false, loading });
const Breadcrumb = dynamic(() => import("@/app/components/examples/2.0.0/BreadcrumbWrapper"), { ssr: false, loading });
const Tabs = dynamic(() => import("@/app/components/examples/2.0.0/TabsWrapper"), { ssr: false, loading });
const Card = dynamic(() => import("@/app/components/examples/2.0.0/CardWrapper"), { ssr: false, loading });
const Menu = dynamic(() => import("@/app/components/examples/2.0.0/MenuWrapper"), { ssr: false, loading });
const Popover = dynamic(() => import("@/app/components/examples/2.0.0/PopoverWrapper"), { ssr: false, loading });
const Tooltip = dynamic(() => import("@/app/components/examples/2.0.0/TooltipWrapper"), { ssr: false, loading });
const Dialog = dynamic(() => import("@/app/components/examples/2.0.0/DialogWrapper"), { ssr: false, loading });
const Modal = dynamic(() => import("@/app/components/examples/2.0.0/ModalWrapper"), { ssr: false, loading });
const Toaster = dynamic(() => import("@/app/components/examples/2.0.0/ToasterWrapper"), { ssr: false, loading });
const Spinner = dynamic(() => import("@/app/components/examples/2.0.0/SpinnerWrapper"), { ssr: false, loading });
const Skeleton = dynamic(() => import("@/app/components/examples/2.0.0/SkeletonWrapper"), { ssr: false, loading });
const DataGrid = dynamic(() => import("@/app/components/examples/2.0.0/DataGridWrapper"), { ssr: false, loading });

export interface PreviewSection {
  /** Anchor id and jump-list label. */
  id: string;
  title: string;
  /** Doc page slug, for the "docs" link on the card. */
  slug: string;
  Component: React.ComponentType;
  /** Reserved height so the page does not jump as demos mount. */
  minHeight: number;
  /** The grid gets the full width. */
  wide?: boolean;
}

export const SECTIONS: PreviewSection[] = [
  { id: "button", title: "Button", slug: "button", Component: Button, minHeight: 120 },
  { id: "input", title: "Input", slug: "input", Component: Input, minHeight: 200 },
  { id: "otp", title: "OtpInput", slug: "input", Component: OtpInput, minHeight: 120 },
  { id: "numberinput", title: "NumberInput", slug: "numberinput", Component: NumberInput, minHeight: 160 },
  { id: "textarea", title: "Textarea", slug: "textarea", Component: Textarea, minHeight: 180 },
  { id: "checkbox", title: "Checkbox", slug: "checkbox", Component: Checkbox, minHeight: 120 },
  { id: "checkboxgroup", title: "CheckboxGroup", slug: "checkbox", Component: CheckboxGroup, minHeight: 160 },
  { id: "radiogroup", title: "RadioGroup", slug: "radiogroup", Component: RadioGroup, minHeight: 180 },
  { id: "switch", title: "Switch", slug: "switch", Component: Switch, minHeight: 200 },
  { id: "select", title: "Select", slug: "combobox", Component: Select, minHeight: 130 },
  { id: "multiselect", title: "MultiSelect", slug: "combobox", Component: MultiSelect, minHeight: 130 },
  { id: "datepicker", title: "DatePicker", slug: "datepicker", Component: DatePicker, minHeight: 130 },
  { id: "daterangepicker", title: "DateRangePicker", slug: "datepicker", Component: DateRangePicker, minHeight: 130 },
  { id: "fileuploader", title: "FileUploader", slug: "fileuploader", Component: FileUploader, minHeight: 240, wide: true },
  { id: "breadcrumb", title: "Breadcrumb", slug: "breadcrumb", Component: Breadcrumb, minHeight: 90 },
  { id: "tabs", title: "Tabs", slug: "tabs", Component: Tabs, minHeight: 170 },
  { id: "card", title: "Card", slug: "card", Component: Card, minHeight: 240, wide: true },
  { id: "menu", title: "Menu", slug: "menu", Component: Menu, minHeight: 90 },
  { id: "popover", title: "Popover", slug: "popover", Component: Popover, minHeight: 110 },
  { id: "tooltip", title: "Tooltip", slug: "tooltip", Component: Tooltip, minHeight: 90 },
  { id: "dialog", title: "Dialog", slug: "dialog", Component: Dialog, minHeight: 110 },
  { id: "modal", title: "Modal", slug: "modal", Component: Modal, minHeight: 110 },
  { id: "toaster", title: "Toaster", slug: "toaster", Component: Toaster, minHeight: 90 },
  { id: "spinner", title: "Spinner", slug: "spinner", Component: Spinner, minHeight: 200 },
  { id: "skeleton", title: "Skeleton", slug: "skeleton", Component: Skeleton, minHeight: 220, wide: true },
  { id: "datagrid", title: "Data Grid", slug: "datagrid", Component: DataGrid, minHeight: 420, wide: true },
];

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
      { rootMargin: "300px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight }}>
      {visible ? children : <div className="v2-demo-skeleton" style={{ minHeight }} aria-hidden />}
    </div>
  );
}
