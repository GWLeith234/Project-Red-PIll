import { useEffect } from "react";
import { Link } from "wouter";

const LAST_UPDATED = "February 18, 2026";
const COMPANY_NAME = "Salem Media";
const CONTACT_EMAIL = "george@salemmedia.com";
const WEBSITE = "salemmedia.com";

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        <section>
          <p className="text-muted-foreground leading-relaxed">
            These Terms of Service ("Terms") govern your access to and use of the {COMPANY_NAME}{" "}
            platform at {WEBSITE} and related services (collectively, the "Platform"). By
            accessing or using the Platform, you agree to be bound by these Terms. If you do not
            agree, do not use the Platform.
          </p>
        </section>

        <Section title="1. Eligibility">
          <p className="text-muted-foreground">
            You must be at least 13 years of age to use the Platform. By using the Platform, you
            represent that you are 13 or older and have the legal capacity to enter into these
            Terms. If you are under 18, you represent that your parent or guardian has reviewed
            and agreed to these Terms.
          </p>
        </Section>

        <Section title="2. Your Account">
          <p className="text-muted-foreground mb-3">
            When you create an account or subscribe to the Platform, you agree to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Provide accurate and complete information</li>
            <li>Keep your login credentials secure and confidential</li>
            <li>Notify us immediately of any unauthorized access to your account</li>
            <li>Accept responsibility for all activity that occurs under your account</li>
          </ul>
          <p className="text-muted-foreground mt-3">
            We reserve the right to suspend or terminate accounts that violate these Terms or
            that we believe are being used fraudulently.
          </p>
        </Section>

        <Section title="3. Content and Intellectual Property">
          <SubSection title="Our Content">
            <p className="text-muted-foreground">
              All content on the Platform including articles, podcast episodes, video clips,
              graphics, logos, and software is owned by or licensed to {COMPANY_NAME} and
              protected by applicable intellectual property laws. You may not reproduce,
              distribute, modify, or create derivative works without our prior written consent.
            </p>
          </SubSection>
          <SubSection title="Your Content">
            <p className="text-muted-foreground">
              By submitting content to the Platform (comments, community posts, poll responses,
              etc.), you grant {COMPANY_NAME} a non-exclusive, royalty-free, worldwide license
              to use, display, and distribute that content in connection with the Platform. You
              represent that you have all rights necessary to grant this license.
            </p>
          </SubSection>
          <SubSection title="Copyright Complaints">
            <p className="text-muted-foreground">
              If you believe content on the Platform infringes your copyright, please contact us
              at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>{" "}
              with a description of the allegedly infringing material and your contact
              information.
            </p>
          </SubSection>
        </Section>

        <Section title="4. Acceptable Use">
          <p className="text-muted-foreground mb-3">You agree not to use the Platform to:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Violate any applicable law or regulation</li>
            <li>Post or transmit content that is defamatory, obscene, threatening, or harassing</li>
            <li>Impersonate any person or entity or misrepresent your affiliation</li>
            <li>Collect or harvest user data without authorization</li>
            <li>Transmit spam, malware, or other malicious code</li>
            <li>Interfere with or disrupt the Platform's infrastructure</li>
            <li>Scrape or systematically extract data from the Platform without permission</li>
            <li>Circumvent any access controls or security measures</li>
          </ul>
          <p className="text-muted-foreground mt-3">
            We reserve the right to remove content and terminate accounts that violate these
            standards at our sole discretion.
          </p>
        </Section>

        <Section title="5. Community Features">
          <p className="text-muted-foreground">
            The Platform includes community features such as discussion boards, polls, and event
            listings. When participating in community features, you agree to engage respectfully
            and in good faith. {COMPANY_NAME} moderates community content and may remove posts,
            hide comments, or restrict participation without notice. We do not endorse or take
            responsibility for user-submitted community content.
          </p>
        </Section>

        <Section title="6. Newsletter, SMS, and Push Notifications">
          <p className="text-muted-foreground mb-3">
            <strong className="text-foreground">Newsletter/Email:</strong> By subscribing, you
            consent to receive our newsletter and content updates. Unsubscribe at any time via
            the link in any email.
          </p>
          <p className="text-muted-foreground mb-3">
            <strong className="text-foreground">SMS:</strong> SMS communications are only sent
            with your explicit opt-in consent. Message and data rates may apply. Text STOP to
            unsubscribe, HELP for assistance.
          </p>
          <p className="text-muted-foreground">
            <strong className="text-foreground">Push Notifications:</strong> Sent only where you
            have granted permission through your browser or device. Revoke permission at any
            time through your device settings.
          </p>
        </Section>

        <Section title="7. Advertising">
          <p className="text-muted-foreground">
            The Platform is supported by advertising. Advertisements are clearly identified and
            do not constitute endorsements by {COMPANY_NAME}. We are not responsible for the
            content of third-party advertisements or the products and services they promote.
          </p>
        </Section>

        <Section title="8. Third-Party Links and Services">
          <p className="text-muted-foreground">
            The Platform may contain links to third-party websites and services. These links are
            provided for convenience only. {COMPANY_NAME} has no control over and assumes no
            responsibility for the content, privacy policies, or practices of third-party sites.
            Your use of third-party services is at your own risk and subject to their terms.
          </p>
        </Section>

        <Section title="9. Disclaimers">
          <p className="text-muted-foreground mb-3">
            THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
            EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p className="text-muted-foreground">
            Content on the Platform represents the opinions of the respective authors and hosts
            and does not constitute legal, financial, medical, or professional advice.{" "}
            {COMPANY_NAME} does not warrant the accuracy, completeness, or timeliness of any
            content.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p className="text-muted-foreground">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {COMPANY_NAME.toUpperCase()} AND
            ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR
            RELATED TO YOUR USE OF THE PLATFORM, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
            DAMAGES. OUR TOTAL LIABILITY TO YOU SHALL NOT EXCEED $100 OR THE AMOUNT YOU PAID US
            IN THE PAST SIX MONTHS, WHICHEVER IS GREATER.
          </p>
        </Section>

        <Section title="11. Indemnification">
          <p className="text-muted-foreground">
            You agree to indemnify and hold harmless {COMPANY_NAME} and its officers, directors,
            employees, and agents from any claims, damages, losses, and expenses (including
            reasonable attorneys' fees) arising from your use of the Platform, your violation of
            these Terms, or your infringement of any third-party rights.
          </p>
        </Section>

        <Section title="12. Governing Law and Dispute Resolution">
          <p className="text-muted-foreground mb-3">
            These Terms are governed by the laws of the State of Texas, United States, without
            regard to conflict of law principles. Any dispute arising under these Terms shall be
            resolved exclusively in the state or federal courts located in Texas, and you
            consent to the personal jurisdiction of those courts.
          </p>
          <p className="text-muted-foreground">
            Before filing any legal claim, you agree to contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>{" "}
            and attempt to resolve the dispute informally for at least 30 days.
          </p>
        </Section>

        <Section title="13. Modifications to These Terms">
          <p className="text-muted-foreground">
            We reserve the right to modify these Terms at any time. We will provide notice of
            material changes by posting the updated Terms with a new effective date. Your
            continued use of the Platform after changes are posted constitutes acceptance of the
            revised Terms.
          </p>
        </Section>

        <Section title="14. Termination">
          <p className="text-muted-foreground">
            We may suspend or terminate your access to the Platform at any time, for any reason,
            with or without notice. Upon termination, your right to use the Platform ceases
            immediately. Provisions of these Terms that by their nature should survive
            termination will survive, including ownership provisions, warranty disclaimers, and
            limitations of liability.
          </p>
        </Section>

        <Section title="15. Contact Us">
          <p className="text-muted-foreground">
            Questions about these Terms? Contact us at:
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
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
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
