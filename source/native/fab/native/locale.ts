export interface FabLocaleText {
  /** Announced while `loading`. */
  loading: string;
  /** Label of the SpeedDial's main button while open. */
  close: string;
}

export const defaultFabText: FabLocaleText = {
  loading: "Loading",
  close: "Close",
};
