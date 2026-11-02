# SearchBar

> **Beta, React Native only.** The API may change between `native` prereleases.

A rounded search field with a magnifier, a clear button, an optional iOS-style Cancel, and a debounced `onSearch` for live results.

| Prop | Type | Default |
| --- | --- | --- |
| `value` / `defaultValue` / `onValueChange` | `string` | `""` |
| `onSearch` | `(value) => void`, debounced; called with `""` on clear | |
| `debounce` | ms | `250` |
| `onSubmit` | the keyboard's search key | |
| `showCancel` / `onCancel` | Cancel button while focused | `false` |
| `loading` | spinner instead of the clear button | `false` |
| `autoFocus`, `disabled`, `placeholder`, `localeText`, `style`, `styles`, `ref` | | |

```tsx
<SearchBar showCancel loading={pending} onSearch={(q) => setQuery(q)} />
```

Strings (`placeholder`, `clear`, `cancel`, `loading`) come from `defaultSearchBarText`; override them with `localeText`.
