import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, Check, Loader2, Mic, Headphones, Bell, Sparkles, ArrowRight } from "lucide-react";

async function publicSubscribe(data: { email: string; firstName?: string; lastName?: string; podcastId?: string; source?: string }) {
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

export function InlineSubscribeWidget({ podcastId, podcastTitle, source = "article_inline" }: {
  podcastId?: string;
  podcastTitle?: string;
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const subscribe = useMutation({
    mutationFn: publicSubscribe,
    onSuccess: () => setSuccess(true),
    onError: (err: Error) => setError(err.message),
  });

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
    <div className="my-8 border-2 border-gray-900 bg-gray-900 p-6" data-testid="widget-inline-subscribe">
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-12 w-12 rounded-full bg-amber-500/20 items-center justify-center flex-shrink-0">
          <Bell className="h-6 w-6 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1">Stay in the loop</h3>
          <p className="text-gray-400 text-sm mb-4">
            Get the latest stories and insights from {podcastTitle || "our podcast network"} delivered to your inbox.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.trim()) return;
              setError("");
              subscribe.mutate({ email: email.trim(), firstName: firstName.trim() || undefined, podcastId, source });
            }}
            className="flex flex-col sm:flex-row gap-2"
            data-testid="form-inline-subscribe"
          >
            <input
              type="text"
              placeholder="First name (optional)"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="px-3 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors sm:w-36"
              data-testid="input-subscribe-firstname"
            />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
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
          </form>
          {error && <p className="text-red-400 text-xs mt-2" data-testid="text-subscribe-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export function SidebarSubscribeWidget({ podcastId, podcastTitle, podcastImage, source = "sidebar" }: {
  podcastId?: string;
  podcastTitle?: string;
  podcastImage?: string;
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const subscribe = useMutation({
    mutationFn: publicSubscribe,
    onSuccess: () => setSuccess(true),
    onError: (err: Error) => setError(err.message),
  });

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
    <div className="border border-gray-200 bg-white p-5" data-testid="widget-sidebar-subscribe">
      <div className="flex items-center gap-3 mb-3">
        {podcastImage ? (
          <img src={podcastImage} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
            <Mic className="h-5 w-5 text-white" />
          </div>
        )}
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Newsletter</h3>
          <p className="text-xs text-gray-500">Never miss an update</p>
        </div>
      </div>
      <p className="text-xs text-gray-600 mb-3 leading-relaxed">
        Subscribe to get the latest stories from {podcastTitle || "our network"} straight to your inbox.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.trim()) return;
          setError("");
          subscribe.mutate({ email: email.trim(), podcastId, source });
        }}
        data-testid="form-sidebar-subscribe"
      >
        <input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 mb-2 focus:outline-none focus:border-gray-400 transition-colors"
          data-testid="input-sidebar-subscribe-email"
        />
        <button
          type="submit"
          disabled={subscribe.isPending}
          className="w-full px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          data-testid="button-subscribe-sidebar"
        >
          {subscribe.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
          Subscribe Free
        </button>
      </form>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <p className="text-[10px] text-gray-400 mt-2 text-center">No spam. Unsubscribe anytime.</p>
    </div>
  );
}

export function StickyBottomSubscribeBar({ podcastId, podcastTitle, source = "sticky_bar" }: {
  podcastId?: string;
  podcastTitle?: string;
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState("");

  const subscribe = useMutation({
    mutationFn: publicSubscribe,
    onSuccess: () => setSuccess(true),
    onError: (err: Error) => setError(err.message),
  });

  if (dismissed || success) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t-2 border-amber-500 shadow-2xl print:hidden" data-testid="widget-sticky-subscribe">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Sparkles className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <p className="text-white text-sm truncate">
            <span className="font-semibold">Don't miss out!</span>
            <span className="text-gray-400 ml-1.5 hidden sm:inline">Get {podcastTitle || "podcast"} updates in your inbox.</span>
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) return;
            setError("");
            subscribe.mutate({ email: email.trim(), podcastId, source });
          }}
          className="flex gap-2 w-full sm:w-auto"
          data-testid="form-sticky-subscribe"
        >
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 sm:w-52 px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500"
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
        </form>
        {error && <span className="text-red-400 text-xs">{error}</span>}
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-500 hover:text-gray-300 text-xs sm:ml-2"
          data-testid="button-dismiss-sticky"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function EpisodeSubscribeWidget({ podcastId, podcastTitle, podcastImage, source = "episode_page" }: {
  podcastId?: string;
  podcastTitle?: string;
  podcastImage?: string;
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const subscribe = useMutation({
    mutationFn: publicSubscribe,
    onSuccess: () => setSuccess(true),
    onError: (err: Error) => setError(err.message),
  });

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
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-center" data-testid="widget-episode-subscribe">
      <div className="flex items-center justify-center gap-3 mb-4">
        {podcastImage ? (
          <img src={podcastImage} alt="" className="h-14 w-14 rounded-full object-cover border-2 border-amber-500/30" />
        ) : (
          <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Headphones className="h-7 w-7 text-amber-400" />
          </div>
        )}
      </div>
      <h3 className="text-white font-bold text-xl mb-1">Never miss an episode</h3>
      <p className="text-gray-400 text-sm mb-5 max-w-md mx-auto">
        Subscribe to {podcastTitle || "this podcast"} and get new episodes, exclusive content, and behind-the-scenes updates delivered to your inbox.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.trim()) return;
          setError("");
          subscribe.mutate({ email: email.trim(), firstName: firstName.trim() || undefined, podcastId, source });
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
            className="w-32 px-3 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
            data-testid="input-episode-subscribe-firstname"
          />
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
            data-testid="input-episode-subscribe-email"
          />
        </div>
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
      <p className="text-gray-600 text-[10px] mt-3">Free forever. No spam. Unsubscribe anytime.</p>
    </div>
  );
}
