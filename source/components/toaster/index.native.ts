// React Native entry. Metro picks this over index.ts on iOS and Android.
export { Toaster } from "./native/Toaster";
export type { ToasterProps } from "./native/Toaster";
export type { ToasterSlot, ToasterStyles } from "./native/ToastItem";
export { useToasts } from "./hooks/useToasts";
export * from "./core";
