// Lightweight telemetry reporter. Never throws - telemetry must not break the game.
export function reportGeneration(
  activityType: "wordle" | "word-search",
  success: boolean,
  options?: { failureReason?: string; durationMs?: number }
) {
  try {
    const payload = JSON.stringify({
      type: "generation",
      activityType,
      success,
      failureReason: options?.failureReason,
      durationMs: options?.durationMs ?? 0,
    });
    fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore telemetry errors
  }
}
