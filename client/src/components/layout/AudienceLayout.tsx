import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Menu, X, Mic, Headphones, Newspaper, Radio, ChevronDown, Bell, BellRing, Home, Search, Bookmark, FileText, ChevronLeft, ChevronRight, Shuffle, TrendingUp } from "lucide-react";
import { useReadLater } from "@/hooks/use-read-later";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useAudioPlayerOptional } from "@/components/AudioPlayerProvider";
import MiniPlayer from "@/components/MiniPlayer";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { CookieConsentBanner, CookieSettingsLink } from "@/components/CookieConsentBanner";

function usePublicPodcasts() {
  return useQuery({
    queryKey: ["/api/public/podcasts"],
    queryFn: async () => {
      const res = await fetch("/api/public/podcasts");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });
}

function usePublicBranding() {
  return useQuery({
    queryKey: ["/api/branding"],
    queryFn: async () => {
      const res = await fetch("/api/branding");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
  });
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function PresetsBar({ podcasts, primaryColor }: { podcasts: any[]; primaryColor: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [location] = useLocation();

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el?.removeEventListener("scroll", checkScroll);
  }, [podcasts]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  if (!podcasts?.length) return null;

  const presetItems = [
    { id: "__home", label: "For You", href: "/home", icon: <Home className="h-5 w-5" /> },
    { id: "__trending", label: "Trending", href: "/news", icon: <TrendingUp className="h-5 w-5" /> },
    { id: "__discover", label: "Discover", href: "/podcasts", icon: <Shuffle className="h-5 w-5" /> },
    ...podcasts.map((p: any) => ({
      id: p.id,
      label: p.title,
      href: `/show/${p.id}`,
      image: p.coverImage,
    })),
  ];

  return (
    <div className="relative bg-gray-900/80 backdrop-blur-sm border-b border-gray-800/50" data-testid="presets-bar">
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-r from-gray-900 to-transparent flex items-center justify-center text-gray-400 hover:text-white"
          data-testid="btn-presets-scroll-left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      <div
        ref={scrollRef}
        className="flex items-center gap-4 px-4 py-2.5 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {presetItems.map((item: any) => {
          const isActive = item.href === location || (item.href !== "/home" && item.href !== "/news" && item.href !== "/podcasts" && location.startsWith(item.href));
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-col items-center gap-1 flex-shrink-0 group"
              data-testid={`preset-${item.id}`}
            >
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center overflow-hidden transition-all duration-200 ${
                  isActive
                    ? "ring-2 ring-offset-1 ring-offset-gray-900 scale-110"
                    : "ring-1 ring-gray-700 group-hover:ring-gray-500 group-hover:scale-105"
                }`}
                style={isActive ? { boxShadow: `0 0 0 2px ${primaryColor}` } : undefined}
              >
                {item.image ? (
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-gray-300">
                    {item.icon || <Mic className="h-5 w-5" />}
                  </div>
                )}
              </div>
              <span className={`text-[10px] font-medium max-w-[56px] truncate ${
                isActive ? "text-white" : "text-gray-500 group-hover:text-gray-300"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-l from-gray-900 to-transparent flex items-center justify-center text-gray-400 hover:text-white"
          data-testid="btn-presets-scroll-right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function NotificationPanel({ isSubscribed, preferences, subscribe, unsubscribe, updatePreferences, primaryColor, onClose }: {
  isSubscribed: boolean; preferences: any; subscribe: () => Promise<any>; unsubscribe: () => Promise<void>;
  updatePreferences: (p: any) => Promise<void>; primaryColor: string; onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  if (!isSubscribed) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose} data-testid="notification-modal-backdrop">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()} data-testid="notification-modal">
          <div className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-4" style={{ backgroundColor: `${primaryColor}20` }}>
            <BellRing className="h-7 w-7" style={{ color: primaryColor }} />
          </div>
          <h3 className="text-lg font-bold text-white text-center mb-2">Stay in the loop</h3>
          <p className="text-sm text-gray-400 text-center mb-6">Get notified when new episodes drop and breaking news publishes</p>
          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                const result = await subscribe();
                if (result) {
                  onClose();
                } else {
                  console.error("Subscribe returned null");
                  setLoading(false);
                }
              } catch (err) {
                console.error("Subscribe error:", err);
                setLoading(false);
              }
            }}
            className="w-full py-2.5 rounded-full font-semibold text-sm transition-all hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: primaryColor, color: "#111" }}
            data-testid="button-enable-notifications"
          >
            {loading ? "Enabling..." : "Enable Notifications"}
          </button>
          <button onClick={onClose} className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors" data-testid="button-dismiss-notifications">
            Not now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 z-50" data-testid="notification-preferences-dropdown">
      <h4 className="text-sm font-bold text-white mb-3">Notification Preferences</h4>
      {[
        { key: "articles", label: "New Articles" },
        { key: "episodes", label: "New Episodes" },
        { key: "breaking", label: "Breaking News" },
      ].map(({ key, label }) => (
        <label key={key} className="flex items-center justify-between py-2 cursor-pointer group" data-testid={`toggle-pref-${key}`}>
          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
          <button
            onClick={() => updatePreferences({ [key]: !preferences[key] })}
            className={`relative w-10 h-5 rounded-full transition-colors ${preferences[key] ? "" : "bg-gray-700"}`}
            style={preferences[key] ? { backgroundColor: primaryColor } : undefined}
            data-testid={`switch-${key}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${preferences[key] ? "translate-x-5" : ""}`} />
          </button>
        </label>
      ))}
      <div className="border-t border-gray-800 mt-2 pt-2">
        <button
          onClick={async () => { await unsubscribe(); onClose(); }}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
          data-testid="button-unsubscribe-push"
        >
          Turn off all notifications
        </button>
      </div>
    </div>
  );
}

function AudienceLayoutInner({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const { data: podcasts } = usePublicPodcasts();
  const { data: branding } = usePublicBranding();
  const { savedCount } = useReadLater();
  const { isSupported, isSubscribed, preferences, subscribe, unsubscribe, updatePreferences } = usePushNotifications();
  const audioPlayer = useAudioPlayerOptional();
  const hasActivePlayer = !!audioPlayer?.currentEpisode;
  const [location, navigate] = useLocation();

  const platformName = branding?.companyName || "MediaTech Empire";
  const tagline = branding?.tagline || "AI-Powered Media Platform";
  const logoUrl = branding?.logoUrl;
  const primaryColor = branding?.primaryColor || "#E5C100";

  const isActivePath = (path: string) => {
    if (path === "home") return location === "/home";
    if (path === "podcasts") return location === "/podcasts" || location.startsWith("/show/") || location.startsWith("/listen/");
    if (path === "search") return location === "/search";
    if (path === "news") return location === "/news" || location.startsWith("/news/");
    if (path === "read-later") return location === "/read-later";
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" data-testid="audience-layout">
      <header className="sticky top-0 z-50 bg-gray-950 text-white" data-testid="audience-masthead">
        <div className="border-b border-gray-800/50">
          <div className="max-w-[1400px] mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-6">
                <Link href="/home" className="flex items-center gap-2.5 group flex-shrink-0" data-testid="link-masthead-home">
                  {logoUrl ? (
                    <img src={logoUrl} alt={platformName} className="h-8 max-w-[160px] object-contain" data-testid="img-masthead-logo" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                        <Radio className="h-4 w-4 text-gray-900" />
                      </div>
                      <span className="text-lg font-bold tracking-tight hidden sm:block" data-testid="text-masthead-name">{platformName}</span>
                    </div>
                  )}
                </Link>

                <nav className="hidden lg:flex items-center" data-testid="audience-nav-desktop">
                  {[
                    { href: "/home", label: "Home", path: "home", icon: Home },
                    { href: "/podcasts", label: "Listen", path: "podcasts", icon: Headphones },
                    { href: "/news", label: "News", path: "news", icon: Newspaper },
                  ].map(({ href, label, path, icon: Icon }) => (
                    <Link
                      key={path}
                      href={href}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium transition-all rounded-full mx-0.5
                        ${isActivePath(path)
                          ? "text-gray-900"
                          : "text-gray-400 hover:text-white"
                        }`}
                      style={isActivePath(path) ? { backgroundColor: primaryColor } : undefined}
                      data-testid={`nav-${path}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  href="/search"
                  className="flex items-center gap-1.5 px-2.5 py-2 text-sm transition-colors rounded-full text-gray-400 hover:text-white hover:bg-gray-800"
                  data-testid="nav-search"
                >
                  <Search className="h-4 w-4" />
                </Link>
                {isSupported && (
                  <div className="relative">
                    <button
                      onClick={() => setNotifPanelOpen(!notifPanelOpen)}
                      className="flex items-center gap-1.5 px-2.5 py-2 text-sm transition-colors rounded-full text-gray-400 hover:text-white hover:bg-gray-800 relative"
                      data-testid="button-notification-bell"
                    >
                      <Bell className="h-4 w-4" />
                      {!isSubscribed && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" data-testid="dot-notifications-off" />
                      )}
                    </button>
                    {notifPanelOpen && isSubscribed && (
                      <NotificationPanel
                        isSubscribed={isSubscribed}
                        preferences={preferences}
                        subscribe={subscribe}
                        unsubscribe={unsubscribe}
                        updatePreferences={updatePreferences}
                        primaryColor={primaryColor}
                        onClose={() => setNotifPanelOpen(false)}
                      />
                    )}
                  </div>
                )}
                {notifPanelOpen && !isSubscribed && isSupported && (
                  <NotificationPanel
                    isSubscribed={isSubscribed}
                    preferences={preferences}
                    subscribe={subscribe}
                    unsubscribe={unsubscribe}
                    updatePreferences={updatePreferences}
                    primaryColor={primaryColor}
                    onClose={() => setNotifPanelOpen(false)}
                  />
                )}
                <Link
                  href="/read-later"
                  className={`flex items-center gap-1.5 px-2.5 py-2 text-sm transition-colors rounded-full relative
                    ${isActivePath("read-later") ? "text-white bg-gray-800" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
                  data-testid="nav-read-later"
                >
                  <Bookmark className="h-4 w-4" />
                  {savedCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ backgroundColor: primaryColor, color: "#111" }} data-testid="badge-read-later-count">
                      {savedCount > 99 ? "99+" : savedCount}
                    </span>
                  )}
                </Link>
                <a
                  href="#subscribe"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.querySelector('[data-testid="widget-inline-subscribe"], [data-testid="widget-sidebar-subscribe"], [data-testid="widget-episode-subscribe"]');
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-full transition-all hover:brightness-110"
                  style={{ backgroundColor: primaryColor, color: "#111" }}
                  data-testid="button-masthead-subscribe"
                >
                  <Bell className="h-3.5 w-3.5" />
                  Subscribe
                </a>
                <button
                  className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  data-testid="button-mobile-menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <PresetsBar podcasts={podcasts || []} primaryColor={primaryColor} />

        {mobileMenuOpen && (
          <div className="lg:hidden bg-gray-900 border-b border-gray-800 animate-in slide-in-from-top-2 duration-200" data-testid="audience-nav-mobile">
            <div className="px-4 py-4 space-y-1">
              {[
                { href: "/home", label: "Home", icon: Home },
                { href: "/podcasts", label: "Listen", icon: Headphones },
                { href: "/news", label: "News", icon: Newspaper },
                { href: "/search", label: "Search", icon: Search },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-gray-800 rounded-xl transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-nav-${label.toLowerCase()}`}
                >
                  <Icon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-white font-medium">{label}</span>
                </Link>
              ))}

              {isSupported && (
                <button
                  onClick={() => { setMobileMenuOpen(false); setNotifPanelOpen(true); }}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-gray-800 rounded-xl transition-colors w-full text-left"
                  data-testid="mobile-nav-notifications"
                >
                  <Bell className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-white font-medium">Notifications</span>
                  {!isSubscribed && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-red-500" />
                  )}
                </button>
              )}

              {podcasts && podcasts.length > 0 && (
                <div className="pt-3 mt-2 border-t border-gray-800">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2">Shows</p>
                  {podcasts.map((p: any) => (
                    <Link
                      key={p.id}
                      href={`/show/${p.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 rounded-xl transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`mobile-nav-show-${p.id}`}
                    >
                      {p.coverImage ? (
                        <img src={p.coverImage} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-gray-700" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gray-800 flex items-center justify-center ring-1 ring-gray-700">
                          <Mic className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{p.title}</p>
                        <p className="text-xs text-gray-500 truncate">with {p.host}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="pt-3 mt-2 border-t border-gray-800">
                <Link
                  href="/read-later"
                  className="flex items-center gap-3 px-3 py-3 hover:bg-gray-800 rounded-xl transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="mobile-nav-read-later"
                >
                  <Bookmark className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-white font-medium">Read Later</span>
                  {savedCount > 0 && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: primaryColor, color: "#111" }}>{savedCount}</span>
                  )}
                </Link>
                <a
                  href="#subscribe"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    setTimeout(() => {
                      const el = document.querySelector('[data-testid="widget-inline-subscribe"], [data-testid="widget-sidebar-subscribe"], [data-testid="widget-episode-subscribe"]');
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 100);
                  }}
                  className="flex items-center justify-center gap-2 mx-3 mt-3 py-2.5 rounded-full font-semibold text-sm transition-all hover:brightness-110"
                  style={{ backgroundColor: primaryColor, color: "#111" }}
                  data-testid="button-mobile-subscribe"
                >
                  <Bell className="h-4 w-4" />
                  Subscribe
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className={`flex-1 ${hasActivePlayer ? "pb-28 lg:pb-16" : "pb-16 lg:pb-0"}`}>
        {children}
      </main>

      <MiniPlayer />

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-lg border-t border-gray-800/50 safe-area-bottom print:hidden" data-testid="mobile-tab-bar">
        <div className="flex items-center justify-around h-14">
          {[
            { href: "/home", icon: Home, label: "Home", path: "home" },
            { href: "/podcasts", icon: Headphones, label: "Listen", path: "podcasts" },
            { href: "/news", icon: Newspaper, label: "News", path: "news" },
            { href: "/search", icon: Search, label: "Search", path: "search" },
          ].map(({ href, icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(href);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors
                ${isActivePath(path) ? "" : "text-gray-500"}`}
              style={isActivePath(path) ? { color: primaryColor } : undefined}
              data-testid={`tab-${path}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <PWAInstallPrompt />
      <CookieConsentBanner />

      <footer className="bg-gray-950 text-gray-400 print:hidden" data-testid="audience-footer">
        <div className="max-w-[1400px] mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                {logoUrl ? (
                  <img src={logoUrl} alt={platformName} className="h-7 max-w-[140px] object-contain brightness-200" />
                ) : (
                  <>
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                      <Radio className="h-3.5 w-3.5 text-gray-900" />
                    </div>
                    <span className="text-base font-bold text-white">{platformName}</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-4 max-w-xs">{tagline}</p>
              <div className="flex gap-2">
                <a href="#" className="h-8 w-8 rounded-full bg-gray-800/80 flex items-center justify-center hover:bg-gray-700 transition-colors" data-testid="link-social-x">
                  <XIcon className="h-3.5 w-3.5 text-gray-400" />
                </a>
                <a href="#" className="h-8 w-8 rounded-full bg-gray-800/80 flex items-center justify-center hover:bg-gray-700 transition-colors" data-testid="link-social-facebook">
                  <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="h-8 w-8 rounded-full bg-gray-800/80 flex items-center justify-center hover:bg-gray-700 transition-colors" data-testid="link-social-instagram">
                  <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Shows</h4>
              <ul className="space-y-1.5">
                {podcasts?.slice(0, 5).map((p: any) => (
                  <li key={p.id}>
                    <Link href={`/show/${p.id}`} className="text-sm text-gray-500 hover:text-white transition-colors" data-testid={`footer-show-${p.id}`}>
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Explore</h4>
              <ul className="space-y-1.5">
                <li><Link href="/home" className="text-sm text-gray-500 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/podcasts" className="text-sm text-gray-500 hover:text-white transition-colors">All Podcasts</Link></li>
                <li><Link href="/news" className="text-sm text-gray-500 hover:text-white transition-colors">News</Link></li>
                <li><Link href="/search" className="text-sm text-gray-500 hover:text-white transition-colors">Search</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Get the App</h4>
              <div className="space-y-2">
                <div className="opacity-60 cursor-not-allowed" data-testid="link-app-store">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 rounded-lg pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    <div>
                      <p className="text-[9px] text-gray-500 leading-none">Download on the</p>
                      <p className="text-xs text-white font-medium leading-tight">App Store</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-600 text-center mt-1">Coming Soon</p>
                </div>
                <div className="opacity-60 cursor-not-allowed" data-testid="link-google-play">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 rounded-lg pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 12l2.302-3.492zM5.864 2.658L16.8 9.99l-2.302 2.302L5.864 3.658z"/></svg>
                    <div>
                      <p className="text-[9px] text-gray-500 leading-none">Get it on</p>
                      <p className="text-xs text-white font-medium leading-tight">Google Play</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-600 text-center mt-1">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800/50 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} {platformName}. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Contact</span>
              <CookieSettingsLink className="text-xs text-gray-600 hover:text-gray-400 cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AudienceLayout({ children }: { children: React.ReactNode }) {
  return <AudienceLayoutInner>{children}</AudienceLayoutInner>;
}
