import { lazy, Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/lib/auth";
import Login from "@/pages/Login";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ContentFactory = lazy(() => import("@/pages/ContentFactory"));
const Monetization = lazy(() => import("@/pages/Monetization"));
const Network = lazy(() => import("@/pages/Network"));
const ArticlePage = lazy(() => import("@/pages/ArticlePage"));
const EpisodePage = lazy(() => import("@/pages/EpisodePage"));
const PodcastDirectory = lazy(() => import("@/pages/PodcastDirectory"));
const ShowDetail = lazy(() => import("@/pages/ShowDetail"));
const AudienceHome = lazy(() => import("@/pages/AudienceHome"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const ReadLater = lazy(() => import("@/pages/ReadLater"));
const PublicNewsPage = lazy(() => import("@/pages/PublicNewsPage"));
const AudienceLayout = lazy(() => import("@/components/layout/AudienceLayout"));
const UsersAdmin = lazy(() => import("@/pages/UsersAdmin"));
const SubscriberCRM = lazy(() => import("@/pages/SubscriberCRM"));
const CommercialCRM = lazy(() => import("@/pages/CommercialCRM"));
const Customize = lazy(() => import("@/pages/Customize"));
const Settings = lazy(() => import("@/pages/Settings"));
const ModerationQueue = lazy(() => import("@/pages/ModerationQueue"));
const AuthorProfile = lazy(() => import("@/pages/AuthorProfile"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const CampaignBuilderPage = lazy(() => import("@/pages/CampaignBuilderPage"));
const SchedulerPage = lazy(() => import("@/pages/SchedulerPage"));
const NotFound = lazy(() => import("@/pages/not-found"));

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

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen bg-[url('/images/command-center-bg.png')] bg-cover bg-center bg-fixed bg-no-repeat relative">
        <div className="absolute inset-0 bg-background/90 z-0 pointer-events-none backdrop-blur-[2px]"></div>
        <div className="relative z-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
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
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/">{() => <PermissionGate permission="dashboard.view"><Dashboard /></PermissionGate>}</Route>
          <Route path="/content">{() => <PermissionGate permission="content.view"><ContentFactory /></PermissionGate>}</Route>
          <Route path="/scheduler">{() => <PermissionGate permission="content.view"><SchedulerPage /></PermissionGate>}</Route>
          <Route path="/moderation">{() => <PermissionGate permission="content.edit"><ModerationQueue /></PermissionGate>}</Route>
          <Route path="/campaigns">{() => <PermissionGate permission="content.view"><CampaignBuilderPage /></PermissionGate>}</Route>
          <Route path="/monetization">{() => <PermissionGate permission="monetization.view"><Monetization /></PermissionGate>}</Route>
          <Route path="/network">{() => <PermissionGate permission="network.view"><Network /></PermissionGate>}</Route>
          <Route path="/sales">{() => <PermissionGate permission="sales.view"><CommercialCRM /></PermissionGate>}</Route>
          <Route path="/audience">{() => <PermissionGate permission="audience.view"><SubscriberCRM /></PermissionGate>}</Route>
          <Route path="/analytics">{() => <PermissionGate permission="analytics.view"><Analytics /></PermissionGate>}</Route>
          <Route path="/customize">{() => <PermissionGate permission="customize.view"><Customize /></PermissionGate>}</Route>
          <Route path="/users">{() => <PermissionGate permission="users.view"><UsersAdmin /></PermissionGate>}</Route>
          <Route path="/settings">{() => <PermissionGate permission="settings.view"><Settings /></PermissionGate>}</Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AdminLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
            <Route>
              <ProtectedRoutes />
            </Route>
          </Switch>
        </Suspense>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
