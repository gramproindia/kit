import React, { ReactNode } from "react";
import { Button } from "@/component-lib/button";
import DataGridWrapper from "@/app/components/examples/DataGridWrapper";
import DemoGrid from "@/app/components/examples/2.0.0/demogrid";
import SelectWrapper from "@/app/components/examples/2.0.0/combobox/SelectWrapper";
import MultiSelectWrapper from "@/app/components/examples/2.0.0/combobox/MultiSelectWrapper";
import { CodeBlock, PreBlock } from "@/app/components/CodeBlock";
import WarningBanner from "@/app/components/WarningBanner";
import FeatureCarousel from "@/app/components/FeatureCarousal";
import DatePickerWrapperBeta from "@/app/components/examples/2.0.0/datepicker/DatePickerWrapper";
import DateRangePickerWrapper from "@/app/components/examples/2.0.0/datepicker/DateRangePickerWrapper";
import {
  BarGraphWrapper,
  BreadcrumbWrapper,
  ButtonWrapper,
  CardWrapper,
  DatePickerWrapper,
  DialogWrapper,
} from "@/app/components/examples";
import { ContextMenuWrapper } from "@/app/components/examples/ContextMenuWrapper";
import Notice from "@/app/components/Notice";
import { MaterialInputWrapper } from "@/app/components/examples/MaterialInputWrapper";
import { FileUploaderWrapper } from "@/app/components/examples/UploaderWrapper";
import BugWarning from "@/app/components/BugWarning";
import { MermaidChart } from "@/app/components/MermaidChart";
import ToasterWrapper from "@/app/components/examples/2.0.0/toaster/ToasterWrapper";
import FileUploaderWrapperBeta from "@/app/components/examples/2.0.0/fileuploader/FileUploaderWrapper";
import DialogWrapperBeta from "@/app/components/examples/2.0.0/dialog/DialogWrapper";
import InputWrapperBeta from "@/app/components/examples/2.0.0/input/InputWrapper";
import ModalWrapperBeta from "@/app/components/examples/2.0.0/modal/ModalWrapper";
import TextareaWrapperBeta from "@/app/components/examples/2.0.0/textarea/TextareaWrapper";
import OtpInputWrapperBeta from "@/app/components/examples/2.0.0/input/OtpInputWrapper";
import ButtonWrapperBeta from "@/app/components/examples/2.0.0/button/ButtonWrapper";
import CheckboxWrapperBeta from "@/app/components/examples/2.0.0/checkbox/CheckboxWrapper";
import CheckboxGroupWrapperBeta from "@/app/components/examples/2.0.0/checkbox/CheckboxGroupWrapper";
import BreadcrumbWrapperBeta from "@/app/components/examples/2.0.0/breadcrumb/BreadcrumbWrapper";
import TabsWrapperBeta from "@/app/components/examples/2.0.0/tabs/TabsWrapper";
import SpinnerWrapperBeta from "@/app/components/examples/2.0.0/spinner/SpinnerWrapper";

const createHeadingComponent = (level: number) => {
  return ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text =
      typeof children === "string"
        ? children
        : Array.isArray(children)
          ? children.join("")
          : "";

    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    const baseClasses = {
      1: "text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8 mt-12 first:mt-0 pb-4 border-b border-gray-200 dark:border-gray-700",
      2: "text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-6 mt-10 pb-2 border-b border-gray-200 dark:border-gray-700",
      3: "text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 mt-8",
      4: "text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6",
      5: "text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4",
      6: "text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4",
    };

    return React.createElement(
      `h${level}`,
      {
        id,
        className: baseClasses[level as keyof typeof baseClasses],
        ...props,
      },
      children,
    );
  };
};

const Callout = ({
  children,
  type = "info",
}: {
  children: ReactNode;
  type?: "info" | "warning" | "error" | "success";
}) => {
  const styles = {
    info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
    warning:
      "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
    error:
      "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
    success:
      "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 my-6 ${styles[type]}`}>
      {children}
    </div>
  );
};

export const mdxComponents = {
  // Headings
  h1: createHeadingComponent(1),
  h2: createHeadingComponent(2),
  h3: createHeadingComponent(3),
  h4: createHeadingComponent(4),
  h5: createHeadingComponent(5),
  h6: createHeadingComponent(6),

  // Paragraphs
  p: ({ children, ...props }: any) => (
    <p className="text-gray-700 dark:text-gray-300 leading-7 mb-4" {...props}>
      {children}
    </p>
  ),

  // Lists
  ul: ({ children, ...props }: any) => (
    <ul
      className="space-y-2 mb-6 ml-6 list-disc text-gray-700 dark:text-gray-300"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol
      className="space-y-2 mb-6 ml-6 list-decimal text-gray-700 dark:text-gray-300"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="leading-7" {...props}>
      {children}
    </li>
  ),

  // Links
  a: ({ children, href, ...props }: any) => (
    <a
      href={href}
      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 hover:decoration-blue-600 dark:hover:decoration-blue-400 transition-colors"
      {...props}
    >
      {children}
    </a>
  ),

  // Code
  code: CodeBlock,
  pre: PreBlock,

  // Blockquotes
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-4 border-gray-300 dark:border-gray-600 pl-6 py-2 my-6 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-r"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Tables
  table: ({ children, ...props }: any) => (
    <div className="my-6 overflow-x-auto">
      <table className="min-w-full" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="border-b border-gray-200 dark:border-gray-800" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: any) => (
    <th
      className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td
      className="border-b border-gray-200 dark:border-gray-800 px-4 py-2 text-gray-700 dark:text-gray-300"
      {...props}
    >
      {children}
    </td>
  ),

  // Horizontal rule
  hr: ({ ...props }: any) => (
    <hr
      className="my-8 border-0 border-t border-gray-300 dark:border-gray-600"
      {...props}
    />
  ),

  // Images
  img: ({ src, alt, ...props }: any) => (
    <img
      src={src}
      alt={alt}
      className="max-w-full h-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 my-6"
      {...props}
    />
  ),

  // Custom components
  Callout,

  // Keyboard keys
  kbd: ({ children, ...props }: any) => (
    <kbd
      className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm"
      {...props}
    >
      {children}
    </kbd>
  ),

  FeatureCarousel,
  Button,
  DataGridWrapper,
  SelectWrapper,
  MultiSelectWrapper,
  DemoGrid,
  BarGraphWrapper,
  BreadcrumbWrapper,
  ButtonWrapper,
  CardWrapper,
  ContextMenuWrapper,
  DatePickerWrapper,
  DialogWrapper,
  MaterialInputWrapper,
  FileUploaderWrapper,
  Notice,
  BugWarning,
  MermaidChart,
  WarningBanner,
  DatePickerWrapperBeta,
  DateRangePickerWrapper,
  ToasterWrapper,
  FileUploaderWrapperBeta,
  DialogWrapperBeta,
  InputWrapperBeta,
  ModalWrapperBeta,
  TextareaWrapperBeta,
  OtpInputWrapperBeta,
  ButtonWrapperBeta,
  CheckboxWrapperBeta,
  CheckboxGroupWrapperBeta,
  BreadcrumbWrapperBeta,
  TabsWrapperBeta,
  SpinnerWrapperBeta,
};
