import { db } from "./storage";
import { legalTemplates } from "@shared/schema";
import { eq } from "drizzle-orm";

const tosBody = `# TERMS OF SERVICE

**EFFECTIVE AS OF {{TOS_EFFECTIVE_DATE}}**

## 1. AGREEMENT BETWEEN USER AND {{COMPANY_SHORT}}

PLEASE READ THESE TERMS OF USE CAREFULLY BEFORE USING ANY {{COMPANY_SHORT}} SITE OR APPLICATION.

This site or application is owned or managed by {{COMPANY_NAME}} (referred to herein as "{{COMPANY_SHORT}}"), which includes, without limitation, entertainment brands such as podcast networks, websites, mobile applications, and related digital properties (each a "{{COMPANY_SHORT}} Site," and collectively the "{{COMPANY_SHORT}} Sites").

{{COMPANY_SHORT}} provides this {{COMPANY_SHORT}} Site and related services for your personal non-commercial use only and subject to your compliance with this Terms of Use Agreement (the "Agreement"). Please read this Agreement carefully before using any {{COMPANY_SHORT}} Site. Your use of this {{COMPANY_SHORT}} Site constitutes your acceptance to be bound by this Agreement without limitation, qualification, or change.

## 2. MOBILE DEVICES AND APPLICATIONS

If permitted through the applicable {{COMPANY_SHORT}} Service, to upload content, receive messages, browse, or access features through a mobile application, you must have a mobile communications subscription with a participating carrier.

## 3. USE OF CONTENT

All information, materials, functions, and other content ("Content") contained on any {{COMPANY_SHORT}} Site are our copyrighted property or the copyrighted property of our licensors. Except as specifically agreed in writing, no Content may be used, reproduced, transmitted, distributed, or otherwise exploited.

## 4. PODCAST CONTENT AND AUDIO/VIDEO STREAMING

{{COMPANY_SHORT}} makes podcast episodes, audio streams, and video content available through the {{COMPANY_SHORT}} Sites. Your use is limited to personal, non-commercial listening and viewing purposes. You may not record, rebroadcast, retransmit, or redistribute any stream without express written permission.

## 5. NO UNLAWFUL OR PROHIBITED USE

As a condition of your use of a {{COMPANY_SHORT}} Site, you warrant you will not use it for any unlawful or prohibited purpose.

YOUR ACCESS TO ANY {{COMPANY_SHORT}} SITE MAY BE TERMINATED IMMEDIATELY IN {{COMPANY_SHORT}}'S SOLE DISCRETION.

## 6. PRIVACY AND PROTECTION OF PERSONAL INFORMATION

{{COMPANY_SHORT}} has developed a Privacy Policy to inform you of its practices with respect to collection, use, disclosure, and protection of personal information.

## 7. ACCOUNTS, SECURITY, AND PASSWORDS

If a {{COMPANY_SHORT}} Service requires you to open an account, you must provide current, complete, and accurate information. You agree to notify {{COMPANY_SHORT}} immediately of any unauthorized use at {{SUPPORT_EMAIL}}.

## 8. USER SUBMISSIONS

By posting your Submission to a {{COMPANY_SHORT}} Site, you grant us a perpetual, non-exclusive, irrevocable, fully-paid, royalty-free, worldwide license to use, reproduce, transmit, display, distribute, modify, and create derivative works.

## 9. CODE OF CONDUCT

By using a {{COMPANY_SHORT}} Site, you agree not to distribute unlawful content, files protected by IP laws, harassing content, viruses, spam, or attempt unauthorized access.

## 10. THIRD-PARTY LINKS, ADVERTISEMENTS, AND SPONSORS

The {{COMPANY_SHORT}} Sites may contain links to other websites. We are not responsible for the contents of any Linked Site.

## 11. NEWSLETTER AND SUBSCRIPTION SERVICES

You may unsubscribe at any time by following instructions in communications or contacting {{SUPPORT_EMAIL}}.

## 12. CONTESTS AND SWEEPSTAKES

Any sweepstakes or contests are governed by specific rules presented with those promotions.

## 13. SOFTWARE AND DOWNLOADS

Any software is owned or controlled by {{COMPANY_SHORT}} and protected by copyright laws.

## 14. EVENTS

Participation in {{COMPANY_SHORT}}-sponsored events is at your own risk.

## 15. DISCLAIMERS AND LIMITATION OF LIABILITY

THE {{COMPANY_SHORT}} SITES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTY OF ANY KIND. IN NO EVENT SHALL {{COMPANY_SHORT}} BE LIABLE FOR ANY DAMAGES WHATSOEVER.

## 16. INDEMNIFICATION

You agree to defend, indemnify, and hold {{COMPANY_SHORT}} harmless from any claims arising from your use of the {{COMPANY_SHORT}} Sites.

## 17. GOVERNING LAW AND JURISDICTION

This Agreement shall be governed by the laws of the State of {{STATE_OF_INCORPORATION}}.

## 18. COPYRIGHT INFRINGEMENT (DMCA)

Send DMCA notices to: {{SUPPORT_EMAIL}} or by mail to {{COMPANY_NAME}}, Attn: Copyright Agent, {{COMPANY_ADDRESS}}.

## 19. MISCELLANEOUS

Questions regarding these Terms should be directed to {{SUPPORT_EMAIL}} or by mail to {{COMPANY_NAME}}, {{COMPANY_ADDRESS}}.`;

const privacyBody = `# PRIVACY POLICY

**EFFECTIVE AS OF {{PRIVACY_EFFECTIVE_DATE}}**

{{COMPANY_NAME}} ("{{COMPANY_SHORT}}," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our websites, mobile applications, podcast platforms, and other digital properties (collectively, the "{{COMPANY_SHORT}} Sites").

## 1. INFORMATION WE COLLECT

We collect information you provide directly to us, including but not limited to:

- **Account Information:** Name, email address, username, password, and profile details when you create an account.
- **Subscription Information:** Email address, podcast preferences, and communication preferences when you subscribe to newsletters or podcasts.
- **User Submissions:** Comments, reviews, forum posts, and other content you submit through {{COMPANY_SHORT}} Sites.
- **Transaction Information:** Billing address, payment method details, and purchase history when you make a purchase or donation.
- **Communications:** Information you provide when you contact us at {{SUPPORT_EMAIL}} for support or feedback.

We also automatically collect certain information when you use our services, including:

- **Device Information:** IP address, browser type, operating system, device identifiers, and mobile network information.
- **Usage Data:** Pages visited, content viewed or listened to, time spent on pages, click patterns, and referral URLs.
- **Location Data:** General geographic location based on IP address.
- **Cookies and Tracking Technologies:** We use cookies, web beacons, pixels, and similar technologies to collect usage data and improve our services.

## 2. HOW WE USE YOUR INFORMATION

We use the information we collect to:

- Provide, maintain, and improve the {{COMPANY_SHORT}} Sites and services.
- Personalize your experience, including content recommendations and podcast suggestions.
- Send newsletters, updates, and promotional communications (with your consent).
- Process transactions and send related information.
- Respond to your comments, questions, and customer service requests.
- Monitor and analyze trends, usage, and activities in connection with our services.
- Detect, investigate, and prevent fraudulent transactions and other illegal activities.
- Comply with legal obligations and enforce our Terms of Service.

## 3. ADVERTISER AND SPONSOR DATA SHARING

{{COMPANY_SHORT}} works with advertisers, sponsors, and advertising partners to deliver relevant content and advertisements. We may share the following with these partners:

- **Aggregated and De-identified Data:** Audience demographics, listening statistics, engagement metrics, and content performance data that does not personally identify you.
- **Campaign Performance Data:** Impression counts, click-through rates, and conversion metrics related to advertising campaigns.
- **Podcast Analytics:** Download numbers, listener demographics, geographic distribution, and listening patterns shared with podcast sponsors.

We do NOT sell your personal information directly to advertisers. Advertisers may receive reports containing aggregate statistics about our audience but will not receive your personal contact information without your explicit consent.

## 4. THIRD-PARTY PLATFORMS AND SERVICES

The {{COMPANY_SHORT}} Sites may integrate with or contain links to third-party platforms, including:

- **Podcast Distribution Platforms:** Apple Podcasts, Spotify, Google Podcasts, and other podcast directories.
- **Social Media Platforms:** Facebook, Twitter/X, Instagram, LinkedIn, TikTok, and YouTube.
- **Analytics Providers:** Google Analytics, podcast analytics services, and audience measurement tools.
- **Payment Processors:** Third-party payment services for processing transactions.
- **Advertising Networks:** Third-party ad networks that may use cookies and tracking technologies.

These third parties have their own privacy policies, and we encourage you to review them. {{COMPANY_SHORT}} is not responsible for the privacy practices of third-party services.

## 5. DATA SECURITY

We implement appropriate technical and organizational security measures to protect your personal information, including:

- Encryption of data in transit and at rest.
- Regular security assessments and vulnerability testing.
- Access controls limiting employee access to personal data.
- Secure data storage with {{COMPANY_SHORT}}'s approved cloud service providers.

However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee its absolute security.

## 6. YOUR PRIVACY RIGHTS

Depending on your location, you may have the following rights regarding your personal information:

- **Access:** Request a copy of the personal information we hold about you.
- **Correction:** Request correction of inaccurate or incomplete personal information.
- **Deletion:** Request deletion of your personal information, subject to certain exceptions.
- **Opt-Out:** Opt out of receiving marketing communications at any time by contacting {{SUPPORT_EMAIL}} or using the unsubscribe link in our emails.
- **Data Portability:** Request a copy of your data in a structured, machine-readable format.
- **Restrict Processing:** Request that we limit how we use your personal information.

To exercise any of these rights, please contact us at {{SUPPORT_EMAIL}} or write to {{COMPANY_NAME}}, {{COMPANY_ADDRESS}}.

## 7. ADVERTISING AND TARGETING

We and our advertising partners may use cookies, web beacons, and similar technologies to collect information for advertising purposes, including:

- **Interest-Based Advertising:** Delivering ads based on your browsing history, content preferences, and podcast listening habits.
- **Retargeting:** Showing ads on other websites and platforms based on your previous interactions with {{COMPANY_SHORT}} Sites.
- **Frequency Capping:** Limiting the number of times you see a particular advertisement.
- **Attribution and Analytics:** Measuring the effectiveness of advertising campaigns.

You may opt out of interest-based advertising by:

- Adjusting your browser settings to block or delete cookies.
- Using the opt-out tools provided by the Digital Advertising Alliance (DAA) at optout.aboutads.info.
- Using the opt-out tools provided by the Network Advertising Initiative (NAI) at optout.networkadvertising.org.
- Adjusting your mobile device settings to limit ad tracking.

## 8. CHILDREN'S PRIVACY

The {{COMPANY_SHORT}} Sites are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will take steps to delete such information promptly. If you believe a child under 13 has provided us with personal information, please contact us at {{SUPPORT_EMAIL}}.

## 9. CALIFORNIA PRIVACY RIGHTS (CCPA/CPRA)

If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA):

- **Right to Know:** You have the right to request that we disclose what personal information we collect, use, disclose, and sell about you.
- **Right to Delete:** You have the right to request deletion of your personal information, subject to certain exceptions.
- **Right to Correct:** You have the right to request correction of inaccurate personal information.
- **Right to Opt-Out of Sale/Sharing:** You have the right to opt out of the sale or sharing of your personal information for cross-context behavioral advertising.
- **Right to Limit Use of Sensitive Personal Information:** You have the right to limit how we use your sensitive personal information.
- **Right to Non-Discrimination:** We will not discriminate against you for exercising your privacy rights.

To submit a request, please contact us at {{SUPPORT_EMAIL}} or write to {{COMPANY_NAME}}, {{COMPANY_ADDRESS}}. We will verify your identity before processing your request.

In the preceding 12 months, we have collected the following categories of personal information: identifiers, internet activity, geolocation data, and inferences drawn from the above.

## 10. DATA RETENTION

We retain your personal information for as long as necessary to fulfill the purposes for which it was collected, including to satisfy legal, accounting, or reporting requirements. When we no longer need your personal information, we will securely delete or anonymize it.

## 11. CHANGES TO THIS PRIVACY POLICY

We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on the {{COMPANY_SHORT}} Sites and updating the "Effective As Of" date. Your continued use of the {{COMPANY_SHORT}} Sites after any changes constitutes your acceptance of the updated Privacy Policy.

## 12. CONTACT US

If you have any questions about this Privacy Policy or our privacy practices, please contact us at:

**{{COMPANY_NAME}}**
{{COMPANY_ADDRESS}}
Email: {{SUPPORT_EMAIL}}
Phone: {{SUPPORT_PHONE}}`;

async function seedLegalTemplates() {
  console.log("Checking for existing legal templates...");

  const existingTos = await db
    .select()
    .from(legalTemplates)
    .where(eq(legalTemplates.templateType, "terms_of_service"));

  const existingPrivacy = await db
    .select()
    .from(legalTemplates)
    .where(eq(legalTemplates.templateType, "privacy_policy"));

  if (existingTos.length > 0 && existingPrivacy.length > 0) {
    console.log("Both legal templates already exist. Skipping seed.");
    process.exit(0);
  }

  if (existingTos.length === 0) {
    console.log("Inserting Terms of Service template...");
    await db.insert(legalTemplates).values({
      templateType: "terms_of_service",
      title: "Terms of Service",
      body: tosBody,
    });
    console.log("Terms of Service template inserted.");
  } else {
    console.log("Terms of Service template already exists. Skipping.");
  }

  if (existingPrivacy.length === 0) {
    console.log("Inserting Privacy Policy template...");
    await db.insert(legalTemplates).values({
      templateType: "privacy_policy",
      title: "Privacy Policy",
      body: privacyBody,
    });
    console.log("Privacy Policy template inserted.");
  } else {
    console.log("Privacy Policy template already exists. Skipping.");
  }

  console.log("Legal templates seeding complete.");
  process.exit(0);
}

seedLegalTemplates().catch((err) => {
  console.error("Error seeding legal templates:", err);
  process.exit(1);
});
