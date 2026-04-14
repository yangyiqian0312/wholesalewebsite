import { PageBreadcrumbs } from "../../components/shared/page-breadcrumbs";
import { SiteFooter } from "../../components/shared/site-footer";
import { SiteHeader } from "../../components/shared/site-header";

export default function TermsAndConditionsPage() {
  return (
    <div className="page-shell">
      <SiteHeader activePath="/catalog" />

      <main className="page-layout info-page-text">
        <PageBreadcrumbs items={[{ href: "/", label: "Home" }, { label: "Terms & Conditions" }]} />

        <section className="info-page-section-plain">
          <p className="eyebrow about-page-eyebrow">Terms &amp; Conditions</p>
          <h1>Rules for using the wholesale storefront</h1>
          <p className="legal-copy">Effective date: April 14, 2026.</p>
          <p className="legal-copy">
            These terms govern access to the storefront, account use, and general platform
            behavior for approved wholesale customers and applicants.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Approved Account Access</h2>
          <p className="legal-copy">
            Pricing visibility, ordering features, and account management are intended for approved
            wholesale users. Access may be limited, suspended, or removed if account details are
            inaccurate or use falls outside approved wholesale activity.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Account Responsibility</h2>
          <ul className="info-page-list">
            <li>Keep login credentials secure.</li>
            <li>Use the storefront only for your business account.</li>
            <li>Keep account profile and contact details reasonably current.</li>
            <li>Do not share pricing access outside your approved business workflow.</li>
          </ul>
        </section>

        <section className="info-page-section-plain">
          <h2>Catalog, Availability, and Pricing</h2>
          <p className="legal-copy">
            Catalog listings, availability, release dates, and visible pricing may change. Order
            submission through the storefront starts a review workflow and does not by itself
            guarantee acceptance, inventory reservation, or final invoicing terms.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Acceptable Use</h2>
          <ul className="info-page-list">
            <li>Do not misuse the site or attempt unauthorized access.</li>
            <li>Do not interfere with other users, sessions, or account workflows.</li>
            <li>Do not copy or scrape protected pricing or internal workflow data at scale.</li>
            <li>Do not use the storefront for fraudulent, abusive, or misleading activity.</li>
          </ul>
        </section>

        <section className="info-page-section-plain">
          <h2>Platform Changes</h2>
          <p className="legal-copy">
            We may update site functionality, account requirements, or internal review workflows as
            the wholesale program evolves. Continued use of the storefront after updates means you
            are using the current version of the service.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Contact</h2>
          <p className="legal-copy">
            Questions about storefront access or account use can be sent to{" "}
            <strong>operation@crossingcards.com</strong>.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Mobile Messaging Terms</h2>
          <p className="legal-copy">
            Crossing TCG (&ldquo;we&rdquo; or &ldquo;us&rdquo;) operates a mobile messaging program
            (the &ldquo;Program&rdquo;) subject to these Mobile Messaging Terms and Conditions (the
            &ldquo;Mobile Messaging Terms&rdquo;). The Program and our collection and use of your
            personal information is also subject to our Privacy Policy.
          </p>
          <ol className="info-page-numbered-list">
            <li>
              <strong>Program Description:</strong> We may send promotional and transactional mobile
              messages in various formats through the Program. Message frequency will vary but will
              not exceed 4 messages per month. We do not charge for mobile messages sent through
              the Program, but you are responsible for any message and data rates imposed by your
              mobile provider.
            </li>
            <li>
              <strong>User Opt-In:</strong> By providing your mobile phone number to us, you are
              voluntarily opting in to the Program and you agree to receive recurring mobile
              messages from us. If you change your mobile phone number or are no longer the owner
              or authorized user of it, you agree to promptly notify us at{" "}
              <strong>customerservice@crossingcards.com</strong>.
            </li>
            <li>
              <strong>User Opt-Out and Support:</strong> You may opt out of the Program at any time
              by replying STOP, QUIT, CANCEL, OPT-OUT, or UNSUBSCRIBE to any mobile message from
              us. For support, reply HELP to any mobile message from us.
            </li>
            <li>
              <strong>Disclaimer of Warranty and Liability:</strong> The Program is offered on an
              as-is basis and may not be available in all areas, at all times, or on all mobile
              providers.
            </li>
            <li>
              <strong>Modifications:</strong> We may modify or cancel the Program or any of its
              features at any time, and we may also modify these Mobile Messaging Terms from time
              to time by posting updated terms to our website.
            </li>
          </ol>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
