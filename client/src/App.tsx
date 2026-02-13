import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import ContentFactory from "@/pages/ContentFactory";
import Monetization from "@/pages/Monetization";
import Network from "@/pages/Network";
import NewsPage from "@/pages/NewsPage";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/news/:id" component={NewsPage} />
        <Route>
          <AdminLayout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/content" component={ContentFactory} />
              <Route path="/monetization" component={Monetization} />
              <Route path="/network" component={Network} />
              <Route path="/audience" component={() => <div className="text-2xl font-display">Audience Intelligence (Coming Soon)</div>} />
              <Route path="/analytics" component={() => <div className="text-2xl font-display">Analytics (Coming Soon)</div>} />
              <Route path="/settings" component={() => <div className="text-2xl font-display">Settings (Coming Soon)</div>} />
              <Route component={NotFound} />
            </Switch>
          </AdminLayout>
        </Route>
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
