import { PageBreadcrumbs } from "../../components/shared/page-breadcrumbs";
import { SiteFooter } from "../../components/shared/site-footer";
import { SiteHeader } from "../../components/shared/site-header";

export default function PrivacyPolicyPage() {
  return (
    <div className="page-shell">
      <SiteHeader activePath="/catalog" />

      <main className="page-layout info-page-text">
        <PageBreadcrumbs items={[{ href: "/", label: "Home" }, { label: "Privacy Policy" }]} />

        <section className="info-page-section-plain">
          <p className="eyebrow about-page-eyebrow">Privacy Policy</p>
          <h1>Privacy Policy</h1>
          <p className="legal-copy">Last updated: April 14, 2026</p>
          <p className="legal-copy">
            Crossing TCG operates this store and website, including all related information,
            content, features, tools, products and services, in order to provide you, the
            customer, with a curated shopping experience (the &quot;Services&quot;). Crossing TCG is
            powered by Shopify, which enables us to provide the Services to you.
          </p>
          <p className="legal-copy">
            This Privacy Policy describes how we collect, use, and disclose your personal
            information when you visit, use, or make a purchase or other transaction using the
            Services or otherwise communicate with us. If there is a conflict between our Terms of
            Service and this Privacy Policy, this Privacy Policy controls with respect to the
            collection, processing, and disclosure of your personal information.
          </p>
          <p className="legal-copy">
            Please read this Privacy Policy carefully. By using and accessing any of the Services,
            you acknowledge that you have read this Privacy Policy and understand the collection,
            use, and disclosure of your information as described in this Privacy Policy.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Personal Information We Collect or Process</h2>
          <ul className="info-page-list">
            <li>Contact details including name, address, phone number, and email address.</li>
            <li>Financial information, payment details, and transaction confirmations.</li>
            <li>Account information including username, password, preferences, and settings.</li>
            <li>Transaction information including cart, purchase, return, exchange, and cancellation activity.</li>
            <li>Communications with us, including support inquiries.</li>
            <li>Device information including browser, network connection, IP address, and identifiers.</li>
            <li>Usage information regarding how and when you interact with the Services.</li>
          </ul>
        </section>

        <section className="info-page-section-plain">
          <h2>Personal Information Sources</h2>
          <ul className="info-page-list">
            <li>Directly from you when you create an account, use the Services, or contact us.</li>
            <li>Automatically through the Services, including cookies and similar technologies.</li>
            <li>From service providers that support storefront technology and processing.</li>
            <li>From partners or other third parties.</li>
          </ul>
        </section>

        <section className="info-page-section-plain">
          <h2>How We Use Your Personal Information</h2>
          <ul className="info-page-list">
            <li>Provide, tailor, and improve the Services.</li>
            <li>Marketing and advertising.</li>
            <li>Security and fraud prevention.</li>
            <li>Communicating with you.</li>
            <li>Legal reasons.</li>
          </ul>
        </section>

        <section className="info-page-section-plain">
          <h2>How We Disclose Personal Information</h2>
          <ul className="info-page-list">
            <li>With Shopify, vendors, and service providers supporting operations and fulfillment.</li>
            <li>With business and marketing partners, including Shopify-supported advertising tools.</li>
            <li>When you direct us or consent to disclosure for shipping or integrations.</li>
            <li>With affiliates or within our corporate group.</li>
            <li>In connection with legal obligations, disputes, or business transactions.</li>
          </ul>
        </section>

        <section className="info-page-section-plain">
          <h2>Relationship with Shopify</h2>
          <p className="legal-copy">
            The Services are hosted by Shopify, which collects and processes personal information
            about your access to and use of the Services in order to provide and improve the
            Services for you. Information you submit to the Services will be transmitted to and
            shared with Shopify as well as third parties that may be located in countries other
            than where you reside, in order to provide and improve the Services for you.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Third Party Websites and Links</h2>
          <p className="legal-copy">
            The Services may provide links to third-party websites or platforms. If you follow
            those links, you should review their privacy and security policies and other terms. We
            are not responsible for the privacy or security of those third-party sites.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Children&apos;s Data</h2>
          <p className="legal-copy">
            The Services are not intended to be used by children, and we do not knowingly collect
            personal information about children under the age of majority in your jurisdiction. If
            you believe a child has provided personal information, please contact us to request
            deletion.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Security and Retention of Your Information</h2>
          <p className="legal-copy">
            No security measures are perfect or impenetrable, and we cannot guarantee perfect
            security. Any information sent to us may not be secure while in transit.
          </p>
          <p className="legal-copy">
            How long we retain your personal information depends on factors such as whether we need
            the information to maintain your account, provide Services, comply with legal
            obligations, resolve disputes, or enforce contracts and policies.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Your Rights and Choices</h2>
          <p className="legal-copy">
            Depending on where you live, you may have some or all of the rights listed below in
            relation to your personal information.
          </p>
          <ul className="info-page-list">
            <li>Right to access or know what personal information we hold about you.</li>
            <li>Right to delete personal information we maintain about you.</li>
            <li>Right to correct inaccurate personal information.</li>
            <li>Right of portability in certain circumstances.</li>
            <li>Right to opt out of sale or sharing for targeted advertising, where applicable.</li>
            <li>Right to manage promotional communication preferences.</li>
          </ul>
        </section>

        <section className="info-page-section-plain">
          <h2>Complaints</h2>
          <p className="legal-copy">
            If you have complaints about how we process your personal information, please contact
            us. Depending on where you live, you may also have the right to appeal our decision or
            lodge a complaint with your local data protection authority.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>International Transfers</h2>
          <p className="legal-copy">
            We may transfer, store, and process your personal information outside the country where
            you live. Where required, we rely on recognized transfer mechanisms for international
            data transfers.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Changes to This Privacy Policy</h2>
          <p className="legal-copy">
            We may update this Privacy Policy from time to time to reflect changes to our
            practices, operational needs, legal requirements, or regulatory obligations.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Contact</h2>
          <p className="legal-copy">
            Should you have any questions about our privacy practices or this Privacy Policy, or if
            you would like to exercise any of the rights available to you, please call or email us
            at <strong>customerservice@crossingcards.com</strong> or contact us at{" "}
            <strong>152 Technology Drive, Irvine, CA, 92618, US</strong>.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
