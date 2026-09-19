"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, Moon, RotateCcw, Sun } from "lucide-react";
import { useTheme } from "@/app/components/ThemeProvider";
import { docHref, type Locale } from "../../_lib/i18n";
import { t } from "../../_lib/strings";
import {
  PRESETS,
  THEME_GROUPS,
  resolveForScheme,
  toCss,
  withScheme,
  type ThemeVar,
} from "../../_lib/theme-vars";
import { SECTIONS, WhenVisible } from "./previews";

type Values = Record<string, string>;

/**
 * The variables are written on :root, which is where the docs tell you to set
 * them, and the only place that also reaches components rendered in the top
 * layer — menus, tooltips, dialogs and toasts. Nothing else on the page reads
 * --gbs-*, so the docs chrome is unaffected.
 */
function useRootVariables(values: Values) {
  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(values)) root.style.setProperty(`--${name}`, value);
    return () => {
      for (const name of Object.keys(values)) root.style.removeProperty(`--${name}`);
    };
  }, [values]);
}

export function Playground({ locale }: { locale: Locale }) {
  const s = t(locale);
  const { theme, toggleTheme } = useTheme();
  const [values, setValues] = useState<Values>({});
  const [preset, setPreset] = useState("default");
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useRootVariables(values);

  // Before hydration the theme is unknown; assume light so markup matches.
  const scheme: "light" | "dark" = mounted && theme === "dark" ? "dark" : "light";
  const css = useMemo(() => toCss(values), [values]);

  const setVar = useCallback((variable: ThemeVar, raw: string | null) => {
    setPreset("custom");
    setValues((current) => {
      const next = { ...current };
      if (raw === null) delete next[variable.name];
      else next[variable.name] = raw;
      return next;
    });
  }, []);

  const applyPreset = (id: string, presetValues: Values) => {
    setPreset(id);
    setValues(presetValues);
  };

  const copyCss = async () => {
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const changedCount = Object.keys(values).length;

  const controls = (
    <div className="v2-pg-controls">
      <section>
        <p className="v2-nav-heading">{s.pgPresets}</p>
        <div className="v2-pg-presets">
          {PRESETS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="v2-pg-preset"
              aria-pressed={preset === option.id}
              onClick={() => applyPreset(option.id, option.values)}
            >
              <span className="v2-pg-swatch" style={{ background: option.swatch }} aria-hidden />
              {s.pgPresetNames[option.id] ?? option.id}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="v2-nav-heading">{s.pgScheme}</p>
        <button type="button" className="v2-btn w-full" onClick={toggleTheme}>
          {scheme === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
          {scheme === "dark" ? s.pgSchemeLight : s.pgSchemeDark}
        </button>
        <p className="v2-pg-hint">{s.pgSchemeHint}</p>
      </section>

      {THEME_GROUPS.map((group) => (
        <section key={group.id}>
          <p className="v2-nav-heading">{s.pgGroups[group.id] ?? group.id}</p>
          <div className="v2-pg-fields">
            {group.vars.map((variable) => {
              const current = values[variable.name];
              const shown = resolveForScheme(current ?? (scheme === "light" ? variable.light : variable.dark), scheme);
              const isSet = current !== undefined;

              return (
                <div key={variable.name} className="v2-pg-field" data-set={isSet || undefined}>
                  <label className="v2-pg-label" htmlFor={`pg-${variable.name}`} title={variable.use}>
                    <code>--{variable.name}</code>
                  </label>

                  {variable.kind === "color" && (
                    <span className="v2-pg-color">
                      <input
                        id={`pg-${variable.name}`}
                        type="color"
                        value={/^#[0-9a-f]{6}$/i.test(shown) ? shown : "#000000"}
                        onChange={(event) => setVar(variable, withScheme(current, event.target.value, scheme, variable))}
                        aria-label={`--${variable.name}`}
                      />
                      <input
                        type="text"
                        className="v2-pg-text"
                        value={shown}
                        spellCheck={false}
                        onChange={(event) => setVar(variable, withScheme(current, event.target.value, scheme, variable))}
                      />
                    </span>
                  )}

                  {variable.kind === "length" && (
                    <span className="v2-pg-range">
                      <input
                        id={`pg-${variable.name}`}
                        type="range"
                        min={variable.min}
                        max={variable.max}
                        step={variable.step}
                        value={parseFloat(shown) || 0}
                        onChange={(event) => setVar(variable, `${event.target.value}${variable.unit ?? "px"}`)}
                      />
                      <output>{shown}</output>
                    </span>
                  )}

                  {variable.kind === "raw" && (
                    <input
                      id={`pg-${variable.name}`}
                      type="text"
                      className="v2-pg-text"
                      value={shown}
                      spellCheck={false}
                      onChange={(event) => setVar(variable, event.target.value)}
                    />
                  )}

                  {isSet && (
                    <button type="button" className="v2-pg-clear" onClick={() => setVar(variable, null)}>
                      {s.pgReset}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );

  return (
    <main id="v2-main" className="v2-container pt-8 pb-20 md:pt-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{s.pgTitle}</h1>
        <p className="mt-3 max-w-2xl text-base text-pretty text-(--v2-muted) sm:text-lg">{s.pgIntro}</p>
        <p className="mt-3 text-sm text-(--v2-muted)">
          <Link href={docHref("theming", locale)}>{s.pgReadGuide}</Link>
        </p>
      </header>

      <div className="v2-pg">
        <aside className="v2-pg-panel">
          <div className="v2-pg-actions">
            <button type="button" className="v2-btn v2-pg-copy" onClick={copyCss} disabled={changedCount === 0}>
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? s.copied : s.pgCopyCss}
            </button>
            <button
              type="button"
              className="v2-btn"
              onClick={() => applyPreset("default", {})}
              disabled={changedCount === 0}
              aria-label={s.pgResetAll}
              title={s.pgResetAll}
            >
              <RotateCcw className="size-4" aria-hidden />
            </button>
          </div>

          {/* A drawer on phones, an always-open column from md up. */}
          <details className="v2-pg-drawer md:hidden" name="playground">
            <summary>{s.pgOptions}</summary>
            {controls}
          </details>
          <div className="max-md:hidden">{controls}</div>

          <section className="v2-pg-css">
            <p className="v2-nav-heading">{s.pgYourCss}</p>
            <pre>
              <code>{css}</code>
            </pre>
          </section>
        </aside>

        <div className="v2-pg-preview">
          <nav aria-label={s.pgJumpTo} className="v2-pg-jump">
            {SECTIONS.map((section) => (
              <a key={section.id} href={`#pg-${section.id}`}>
                {section.title}
              </a>
            ))}
          </nav>

          <div className="v2-pg-grid">
            {SECTIONS.map(({ id, title, slug, Component, minHeight, wide }) => (
              <section key={id} id={`pg-${id}`} className="v2-pg-card" data-wide={wide || undefined}>
                <header>
                  <h2>{title}</h2>
                  {slug && (
                    <Link href={docHref(slug, locale)} className="v2-pg-doclink">
                      {s.pgDocs}
                    </Link>
                  )}
                </header>
                <div className="v2-pg-stage">
                  <WhenVisible minHeight={minHeight}>
                    <Component />
                  </WhenVisible>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
