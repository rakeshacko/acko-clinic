import React from "react";
import { useStore } from "../store";

// Bottom tab bar shown only on mobile. Mirrors the navigation that the
// left rail provides on desktop.

export function MobileTabBar() {
  const mobileSidebarOpen = useStore((s) => s.mobileSidebarOpen);
  const showFloorBoard = useStore((s) => s.showFloorBoard);
  const controlPanelOpen = useStore((s) => s.controlPanelOpen);
  const unreads = useStore((s) => s.unreadByChannel);
  const totalUnread = Object.values(unreads).reduce((a, b) => a + b, 0);

  // Close any overlay so the tab switch fully takes effect.
  const dismissOverlays = () => {
    if (useStore.getState().showFloorBoard) useStore.getState().toggleFloorBoard();
    if (useStore.getState().controlPanelOpen) useStore.getState().toggleControlPanel();
  };

  const goHome = () => {
    dismissOverlays();
    useStore.getState().setMobileSidebarOpen(true);
  };
  const goChannel = () => {
    dismissOverlays();
    useStore.getState().setMobileSidebarOpen(false);
  };
  const goFloor = () => {
    if (showFloorBoard) {
      useStore.getState().toggleFloorBoard();
      return;
    }
    if (controlPanelOpen) useStore.getState().toggleControlPanel();
    useStore.getState().toggleFloorBoard();
  };
  const goRun = () => {
    if (controlPanelOpen) {
      useStore.getState().toggleControlPanel();
      return;
    }
    if (showFloorBoard) useStore.getState().toggleFloorBoard();
    useStore.getState().toggleControlPanel();
  };

  return (
    <nav className="bg-[#19171D] text-white border-t border-black/50 flex items-stretch h-[56px] flex-shrink-0 z-30 safe-bottom relative">
      <TabButton
        active={mobileSidebarOpen && !showFloorBoard && !controlPanelOpen}
        icon="🏠"
        label="Home"
        badge={totalUnread > 0 ? totalUnread : undefined}
        onClick={goHome}
      />
      <TabButton
        active={!mobileSidebarOpen && !showFloorBoard && !controlPanelOpen}
        icon="💬"
        label="Channel"
        onClick={goChannel}
      />
      <TabButton active={showFloorBoard} icon="🏥" label="Floor" onClick={goFloor} />
      <TabButton active={controlPanelOpen} icon="🎬" label="Run" onClick={goRun} />
    </nav>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
  badge,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative ${
        active ? "text-white bg-white/10" : "text-white/60 hover:text-white"
      }`}
    >
      <span className="text-[18px] leading-none">{icon}</span>
      <span className="text-[10px] font-medium leading-none">{label}</span>
      {badge !== undefined && (
        <span className="absolute top-2 right-[26%] bg-[#E01E5A] text-white rounded-full text-[10px] leading-[14px] min-w-[16px] h-[16px] px-1 text-center font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}
