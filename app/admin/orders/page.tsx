import Link from "next/link";
import { fetchAdminOrders, formatAdminDate } from "../_lib/admin-data";

export default async function AdminOrdersPage() {
  const orders = await fetchAdminOrders();
  const totalRevenue = orders
    .reduce((sum, order) => sum + Number(order.subtotalAmount), 0)
    .toFixed(2);

  return (
    <div className="admin-layout">
      <section className="admin-hero panel">
        <div>
          <p className="admin-hero-kicker">Orders</p>
          <h1>Submitted wholesale orders</h1>
          <p className="admin-hero-copy">
            Review every order submitted through the storefront, along with customer and line-item details.
          </p>
        </div>
      </section>

      <section className="admin-summary-grid">
        <article className="panel admin-summary-card">
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Submitted Revenue</span>
          <strong>${totalRevenue}</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Latest Order</span>
          <strong>{orders[0] ? formatAdminDate(orders[0].submittedAt) : "None"}</strong>
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
                <th>Customer</th>
                <th>Company</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link className="admin-table-link" href={`/admin/orders/${order.id}`}>
                      <div className="admin-table-main">
                        {order.inflowOrderNumber || order.inflowSalesOrderId || order.id}
                      </div>
                    </Link>
                    <div className="value-sub">{order.source}</div>
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
                  <td colSpan={6}>
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
