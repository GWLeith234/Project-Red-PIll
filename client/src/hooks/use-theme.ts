import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme-preference";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") return getSystemTheme();
  return mode;
}

export function useTheme() {
  const { data: branding } = useQuery<{ themeMode?: string }>({
    queryKey: ["/api/branding"],
    queryFn: async () => {
      const res = await fetch("/api/branding");
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 60000,
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") return stored;
    } catch {}
    return "dark";
  });

  const [brandingLoaded, setBrandingLoaded] = useState(false);

  useEffect(() => {
    if (branding && !brandingLoaded) {
      setBrandingLoaded(true);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const brandingMode = branding.themeMode as ThemeMode;
        if (brandingMode === "light" || brandingMode === "dark" || brandingMode === "system") {
          setModeState(brandingMode);
        }
      }
    }
  }, [branding, brandingLoaded]);

  const theme = resolveTheme(mode);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme(getSystemTheme());
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [mode]);

  const setTheme = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    try { localStorage.setItem(STORAGE_KEY, newMode); } catch {}
  }, []);

  return { theme, mode, setTheme };
}
