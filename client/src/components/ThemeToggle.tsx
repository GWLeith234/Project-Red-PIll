import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

const modes = ["dark", "light", "system"] as const;
const modeLabels = { dark: "Dark", light: "Light", system: "System" };
const modeIcons = { dark: Moon, light: Sun, system: Monitor };

export default function ThemeToggle({ compact }: { compact?: boolean }) {
  const { mode, setTheme } = useTheme();

  const cycle = () => {
    const idx = modes.indexOf(mode);
    const next = modes[(idx + 1) % modes.length];
    setTheme(next);
  };

  const Icon = modeIcons[mode];
  const label = modeLabels[mode];

  return (
    <button
      onClick={cycle}
      className="p-1.5 hover:bg-muted rounded-sm transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
      title={`Theme: ${label}`}
      data-testid="button-theme-toggle"
    >
      <Icon className={compact ? "h-4 w-4" : "h-4 w-4"} />
    </button>
  );
}
