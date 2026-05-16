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
import { MobileTabBar } from "./components/MobileTabBar";

export default function App() {
  const showFloorBoard = useStore((s) => s.showFloorBoard);
  const mobileSidebarOpen = useStore((s) => s.mobileSidebarOpen);

  useEffect(() => {
    registerAllTemplates();
    registerAllScenarios();
  }, []);

  return (
    <div
      className="w-screen flex flex-col md:flex-row overflow-hidden bg-white text-slack-textPrimary"
      style={{ height: "100dvh" }}
    >
      {/* LeftRail is hidden on mobile — its actions live in the bottom tab bar. */}
      <div className="hidden md:flex flex-shrink-0">
        <LeftRail />
      </div>

      {/* Sidebar: full-width and flex-1 on mobile when open; fixed 260px on desktop. */}
      <div
        className={`${mobileSidebarOpen ? "flex flex-1" : "hidden"} md:flex md:flex-none flex-col w-full md:w-[260px] min-h-0 min-w-0`}
      >
        <Sidebar />
      </div>

      {/* Channel pane: flex-1 on mobile when sidebar hidden; flex-1 on desktop. */}
      <div
        className={`${mobileSidebarOpen ? "hidden" : "flex flex-1"} md:flex md:flex-1 flex-col min-w-0 min-h-0`}
      >
        <ChannelPane />
      </div>

      {/* Overlays — full-screen on mobile, drawer on desktop. */}
      <ControlPanel />
      <FormModal />
      <WalkinModal />
      {showFloorBoard && <FloorBoard />}

      {/* Mobile bottom navigation. */}
      <div className="md:hidden">
        <MobileTabBar />
      </div>
    </div>
  );
}
