import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Upload, Link as LinkIcon, Download, Image as ImageIcon,
  Scaling, CheckCircle2, AlertCircle, Loader2, X,
  Facebook, Instagram, Linkedin, Youtube, Twitter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/admin/PageHeader";
import MetricsStrip from "@/components/admin/MetricsStrip";

interface ResizedImage {
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  base64: string;
  size: number;
  error?: string;
}

interface ResizeResult {
  success: boolean;
  original: { metadata: { width: number; height: number; format: string } };
  processed: { count: number; successCount: number; errorCount: number };
  results: ResizedImage[];
}

const PLATFORM_ICONS: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  twitter: Twitter,
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "bg-blue-600",
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
  linkedin: "bg-blue-700",
  twitter: "bg-sky-500",
  tiktok: "bg-black",
  youtube: "bg-red-600",
  pinterest: "bg-red-500",
  googleDisplay: "bg-green-600",
  snapchat: "bg-yellow-400",
};

export default function AdResizer() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [fitOption, setFitOption] = useState("cover");
  const [results, setResults] = useState<ResizeResult | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");

  const { data: sizesData } = useQuery<{ platforms: string[]; totalSizes: number; sizes: Record<string, any[]> }>({
    queryKey: ["/api/ad-resizer/sizes"],
  });

  const resizeUrlMutation = useMutation({
    mutationFn: async (data: { url: string; platforms?: string[]; fit: string }) => {
      const res = await apiRequest("POST", "/api/ad-resizer/resize-url", data);
      return res.json();
    },
    onSuccess: (data) => {
      setResults(data);
      toast({ title: "Resizing complete", description: `Generated ${data.processed.successCount} ad sizes` });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const resizeUploadMutation = useMutation({
    mutationFn: async (data: { file: File; platforms?: string[]; fit: string }) => {
      const formData = new FormData();
      formData.append("image", data.file);
      if (data.platforms && data.platforms.length > 0) {
        formData.append("platforms", JSON.stringify(data.platforms));
      }
      formData.append("fit", data.fit);
      const res = await fetch("/api/ad-resizer/resize-upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to resize image");
      return res.json();
    },
    onSuccess: (data) => {
      setResults(data);
      toast({ title: "Resizing complete", description: `Generated ${data.processed.successCount} ad sizes` });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const isProcessing = resizeUrlMutation.isPending || resizeUploadMutation.isPending;

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setImageUrl("");
    }
  }, []);

  const handleUrlChange = useCallback((url: string) => {
    setImageUrl(url);
    if (url) {
      setSelectedFile(null);
      setPreviewUrl(url);
    }
  }, []);

  const togglePlatform = useCallback((platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  }, []);

  const handleResize = useCallback(() => {
    const platforms = selectedPlatforms.length > 0 ? selectedPlatforms : undefined;
    if (selectedFile) {
      resizeUploadMutation.mutate({ file: selectedFile, platforms, fit: fitOption });
    } else if (imageUrl) {
      resizeUrlMutation.mutate({ url: imageUrl, platforms, fit: fitOption });
    } else {
      toast({ title: "No image", description: "Please upload an image or provide a URL", variant: "destructive" });
    }
  }, [selectedFile, imageUrl, selectedPlatforms, fitOption]);

  const downloadImage = useCallback((result: ResizedImage) => {
    const link = document.createElement("a");
    link.href = `data:image/jpeg;base64,${result.base64}`;
    link.download = `${result.name.replace(/\s+/g, "_").toLowerCase()}_${result.width}x${result.height}.jpg`;
    link.click();
  }, []);

  const downloadAll = useCallback(() => {
    if (!results) return;
    const filtered = getFilteredResults();
    filtered.forEach((result, i) => {
      if (!result.error && result.base64) {
        setTimeout(() => downloadImage(result), i * 100);
      }
    });
  }, [results, filterPlatform]);

  const getFilteredResults = useCallback(() => {
    if (!results) return [];
    if (filterPlatform === "all") return results.results.filter(r => !r.error);
    return results.results.filter(r => !r.error && r.name.toLowerCase().includes(filterPlatform.toLowerCase()));
  }, [results, filterPlatform]);

  const clearAll = useCallback(() => {
    setImageUrl("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults(null);
    setSelectedPlatforms([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const platforms = sizesData?.platforms || [];

  return (
    <div className="p-6 space-y-6" data-testid="ad-resizer-page">
      <PageHeader pageKey="ad-resizer" onAIAction={() => {}} aiActionOverride="AI Suggest" onPrimaryAction={() => {}} primaryActionOverride="Resize All" />

      <MetricsStrip
        columns={4}
        metrics={[
          { label: "FORMATS AVAILABLE", value: "70" },
          { label: "PLATFORMS SUPPORTED", value: "9" },
          { label: "LAST RESIZED", value: "—" },
          { label: "TOTAL DOWNLOADS", value: 0 },
        ]}
      />

      {results && (
        <div className="flex justify-end -mt-4">
          <Button variant="outline" onClick={clearAll} data-testid="button-clear-all">
            <X className="h-4 w-4 mr-2" /> Clear All
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Source Image</CardTitle>
              <CardDescription>Upload a file or paste an image URL</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="upload">
                <TabsList className="w-full">
                  <TabsTrigger value="upload" className="flex-1" data-testid="tab-upload">
                    <Upload className="h-4 w-4 mr-2" /> Upload
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex-1" data-testid="tab-url">
                    <LinkIcon className="h-4 w-4 mr-2" /> URL
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="space-y-3">
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="dropzone-upload"
                  >
                    <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {selectedFile ? selectedFile.name : "Click to select an image"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP up to 50MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-file"
                  />
                </TabsContent>
                <TabsContent value="url" className="space-y-3">
                  <div>
                    <Label>Image URL</Label>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      data-testid="input-image-url"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {previewUrl && (
                <div className="rounded-lg overflow-hidden border bg-muted/30">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-48 object-contain"
                    data-testid="img-preview"
                    onError={() => setPreviewUrl(null)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Platforms</CardTitle>
              <CardDescription>
                Select specific platforms or leave blank for all {sizesData?.totalSizes || "70+"} sizes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {platforms.map((platform: string) => {
                  const Icon = PLATFORM_ICONS[platform];
                  return (
                    <label
                      key={platform}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors text-sm",
                        selectedPlatforms.includes(platform) ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/50"
                      )}
                      data-testid={`checkbox-platform-${platform}`}
                    >
                      <Checkbox
                        checked={selectedPlatforms.includes(platform)}
                        onCheckedChange={() => togglePlatform(platform)}
                      />
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      <span className="capitalize">{platform === "googleDisplay" ? "Google Display" : platform}</span>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Resize Fit</Label>
                <Select value={fitOption} onValueChange={setFitOption}>
                  <SelectTrigger data-testid="select-fit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover (fills area, may crop)</SelectItem>
                    <SelectItem value="contain">Contain (fits inside, may pad)</SelectItem>
                    <SelectItem value="fill">Fill (stretches to fit)</SelectItem>
                    <SelectItem value="inside">Inside (scales down only)</SelectItem>
                    <SelectItem value="outside">Outside (scales up only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleResize}
                disabled={isProcessing || (!selectedFile && !imageUrl)}
                data-testid="button-resize"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Scaling className="h-5 w-5 mr-2" /> Resize Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {isProcessing && (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Processing your image...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Generating {selectedPlatforms.length > 0
                    ? `sizes for ${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? 's' : ''}`
                    : `all ${sizesData?.totalSizes || "70+"} ad sizes`}
                </p>
              </CardContent>
            </Card>
          )}

          {results && !isProcessing && (
            <div className="space-y-4">
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="font-medium" data-testid="text-success-count">
                          {results.processed.successCount} sizes generated
                        </span>
                      </div>
                      {results.processed.errorCount > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <span className="text-sm text-red-400" data-testid="text-error-count">
                            {results.processed.errorCount} errors
                          </span>
                        </div>
                      )}
                      <Badge variant="secondary">
                        Original: {results.original.metadata.width}x{results.original.metadata.height}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                        <SelectTrigger className="w-[160px]" data-testid="select-filter-platform">
                          <SelectValue placeholder="Filter platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Platforms</SelectItem>
                          {platforms.map((p: string) => (
                            <SelectItem key={p} value={p} className="capitalize">
                              {p === "googleDisplay" ? "Google Display" : p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={downloadAll} data-testid="button-download-all">
                        <Download className="h-4 w-4 mr-2" /> Download All
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {getFilteredResults().map((result, i) => (
                  <Card
                    key={`${result.name}-${i}`}
                    className="overflow-hidden group hover:ring-2 hover:ring-primary/50 transition-all"
                    data-testid={`card-result-${i}`}
                  >
                    <div className="relative bg-muted/30 flex items-center justify-center p-2" style={{ minHeight: 120 }}>
                      <img
                        src={`data:image/jpeg;base64,${result.base64}`}
                        alt={result.name}
                        className="max-w-full max-h-32 object-contain"
                        loading="lazy"
                      />
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => downloadImage(result)}
                        data-testid={`button-download-${i}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <CardContent className="p-2.5">
                      <p className="text-xs font-medium truncate" title={result.name}>{result.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {result.width}x{result.height}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {(result.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {getFilteredResults().length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No results match the selected filter
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!results && !isProcessing && (
            <Card className="h-full min-h-[400px] flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Scaling className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-medium text-muted-foreground mb-2">Ready to resize</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Upload an image or provide a URL, select your target platforms, and click Resize. 
                  Your image will be automatically formatted for every ad size across all major platforms.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {Object.entries(PLATFORM_COLORS).map(([platform, color]) => (
                    <Badge key={platform} variant="outline" className="capitalize text-xs">
                      {platform === "googleDisplay" ? "Google Display" : platform}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
