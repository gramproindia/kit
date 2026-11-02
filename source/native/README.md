# Mobile-only components (React Native)

Components that exist only on mobile: app bars, bottom navigation, floating
action buttons, and the like. They have no web version, so they live here
rather than in `source/components/`. Components that exist on both platforms
keep their native view in `source/components/<folder>/native/`.

**Status: beta.** APIs may change between prereleases on the `native` npm tag.

## Layout

```
source/native/<folder>/
  native/<Name>.tsx   the component
  index.ts            entry (native-only, so there is no index.native.ts split)
  README.md
```

## Rules (enforced by `source/components/shared/__tests__/boundaries.test.ts`)

- Never import another component, from here or from `source/components/`.
- Reach shared code only as `../../../components/shared/native/…`,
  `../../../components/shared/core/…`, or
  `../../../components/shared/react/useControllableState`. The CLI rewrites
  `../../../components/shared/` to `../../shared/` when it copies a component
  into a project, which is where `shared/` sits there.
- Import only `react` and `react-native`, and from `react-native` only the APIs
  that react-native-web also implements, so the docs can render live previews.
