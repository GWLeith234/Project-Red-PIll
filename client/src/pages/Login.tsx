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

        {!needsSetup && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border bg-background hover:bg-muted/50 transition-colors text-sm text-foreground"
                data-testid="button-login-google"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>

              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border bg-background hover:bg-muted/50 transition-colors text-sm text-foreground"
                data-testid="button-login-x"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X
              </button>

              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border bg-background hover:bg-muted/50 transition-colors text-sm text-foreground"
                data-testid="button-login-linkedin"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0A66C2" />
                </svg>
                LinkedIn
              </button>
            </div>
          </>
        )}

        {needsSetup && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            This is the first time setup. Create your admin account to get started.
          </p>
        )}
      </div>
    </div>
  );
}
