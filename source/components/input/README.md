# Input and OtpInput

Text fields for React 19, styled to match the rest of the library. No runtime
dependencies besides React.

- **`<Input>`** — label, hint, error, leading/trailing adornments, clear button,
  password reveal and a character counter. Every other prop goes to the `<input>`.
- **`<OtpInput>`** — one-time codes. A single real `<input>` drawn as cells, so SMS
  autofill (`autocomplete="one-time-code"`), paste and screen readers work as for
  one field.

## Setup

```ts
import { Input, OtpInput } from "@/components/input";
import "@/components/input/styles.css";
```

## Usage

```tsx
<Input label="Email" type="email" value={email} onValueChange={setEmail} clearable />
<Input label="Password" type="password" name="password" required />
<OtpInput label="Code" groups={[3, 3]} onComplete={verify} />
```

## Props

`Input`: all `<input>` attributes plus `value`, `defaultValue`, `onValueChange`,
`label`, `description`, `error`, `size` (`sm` `md` `lg`), `leading`, `trailing`,
`clearable`, `revealPassword` (default `true`), `showCount`, `classNames`
(`root` `label` `control` `input` `description` `error` `count`), `localeText`,
and `ref` (the `<input>`).

`OtpInput`: `length` (6), `mode` (`numeric` `alphanumeric` `alphabetic`),
`uppercase`, `value`, `defaultValue`, `onValueChange`, `onComplete`, `groups`,
`mask`, `label`, `description`, `error`, `size`, `name`, `required`, `disabled`,
`classNames` (`root` `label` `cells` `cell` `separator` `description` `error`),
`localeText`, and `ref` (the `<input>`).

With `maxLength`, the counter counts what the limit counts: UTF-16 units, as
browsers and React Native enforce it, so an emoji such as 👍🏽 counts as 4 and
the counter reads 10 / 10 exactly when typing stops. Without `maxLength` it
counts characters as people see them. A form reset, or a form library setting
the value directly, updates the counter and the clear button too.

## Headless use

`sanitizeOtp`, `otpPattern`, `otpInputMode`, `separatorsAfter`, `activeCell`,
`cellAt`, `countCharacters` and `counterValue` are exported from the
framework-free `core`.
