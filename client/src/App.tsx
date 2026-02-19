import React, { Suspense, useMemo } from "react";
import { Sidebar, MobileHeader, MobileSidebarProvider, useMobileSidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { Switch, Route } from "wouter";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/lib/auth";
import { BrandingProvider } from "@/components/BrandingProvider";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ContentFactory from "@/pages/ContentFactory";
import Monetization from "@/pages/Monetization";
import Network from "@/pages/Network";
import ArticlePage from "@/pages/ArticlePage";
import EpisodePage from "@/pages/EpisodePage";
import PodcastDirectory from "@/pages/PodcastDirectory";
import ShowDetail from "@/pages/ShowDetail";
import AudienceHome from "@/pages/AudienceHome";
import SearchPage from "@/pages/SearchPage";
import ReadLater from "@/pages/ReadLater";
import PublicNewsPage from "@/pages/PublicNewsPage";
import AudienceLayout from "@/components/layout/AudienceLayout";
import { AudioPlayerProvider } from "@/components/AudioPlayerProvider";
import UsersAdmin from "@/pages/UsersAdmin";
import SubscriberCRM from "@/pages/SubscriberCRM";
import CommercialCRM from "@/pages/CommercialCRM";
import Customize from "@/pages/Customize";
import Settings from "@/pages/Settings";
import ModerationQueue from "@/pages/ModerationQueue";
import AuthorProfile from "@/pages/AuthorProfile";
import Analytics from "@/pages/Analytics";
import CampaignBuilderPage from "@/pages/CampaignBuilderPage";
import SchedulerPage from "@/pages/SchedulerPage";
import AdResizer from "@/pages/AdResizer";
import KanbanBoard from "@/pages/KanbanBoard";
import MyTasks from "@/pages/MyTasks";
import NewsletterManager from "@/pages/NewsletterManager";
import LegalAdmin from "@/pages/LegalAdmin";
import SiteBuilder from "@/pages/SiteBuilder";
import CommunityAdmin from "@/pages/CommunityAdmin";
import PushCampaigns from "@/pages/PushCampaigns";
import EventsPage from "@/pages/EventsPage";
import CommunityPage from "@/pages/CommunityPage";
import LiveMapBroadcast from "@/pages/LiveMapBroadcast";
import NotFound from "@/pages/not-found";

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Loading...</p>
      </div>
    </div>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { open } = useMobileSidebar();
  const { data: branding } = useQuery({
    queryKey: ["/api/branding"],
    queryFn: async () => {
      const res = await fetch("/api/branding");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30000,
    retry: false,
  });

  const bgStyle = useMemo(() => {
    if (!branding) return {};
    const b = branding as any;
    const type = b.backgroundType || "solid";
    const style: React.CSSProperties = {};

    if (type === "gradient" && b.backgroundGradient) {
      style.backgroundImage = b.backgroundGradient;
    } else if (type === "image" && b.backgroundImageUrl) {
      style.backgroundImage = `url(${b.backgroundImageUrl})`;
      style.backgroundSize = b.backgroundSize || "cover";
      style.backgroundPosition = b.backgroundPosition || "center";
      style.backgroundAttachment = "fixed";
      style.backgroundRepeat = "no-repeat";
    } else if (type === "pattern" && b.backgroundPattern) {
      style.backgroundImage = b.backgroundPattern;
    } else if (type === "solid" && b.backgroundColor) {
      style.backgroundColor = b.backgroundColor;
    }
    return style;
  }, [branding]);

  const overlayOpacity = useMemo(() => {
    if (!branding) return 0.9;
    const b = branding as any;
    const type = b.backgroundType || "solid";
    if (type === "image" || type === "pattern") {
      return parseFloat(b.backgroundOverlayOpacity || "0.8");
    }
    if (type === "gradient") {
      return parseFloat(b.backgroundOverlayOpacity || "0");
    }
    return 0;
  }, [branding]);

  const hasCustomBg = branding && (branding as any).backgroundType;

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <MobileHeader />
      <Sidebar />
      <div className={cn(
        "flex-1 ml-0 lg:ml-64 flex flex-col h-screen transition-transform duration-300 ease-in-out",
        open ? "translate-x-72 lg:translate-x-0" : "translate-x-0"
      )}>
        <main
          className="flex-1 pt-14 lg:pt-0 px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 overflow-y-auto relative"
          style={hasCustomBg ? bgStyle : {}}
        >
          {hasCustomBg && overlayOpacity > 0 && (
            <div
              className="absolute inset-0 z-0 pointer-events-none backdrop-blur-[2px]"
              style={{ backgroundColor: `hsl(var(--background) / ${overlayOpacity})` }}
            />
          )}
          <div className={cn("max-w-7xl mx-auto", hasCustomBg && overlayOpacity > 0 ? "relative z-10" : "")}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileSidebarProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </MobileSidebarProvider>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-64 text-center" data-testid="error-boundary">
          <div>
            <h2 className="text-lg font-display font-bold text-primary mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-4">This page encountered an error while loading.</p>
            {this.state.error && (
              <pre className="text-xs text-red-400 bg-red-500/10 p-3 rounded mb-4 max-w-md overflow-auto text-left" data-testid="text-error-details">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-mono uppercase tracking-wider hover:bg-primary/90 transition-colors"
              data-testid="button-error-retry"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function NoAccess() {
  return (
    <div className="text-center py-20" data-testid="no-access-page">
      <h2 className="text-2xl font-display font-bold text-primary mb-2">Access Denied</h2>
      <p className="text-muted-foreground">You don't have permission to view this page.</p>
    </div>
  );
}

function PermissionGate({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) return <NoAccess />;
  return <>{children}</>;
}

function ProtectedRoutes() {
  const { user, loading, needsSetup } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || needsSetup) {
    return <Login />;
  }

  return (
    <AdminLayout>
      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/">{() => <PermissionGate permission="dashboard.view"><Dashboard /></PermissionGate>}</Route>
          <Route path="/content">{() => <PermissionGate permission="content.view"><ContentFactory /></PermissionGate>}</Route>
          <Route path="/scheduler">{() => <PermissionGate permission="content.view"><SchedulerPage /></PermissionGate>}</Route>
          <Route path="/moderation">{() => <PermissionGate permission="content.edit"><ModerationQueue /></PermissionGate>}</Route>
          <Route path="/campaigns">{() => <PermissionGate permission="content.view"><CampaignBuilderPage /></PermissionGate>}</Route>
          <Route path="/monetization">{() => <PermissionGate permission="monetization.view"><Monetization /></PermissionGate>}</Route>
          <Route path="/ad-resizer">{() => <PermissionGate permission="monetization.view"><AdResizer /></PermissionGate>}</Route>
          <Route path="/network">{() => <PermissionGate permission="network.view"><Network /></PermissionGate>}</Route>
          <Route path="/sales">{() => <PermissionGate permission="sales.view"><CommercialCRM /></PermissionGate>}</Route>
          <Route path="/audience">{() => <PermissionGate permission="audience.view"><SubscriberCRM /></PermissionGate>}</Route>
          <Route path="/analytics">{() => <PermissionGate permission="analytics.view"><Analytics /></PermissionGate>}</Route>
          <Route path="/customize">{() => <PermissionGate permission="customize.view"><Customize /></PermissionGate>}</Route>
          <Route path="/users">{() => <PermissionGate permission="users.view"><UsersAdmin /></PermissionGate>}</Route>
          <Route path="/settings">{() => <PermissionGate permission="settings.view"><Settings /></PermissionGate>}</Route>
          <Route path="/kanban">{() => <PermissionGate permission="content.view"><KanbanBoard /></PermissionGate>}</Route>
          <Route path="/my-tasks">{() => <PermissionGate permission="content.view"><MyTasks /></PermissionGate>}</Route>
          <Route path="/newsletters">{() => <PermissionGate permission="content.view"><NewsletterManager /></PermissionGate>}</Route>
          <Route path="/legal-admin">{() => <PermissionGate permission="settings.view"><LegalAdmin /></PermissionGate>}</Route>
          <Route path="/community">{() => <PermissionGate permission="content.view"><CommunityAdmin /></PermissionGate>}</Route>
          <Route path="/push-campaigns">{() => <PermissionGate permission="content.edit"><PushCampaigns /></PermissionGate>}</Route>
          <Route path="/site-builder">{() => <PermissionGate permission="customize.edit"><SiteBuilder /></PermissionGate>}</Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrandingProvider>
      <AudioPlayerProvider>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/home">{() => <AudienceLayout><AudienceHome /></AudienceLayout>}</Route>
            <Route path="/podcasts">{() => <AudienceLayout><PodcastDirectory /></AudienceLayout>}</Route>
            <Route path="/search">{() => <AudienceLayout><SearchPage /></AudienceLayout>}</Route>
            <Route path="/show/:podcastId">{() => <AudienceLayout><ShowDetail /></AudienceLayout>}</Route>
            <Route path="/author/:authorId">{() => <AudienceLayout><AuthorProfile /></AudienceLayout>}</Route>
            <Route path="/read-later">{() => <AudienceLayout><ReadLater /></AudienceLayout>}</Route>
            <Route path="/news">{() => <AudienceLayout><PublicNewsPage /></AudienceLayout>}</Route>
            <Route path="/news/:podcastId/article/:articleId">{() => <AudienceLayout><ArticlePage /></AudienceLayout>}</Route>
            <Route path="/listen/:podcastId/episode/:episodeId">{() => <AudienceLayout><EpisodePage /></AudienceLayout>}</Route>
            <Route path="/events">{() => <AudienceLayout><EventsPage /></AudienceLayout>}</Route>
            <Route path="/community-hub">{() => <AudienceLayout><CommunityPage /></AudienceLayout>}</Route>
            <Route path="/analytics/live-map">{() => <LiveMapBroadcast />}</Route>
            <Route>
              <ProtectedRoutes />
            </Route>
          </Switch>
        </Suspense>
        <Toaster />
      </AuthProvider>
      </AudioPlayerProvider>
      </BrandingProvider>
    </QueryClientProvider>
  );
}

export default App;
