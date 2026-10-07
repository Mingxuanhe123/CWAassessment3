"use client";

import { useEffect } from "react";

/**
 * Records time-on-page telemetry when the user leaves the page.
 * Sends a pageview event to POST /api/telemetry.
 */
export default function usePageTime(path: string) {
  useEffect(() => {
    const start = Date.now();

    function flush() {
      const durationMs = Date.now() - start;
      if (durationMs < 500) return; // ignore accidental bounces
      const payload = JSON.stringify({ type: "pageview", path, durationMs });
      try {
        navigator.sendBeacon?.("/api/telemetry", new Blob([payload], { type: "application/json" })) ||
          fetch("/api/telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          });
      } catch {
        // telemetry must never break the UI
      }
    }

    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [path]);
}
