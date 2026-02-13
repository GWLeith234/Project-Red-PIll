import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Menu, X, Mic, Headphones, Newspaper, Radio, ChevronDown, Bell } from "lucide-react";

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

export default function AudienceLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showsOpen, setShowsOpen] = useState(false);
  const { data: podcasts } = usePublicPodcasts();
  const { data: branding } = usePublicBranding();
  const [location] = useLocation();

  const platformName = branding?.companyName || "MediaTech Empire";
  const tagline = branding?.tagline || "AI-Powered Media Platform";
  const logoUrl = branding?.logoUrl;
  const primaryColor = branding?.primaryColor || "#E5C100";

  const firstPodcastId = podcasts?.[0]?.id;

  const isActivePath = (path: string) => {
    if (path === "podcasts") return location === "/podcasts";
    if (path === "shows") return location.startsWith("/show/") || location.startsWith("/listen/") || location.startsWith("/news/");
    if (path === "news") return location.startsWith("/news/");
    if (path === "episodes") return location.startsWith("/listen/");
    return false;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col" data-testid="audience-layout">
      <header className="sticky top-0 z-50 bg-gray-950 text-white" data-testid="audience-masthead">
        <div className="border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3 group" data-testid="link-masthead-home">
                {logoUrl ? (
                  <img src={logoUrl} alt={platformName} className="h-9 max-w-[180px] object-contain" data-testid="img-masthead-logo" />
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                      <Mic className="h-5 w-5 text-gray-900" />
                    </div>
                    <span className="text-xl font-bold tracking-tight hidden sm:block" data-testid="text-masthead-name">{platformName}</span>
                  </div>
                )}
              </Link>

              <nav className="hidden lg:flex items-center gap-1" data-testid="audience-nav-desktop">
                <Link
                  href="/podcasts"
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors rounded-lg
                    ${isActivePath("podcasts") ? "text-white bg-gray-800" : "text-gray-400 hover:text-white hover:bg-gray-800/50"}`}
                  data-testid="nav-podcasts"
                >
                  <Radio className="h-4 w-4" />
                  Podcasts
                </Link>

                <div className="relative group">
                  <button
                    onClick={() => setShowsOpen(!showsOpen)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors rounded-lg
                      ${isActivePath("shows") ? "text-white bg-gray-800" : "text-gray-400 hover:text-white hover:bg-gray-800/50"}`}
                    data-testid="nav-shows"
                  >
                    <Headphones className="h-4 w-4" />
                    Shows
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showsOpen ? "rotate-180" : ""}`} />
                  </button>

                  {showsOpen && podcasts && podcasts.length > 0 && (
                      <div
                        className="absolute top-full left-0 mt-1 w-80 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl py-2 z-50"
                        onMouseLeave={() => setShowsOpen(false)}
                        data-testid="dropdown-shows"
                      >
                        <div className="px-3 py-2 border-b border-gray-800">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Our Shows</p>
                        </div>
                        {podcasts.map((p: any) => (
                          <Link
                            key={p.id}
                            href={`/show/${p.id}`}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 transition-colors"
                            onClick={() => setShowsOpen(false)}
                            data-testid={`nav-show-${p.id}`}
                          >
                            {p.coverImage ? (
                              <img src={p.coverImage} alt="" className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                                <Mic className="h-5 w-5 text-gray-500" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">{p.title}</p>
                              <p className="text-xs text-gray-500 truncate">with {p.host}</p>
                            </div>
                          </Link>
                        ))}
                        <div className="border-t border-gray-800 mt-1 pt-1">
                          <Link
                            href="/podcasts"
                            className="flex items-center gap-2 px-3 py-2 text-xs text-amber-500 hover:bg-gray-800 transition-colors font-medium"
                            onClick={() => setShowsOpen(false)}
                          >
                            Browse all shows &rarr;
                          </Link>
                        </div>
                      </div>
                    )}
                </div>

                {firstPodcastId && (
                  <Link
                    href={`/news/${firstPodcastId}`}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors rounded-lg
                      ${isActivePath("news") ? "text-white bg-gray-800" : "text-gray-400 hover:text-white hover:bg-gray-800/50"}`}
                    data-testid="nav-news"
                  >
                    <Newspaper className="h-4 w-4" />
                    News
                  </Link>
                )}
              </nav>

              <div className="flex items-center gap-2">
                <a
                  href="#subscribe"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.querySelector('[data-testid="widget-inline-subscribe"], [data-testid="widget-sidebar-subscribe"], [data-testid="widget-episode-subscribe"]');
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
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
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-gray-900 border-b border-gray-800" data-testid="audience-nav-mobile">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              <Link
                href="/podcasts"
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-nav-podcasts"
              >
                <Radio className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-white font-medium">Browse Podcasts</span>
              </Link>
              {podcasts && podcasts.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Shows</p>
                  {podcasts.map((p: any) => (
                    <Link
                      key={p.id}
                      href={`/show/${p.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`mobile-nav-show-${p.id}`}
                    >
                      {p.coverImage ? (
                        <img src={p.coverImage} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center">
                          <Mic className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <span className="text-sm text-white font-medium">{p.title}</span>
                    </Link>
                  ))}
                </div>
              )}
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
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold text-sm"
                style={{ backgroundColor: primaryColor, color: "#111" }}
                data-testid="button-mobile-subscribe"
              >
                <Bell className="h-4 w-4" />
                Subscribe
              </a>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-gray-950 text-gray-400 print:hidden" data-testid="audience-footer">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                {logoUrl ? (
                  <img src={logoUrl} alt={platformName} className="h-8 max-w-[160px] object-contain brightness-200" />
                ) : (
                  <>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                      <Mic className="h-4 w-4 text-gray-900" />
                    </div>
                    <span className="text-lg font-bold text-white">{platformName}</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{tagline}</p>
              <div className="flex gap-3">
                <a href="#" className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors" data-testid="link-social-x">
                  <XIcon className="h-3.5 w-3.5 text-gray-400" />
                </a>
                <a href="#" className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors" data-testid="link-social-facebook">
                  <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors" data-testid="link-social-instagram">
                  <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Shows</h4>
              <ul className="space-y-2">
                {podcasts?.slice(0, 6).map((p: any) => (
                  <li key={p.id}>
                    <Link href={`/show/${p.id}`} className="text-sm text-gray-500 hover:text-white transition-colors" data-testid={`footer-show-${p.id}`}>
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><span className="text-sm text-gray-500">News & Stories</span></li>
                <li><span className="text-sm text-gray-500">Podcasts</span></li>
                <li><span className="text-sm text-gray-500">Episodes</span></li>
                <li><span className="text-sm text-gray-500">Subscribe</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Get the App</h4>
              <p className="text-sm text-gray-500 mb-4">Listen anywhere. Available on all your devices.</p>
              <div className="space-y-2">
                <a href="#" className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors" data-testid="link-app-store">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  <div>
                    <p className="text-[10px] text-gray-500 leading-none">Download on the</p>
                    <p className="text-sm text-white font-medium leading-tight">App Store</p>
                  </div>
                </a>
                <a href="#" className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors" data-testid="link-google-play">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 12l2.302-3.492zM5.864 2.658L16.8 9.99l-2.302 2.302L5.864 3.658z"/></svg>
                  <div>
                    <p className="text-[10px] text-gray-500 leading-none">Get it on</p>
                    <p className="text-sm text-white font-medium leading-tight">Google Play</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} {platformName}. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
