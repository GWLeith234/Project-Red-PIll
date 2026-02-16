import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Check, Loader2, Mic, Headphones, Bell, Sparkles, ArrowRight, TrendingUp, Users, Star } from "lucide-react";
import { Link } from "wouter";
import { setSubscriberEmail } from "@/hooks/use-subscription";

async function publicSubscribe(data: { email: string; firstName?: string; lastName?: string; podcastId?: string; source?: string; marketingConsent?: boolean; smsConsent?: boolean }) {
  const res = await fetch("/api/public/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Something went wrong" }));
    throw new Error(err.message);
  }
  return res.json();
}

interface Recommendation {
  id: string;
  title: string;
  host: string;
  coverImage: string | null;
  subscribers: number | null;
  growthPercent: number | null;
  description: string | null;
  score: number;
  reasons: string[];
}

function formatSubs(count: number | null) {
  if (!count) return null;
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
  return count.toString();
}

export function RecommendedShowsInline({ recommendations, subscriberName }: {
  recommendations: Recommendation[];
  subscriberName?: string | null;
}) {
  if (recommendations.length === 0) return null;
  return (
    <div className="my-8 border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-6" data-testid="widget-recommendations-inline">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-foreground font-bold text-lg">
            {subscriberName ? `${subscriberName}, you might also enjoy` : "Recommended for you"}
          </h3>
          <p className="text-muted-foreground text-sm">Based on your listening interests</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recommendations.slice(0, 4).map((rec) => (
          <Link key={rec.id} href={`/show/${rec.id}`} className="block" data-testid={`link-recommended-${rec.id}`}>
            <div className="group flex gap-3 p-3 bg-card rounded-lg border border-amber-100 hover:border-amber-300 hover:shadow-sm transition-all">
              <div className="h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                {rec.coverImage ? (
                  <img src={rec.coverImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-popover flex items-center justify-center">
                    <Mic className="h-6 w-6 text-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-amber-700 truncate transition-colors" data-testid={`text-recommended-title-${rec.id}`}>
                  {rec.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">{rec.host}</p>
                {rec.reasons[0] && (
                  <p className="text-[10px] text-amber-600 font-medium mt-1 truncate">{rec.reasons[0]}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function RecommendedShowsSidebar({ recommendations, subscriberName }: {
  recommendations: Recommendation[];
  subscriberName?: string | null;
}) {
  if (recommendations.length === 0) return null;
  return (
    <div className="border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5" data-testid="widget-recommendations-sidebar">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">For You</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        {subscriberName ? `${subscriberName}, shows we think you'll love` : "Shows picked for your interests"}
      </p>
      <div className="space-y-3">
        {recommendations.slice(0, 4).map((rec, idx) => (
          <Link key={rec.id} href={`/show/${rec.id}`} className="block" data-testid={`sidebar-recommended-${rec.id}`}>
            <div className="group flex gap-3 items-start hover:bg-white/60 rounded-lg p-1.5 -m-1.5 transition-colors">
              <div className="relative flex-shrink-0">
                <div className="h-11 w-11 rounded-lg overflow-hidden bg-muted">
                  {rec.coverImage ? (
                    <img src={rec.coverImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-popover flex items-center justify-center">
                      <Mic className="h-5 w-5 text-foreground" />
                    </div>
                  )}
                </div>
                <span className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-amber-500 text-[9px] text-white font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-amber-700 truncate transition-colors">
                  {rec.title}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{rec.host}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {rec.reasons[0] && (
                    <span className="text-[10px] text-amber-600 font-medium truncate">{rec.reasons[0]}</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function RecommendedShowsEpisode({ recommendations, subscriberName }: {
  recommendations: Recommendation[];
  subscriberName?: string | null;
}) {
  if (recommendations.length === 0) return null;
  return (
    <div className="bg-gradient-to-br from-popover to-muted p-8 text-center" data-testid="widget-recommendations-episode">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Star className="h-6 w-6 text-amber-400" />
        </div>
      </div>
      <h3 className="text-foreground font-bold text-xl mb-1">
        {subscriberName ? `${subscriberName}, explore more shows` : "Shows you'll love"}
      </h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
        Handpicked recommendations based on your listening history and interests.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
        {recommendations.slice(0, 4).map((rec) => (
          <Link key={rec.id} href={`/show/${rec.id}`} className="block" data-testid={`episode-recommended-${rec.id}`}>
            <div className="group flex gap-3 p-3 bg-muted/80 rounded-lg border border-border/50 hover:border-amber-500/30 hover:bg-muted transition-all text-left">
              <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
                {rec.coverImage ? (
                  <img src={rec.coverImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center">
                    <Mic className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-amber-400 truncate transition-colors">
                  {rec.title}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{rec.host}</p>
                {rec.reasons[0] && (
                  <p className="text-[10px] text-amber-500/80 font-medium mt-0.5 truncate">{rec.reasons[0]}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function StickyRecommendationBar({ recommendations, subscriberName }: {
  recommendations: Recommendation[];
  subscriberName?: string | null;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || recommendations.length === 0) return null;
  const top = recommendations[0];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 shadow-2xl print:hidden" data-testid="widget-sticky-recommendation">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        <Sparkles className="h-5 w-5 text-gray-900 flex-shrink-0" />
        <p className="text-gray-900 text-sm flex-1 truncate">
          <span className="font-semibold">{subscriberName ? `${subscriberName}, check out:` : "You might enjoy:"}</span>
          <span className="ml-1.5">{top.title} by {top.host}</span>
          {top.reasons[0] && <span className="text-gray-800/70 ml-1">— {top.reasons[0]}</span>}
        </p>
        <Link href={`/show/${top.id}`}>
          <button className="px-4 py-2 bg-popover hover:bg-muted text-foreground font-semibold text-sm rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0" data-testid="button-sticky-recommendation">
            <Headphones className="h-3.5 w-3.5" />
            Listen
          </button>
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-800/70 hover:text-gray-900 text-xs flex-shrink-0"
          data-testid="button-dismiss-sticky-recommendation"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function InlineSubscribeWidget({ podcastId, podcastTitle, source = "article_inline", isSubscribed, recommendations, subscriberName }: {
  podcastId?: string;
  podcastTitle?: string;
  source?: string;
  isSubscribed?: boolean;
  recommendations?: Recommendation[];
  subscriberName?: string | null;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const subscribe = useMutation({
    mutationFn: publicSubscribe,
    onSuccess: () => {
      setSuccess(true);
      if (email) {
        setSubscriberEmail(email.trim(), firstName.trim() || undefined);
        queryClient.invalidateQueries({ queryKey: ["/api/public/check-subscription"] });
      }
    },
    onError: (err: Error) => setError(err.message),
  });

  if (isSubscribed && recommendations && recommendations.length > 0) {
    return <RecommendedShowsInline recommendations={recommendations} subscriberName={subscriberName} />;
  }

  if (isSubscribed) return null;

  if (success) {
    return (
      <div className="my-8 border-2 border-green-200 bg-green-50 p-6 text-center" data-testid="widget-inline-subscribe-success">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="h-4 w-4 text-white" />
          </div>
        </div>
        <p className="text-green-800 font-semibold text-lg">You're subscribed!</p>
        <p className="text-green-600 text-sm mt-1">You'll receive the latest updates from {podcastTitle || "our network"}.</p>
      </div>
    );
  }

  return (
    <div className="my-8 border-2 border-popover bg-popover p-6" data-testid="widget-inline-subscribe">
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-12 w-12 rounded-full bg-amber-500/20 items-center justify-center flex-shrink-0">
          <Bell className="h-6 w-6 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-foreground font-bold text-lg mb-1">Stay in the loop</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Get the latest stories and insights from {podcastTitle || "our podcast network"} delivered to your inbox.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.trim()) return;
              setError("");
              subscribe.mutate({ email: email.trim(), firstName: firstName.trim() || undefined, podcastId, source, marketingConsent: consent });
            }}
            className="flex flex-col gap-2"
            data-testid="form-inline-subscribe"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="First name (optional)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="px-3 py-2.5 bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors sm:w-36"
                data-testid="input-subscribe-firstname"
              />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-3 py-2.5 bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors"
                data-testid="input-subscribe-email"
              />
              <button
                type="submit"
                disabled={subscribe.isPending}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="button-subscribe-inline"
              >
                {subscribe.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Subscribe
              </button>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-amber-500" data-testid="checkbox-consent-inline" />
              <span className="text-muted-foreground text-[11px] leading-tight">I agree to receive emails and marketing communications. You can unsubscribe at any time.</span>
            </label>
          </form>
          {error && <p className="text-red-400 text-xs mt-2" data-testid="text-subscribe-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export function SidebarSubscribeWidget({ podcastId, podcastTitle, podcastImage, source = "sidebar", isSubscribed, recommendations, subscriberName }: {
  podcastId?: string;
  podcastTitle?: string;
  podcastImage?: string;
  source?: string;
  isSubscribed?: boolean;
  recommendations?: Recommendation[];
  subscriberName?: string | null;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const subscribe = useMutation({
    mutationFn: publicSubscribe,
    onSuccess: () => {
      setSuccess(true);
      if (email) {
        setSubscriberEmail(email.trim());
        queryClient.invalidateQueries({ queryKey: ["/api/public/check-subscription"] });
      }
    },
    onError: (err: Error) => setError(err.message),
  });

  if (isSubscribed && recommendations && recommendations.length > 0) {
    return <RecommendedShowsSidebar recommendations={recommendations} subscriberName={subscriberName} />;
  }

  if (isSubscribed) return null;

  if (success) {
    return (
      <div className="border border-green-200 bg-green-50 p-5 text-center" data-testid="widget-sidebar-subscribe-success">
        <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
        <p className="text-green-800 font-semibold text-sm">Subscribed!</p>
        <p className="text-green-600 text-xs mt-1">Welcome aboard.</p>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card p-5" data-testid="widget-sidebar-subscribe">
      <div className="flex items-center gap-3 mb-3">
        {podcastImage ? (
          <img src={podcastImage} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-popover flex items-center justify-center flex-shrink-0">
            <Mic className="h-5 w-5 text-foreground" />
          </div>
        )}
        <div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Newsletter</h3>
          <p className="text-xs text-muted-foreground">Never miss an update</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        Subscribe to get the latest stories from {podcastTitle || "our network"} straight to your inbox.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.trim()) return;
          setError("");
          subscribe.mutate({ email: email.trim(), podcastId, source, marketingConsent: consent });
        }}
        data-testid="form-sidebar-subscribe"
      >
        <input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-border text-sm text-foreground placeholder:text-muted-foreground mb-2 focus:outline-none focus:border-border transition-colors"
          data-testid="input-sidebar-subscribe-email"
        />
        <label className="flex items-start gap-2 cursor-pointer mb-2">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-gray-900" data-testid="checkbox-consent-sidebar" />
          <span className="text-muted-foreground text-[10px] leading-tight">I agree to receive marketing emails. Unsubscribe anytime.</span>
        </label>
        <button
          type="submit"
          disabled={subscribe.isPending}
          className="w-full px-3 py-2 bg-popover hover:bg-muted text-foreground text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          data-testid="button-subscribe-sidebar"
        >
          {subscribe.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
          Subscribe Free
        </button>
      </form>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function StickyBottomSubscribeBar({ podcastId, podcastTitle, source = "sticky_bar", isSubscribed, recommendations, subscriberName }: {
  podcastId?: string;
  podcastTitle?: string;
  source?: string;
  isSubscribed?: boolean;
  recommendations?: Recommendation[];
  subscriberName?: string | null;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState("");

  const subscribe = useMutation({
    mutationFn: publicSubscribe,
    onSuccess: () => {
      setSuccess(true);
      if (email) {
        setSubscriberEmail(email.trim());
        queryClient.invalidateQueries({ queryKey: ["/api/public/check-subscription"] });
      }
    },
    onError: (err: Error) => setError(err.message),
  });

  if (isSubscribed && recommendations && recommendations.length > 0) {
    return <StickyRecommendationBar recommendations={recommendations} subscriberName={subscriberName} />;
  }

  if (isSubscribed) return null;

  if (dismissed || success) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-popover border-t-2 border-amber-500 shadow-2xl print:hidden" data-testid="widget-sticky-subscribe">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Sparkles className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <p className="text-foreground text-sm truncate">
            <span className="font-semibold">Don't miss out!</span>
            <span className="text-muted-foreground ml-1.5 hidden sm:inline">Get {podcastTitle || "podcast"} updates in your inbox.</span>
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) return;
            setError("");
            subscribe.mutate({ email: email.trim(), podcastId, source, marketingConsent: consent });
          }}
          className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"
          data-testid="form-sticky-subscribe"
        >
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 sm:w-52 px-3 py-2 bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
              data-testid="input-sticky-subscribe-email"
            />
            <button
              type="submit"
              disabled={subscribe.isPending}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
              data-testid="button-subscribe-sticky"
            >
              {subscribe.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
              Subscribe
            </button>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="accent-amber-500" data-testid="checkbox-consent-sticky" />
            <span className="text-muted-foreground text-[10px]">I agree to receive marketing emails</span>
          </label>
        </form>
        {error && <span className="text-red-400 text-xs">{error}</span>}
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground/80 text-xs sm:ml-2"
          data-testid="button-dismiss-sticky"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function EpisodeSubscribeWidget({ podcastId, podcastTitle, podcastImage, source = "episode_page", isSubscribed, recommendations, subscriberName }: {
  podcastId?: string;
  podcastTitle?: string;
  podcastImage?: string;
  source?: string;
  isSubscribed?: boolean;
  recommendations?: Recommendation[];
  subscriberName?: string | null;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const subscribe = useMutation({
    mutationFn: publicSubscribe,
    onSuccess: () => {
      setSuccess(true);
      if (email) {
        setSubscriberEmail(email.trim(), firstName.trim() || undefined);
        queryClient.invalidateQueries({ queryKey: ["/api/public/check-subscription"] });
      }
    },
    onError: (err: Error) => setError(err.message),
  });

  if (isSubscribed && recommendations && recommendations.length > 0) {
    return <RecommendedShowsEpisode recommendations={recommendations} subscriberName={subscriberName} />;
  }

  if (isSubscribed) return null;

  if (success) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-8 text-center" data-testid="widget-episode-subscribe-success">
        <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-3">
          <Check className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-green-800 font-bold text-xl mb-1">Welcome aboard!</h3>
        <p className="text-green-600 text-sm">You'll be notified about new episodes from {podcastTitle || "this show"}.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-popover to-muted p-8 text-center" data-testid="widget-episode-subscribe">
      <div className="flex items-center justify-center gap-3 mb-4">
        {podcastImage ? (
          <img src={podcastImage} alt="" className="h-14 w-14 rounded-full object-cover border-2 border-amber-500/30" />
        ) : (
          <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Headphones className="h-7 w-7 text-amber-400" />
          </div>
        )}
      </div>
      <h3 className="text-foreground font-bold text-xl mb-1">Never miss an episode</h3>
      <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
        Subscribe to {podcastTitle || "this podcast"} and get new episodes, exclusive content, and behind-the-scenes updates delivered to your inbox.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.trim()) return;
          setError("");
          subscribe.mutate({ email: email.trim(), firstName: firstName.trim() || undefined, podcastId, source, marketingConsent: consent });
        }}
        className="max-w-md mx-auto space-y-2"
        data-testid="form-episode-subscribe"
      >
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-32 px-3 py-2.5 bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors"
            data-testid="input-episode-subscribe-firstname"
          />
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-3 py-2.5 bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors"
            data-testid="input-episode-subscribe-email"
          />
        </div>
        <label className="flex items-start gap-2 cursor-pointer text-left">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-amber-500" data-testid="checkbox-consent-episode" />
          <span className="text-muted-foreground text-[11px] leading-tight">I agree to receive emails and marketing communications. You can unsubscribe at any time.</span>
        </label>
        <button
          type="submit"
          disabled={subscribe.isPending}
          className="w-full px-5 py-3 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          data-testid="button-subscribe-episode"
        >
          {subscribe.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          Subscribe to {podcastTitle || "This Show"}
        </button>
      </form>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
