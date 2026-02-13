import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useBranding } from "@/lib/api";

export default function Login() {
  const { login, setup, needsSetup } = useAuth();
  const { data: branding } = useBranding();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const platformName = branding?.companyName || "MediaTech Empire";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (needsSetup) {
        await setup({ username, password, displayName: displayName || username });
      } else {
        await login(username, password);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="login-page">
      <div className="absolute inset-0 bg-[url('/images/command-center-bg.png')] bg-cover bg-center opacity-20" />

      <div className="relative z-10 w-full max-w-md p-8 bg-card border border-border" data-testid="login-form-container">
        <div className="text-center mb-8">
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt={platformName} className="h-10 mx-auto mb-4 object-contain" data-testid="login-logo" />
          ) : (
            <h1 className="text-3xl font-display font-bold text-primary tracking-tight" data-testid="login-title">
              {platformName}
            </h1>
          )}
          <p className="text-sm text-muted-foreground mt-2 font-mono uppercase tracking-widest">
            {needsSetup ? "Create Admin Account" : "Sign In"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {needsSetup && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Your name"
                data-testid="input-display-name"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="Enter username"
              required
              data-testid="input-username"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="Enter password"
              required
              minLength={6}
              data-testid="input-password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2" data-testid="text-login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-primary text-primary-foreground font-mono uppercase tracking-wider text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            data-testid="button-login"
          >
            {isLoading ? "Please wait..." : needsSetup ? "Create Account" : "Sign In"}
          </button>
        </form>

        {needsSetup && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            This is the first time setup. Create your admin account to get started.
          </p>
        )}
      </div>
    </div>
  );
}
