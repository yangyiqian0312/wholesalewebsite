import { CartPageClient } from "../../components/cart/cart-page-client";
import { PageBreadcrumbs } from "../../components/shared/page-breadcrumbs";
import { SiteFooter } from "../../components/shared/site-footer";
import { SiteHeader } from "../../components/shared/site-header";
import { createClient } from "../../utils/supabase/server";

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="page-shell">
      <SiteHeader activePath="/catalog" />

      <main className="page-layout">
        <PageBreadcrumbs items={[{ href: "/", label: "Home" }, { label: "Cart" }]} />
        <CartPageClient canSeePrice={Boolean(user)} />
      </main>

      <SiteFooter />
    </div>
  );
}
