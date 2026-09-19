"use client";

/*
 * The playground shows every demo, straight from the generated list, so a new
 * component appears here as soon as its wrapper exists.
 */
import { DEMO_LIST } from "../generated/map";
import { heightOf, WIDE } from "../demo-runtime";

export interface PreviewSection {
  id: string;
  title: string;
  /** The doc page, when the component has one. */
  slug: string | null;
  Component: React.ComponentType;
  minHeight: number;
  wide: boolean;
}

export const SECTIONS: PreviewSection[] = DEMO_LIST.map((demo) => ({
  id: demo.name.replace(/Wrapper$/, "").toLowerCase(),
  title: demo.title,
  slug: demo.slug,
  Component: demo.Component,
  minHeight: heightOf(demo.name),
  wide: WIDE.has(demo.name),
}));

export { WhenVisible } from "../demo-runtime";
