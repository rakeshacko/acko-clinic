import React, { useEffect } from "react";
import { ChannelPane } from "./components/ChannelPane";
import { ControlPanel } from "./components/ControlPanel";
import { FloorBoard } from "./components/FloorBoard";
import { FormModal } from "./components/FormModal";
import { LeftRail } from "./components/LeftRail";
import { Sidebar } from "./components/Sidebar";
import { useStore } from "./store";
import { registerAllTemplates } from "./templates/templates";
import { registerAllScenarios } from "./scenarios";
import { WalkinModal } from "./components/WalkinModal";

export default function App() {
  const showFloorBoard = useStore((s) => s.showFloorBoard);

  useEffect(() => {
    registerAllTemplates();
    registerAllScenarios();
  }, []);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white text-slack-textPrimary">
      <LeftRail />
      <Sidebar />
      <ChannelPane />
      <ControlPanel />
      <FormModal />
      <WalkinModal />
      {showFloorBoard && <FloorBoard />}
    </div>
  );
}
