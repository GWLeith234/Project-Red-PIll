import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Shield, Cookie, BarChart3, Target, Megaphone, Wrench } from "lucide-react";

const STORAGE_KEY = "cookie_consent";

interface CookieConsent {
  necessary: boolean;
  functional: boolean;
  performance: boolean;
  targeting: boolean;
  timestamp: string;
}

interface CookieConsentContextType {
  openPreferences: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType>({
  openPreferences: () => {},
});

function getStoredConsent(): CookieConsent | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function saveConsent(consent: CookieConsent) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
}

const categories = [
  {
    id: "necessary" as const,
    label: "Strictly Necessary",
    icon: Shield,
    description: "Essential cookies required for the site to function. These cannot be disabled.",
    locked: true,
    defaultValue: true,
  },
  {
    id: "functional" as const,
    label: "Functional",
    icon: Wrench,
    description: "Cookies that enable enhanced functionality and personalisation, such as remembering your preferences.",
    locked: true,
    defaultValue: true,
  },
  {
    id: "performance" as const,
    label: "Performance",
    icon: BarChart3,
    description: "Analytics, page views, and session duration. Helps us understand how visitors interact with our site.",
    locked: false,
    defaultValue: false,
    testId: "toggle-performance-cookies",
  },
  {
    id: "targeting" as const,
    label: "Targeting",
    icon: Target,
    description: "Personalised advertising and interest-based content delivery.",
    locked: false,
    defaultValue: false,
    testId: "toggle-targeting-cookies",
  },
  {
    id: "advertising" as const,
    label: "Advertising Delivery",
    icon: Megaphone,
    description: "Non-targeted ad serving. Always active to support free content delivery.",
    locked: true,
    defaultValue: true,
  },
];

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [performance, setPerformance] = useState(false);
  const [targeting, setTargeting] = useState(false);

  useEffect(() => {
    const consent = getStoredConsent();
    if (!consent) {
      setVisible(true);
    } else {
      setPerformance(consent.performance);
      setTargeting(consent.targeting);
    }
  }, []);

  const handleAcceptAll = useCallback(() => {
    const consent: CookieConsent = {
      necessary: true,
      functional: true,
      performance: true,
      targeting: true,
      timestamp: new Date().toISOString(),
    };
    saveConsent(consent);
    setPerformance(true);
    setTargeting(true);
    setVisible(false);
    setModalOpen(false);
  }, []);

  const handleRejectAll = useCallback(() => {
    const consent: CookieConsent = {
      necessary: true,
      functional: true,
      performance: false,
      targeting: false,
      timestamp: new Date().toISOString(),
    };
    saveConsent(consent);
    setPerformance(false);
    setTargeting(false);
    setVisible(false);
    setModalOpen(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    const consent: CookieConsent = {
      necessary: true,
      functional: true,
      performance,
      targeting,
      timestamp: new Date().toISOString(),
    };
    saveConsent(consent);
    setVisible(false);
    setModalOpen(false);
  }, [performance, targeting]);

  const openPreferences = useCallback(() => {
    const consent = getStoredConsent();
    if (consent) {
      setPerformance(consent.performance);
      setTargeting(consent.targeting);
    }
    setModalOpen(true);
  }, []);

  const handleManagePreferences = useCallback(() => {
    setModalOpen(true);
  }, []);

  return (
    <CookieConsentContext.Provider value={{ openPreferences }}>
      {visible && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-700/50 bg-gray-950/98 backdrop-blur-sm shadow-2xl"
          role="region"
          aria-label="Cookie consent"
          data-testid="cookie-consent-banner"
        >
          <div className="max-w-[1400px] mx-auto px-4 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Cookie className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-gray-300 leading-relaxed">
                  We process your data to deliver content and measure its performance. Some cookies are essential for the site to function.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-none min-h-[36px] px-5 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground border border-primary/50 transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                  data-testid="button-accept-all-cookies"
                >
                  Accept All
                </button>
                <button
                  onClick={handleRejectAll}
                  className="flex-1 sm:flex-none min-h-[36px] px-5 py-2 text-sm font-semibold rounded-md bg-gray-800 text-gray-100 border border-gray-700 transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                  data-testid="button-reject-all-cookies"
                >
                  Reject All
                </button>
                <button
                  onClick={handleManagePreferences}
                  className="flex-1 sm:flex-none min-h-[36px] px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded-md"
                  data-testid="button-manage-preferences"
                >
                  Manage Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="sm:max-w-lg bg-gray-950 border-gray-800 text-gray-100"
          data-testid="cookie-preferences-modal"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-white">
              <Cookie className="h-5 w-5 text-amber-400" aria-hidden="true" />
              Cookie Preferences
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isToggleable = !cat.locked;
              const checked = cat.locked
                ? true
                : cat.id === "performance"
                  ? performance
                  : cat.id === "targeting"
                    ? targeting
                    : true;

              return (
                <div
                  key={cat.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-800/50 bg-gray-900/50 hover:bg-gray-900 transition-colors"
                >
                  <Icon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-200">{cat.label}</span>
                      <Switch
                        checked={checked}
                        onCheckedChange={(val) => {
                          if (cat.id === "performance") setPerformance(val);
                          if (cat.id === "targeting") setTargeting(val);
                        }}
                        disabled={cat.locked}
                        aria-label={`${cat.label} cookies`}
                        {...(cat.testId ? { "data-testid": cat.testId } : {})}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{cat.description}</p>
                    {cat.locked && (
                      <span className="inline-block mt-1.5 text-[10px] font-medium text-amber-500/80 uppercase tracking-wider">
                        Always active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <button
                onClick={handleAcceptAll}
                className="flex-1 min-h-[36px] px-4 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground border border-primary/50 transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                data-testid="button-accept-all-cookies"
              >
                Accept All
              </button>
              <button
                onClick={handleRejectAll}
                className="flex-1 min-h-[36px] px-4 py-2 text-sm font-semibold rounded-md bg-gray-800 text-gray-100 border border-gray-700 transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                data-testid="button-reject-all-cookies"
              >
                Reject All
              </button>
            </div>
            <button
              onClick={handleSavePreferences}
              className="w-full min-h-[36px] px-4 py-2 text-sm font-semibold rounded-md bg-amber-500 text-gray-900 transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
              data-testid="button-save-cookie-preferences"
            >
              Save Preferences
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </CookieConsentContext.Provider>
  );
}

export function CookieSettingsLink({ className }: { className?: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [performance, setPerformance] = useState(false);
  const [targeting, setTargeting] = useState(false);

  const openPreferences = () => {
    const consent = getStoredConsent();
    if (consent) {
      setPerformance(consent.performance);
      setTargeting(consent.targeting);
    }
    setModalOpen(true);
  };

  const handleAcceptAll = () => {
    const consent: CookieConsent = {
      necessary: true,
      functional: true,
      performance: true,
      targeting: true,
      timestamp: new Date().toISOString(),
    };
    saveConsent(consent);
    setModalOpen(false);
  };

  const handleRejectAll = () => {
    const consent: CookieConsent = {
      necessary: true,
      functional: true,
      performance: false,
      targeting: false,
      timestamp: new Date().toISOString(),
    };
    saveConsent(consent);
    setModalOpen(false);
  };

  const handleSavePreferences = () => {
    const consent: CookieConsent = {
      necessary: true,
      functional: true,
      performance,
      targeting,
      timestamp: new Date().toISOString(),
    };
    saveConsent(consent);
    setModalOpen(false);
  };

  return (
    <>
      <button
        onClick={openPreferences}
        className={className || "text-sm text-gray-500 hover:text-white transition-colors cursor-pointer"}
        data-testid="link-cookie-settings"
      >
        Cookie Settings
      </button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="sm:max-w-lg bg-gray-950 border-gray-800 text-gray-100"
          data-testid="cookie-preferences-modal"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-white">
              <Cookie className="h-5 w-5 text-amber-400" aria-hidden="true" />
              Cookie Preferences
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const checked = cat.locked
                ? true
                : cat.id === "performance"
                  ? performance
                  : cat.id === "targeting"
                    ? targeting
                    : true;

              return (
                <div
                  key={cat.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-800/50 bg-gray-900/50 hover:bg-gray-900 transition-colors"
                >
                  <Icon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-200">{cat.label}</span>
                      <Switch
                        checked={checked}
                        onCheckedChange={(val) => {
                          if (cat.id === "performance") setPerformance(val);
                          if (cat.id === "targeting") setTargeting(val);
                        }}
                        disabled={cat.locked}
                        aria-label={`${cat.label} cookies`}
                        {...(cat.testId ? { "data-testid": cat.testId } : {})}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{cat.description}</p>
                    {cat.locked && (
                      <span className="inline-block mt-1.5 text-[10px] font-medium text-amber-500/80 uppercase tracking-wider">
                        Always active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <button
                onClick={handleAcceptAll}
                className="flex-1 min-h-[36px] px-4 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground border border-primary/50 transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
              >
                Accept All
              </button>
              <button
                onClick={handleRejectAll}
                className="flex-1 min-h-[36px] px-4 py-2 text-sm font-semibold rounded-md bg-gray-800 text-gray-100 border border-gray-700 transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
              >
                Reject All
              </button>
            </div>
            <button
              onClick={handleSavePreferences}
              className="w-full min-h-[36px] px-4 py-2 text-sm font-semibold rounded-md bg-amber-500 text-gray-900 transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              Save Preferences
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
