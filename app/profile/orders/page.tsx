import { redirect } from "next/navigation";
import { OrderHistoryPanel, type AccountOrder } from "../../../components/account/order-history-panel";
import { SiteHeader } from "../../../components/shared/site-header";
import { createClient } from "../../../utils/supabase/server";
import { getAdminApiToken, getBackendBaseUrl } from "../../../utils/backend-api";

async function fetchOrders(email: string): Promise<AccountOrder[]> {
  const response = await fetch(
    `${getBackendBaseUrl()}/api/admin/orders?email=${encodeURIComponent(email)}`,
    {
      headers: {
        "x-admin-token": getAdminApiToken(),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to load order history: ${response.status}`);
  }

  return (await response.json()) as AccountOrder[];
}

export default async function ProfileOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const orders = await fetchOrders(user.email);

  return (
    <div className="page-shell">
      <SiteHeader activePath="/catalog" />

      <main className="page-layout">
        <div className="breadcrumbs">Home / Order History</div>
        <OrderHistoryPanel orders={orders} />
      </main>
    </div>
  );
}
