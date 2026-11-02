# ListItem, List, ListSection

> **Beta, React Native only.** The API may change between `native` prereleases.

Rows for settings screens, contacts, inboxes: leading icon or avatar, title and supporting text, and a trailing value, control or chevron. `List` draws dividers between rows; `ListSection` adds a header and footer note and defaults to the rounded `inset` look (iOS settings).

**ListItem:** `leading`, `title`, `description`, `numberOfLines` (2), `value`, `trailing`, `chevron`, `destructive`, `disabled`, `onPress`, `onLongPress`, `style` (or a function of `{ pressed }`), `styles` (`leading`, `title`, `description`, `value`, `trailing`).

**List:** `variant` (`"plain"` | `"inset"`), `divided` (`true`). **ListSection:** `header`, `footer`, plus the List props.

```tsx
<ListSection header="Account" footer="Signed in as anand@example.com">
  <ListItem title="Language" value="English" chevron onPress={openLanguage} />
  <ListItem title="Notifications" trailing={<Switch checked={on} onCheckedChange={setOn} />} />
  <ListItem title="Sign out" destructive onPress={signOut} />
</ListSection>
```

Rows are at least 44dp tall (56dp with a description). A pressable row with a chevron is announced as a link, otherwise as a button.
