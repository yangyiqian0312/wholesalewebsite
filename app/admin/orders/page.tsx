import Link from "next/link";
import { fetchAdminApplications, fetchAdminOrders, formatAdminDate } from "../_lib/admin-data";
import { requireAdminPortalUser } from "../../../utils/admin-auth";

export default async function AdminOrdersPage() {
  const user = await requireAdminPortalUser();
  const [orders, applications] = await Promise.all([
    fetchAdminOrders(),
    fetchAdminApplications(),
  ]);
  const visibleApplicationIds = new Set(
    applications
      .filter((application) =>
        user.role === "admin"
          ? true
          : application.assignedSalesRepEmail?.trim().toLowerCase() === user.email?.trim().toLowerCase(),
      )
      .map((application) => application.id),
  );
  const visibleOrders = orders.filter((order) => visibleApplicationIds.has(order.applicationId));
  const totalRevenue = visibleOrders
    .reduce((sum, order) => sum + Number(order.subtotalAmount), 0)
    .toFixed(2);

  return (
    <div className="admin-layout">
      <section className="admin-summary-grid">
        <article className="panel admin-summary-card">
          <span>Total Orders</span>
          <strong>{visibleOrders.length}</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Submitted Revenue</span>
          <strong>${totalRevenue}</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Latest Order</span>
          <strong>{visibleOrders[0] ? formatAdminDate(visibleOrders[0].submittedAt) : "None"}</strong>
        </article>
      </section>

      <section className="panel admin-table-panel">
        <div className="table-panel-header">
          <div>
            <h2>Order List</h2>
            <p className="panel-subtitle">Admin snapshot of orders submitted from the wholesale storefront</p>
          </div>
        </div>

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
                    {order.status}
                    {order.customerCancelRequestedAt ? (
                      <div className="value-sub">Customer requested cancellation</div>
                    ) : null}
                  </td>
                  <td>
                    <Link className="admin-table-link" href={`/admin/orders/${order.id}`}>
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
                    <div className="admin-table-empty">No submitted orders yet.</div>
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
