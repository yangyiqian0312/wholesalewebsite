import Link from "next/link";
import { PageBreadcrumbs } from "../../components/shared/page-breadcrumbs";
import { SiteFooter } from "../../components/shared/site-footer";
import { SiteHeader } from "../../components/shared/site-header";

export default function AboutUsPage() {
  return (
    <div className="page-shell">
      <SiteHeader activePath="/catalog" />

      <main className="page-layout info-page-text">
        <PageBreadcrumbs items={[{ href: "/", label: "Home" }, { label: "About Us" }]} />

        <section className="info-page-section-plain">
          <p className="eyebrow about-page-eyebrow">About Us</p>
          <h1>Wholesale tools built for trading card retailers</h1>
          <p className="legal-copy">
            Crossing Wholesale is designed for approved retail partners who need a clear way to
            discover products, review wholesale pricing, submit orders, and stay aligned with their
            sales rep. We keep the storefront simple so buyers can move from application to order
            review without guesswork.
          </p>
        </section>

        <section className="info-page-section-plain">
          <h2>Who We Serve</h2>
          <p className="legal-copy">
            We work with approved retail buyers, resellers, and wholesale partners looking for a
            structured way to place orders and review availability with our team.
          </p>
          <ul className="info-page-list">
            <li>Retail stores building regular card inventory</li>
            <li>Online sellers applying for approved wholesale access</li>
            <li>Buyers who need sales rep review before payment</li>
          </ul>
        </section>

        <section className="info-page-section-plain">
          <h2>What This Storefront Does</h2>
          <p className="legal-copy">
            The storefront is not just a catalog. It is the working layer between your approved
            account and our internal order review process.
          </p>
          <ul className="info-page-list">
            <li>Browse products synced from our local catalog</li>
            <li>See wholesale pricing after login</li>
            <li>Submit orders for review before payment</li>
            <li>Track updates, approvals, shipping, and notes</li>
          </ul>
        </section>

        <section className="info-page-section-plain">
          <h2>How The Wholesale Process Works</h2>
          <ol className="info-page-numbered-list">
            <li>
              <strong>Apply for an account.</strong> New buyers submit a wholesale application with
              business details and reseller information for review.
            </li>
            <li>
              <strong>Log in to view pricing.</strong> Approved accounts can access pricing, browse
              the catalog, and add products to the cart.
            </li>
            <li>
              <strong>Submit orders for review.</strong> Submitted orders are reviewed by a sales
              rep, who can confirm quantities, pricing, freight, tax, and order notes before
              payment.
            </li>
            <li>
              <strong>Review approved orders.</strong> Customers can see the final approved order
              details, including updates made during review, before the order moves forward.
            </li>
          </ol>
        </section>

        <section className="info-page-section-plain">
          <h2>Need help before you apply?</h2>
          <p className="legal-copy">
            If you have questions about account approval, product access, or ordering workflow, our
            team can help point you in the right direction.
          </p>
          <p className="legal-copy info-page-inline-links">
            <Link href="/open-account">Open an Account</Link>
            <span>/</span>
            <Link href="/contact">Contact Us</Link>
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
