import { PageBreadcrumbs } from "../../components/shared/page-breadcrumbs";
import { SiteFooter } from "../../components/shared/site-footer";
import { SiteHeader } from "../../components/shared/site-header";

export default function TermsOfSalePage() {
  return (
    <div className="page-shell">
      <SiteHeader activePath="/catalog" />

      <main className="page-layout info-page-text">
        <PageBreadcrumbs items={[{ href: "/", label: "Home" }, { label: "Terms of Sale" }]} />

        <section className="info-page-section-plain">
          <p className="eyebrow about-page-eyebrow">Terms of Sale</p>
          <h1>How submitted wholesale orders are reviewed and processed</h1>
          <p className="legal-copy">Effective date: April 14, 2026.</p>
          <p className="legal-copy">
            These terms describe how order submissions, approvals, pricing adjustments, freight,
            tax, and cancellations are handled through the storefront.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Order Submission</h2>
          <p className="legal-copy">
            Orders submitted through the storefront are requests for review. A submitted order is
            not final until reviewed by a sales rep and moved forward through the approval
            workflow.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Review and Approval</h2>
          <ul className="info-page-list">
            <li>Quantities may be adjusted during review.</li>
            <li>Pricing, discount, freight, or tax may be updated before approval.</li>
            <li>Unavailable items may be removed from the final approved order.</li>
            <li>Approved orders remain visible in customer order history for review.</li>
          </ul>
        </section>

        <section className="info-page-section-plain">
          <h2>Pricing and Charges</h2>
          <p className="legal-copy">
            Visible wholesale pricing is limited to approved users. Final approved order totals may
            include reviewed line pricing, discounts, freight, tax, and other order-level charges
            shown in the approved order summary.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Payment and Fulfillment</h2>
          <p className="legal-copy">
            Payment timing, fulfillment progress, and shipping updates follow the internal sales
            workflow for the approved order. Payment is not treated as complete merely because an
            order was submitted.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Cancellations</h2>
          <p className="legal-copy">
            Customers may cancel submitted orders before approval. After approval, cancellation may
            require a request and internal review. Cancellation availability can depend on the
            current order stage and any linked internal sales order processing.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Shipping, Claims, and Support</h2>
          <p className="legal-copy">
            If you need help with an approved order, shipping issue, or order-level change, contact
            <strong> operation@crossingcards.com</strong> and include your business name plus order
            reference.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
