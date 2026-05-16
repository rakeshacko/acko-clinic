import { useStore } from "../store";
import { screeningScenario } from "./screening";
import { consultationScenario } from "./consultation";
import { walkinMemberScenario, walkinNonMemberScenario } from "./walkins";
import { singleTestScenario } from "./singleTest";
import { allBranchScenarios } from "./branches";

let registered = false;

export function registerAllScenarios() {
  if (registered) return;
  registered = true;
  const register = useStore.getState().registerScenario;
  register(screeningScenario);
  register(consultationScenario);
  register(walkinMemberScenario);
  register(walkinNonMemberScenario);
  register(singleTestScenario);
  for (const s of allBranchScenarios) register(s);
}
