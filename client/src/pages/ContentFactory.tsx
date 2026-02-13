import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Mic, 
  FileText, 
  Video, 
  Twitter, 
  Linkedin, 
  Mail, 
  ArrowRight, 
  Wand2, 
  CheckCircle2, 
  Loader2,
  Clock,
  Youtube,
  Search,
  Upload
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContentFactory() {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700">
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Content Factory</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">AI Multiplication Engine: Active</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-mono text-xs uppercase tracking-wider border-border bg-card/50">
            <Clock className="mr-2 h-3 w-3" />
            Queue History
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider">
            <Upload className="mr-2 h-3 w-3" />
            Upload New Episode
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Left Column: Source Input */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="glass-panel border-primary/20 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent animate-pulse"></div>
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Mic className="mr-2 h-5 w-5" />
                Source Material
              </CardTitle>
              <CardDescription className="font-mono text-xs">Currently Processing</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-6">
              <div className="bg-card/50 p-6 rounded-lg border border-border flex flex-col items-center justify-center space-y-4 flex-1">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                  <Mic className="h-10 w-10 text-primary animate-pulse" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold font-display">Episode #142: The Future of Media</h3>
                  <p className="text-sm text-muted-foreground font-mono mt-1">Scott Jennings Podcast • 48:12</p>
                </div>
                
                {/* Audio Waveform Visualization Placeholder */}
                <div className="w-full h-16 flex items-center justify-center gap-1 mt-4">
                  {[...Array(20)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-primary/50 rounded-full animate-[bounce_1s_infinite]"
                      style={{ 
                        height: `${Math.random() * 100}%`,
                        animationDelay: `${i * 0.05}s`
                      }} 
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">Analysis Progress</span>
                  <span className="text-primary font-mono">78%</span>
                </div>
                <Progress value={78} className="h-2 bg-secondary" indicatorClassName="bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                
                <div className="space-y-2 mt-4">
                  <StepItem status="complete" label="Audio Transcription" />
                  <StepItem status="complete" label="Sentiment Analysis" />
                  <StepItem status="complete" label="Topic Extraction" />
                  <StepItem status="processing" label="Content Generation" />
                  <StepItem status="pending" label="SEO Optimization" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Output Matrix */}
        <div className="col-span-12 lg:col-span-8">
          <div className="grid grid-cols-2 gap-4 h-full overflow-y-auto pr-2 pb-2">
            <OutputCard 
              icon={Video} 
              title="Viral Clips" 
              count={5} 
              total={8}
              color="text-red-500"
              items={[
                { title: "The Mainstream Media Dying", platform: "TikTok", status: "ready" },
                { title: "Why X Won the Election", platform: "Reels", status: "ready" },
                { title: "Crypto Regulation Debate", platform: "Shorts", status: "generating" },
              ]}
            />
            
            <OutputCard 
              icon={FileText} 
              title="Articles & Blogs" 
              count={2} 
              total={3}
              color="text-blue-500"
              items={[
                { title: "5 Takeaways from Ep 142", platform: "Substack", status: "ready" },
                { title: "Media Tech Revolution", platform: "Website", status: "review" },
              ]}
            />
            
            <OutputCard 
              icon={Twitter} 
              title="Social Threads" 
              count={12} 
              total={15}
              color="text-sky-400"
              items={[
                { title: "Key Quotes Thread", platform: "Twitter/X", status: "ready" },
                { title: "Behind the Scenes", platform: "Twitter/X", status: "ready" },
                { title: "Poll Question", platform: "Twitter/X", status: "scheduled" },
              ]}
            />
            
            <OutputCard 
              icon={Linkedin} 
              title="Professional Posts" 
              count={1} 
              total={2}
              color="text-indigo-400"
              items={[
                { title: "Industry Analysis", platform: "LinkedIn", status: "generating" },
              ]}
            />

            <OutputCard 
              icon={Mail} 
              title="Newsletter" 
              count={1} 
              total={1}
              color="text-amber-400"
              items={[
                { title: "Weekly Roundup", platform: "Email", status: "generating" },
              ]}
            />

            <OutputCard 
              icon={Search} 
              title="SEO Assets" 
              count={0} 
              total={4}
              color="text-emerald-400"
              items={[
                { title: "Backlink Generation", platform: "Network", status: "pending" },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepItem({ status, label }: { status: "complete" | "processing" | "pending", label: string }) {
  return (
    <div className="flex items-center text-sm">
      <div className="mr-3 w-5 flex justify-center">
        {status === "complete" && <CheckCircle2 className="h-4 w-4 text-accent" />}
        {status === "processing" && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
        {status === "pending" && <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
      </div>
      <span className={cn(
        status === "complete" ? "text-foreground" : 
        status === "processing" ? "text-primary font-medium" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </div>
  );
}

function OutputCard({ icon: Icon, title, count, total, color, items }: any) {
  return (
    <Card className="glass-panel border-border/50 hover:border-primary/30 transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <div className={cn("p-2 rounded-md bg-card border border-border", color.replace('text-', 'bg-') + '/10')}>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div>
              <CardTitle className="text-base font-bold">{title}</CardTitle>
              <CardDescription className="text-xs font-mono mt-0.5">
                {count}/{total} Generated
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={(count / total) * 100} className="h-1 mt-3" indicatorClassName={cn(color.replace('text-', 'bg-'))} />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 mt-2">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 rounded bg-card/30 border border-transparent hover:border-border transition-colors text-sm">
              <span className="truncate max-w-[140px] font-medium">{item.title}</span>
              <Badge variant="outline" className={cn(
                "text-[10px] uppercase font-mono h-5 px-1.5",
                item.status === "ready" ? "border-accent text-accent bg-accent/10" :
                item.status === "generating" ? "border-primary text-primary bg-primary/10 animate-pulse" :
                "border-muted text-muted-foreground"
              )}>
                {item.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
