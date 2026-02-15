import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Sparkles, Search, Loader2, ImagePlus, Camera, Check, AlertTriangle, ExternalLink } from "lucide-react";

interface ImageStudioProps {
  open: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  defaultPrompt?: string;
}

interface StockPhoto {
  id: number;
  width: number;
  height: number;
  photographer: string;
  alt: string;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    thumbnail: string;
  };
}

export function ImageStudio({ open, onClose, onSelect, defaultPrompt = "" }: ImageStudioProps) {
  const [tab, setTab] = useState("ai");
  const [aiPrompt, setAiPrompt] = useState(defaultPrompt);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [stockQuery, setStockQuery] = useState(defaultPrompt);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockPhotos, setStockPhotos] = useState<StockPhoto[]>([]);
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockNeedsKey, setStockNeedsKey] = useState(false);
  const [stockPage, setStockPage] = useState(1);
  const [stockTotal, setStockTotal] = useState(0);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAiPrompt(defaultPrompt);
      setStockQuery(defaultPrompt);
      setAiResult(null);
      setAiError(null);
      setStockPhotos([]);
      setStockError(null);
      setSelectedStock(null);
    }
  }, [open, defaultPrompt]);

  const handleGenerateAi = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: aiPrompt, size: "1024x1024" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Generation failed");
      }
      const data = await res.json();
      setAiResult(data.url);
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  }, [aiPrompt]);

  const handleStockSearch = useCallback(async (page = 1) => {
    if (!stockQuery.trim()) return;
    setStockLoading(true);
    setStockError(null);
    setStockNeedsKey(false);
    try {
      const res = await fetch(`/api/images/stock-search?q=${encodeURIComponent(stockQuery)}&page=${page}&per_page=12`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      if (data.needs_key) {
        setStockNeedsKey(true);
        setStockPhotos([]);
        return;
      }
      setStockPhotos(data.photos || []);
      setStockTotal(data.total_results || 0);
      setStockPage(page);
    } catch (err: any) {
      setStockError(err.message);
    } finally {
      setStockLoading(false);
    }
  }, [stockQuery]);

  const handleSelect = (url: string) => {
    onSelect(url);
    onClose();
    setAiResult(null);
    setSelectedStock(null);
    setStockPhotos([]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-primary" />
            Image Studio
          </DialogTitle>
          <DialogDescription>
            Generate custom AI images or search royalty-free stock photos
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 min-h-0 flex flex-col">
          <TabsList className="bg-card/50 border border-border/50 w-full" data-testid="tabs-image-studio">
            <TabsTrigger value="ai" className="flex-1 font-mono text-xs uppercase tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-ai-generate">
              <Sparkles className="mr-1.5 h-3 w-3" /> AI Generate
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex-1 font-mono text-xs uppercase tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-stock-search">
              <Camera className="mr-1.5 h-3 w-3" /> Stock Photos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="flex-1 min-h-0 overflow-y-auto mt-4 space-y-4">
            <div className="space-y-3">
              <Textarea
                placeholder="Describe the image you want to create... e.g. 'A professional podcast studio with warm lighting and microphone in foreground'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="min-h-[80px] resize-none"
                data-testid="input-ai-prompt"
              />
              <Button
                onClick={handleGenerateAi}
                disabled={aiLoading || !aiPrompt.trim()}
                className="w-full"
                data-testid="button-generate-ai-image"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>

            {aiError && (
              <div className="flex items-center gap-2 p-3 border border-red-500/30 bg-red-500/5 rounded-lg text-sm text-red-400" data-testid="text-ai-error">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {aiError}
              </div>
            )}

            {aiLoading && (
              <div className="space-y-3">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <p className="text-xs text-muted-foreground text-center font-mono">Generating your image... this may take 10-20 seconds</p>
              </div>
            )}

            {aiResult && (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50 bg-black/20">
                  <img src={aiResult} alt="AI generated" className="w-full h-full object-cover" data-testid="img-ai-result" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleSelect(aiResult)} className="flex-1" data-testid="button-use-ai-image">
                    <Check className="mr-2 h-4 w-4" /> Use This Image
                  </Button>
                  <Button variant="outline" onClick={handleGenerateAi} disabled={aiLoading} data-testid="button-regenerate">
                    <Sparkles className="mr-2 h-4 w-4" /> Regenerate
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stock" className="flex-1 min-h-0 overflow-y-auto mt-4 space-y-4">
            <form onSubmit={(e) => { e.preventDefault(); handleStockSearch(1); }} className="flex gap-2">
              <Input
                placeholder="Search royalty-free photos..."
                value={stockQuery}
                onChange={(e) => setStockQuery(e.target.value)}
                className="flex-1"
                data-testid="input-stock-search"
              />
              <Button type="submit" disabled={stockLoading || !stockQuery.trim()} data-testid="button-search-stock">
                {stockLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>

            {stockNeedsKey && (
              <div className="p-4 border border-amber-500/30 bg-amber-500/5 rounded-lg text-center space-y-2" data-testid="text-stock-needs-key">
                <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
                <p className="text-sm text-amber-300 font-semibold">Stock Photo Search Not Configured</p>
                <p className="text-xs text-muted-foreground">
                  To enable stock photo search, add a free Pexels API key to your secrets as <code className="px-1 py-0.5 bg-muted rounded text-xs">PEXELS_API_KEY</code>.
                </p>
                <a
                  href="https://www.pexels.com/api/new/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Get a free API key <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {stockError && (
              <div className="flex items-center gap-2 p-3 border border-red-500/30 bg-red-500/5 rounded-lg text-sm text-red-400">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {stockError}
              </div>
            )}

            {stockLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-video rounded-lg" />
                ))}
              </div>
            )}

            {!stockLoading && stockPhotos.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">{stockTotal.toLocaleString()} results</span>
                  <Badge variant="outline" className="text-[9px] font-mono">Powered by Pexels</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {stockPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedStock(selectedStock === photo.src.large ? null : photo.src.large)}
                      className={cn(
                        "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] group",
                        selectedStock === photo.src.large ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-border"
                      )}
                      data-testid={`stock-photo-${photo.id}`}
                    >
                      <img
                        src={photo.src.medium}
                        alt={photo.alt}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      {selectedStock === photo.src.large && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="h-8 w-8 text-white drop-shadow-lg" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white truncate">{photo.photographer}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  {selectedStock && (
                    <Button onClick={() => handleSelect(selectedStock)} data-testid="button-use-stock-image">
                      <Check className="mr-2 h-4 w-4" /> Use Selected Photo
                    </Button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    {stockPage > 1 && (
                      <Button variant="outline" size="sm" onClick={() => handleStockSearch(stockPage - 1)} className="font-mono text-xs">
                        Previous
                      </Button>
                    )}
                    {stockPhotos.length === 12 && (
                      <Button variant="outline" size="sm" onClick={() => handleStockSearch(stockPage + 1)} className="font-mono text-xs">
                        Next
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
