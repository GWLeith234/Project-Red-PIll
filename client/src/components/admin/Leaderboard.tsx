interface LeaderboardItem {
  rank: number;
  name: string;
  value: string | number;
  avatar?: string;
  subtitle?: string;
}

interface LeaderboardProps {
  items: LeaderboardItem[];
}

const RANK_COLORS: Record<number, string> = {
  1: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  2: "text-muted-foreground border-border bg-muted/30",
  3: "text-orange-400 border-orange-500/40 bg-orange-500/10",
};

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function Leaderboard({ items }: LeaderboardProps) {
  return (
    <div className="space-y-1.5" data-testid="leaderboard">
      {items.map((item) => {
        const rankStyle = RANK_COLORS[item.rank] || "text-muted-foreground border-border bg-muted/30";
        return (
          <div
            key={item.rank}
            className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/20 transition-colors"
            data-testid={`leaderboard-item-${item.rank}`}
          >
            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold border ${rankStyle}`}>
              {item.rank}
            </span>
            {item.avatar ? (
              <img src={item.avatar} alt={item.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
                {getInitials(item.name)}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground truncate block" data-testid={`text-leader-name-${item.rank}`}>{item.name}</span>
              {item.subtitle && <span className="text-xs text-muted-foreground truncate block">{item.subtitle}</span>}
            </div>
            <span className="text-sm font-bold text-foreground tabular-nums" data-testid={`text-leader-value-${item.rank}`}>{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}
