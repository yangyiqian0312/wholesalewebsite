import { CartPageClient } from "../../components/cart/cart-page-client";
import { SiteHeader } from "../../components/shared/site-header";

export default function CartPage() {
  return (
    <div className="page-shell">
      <SiteHeader activePath="/catalog" />

      <main className="page-layout">
        <div className="breadcrumbs">Home / Cart</div>
        <CartPageClient />
      </main>
    </div>
  );
}
