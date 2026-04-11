import Link from "next/link";
import { fetchAdminApplications, fetchAdminOrders, formatAdminDate, formatOrderStatusLabel } from "../_lib/admin-data";
import { requireAdminPortalUser } from "../../../utils/admin-auth";

const orderStatusOptions = ["SUBMITTED", "APPROVED", "PAID", "SHIPPED", "CANCELLED"] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAdminPortalUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const customerParam = Array.isArray(resolvedSearchParams.customer)
    ? resolvedSearchParams.customer[0]
    : resolvedSearchParams.customer;
  const statusParam = Array.isArray(resolvedSearchParams.status)
    ? resolvedSearchParams.status[0]
    : resolvedSearchParams.status;
  const [orders, applications] = await Promise.all([
    fetchAdminOrders(),
    fetchAdminApplications(),
  ]);
  const customerFilter = customerParam?.trim().toLowerCase() ?? "";
  const statusFilter = orderStatusOptions.includes(statusParam as (typeof orderStatusOptions)[number])
    ? statusParam
    : "";
  const visibleApplicationIds = new Set(
    applications
      .filter((application) =>
        user.role === "admin"
          ? true
          : application.assignedSalesRepEmail?.trim().toLowerCase() === user.email?.trim().toLowerCase(),
      )
      .map((application) => application.id),
  );
  const visibleOrders = orders
    .filter((order) => visibleApplicationIds.has(order.applicationId))
    .filter((order) => {
      if (statusFilter && order.status !== statusFilter) {
        return false;
      }

      if (!customerFilter) {
        return true;
      }

      const haystack = [
        order.customerName,
        order.customerEmail,
        order.businessName,
        order.inflowOrderNumber,
        order.inflowSalesOrderId,
        order.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(customerFilter);
    });

  return (
    <div className="admin-layout">
      <section className="panel admin-table-panel">
        <div className="table-panel-header">
          <div>
            <h2>Order List</h2>
          </div>
        </div>

        <section className="admin-listings-search-shell admin-orders-filter-shell">
          <form action="/admin/orders" className="admin-listings-search admin-orders-filter-bar" method="get">
            <label className="admin-listings-search-field">
              <input
                defaultValue={customerParam ?? ""}
                name="customer"
                placeholder="Filter by customer, email, company, or order #"
                type="search"
              />
            </label>
            <label className="admin-orders-filter-select">
              <select defaultValue={statusFilter} name="status">
                <option value="">All statuses</option>
                {orderStatusOptions.map((status) => (
                <option key={status} value={status}>
                    {formatOrderStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <button className="admin-listings-search-button admin-orders-filter-button" type="submit">
              Filter
            </button>
            {(customerParam?.trim() || statusFilter) ? (
              <Link className="text-button admin-orders-filter-clear" href="/admin/orders">
                Clear
              </Link>
            ) : null}
          </form>
        </section>

        <div className="table-scroll">
          <table className="catalog-table admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Company</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.length ? visibleOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link className="admin-table-link" href={`/admin/orders/${order.id}`}>
                      <div className="admin-table-main">{order.inflowOrderNumber || order.inflowSalesOrderId || order.id}</div>
                    </Link>
                    <div className="value-sub">{order.source}</div>
                  </td>
                  <td>
                    {formatOrderStatusLabel(order.status)}
                    {order.customerCancelRequestedAt ? (
                      <div className="value-sub">Customer requested cancellation</div>
                    ) : null}
                  </td>
                  <td>
                    <Link className="admin-table-link" href={`/admin/users/${order.applicationId}`}>
                      {order.customerName}
                    </Link>
                    <div className="value-sub">{order.customerEmail}</div>
                  </td>
                  <td>{order.businessName}</td>
                  <td>{order.lines.length}</td>
                  <td>${Number(order.subtotalAmount).toFixed(2)}</td>
                  <td>{formatAdminDate(order.submittedAt)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-table-empty">
                      {customerFilter || statusFilter ? "No orders match the current filters." : "No submitted orders yet."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
