import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Mic, 
  Users, 
  TrendingUp, 
  Settings, 
  Plus, 
  MoreHorizontal,
  Play,
  BarChart3,
  Globe
} from "lucide-react";

const podcasts = [
  { 
    title: "The Scott Jennings Show", 
    host: "Scott Jennings", 
    cover: "/images/podcast-cover-scott.png",
    subscribers: "842K",
    growth: "+12%",
    episodes: 142,
    multiplicationFactor: 54, // 1 ep -> 54 assets
    status: "Active"
  },
  { 
    title: "Conservative Review", 
    host: "Network Team", 
    cover: null, // Fallback
    subscribers: "125K",
    growth: "+5%",
    episodes: 45,
    multiplicationFactor: 32,
    status: "Active"
  },
  { 
    title: "Market Watch Daily", 
    host: "Finance Desk", 
    cover: null,
    subscribers: "45K",
    growth: "+22%",
    episodes: 12,
    multiplicationFactor: 45,
    status: "Beta"
  }
];

export default function Network() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Podcast Network</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">Managing 3 Shows | Total Reach: 1.1M</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider">
          <Plus className="mr-2 h-3 w-3" />
          Add Show
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {podcasts.map((show, i) => (
          <Card key={i} className="glass-panel border-border/50 overflow-hidden group hover:border-primary/40 transition-all duration-300">
            <div className="h-32 bg-secondary/50 relative">
              {show.cover ? (
                <img src={show.cover} alt={show.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-card">
                  <Mic className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
              <div className="absolute top-3 right-3">
                <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-transparent text-foreground uppercase text-[10px] font-mono">
                  {show.status}
                </Badge>
              </div>
            </div>
            
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="font-display text-xl">{show.title}</CardTitle>
                  <CardDescription className="text-sm">{show.host}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-mono uppercase">Audience</p>
                  <div className="flex items-center">
                    <Users className="h-3 w-3 mr-1 text-primary" />
                    <span className="font-bold text-lg">{show.subscribers}</span>
                  </div>
                  <p className="text-[10px] text-accent">{show.growth} this month</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-mono uppercase">Content Power</p>
                  <div className="flex items-center">
                    <Globe className="h-3 w-3 mr-1 text-purple-400" />
                    <span className="font-bold text-lg">{show.multiplicationFactor}x</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Assets per Ep</p>
                </div>
              </div>
              
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Network Saturation</span>
                  <span className="text-foreground font-mono">85%</span>
                </div>
                <Progress value={85} className="h-1" indicatorClassName="bg-gradient-to-r from-primary to-purple-500" />
              </div>
            </CardContent>
            
            <CardFooter className="bg-card/30 p-4 flex gap-2 border-t border-border/50">
              <Button className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary-foreground text-xs h-8">
                <Settings className="mr-2 h-3 w-3" />
                Manage
              </Button>
              <Button className="flex-1 bg-secondary/50 text-foreground hover:bg-secondary hover:text-white text-xs h-8">
                <BarChart3 className="mr-2 h-3 w-3" />
                Analytics
              </Button>
            </CardFooter>
          </Card>
        ))}

        {/* New Show Placeholder */}
        <button className="border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center h-full min-h-[300px] hover:border-primary/50 hover:bg-primary/5 transition-all group">
          <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
          </div>
          <h3 className="font-display text-lg font-medium text-muted-foreground group-hover:text-primary">Onboard New Show</h3>
          <p className="text-sm text-muted-foreground/50 mt-1 max-w-[200px] text-center">Import RSS feed or create from scratch</p>
        </button>
      </div>
    </div>
  );
}
