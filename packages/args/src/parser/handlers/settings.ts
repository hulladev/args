import type { ParserConfig, ParserSettings } from "@/types/types.public"

export function initSettings<C extends ParserConfig>(config: C): ParserSettings {
  const settings: ParserSettings = {
    caseSensitive: config.settings?.caseSensitive ?? false,
    startIndex: config.settings?.startIndex ?? 0,
    stopIndex: config.settings?.stopIndex ?? null,
    requireEquals: config.settings?.requireEquals ?? false,
    mode: config.settings?.mode ?? "both",
    keepOnlyDetected: config.settings?.keepOnlyDetected ?? false,
  }

  return settings
}
