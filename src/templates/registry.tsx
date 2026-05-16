import React from "react";
import type { Block } from "../types";

export type TemplateCapability = "both" | "image-only";

export interface TemplateDef<D = any> {
  id: string;
  capability: TemplateCapability;
  // Rich React component for image-mode rendering. Will be wrapped in a faux
  // image frame and have interactivity disabled.
  ImageComponent: React.ComponentType<{ data: D }>;
  // Native block emission for the same data. Returns Block[] that the native
  // renderer can paint. Only required when capability === "both".
  toNativeBlocks?: (data: D) => Block[];
  defaultFilename?: string;
  defaultAlt?: string;
}

const registry = new Map<string, TemplateDef<any>>();

export function registerTemplate<D>(t: TemplateDef<D>) {
  registry.set(t.id, t as TemplateDef<any>);
}

export function getTemplate(id: string): TemplateDef | undefined {
  return registry.get(id);
}

export function templateExists(id: string): boolean {
  return registry.has(id);
}

export function allTemplates(): TemplateDef[] {
  return Array.from(registry.values());
}
