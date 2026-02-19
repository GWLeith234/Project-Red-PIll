import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X, Sparkles, RotateCcw, ChevronDown } from "lucide-react";

type ContentType = "article" | "social" | "email" | "newsletter" | "press_release" | "ad_copy";

const CONTENT_TYPES: { key: ContentType; label: string; description: string }[] = [
  { key: "article", label: "Article", description: "News article or opinion piece" },
  { key: "social", label: "Social Post", description: "Platform-specific social content" },
  { key: "email", label: "Email Campaign", description: "Marketing or engagement email" },
  { key: "newsletter", label: "Newsletter", description: "Curated newsletter edition" },
  { key: "press_release", label: "Press Release", description: "Formal press announcement" },
  { key: "ad_copy", label: "Ad Copy", description: "Advertising copy for campaigns" },
];

const TONES = ["professional", "conversational", "urgent", "persuasive", "authoritative", "breaking news", "opinion", "analysis", "feature"];

interface AIGenerateModalProps {
  onClose: () => void;
  onInsert?: (content: string) => void;
}

export default function AIGenerateModal({ onClose, onInsert }: AIGenerateModalProps) {
  const [contentType, setContentType] = useState<ContentType>("article");
  const [generatedContent, setGeneratedContent] = useState("");
  const [tone, setTone] = useState("professional");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [visualSuggestions, setVisualSuggestions] = useState<{ description: string; keywords: string[] }[] | null>(null);
  const [visualsLoading, setVisualsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const [articleParams, setArticleParams] = useState({ headline: "", keywords: "", tone: "breaking news", wordCount: "800" });
  const [socialParams, setSocialParams] = useState({ platform: "Twitter/X", topic: "", tone: "engaging", includeHashtags: true });
  const [emailParams, setEmailParams] = useState({ subjectLine: "", purpose: "engagement", audienceSegment: "general subscribers", keyMessage: "" });
  const [newsletterParams, setNewsletterParams] = useState({ editionName: "", sections: "4", tone: "conversational" });
  const [pressParams, setPressParams] = useState({ headline: "", announcement: "", quotes: "", boilerplate: "" });
  const [adParams, setAdParams] = useState({ product: "", targetAudience: "conservative news readers", format: "banner headline", characterLimit: "" });

  const { data: tokensToday } = useQuery({
    queryKey: ["/api/ai/tokens-today"],
    queryFn: () => fetch("/api/ai/tokens-today", { credentials: "include" }).then(r => r.json()).catch(() => ({ count: 0 })),
  });

  const fetchVisualSuggestions = async (content: string) => {
    setVisualsLoading(true);
    setVisualSuggestions(null);
    try {
      const res = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contentType: "visual_suggestions",
          params: { socialContent: content },
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const parsed = JSON.parse(data.content);
      if (Array.isArray(parsed)) setVisualSuggestions(parsed.slice(0, 3));
    } catch {
      setVisualSuggestions(null);
    } finally {
      setVisualsLoading(false);
    }
  };

  const generateMutation = useMutation({
    mutationFn: async (params: any) => {
      const payload: any = { contentType, params };
      if (referenceUrl.trim()) payload.referenceUrl = referenceUrl.trim();
      const res = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Generation failed");
      return res.json();
    },
    onSuccess: (data) => {
      const content = data.content || "";
      setGeneratedContent(content);
      setVisualSuggestions(null);
      if (contentType === "social" && content) {
        fetchVisualSuggestions(content);
      }
    },
  });

  const getParams = (): any => {
    switch (contentType) {
      case "article": return articleParams;
      case "social": return socialParams;
      case "email": return emailParams;
      case "newsletter": return newsletterParams;
      case "press_release": return pressParams;
      case "ad_copy": return adParams;
    }
  };

  const handleGenerate = () => generateMutation.mutate(getParams());
  const handleRegenerate = () => {
    setGeneratedContent("");
    setVisualSuggestions(null);
    generateMutation.mutate({ ...getParams(), tone });
  };

  const handleCopyPrompt = (description: string, idx: number) => {
    const prompt = `Photorealistic ${description}, high quality, professional photography, 16:9 aspect ratio`;
    navigator.clipboard.writeText(prompt);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60" onClick={onClose} data-testid="ai-generate-modal">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-foreground">AI Content Generator</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground font-mono">Tokens today: {tokensToday?.count || 0}</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground" data-testid="close-ai-generate"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {CONTENT_TYPES.map(ct => (
              <button key={ct.key} onClick={() => { setContentType(ct.key); setGeneratedContent(""); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${contentType === ct.key ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent"}`}
                data-testid={`content-type-${ct.key}`}>
                {ct.label}
              </button>
            ))}
          </div>

          <div className="bg-background border border-border rounded-lg p-4 space-y-3">
            {contentType === "article" && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Topic / Headline</label>
                  <input value={articleParams.headline} onChange={e => setArticleParams({ ...articleParams, headline: e.target.value })} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" placeholder="e.g., Breaking: Senate passes new legislation..." data-testid="input-article-headline" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Keywords</label>
                    <input value={articleParams.keywords} onChange={e => setArticleParams({ ...articleParams, keywords: e.target.value })} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" placeholder="comma-separated" data-testid="input-article-keywords" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Word Count</label>
                    <input value={articleParams.wordCount} onChange={e => setArticleParams({ ...articleParams, wordCount: e.target.value })} type="number" className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" data-testid="input-article-wordcount" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tone</label>
                  <select value={articleParams.tone} onChange={e => setArticleParams({ ...articleParams, tone: e.target.value })} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" data-testid="select-article-tone">
                    {["breaking news", "opinion", "analysis", "feature"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </>
            )}

            {contentType === "social" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Platform</label>
                    <select value={socialParams.platform} onChange={e => setSocialParams({ ...socialParams, platform: e.target.value })} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" data-testid="select-social-platform">
                      {["Twitter/X", "Facebook", "Instagram", "LinkedIn"].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Tone</label>
                    <select value={socialParams.tone} onChange={e => setSocialParams({ ...socialParams, tone: e.target.value })} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" data-testid="select-social-tone">
                      {["engaging", "professional", "casual", "urgent"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Topic</label>
                  <input value={socialParams.topic} onChange={e => setSocialParams({ ...socialParams, topic: e.target.value })} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" data-testid="input-social-topic" />
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={socialParams.includeHashtags} onChange={e => setSocialParams({ ...socialParams, includeHashtags: e.target.checked })} className="rounded" data-testid="check-hashtags" />
                  Include hashtags
                </label>
              </>
            )}

            {contentType === "email" && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Subject Line</label>
                  <input value={emailParams.subjectLine} onChange={e => setEmailParams({ ...emailParams, subjectLine: e.target.value })} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" placeholder="Leave empty for AI to generate" data-testid="input-email-subject" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Purpose</label>
                    <select value={emailParams.purpose} onChange={e => setEmailParams({ ...emailParams, purpose: e.target.value })} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" data-testid="select-email-purpose">
                      {["promotional", "engagement", "re-engagement", "announcement"].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Audience</label>
                    <input value={emailParams.audienceSegment} onChange={e => setEmailParams({ ...emailParams, audienceSegment: e.target.value })} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" data-testid="input-email-audience" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Key Message</label>
                  <textarea value={emailParams.keyMessage} onChange={e => setEmailParams({ ...emailParams, keyMessage: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground resize-none" data-testid="input-email-message" />
                </div>
              </>
            )}

            {contentType === "newsletter" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Edition Name</label>
                    <input value={newsletterParams.editionName} onChange={e => setNewsletterParams({ ...newsletterParams, editionName: e.target.value })} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" placeholder="e.g., Weekly Digest" data-testid="input-newsletter-name" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Sections</label>
                    <input value={newsletterParams.sections} onChange={e => setNewsletterParams({ ...newsletterParams, sections: e.target.value })} type="number" className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" data-testid="input-newsletter-sections" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tone</label>
                  <select value={newsletterParams.tone} onChange={e => setNewsletterParams({ ...newsletterParams, tone: e.target.value })} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" data-testid="select-newsletter-tone">
                    {["formal", "conversational", "urgent"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </>
            )}

            {contentType === "press_release" && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Headline</label>
                  <input value={pressParams.headline} onChange={e => setPressParams({ ...pressParams, headline: e.target.value })} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" data-testid="input-press-headline" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Key Announcement</label>
                  <textarea value={pressParams.announcement} onChange={e => setPressParams({ ...pressParams, announcement: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground resize-none" data-testid="input-press-announcement" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Quotes</label>
                  <input value={pressParams.quotes} onChange={e => setPressParams({ ...pressParams, quotes: e.target.value })} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" placeholder="Optional quotes to include" data-testid="input-press-quotes" />
                </div>
              </>
            )}

            {contentType === "ad_copy" && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Product / Offer</label>
                  <input value={adParams.product} onChange={e => setAdParams({ ...adParams, product: e.target.value })} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" data-testid="input-ad-product" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Format</label>
                    <select value={adParams.format} onChange={e => setAdParams({ ...adParams, format: e.target.value })} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" data-testid="select-ad-format">
                      {["banner headline", "native ad", "sponsored post"].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Character Limit</label>
                    <input value={adParams.characterLimit} onChange={e => setAdParams({ ...adParams, characterLimit: e.target.value })} type="number" className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" data-testid="input-ad-charlimit" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Target Audience</label>
                  <input value={adParams.targetAudience} onChange={e => setAdParams({ ...adParams, targetAudience: e.target.value })} className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" data-testid="input-ad-audience" />
                </div>
              </>
            )}

            <div className="mt-3 pt-3 border-t border-border/50">
              <label className="text-xs font-medium text-muted-foreground">Reference URL (optional)</label>
              <input
                type="url"
                value={referenceUrl}
                onChange={e => setReferenceUrl(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground"
                placeholder="Paste a URL for AI to reference — a news story, brand website, or product page"
                data-testid="input-reference-url"
              />
            </div>
          </div>

          {generatedContent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Generated Content</span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select value={tone} onChange={e => setTone(e.target.value)} className="text-xs px-2 py-1 bg-card border border-border rounded text-muted-foreground appearance-none pr-6" data-testid="select-tone-adjust">
                      {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                  </div>
                  <button onClick={handleRegenerate} disabled={generateMutation.isPending} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300" data-testid="button-regenerate">
                    <RotateCcw className={`w-3 h-3 ${generateMutation.isPending ? "animate-spin" : ""}`} />
                    Regenerate
                  </button>
                </div>
              </div>
              <div className="bg-background border border-border rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap max-h-64 overflow-y-auto" data-testid="generated-content">
                {generatedContent}
              </div>
            </div>
          )}

          {contentType === "social" && generatedContent && (visualsLoading || visualSuggestions) && (
            <div className="space-y-2" data-testid="visual-suggestions-panel">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                <span className="text-xs font-medium text-muted-foreground">Suggested Visuals</span>
              </div>
              {visualsLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
                  <div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  Finding visual ideas...
                </div>
              ) : visualSuggestions && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {visualSuggestions.map((vs, idx) => (
                    <div key={idx} className="bg-background border border-border rounded-lg p-3 space-y-2" data-testid={`visual-card-${idx}`}>
                      <p className="text-xs text-foreground leading-relaxed">{vs.description}</p>
                      <div className="flex flex-col gap-1.5">
                        <a
                          href={`https://unsplash.com/s/photos/${encodeURIComponent(vs.keywords?.slice(0, 3).join(" ") || vs.description.split(" ").slice(0, 3).join(" "))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 text-[10px] font-medium px-2 py-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                          data-testid={`search-stock-${idx}`}
                        >
                          Search Stock Photos
                        </a>
                        <button
                          onClick={() => handleCopyPrompt(vs.description, idx)}
                          className="flex items-center justify-center gap-1 text-[10px] font-medium px-2 py-1.5 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors relative"
                          data-testid={`copy-prompt-${idx}`}
                        >
                          {copiedIdx === idx ? "Copied!" : "AI Image Prompt"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground" data-testid="button-cancel-generate">Cancel</button>
          <div className="flex gap-2">
            {generatedContent && onInsert && (
              <button onClick={() => { onInsert(generatedContent); onClose(); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700" data-testid="button-insert-content">
                Insert Content
              </button>
            )}
            <button onClick={handleGenerate} disabled={generateMutation.isPending} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5" data-testid="button-generate">
              <Sparkles className={`w-3.5 h-3.5 ${generateMutation.isPending ? "animate-pulse" : ""}`} />
              {generateMutation.isPending ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
