import { useEffect } from "react";
import { Link } from "wouter";

const LAST_UPDATED = "February 18, 2026";
const COMPANY_NAME = "Salem Media";
const CONTACT_EMAIL = "george@salemmedia.com";
const WEBSITE = "salemmedia.com";

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Legal
          </p>
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        <section>
          <p className="text-muted-foreground leading-relaxed">
            {COMPANY_NAME} ("we," "us," or "our") operates {WEBSITE} and related services
            (collectively, the "Platform"). This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you visit our Platform. Please read
            this policy carefully. If you disagree with its terms, please discontinue use of
            the Platform.
          </p>
        </section>

        <Section title="1. Information We Collect">
          <SubSection title="Information You Provide Directly">
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Name and email address when subscribing to our newsletter</li>
              <li>Phone number if you opt in to SMS communications</li>
              <li>Profile information such as display name, bio, and photo</li>
              <li>Content you submit including comments, poll votes, and community posts</li>
              <li>Payment information processed securely through third-party providers</li>
            </ul>
          </SubSection>
          <SubSection title="Information Collected Automatically">
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>IP address and approximate geographic location</li>
              <li>Browser type, operating system, and device type</li>
              <li>Pages visited, time spent, and referring URLs</li>
              <li>Session identifiers and anonymous visitor identifiers stored in your browser</li>
              <li>Interaction data such as clicks, scrolls, and content engagement</li>
            </ul>
          </SubSection>
          <SubSection title="Information from Third Parties">
            <p className="text-muted-foreground">
              If you choose to sign in with Google, X (Twitter), or LinkedIn, we receive basic
              profile information from those services consistent with your privacy settings on
              those platforms.
            </p>
          </SubSection>
        </Section>

        <Section title="2. How We Use Your Information">
          <p className="text-muted-foreground mb-3">We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Deliver and personalize content, newsletters, and podcast recommendations</li>
            <li>Send transactional emails and, where consented, marketing communications</li>
            <li>Send SMS messages where you have explicitly opted in</li>
            <li>Send push notifications where you have granted browser or device permission</li>
            <li>Analyze Platform usage to improve content and user experience</li>
            <li>Detect and prevent fraud, abuse, and security incidents</li>
            <li>Comply with legal obligations and enforce our Terms of Service</li>
            <li>Serve relevant advertising to support our free content</li>
          </ul>
        </Section>

        <Section title="3. How We Share Your Information">
          <p className="text-muted-foreground mb-3">
            We do not sell your personal information. We may share your information with:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>
              <strong className="text-foreground">Service providers</strong> — third parties
              that help us operate the Platform (email delivery, analytics, cloud hosting,
              payment processing) under confidentiality obligations
            </li>
            <li>
              <strong className="text-foreground">Advertising partners</strong> — aggregated,
              non-personally-identifiable audience data to help advertisers understand our
              audience; we do not share your name or email with advertisers
            </li>
            <li>
              <strong className="text-foreground">Legal requirements</strong> — when required
              by law, subpoena, or to protect the rights and safety of {COMPANY_NAME} or others
            </li>
            <li>
              <strong className="text-foreground">Business transfers</strong> — in connection
              with a merger, acquisition, or sale of assets, subject to standard confidentiality
              protections
            </li>
          </ul>
        </Section>

        <Section title="4. Cookies and Tracking Technologies">
          <p className="text-muted-foreground mb-3">
            We use cookies and similar technologies including:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>
              <strong className="text-foreground">Essential cookies</strong> — required for
              authentication and session management
            </li>
            <li>
              <strong className="text-foreground">Analytics cookies</strong> — to understand
              how visitors use our Platform (we use anonymous session and visitor IDs)
            </li>
            <li>
              <strong className="text-foreground">Preference cookies</strong> — to remember
              your settings such as saved bookmarks and read history
            </li>
          </ul>
          <p className="text-muted-foreground mt-3">
            You can control cookies through your browser settings. Disabling cookies may affect
            certain Platform functionality.
          </p>
        </Section>

        <Section title="5. Email and SMS Communications">
          <p className="text-muted-foreground mb-3">
            <strong className="text-foreground">Email:</strong> When you subscribe, you consent
            to receiving our newsletter and content updates. You may unsubscribe at any time
            using the link in any email we send.
          </p>
          <p className="text-muted-foreground">
            <strong className="text-foreground">SMS:</strong> We only send SMS messages where
            you have explicitly opted in. Message and data rates may apply. Text STOP to
            unsubscribe at any time. Text HELP for assistance.
          </p>
        </Section>

        <Section title="6. Push Notifications">
          <p className="text-muted-foreground">
            If you grant permission, we may send browser or app push notifications for breaking
            news, new episodes, and articles. You can revoke this permission at any time through
            your browser or device settings.
          </p>
        </Section>

        <Section title="7. Data Retention">
          <p className="text-muted-foreground">
            We retain your personal information for as long as your account is active or as
            needed to provide services. Analytics data is retained for up to 365 days.
            You may request deletion of your data at any time by contacting us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>.
          </p>
        </Section>

        <Section title="8. Your Rights">
          <p className="text-muted-foreground mb-3">Depending on your location, you may have the right to:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Access the personal information we hold about you</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt out of marketing communications at any time</li>
            <li>Object to certain processing activities</li>
          </ul>
          <p className="text-muted-foreground mt-3">
            To exercise any of these rights, contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          <p className="text-muted-foreground">
            Our Platform is not directed to children under the age of 13. We do not knowingly
            collect personal information from children under 13. If you believe a child has
            provided us with personal information, please contact us immediately.
          </p>
        </Section>

        <Section title="10. Security">
          <p className="text-muted-foreground">
            We implement industry-standard technical and organizational measures to protect your
            personal information. However, no method of transmission over the internet is 100%
            secure. We cannot guarantee absolute security but will notify you of any breach
            affecting your data as required by applicable law.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p className="text-muted-foreground">
            This Privacy Policy is governed by the laws of the State of Texas, United States,
            without regard to conflict of law principles.
          </p>
        </Section>

        <Section title="12. Changes to This Policy">
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify you of material
            changes by posting the new policy on this page with an updated date. Your continued
            use of the Platform after changes are posted constitutes your acceptance of the
            revised policy.
          </p>
        </Section>

        <Section title="13. Contact Us">
          <p className="text-muted-foreground">
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <div className="mt-3 p-4 bg-card border border-border rounded text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">{COMPANY_NAME}</p>
            <p>
              Email:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
            <p>Jurisdiction: Texas, United States</p>
          </div>
        </Section>

        {/* Footer nav */}
        <div className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
      {children}
    </div>
  );
}
