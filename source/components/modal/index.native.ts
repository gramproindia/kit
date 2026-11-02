// React Native entry. Metro picks this over index.ts on iOS and Android.
export { Modal } from "./native/Modal";
export type {
  ModalHandle,
  ModalProps,
  ModalRenderProps,
  ModalSlot,
  ModalStyleState,
} from "./native/Modal";
export * from "./core";
