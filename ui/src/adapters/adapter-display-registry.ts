/**
 * Single source of truth for adapter display metadata.
 *
 * Built-in adapters have entries in `adapterDisplayMap`. External (plugin)
 * adapters get sensible defaults derived from their type string via
 * `getAdapterDisplay()`.
 */
import type { ComponentType } from "react";
import {
  Bot,
  Code,
  Gem,
  MousePointer2,
  Sparkles,
  Terminal,
  Cpu,
} from "lucide-react";
import { OpenCodeLogoIcon } from "@/components/OpenCodeLogoIcon";
import { HermesIcon } from "@/components/HermesIcon";
import i18n from "@/locales";

// ---------------------------------------------------------------------------
// Type suffix parsing
// ---------------------------------------------------------------------------

const TYPE_SUFFIXES: Record<string, string> = {
  _local: "local",
  _gateway: "gateway",
};

function getTypeSuffix(type: string): string | null {
  for (const [suffix, mode] of Object.entries(TYPE_SUFFIXES)) {
    if (type.endsWith(suffix)) return mode;
  }
  return null;
}

function withSuffix(label: string, suffix: string | null): string {
  return suffix ? `${label} (${suffix})` : label;
}

// ---------------------------------------------------------------------------
// Display metadata per adapter type
// ---------------------------------------------------------------------------

export interface AdapterDisplayInfo {
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  recommended?: boolean;
  comingSoon?: boolean;
  disabledLabel?: string;
  experimental?: boolean;
  hideFromVisualSelection?: boolean;
}

// Base display info (icon, flags) — labels come from i18n at runtime
const adapterBaseMap: Record<string, Omit<AdapterDisplayInfo, "label" | "description"> & { labelKey: string; descKey: string }> = {
  acpx_local: {
    labelKey: "adapters:acpx_local.label",
    descKey: "adapters:acpx_local.description",
    icon: Bot,
    experimental: true,
    hideFromVisualSelection: true,
  },
  claude_local: {
    labelKey: "adapters:claude_local.label",
    descKey: "adapters:claude_local.description",
    icon: Sparkles,
    recommended: true,
  },
  codex_local: {
    labelKey: "adapters:codex_local.label",
    descKey: "adapters:codex_local.description",
    icon: Code,
    recommended: true,
  },
  gemini_local: {
    labelKey: "adapters:gemini_local.label",
    descKey: "adapters:gemini_local.description",
    icon: Gem,
  },
  opencode_local: {
    labelKey: "adapters:opencode_local.label",
    descKey: "adapters:opencode_local.description",
    icon: OpenCodeLogoIcon,
  },
  hermes_local: {
    labelKey: "adapters:hermes_local.label",
    descKey: "adapters:hermes_local.description",
    icon: HermesIcon,
  },
  pi_local: {
    labelKey: "adapters:pi_local.label",
    descKey: "adapters:pi_local.description",
    icon: Terminal,
  },
  cursor: {
    labelKey: "adapters:cursor.label",
    descKey: "adapters:cursor.description",
    icon: MousePointer2,
  },
  cursor_cloud: {
    labelKey: "adapters:cursor_cloud.label",
    descKey: "adapters:cursor_cloud.description",
    icon: MousePointer2,
  },
  openclaw_gateway: {
    labelKey: "adapters:openclaw_gateway.label",
    descKey: "adapters:openclaw_gateway.description",
    icon: Bot,
  },
  process: {
    labelKey: "adapters:process.label",
    descKey: "adapters:process.description",
    icon: Cpu,
    comingSoon: true,
  },
  http: {
    labelKey: "adapters:http.label",
    descKey: "adapters:http.description",
    icon: Cpu,
    comingSoon: true,
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function humanizeType(type: string): string {
  let base = type;
  for (const suffix of Object.keys(TYPE_SUFFIXES)) {
    if (base.endsWith(suffix)) {
      base = base.slice(0, -suffix.length);
      break;
    }
  }
  return base.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getAdapterLabel(type: string): string {
  const base = adapterBaseMap[type] ? i18n.t(adapterBaseMap[type].labelKey) : humanizeType(type);
  return withSuffix(base, getTypeSuffix(type));
}

export function getAdapterLabels(): Record<string, string> {
  const suffixed: Record<string, string> = {};
  for (const [type] of Object.entries(adapterBaseMap)) {
    suffixed[type] = withSuffix(i18n.t(adapterBaseMap[type].labelKey), getTypeSuffix(type));
  }
  return suffixed;
}

export function getAdapterDisplay(type: string): AdapterDisplayInfo {
  const known = adapterBaseMap[type];
  if (known) {
    return {
      ...known,
      label: i18n.t(known.labelKey),
      description: i18n.t(known.descKey),
    };
  }

  const suffix = getTypeSuffix(type);
  const label = withSuffix(humanizeType(type), suffix);
  return {
    label,
    description: suffix
      ? i18n.t("adapters:external.description", { mode: suffix })
      : i18n.t("adapters:external.description", { mode: "" }),
    icon: Cpu,
  };
}

export function isKnownAdapterType(type: string): boolean {
  return type in adapterBaseMap;
}
