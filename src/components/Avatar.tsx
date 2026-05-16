import React from "react";
import { getStaff } from "../seed";

type AvatarProps = {
  author: string;
  size?: number;
  className?: string;
};

const BOT_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  VisitBot: { bg: "#4A154B", fg: "#FFFFFF", label: "VB" },
  PodBot: { bg: "#1264A3", fg: "#FFFFFF", label: "PB" },
  AppRelay: { bg: "#2EB67D", fg: "#FFFFFF", label: "AR" },
};

export function Avatar({ author, size = 36, className = "" }: AvatarProps) {
  const isBot = !!BOT_COLORS[author];
  if (isBot) {
    const { bg, fg, label } = BOT_COLORS[author];
    return (
      <div
        className={`flex items-center justify-center font-bold rounded ${className}`}
        style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.42 }}
      >
        {label}
      </div>
    );
  }
  if (author === "system") {
    return (
      <div
        className={`flex items-center justify-center rounded ${className}`}
        style={{ width: size, height: size, background: "#9D9D9D", color: "#fff", fontSize: size * 0.4 }}
      >
        S
      </div>
    );
  }
  const staff = getStaff(author);
  const color = staff?.avatarColor ?? "#7BA694";
  const initials = (staff?.name ?? author)
    .split(/[\s.]+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`flex items-center justify-center font-bold rounded ${className}`}
      style={{ width: size, height: size, background: color, color: "#fff", fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}
