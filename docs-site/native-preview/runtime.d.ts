/*
 * What the site's type checker sees for `@native-preview/runtime`.
 *
 * The real module (runtime.tsx) pulls in React Native code whose types live
 * in native-playground, not here. tsconfig.json maps the specifier to this
 * file; next.config.ts aliases the bundler to the real one.
 */
export interface PhoneScreenProps {
  demo: string;
  scheme: "light" | "dark";
  width: number;
  height: number;
  onError?(message: string): void;
}

export declare function PhoneScreen(props: PhoneScreenProps): React.JSX.Element;
