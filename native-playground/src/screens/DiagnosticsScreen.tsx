import { IntlSpike } from "../../spikes/intl/IntlSpike";
import { Screen } from "../ui/kit";

/** Phase 0, spike S1: Kit's date and number code on this phone's Hermes, against Node. */
export function DiagnosticsScreen() {
  return (
    <Screen title="Diagnostics" subtitle="Intl on Hermes" scroll={false}>
      <IntlSpike />
    </Screen>
  );
}
