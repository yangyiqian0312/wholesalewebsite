import { SiteHeader } from "../../components/shared/site-header";

export default function ContactPage() {
  return (
    <div className="page-shell">
      <SiteHeader activePath="/contact" />

      <main className="page-layout">
        <section className="hero">
          <div>
            <p className="eyebrow">Contact</p>
            <h1>Talk with our wholesale team</h1>
            <p className="hero-copy">
              Reach out for account questions, product availability, order support, or wholesale
              onboarding help.
            </p>
          </div>
        </section>

        <section className="catalog-layout">
          <section className="panel table-panel">
            <div className="table-panel-header">
              <div>
                <h2>Contact Information</h2>
                <p className="panel-subtitle">
                  Fastest ways to reach our team for B2B support.
                </p>
              </div>
            </div>

            <div className="admin-application-grid">
              <div className="admin-application-block">
                <span>Email</span>
                <strong>operation@crossingcards.com</strong>
              </div>
              <div className="admin-application-block">
                <span>Business Hours</span>
                <strong>Monday - Friday, 9:00 AM - 5:00 PM PT</strong>
              </div>
              <div className="admin-application-block admin-application-block-wide">
                <span>Support</span>
                <strong>
                  For account approvals, catalog issues, and order questions, email us and include
                  your business name plus the email used on your application.
                </strong>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
