import Link from "next/link";
import { PageBreadcrumbs } from "../../components/shared/page-breadcrumbs";
import { SiteFooter } from "../../components/shared/site-footer";
import { SiteHeader } from "../../components/shared/site-header";

export default function ContactPage() {
  return (
    <div className="page-shell">
      <SiteHeader activePath="/contact" />

      <main className="page-layout info-page-text">
        <PageBreadcrumbs items={[{ href: "/", label: "Home" }, { label: "Contact" }]} />

        <section className="info-page-section-plain">
          <p className="eyebrow about-page-eyebrow">Contact</p>
          <h1>Talk with our wholesale team</h1>
          <p className="legal-copy">
            Reach out for account approvals, catalog questions, order support, or wholesale
            onboarding help.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Primary Contact</h2>
          <p className="legal-copy">
            Email: <strong>operation@crossingcards.com</strong>
          </p>
          <p className="legal-copy">
            Business Hours: <strong>Monday - Friday, 9:00 AM - 5:00 PM PT</strong>
          </p>
          <p className="legal-copy">
            Best Use: Applications, catalog questions, and order support.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Best Information To Include</h2>
          <p className="legal-copy">
            Sending the right details helps our team respond faster and route your request to the
            correct workflow.
          </p>
          <ul className="info-page-list">
            <li>Your business name</li>
            <li>The email used on your application or account</li>
            <li>Relevant order number or customer account number</li>
            <li>A short description of the issue or request</li>
          </ul>
        </section>

        <section className="info-page-section-plain">
          <h2>What We Can Help With</h2>
          <p className="legal-copy">
            We can help with account applications, catalog support, order support, and general
            wholesale questions about how the storefront works.
          </p>
          <p className="legal-copy info-page-inline-links">
            <Link href="/open-account">Open an Account</Link>
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
