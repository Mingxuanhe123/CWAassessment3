"use client";

import { useState, useEffect } from "react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  const expiry = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expiry}; path=/`;
}

type Theme = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark-mode");
    root.classList.remove("light-mode");
  } else {
    root.classList.add("light-mode");
    root.classList.remove("dark-mode");
  }
}

export default function SettingsClient() {
  const [theme, setTheme] = useState<Theme>("light");
  const [guessCount, setGuessCount] = useState(6);
  const [showHints, setShowHints] = useState(true);

  useEffect(() => {
    const savedTheme = (getCookie("theme") as Theme) || "light";
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const savedGuesses = getCookie("guessCount");
    if (savedGuesses) setGuessCount(Number(savedGuesses));
    const savedHints = getCookie("showHints");
    if (savedHints !== null) setShowHints(savedHints === "true");

    // Listen for system theme changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const currentTheme = (getCookie("theme") as Theme) || "light";
      if (currentTheme === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function updateTheme(newTheme: Theme) {
    setTheme(newTheme);
    setCookie("theme", newTheme);
    applyTheme(newTheme);
  }

  function updateGuessCount(count: number) {
    setGuessCount(count);
    setCookie("guessCount", String(count));
  }

  function toggleHints(show: boolean) {
    setShowHints(show);
    setCookie("showHints", String(show));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold mb-8">Settings</h2>

      <section className="mb-8 bg-white p-6 rounded-lg shadow border" style={theme === "dark" ? { backgroundColor: "#2d2d44", borderColor: "#444" } : {}}>
        <h3 className="text-xl font-semibold mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-700" style={theme === "dark" ? { color: "#e0e0e0" } : {}}>Theme</span>
          <div className="flex gap-2">
            <button
              onClick={() => updateTheme("light")}
              className={`px-4 py-2 rounded-md transition-colors ${
                theme === "light" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => updateTheme("dark")}
              className={`px-4 py-2 rounded-md transition-colors ${
                theme === "dark" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              🌙 Dark
            </button>
            <button
              onClick={() => updateTheme("system")}
              className={`px-4 py-2 rounded-md transition-colors ${
                theme === "system" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              💻 System
            </button>
          </div>
        </div>
      </section>

      <section className="mb-8 bg-white p-6 rounded-lg shadow border" style={theme === "dark" ? { backgroundColor: "#2d2d44", borderColor: "#444" } : {}}>
        <h3 className="text-xl font-semibold mb-4">Wordle Defaults</h3>

        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-700" style={theme === "dark" ? { color: "#e0e0e0" } : {}}>Number of Guesses</span>
          <select
            value={guessCount}
            onChange={(e) => updateGuessCount(Number(e.target.value))}
            className="border rounded-md px-3 py-2"
            style={theme === "dark" ? { backgroundColor: "#3d3d5c", color: "#e0e0e0", borderColor: "#555" } : {}}
          >
            {[3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-700" style={theme === "dark" ? { color: "#e0e0e0" } : {}}>Show Hints by Default</span>
          <button
            onClick={() => toggleHints(!showHints)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              showHints ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                showHints ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </section>
    </div>
  );
}
