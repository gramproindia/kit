"use client";

import {
  use,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type ChangeEvent,
  type ChangeEventHandler,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { useControllableState } from "../../shared/react/useControllableState";
import { describeField } from "../../shared/core/field";
import type { RadioSize } from "../core/types";
import { RadioGroupContext } from "./context";
import { useDomSync } from "./domSync";
import { cx, type RadioSlot } from "./props";

export interface RadioProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "size" | "checked" | "defaultChecked" | "onChange"
  > {
  /** The value this choice contributes to its group. */
  value: string;
  /** Selected (controlled). Inside a RadioGroup the group decides instead. */
  checked?: boolean;
  /** Selected to begin with, for a standalone radio you are not controlling. */
  defaultChecked?: boolean;
  /**
   * This radio was chosen. Only ever fires with `true`, since choosing
   * another radio deselects this one rather than firing on it — to follow a
   * group's choice, use `onValueChange` on the RadioGroup.
   */
  onCheckedChange?(checked: boolean): void;
  /**
   * The underlying DOM event, for form libraries that want the native
   * handler.
   */
  onChange?: ChangeEventHandler<HTMLInputElement>;
  /** The text beside the radio. Clicking it selects this choice. */
  label?: ReactNode;
  /** A hint under the label, linked as this choice's description. */
  description?: ReactNode;
  /**
   * The validation message for this one choice. A message that applies to the
   * whole question belongs on the RadioGroup instead.
   */
  error?: ReactNode;
  /** Default `md`, or the size of the RadioGroup it sits in. */
  size?: RadioSize;
  classNames?: Partial<Record<RadioSlot, string>>;
  /** The `<input>` element. */
  ref?: Ref<HTMLInputElement>;
}

// Every standalone radio whose checked state the browser owns, so each can
// look again when a script checks another radio of its name: the browser
// unchecks the old one without telling it.
const domOwnedRadios = new Set<() => void>();

/**
 * One choice, as a native radio. Inside a `RadioGroup` the group owns the
 * value; on its own it behaves like any other radio sharing a `name`.
 *
 * Nothing here manages focus: radios that share a `name` already roam with the
 * arrow keys, skip the disabled ones, wrap around and leave one tab stop for
 * the whole group — in every browser, and without JavaScript.
 */
export function Radio(props: RadioProps) {
  const {
    ref,
    value,
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    onChange,
    label,
    description,
    error,
    size,
    className,
    classNames,
    style,
    id: idProp,
    disabled,
    required,
    name,
    "aria-describedby": describedByProp,
    ...inputProps
  } = props;

  const group = use(RadioGroupContext);
  const reactId = useId();
  const id = idProp ?? reactId;
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);

  const [own, setOwn, controlled] = useControllableState(checkedProp, defaultChecked);
  const checked = group !== null ? group.value === value : own;
  // A standalone radio nobody controls is left to the browser, which already
  // knows that checking one radio unchecks the others of its name. Rendering
  // `checked` from state here would have React put a deselected radio back.
  // `own` then only mirrors the DOM, for `data-checked`.
  const domOwned = group === null && !controlled;

  useEffect(() => {
    const input = inputRef.current;
    if (!domOwned || !input) return;
    const refresh = () => setOwn(input.checked);
    // Choosing another radio of this name unchecks this one without an event
    // on it; the `change` on the radio chosen is the only sign.
    const handleChange = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      if (target?.type === "radio" && target.name === input.name && target.form === input.form) refresh();
    };
    domOwnedRadios.add(refresh);
    input.ownerDocument.addEventListener("change", handleChange);
    return () => {
      domOwnedRadios.delete(refresh);
      input.ownerDocument.removeEventListener("change", handleChange);
    };
  }, [domOwned, setOwn]);

  // A form reset, or a form library writing `el.checked`. In a group the group
  // takes the change and resets itself; a standalone radio re-reads the DOM.
  useDomSync(
    inputRef,
    "checked",
    checked,
    {
      // The browser has already put a standalone radio back to its default.
      onReset: () => {
        if (group === null && inputRef.current) setOwn(inputRef.current.checked);
        return undefined;
      },
      onWrite: (next) => {
        if (group !== null) {
          if (next) group.select(value);
          else if (group.value === value) group.select(null);
        } else {
          domOwnedRadios.forEach((refresh) => refresh());
        }
      },
    },
    group !== null || domOwned,
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (group !== null) group.select(value);
    else setOwn(event.target.checked);
    onChange?.(event);
    onCheckedChange?.(event.target.checked);
  };

  // Either one disables it, as on native: `disabled={false}` on one radio
  // does not switch a disabled group back on.
  const isDisabled = disabled || group?.disabled;
  const invalid = Boolean(error) || (group?.invalid ?? false);
  const describedBy = describeField(id, { extra: describedByProp, description, error });

  return (
    <div
      className={cx("rd-root", classNames?.root, className)}
      style={style}
      data-size={size ?? group?.size ?? "md"}
      data-variant={group?.variant ?? "default"}
      data-checked={checked || undefined}
      data-disabled={isDisabled || undefined}
      data-invalid={invalid ? "" : undefined}
    >
      <span className={cx("rd-control", classNames?.control)}>
        <input
          {...inputProps}
          ref={inputRef}
          id={id}
          type="radio"
          className={cx("rd-input", classNames?.input)}
          checked={domOwned ? undefined : checked}
          defaultChecked={domOwned ? defaultChecked : undefined}
          value={value}
          name={name ?? group?.name}
          disabled={isDisabled}
          // Every radio in a group carries `required`, which is how a browser
          // validates the group as a whole rather than one button in it.
          required={required ?? group?.required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={handleChange}
        />
        <span className="rd-dot" aria-hidden="true" />
      </span>

      {(label || description || error) && (
        <span className="rd-text">
          {label && (
            <label htmlFor={id} className={cx("rd-label", classNames?.label)}>
              {label}
            </label>
          )}
          {description && (
            <span id={`${id}-description`} className={cx("rd-description", classNames?.description)}>
              {description}
            </span>
          )}
          {error && (
            <span id={`${id}-error`} className={cx("rd-error", classNames?.error)} role="alert">
              {error}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
