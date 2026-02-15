import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

function hexToHsl(hex: string): string | null {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  if (hex.length !== 6) return null;

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return `0 0% ${Math.round(l * 100)}%`;

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function computeForeground(hex: string): string {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "222 47% 11%" : "0 0% 100%";
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { data: branding } = useQuery({
    queryKey: ["/api/branding"],
    queryFn: async () => {
      const res = await fetch("/api/branding");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30000,
    retry: false,
  });

  useEffect(() => {
    const root = document.documentElement;

    const defaults: Record<string, string> = {
      "--primary": "217 91% 60%",
      "--primary-foreground": "222 47% 11%",
      "--ring": "217 91% 60%",
      "--gold": "45 93% 47%",
      "--accent": "160 84% 39%",
      "--accent-foreground": "210 40% 98%",
      "--sidebar-primary": "217 91% 60%",
      "--sidebar-primary-foreground": "0 0% 100%",
      "--sidebar-ring": "217 91% 60%",
      "--sidebar-accent": "217 19% 27%",
      "--sidebar-accent-foreground": "210 40% 98%",
      "--sidebar-border": "217 32% 17%",
      "--chart-1": "217 91% 60%",
      "--chart-2": "160 84% 39%",
    };

    if (!branding) {
      Object.entries(defaults).forEach(([prop, val]) => {
        root.style.setProperty(prop, val);
      });
      return;
    }

    if (branding.primaryColor) {
      const hsl = hexToHsl(branding.primaryColor);
      if (hsl) {
        root.style.setProperty("--primary", hsl);
        root.style.setProperty("--ring", hsl);
        root.style.setProperty("--gold", hsl);
        root.style.setProperty("--sidebar-primary", hsl);
        root.style.setProperty("--sidebar-ring", hsl);
        root.style.setProperty("--chart-1", hsl);

        const fg = computeForeground(branding.primaryColor);
        root.style.setProperty("--primary-foreground", fg);
        root.style.setProperty("--sidebar-primary-foreground", fg);

        const hslParts = hsl.split(" ");
        if (hslParts.length === 3) {
          const h = parseInt(hslParts[0]);
          root.style.setProperty("--sidebar-accent", `${h} 19% 20%`);
          root.style.setProperty("--sidebar-accent-foreground", "210 40% 98%");
          root.style.setProperty("--sidebar-border", `${h} 32% 17%`);
        }
      }
    } else {
      ["--primary", "--primary-foreground", "--ring", "--gold",
       "--sidebar-primary", "--sidebar-primary-foreground", "--sidebar-ring",
       "--sidebar-accent", "--sidebar-accent-foreground", "--sidebar-border",
       "--chart-1"].forEach(prop => root.style.setProperty(prop, defaults[prop]));
    }

    if (branding.accentColor) {
      const hsl = hexToHsl(branding.accentColor);
      if (hsl) {
        root.style.setProperty("--accent", hsl);
        root.style.setProperty("--accent-foreground", computeForeground(branding.accentColor));
        root.style.setProperty("--chart-2", hsl);
      }
    } else {
      ["--accent", "--accent-foreground", "--chart-2"].forEach(prop =>
        root.style.setProperty(prop, defaults[prop])
      );
    }

    if (branding.companyName) {
      document.title = branding.companyName;
    }

    if (branding.faviconUrl) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = branding.faviconUrl;
    }
  }, [branding]);

  return <>{children}</>;
}
