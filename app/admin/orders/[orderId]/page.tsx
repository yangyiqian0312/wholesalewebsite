import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchAdminApplicationById, fetchAdminOrderById, formatAdminDate } from "../../_lib/admin-data";
import { requireAdminPortalUser } from "../../../../utils/admin-auth";

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="admin-application-block">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const user = await requireAdminPortalUser();
  const { orderId } = await params;
  const order = await fetchAdminOrderById(orderId);

  if (!order) {
    notFound();
  }

  const application = await fetchAdminApplicationById(order.applicationId);

  if (!application) {
    notFound();
  }

  if (
    user.role === "sales_rep" &&
    application.assignedSalesRepEmail?.trim().toLowerCase() !== user.email?.trim().toLowerCase()
  ) {
    notFound();
  }

  return (
    <div className="admin-layout">
      <section className="admin-hero panel">
        <div>
          <p className="admin-hero-kicker">Order Detail</p>
          <h1>{order.inflowOrderNumber || order.inflowSalesOrderId || order.id}</h1>
          <p className="admin-hero-copy">
            {order.customerName} | {order.customerEmail} | {order.businessName}
          </p>
        </div>
        <div>
          <Link className="text-button" href="/admin/orders">
            Back to order list
          </Link>
        </div>
      </section>

      <section className="admin-summary-grid">
        <article className="panel admin-summary-card">
          <span>Status</span>
          <strong>Submitted</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Submitted</span>
          <strong>{formatAdminDate(order.submittedAt)}</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Subtotal</span>
          <strong>${Number(order.subtotalAmount).toFixed(2)}</strong>
        </article>
      </section>

      <section className="panel admin-application-card">
        <div className="table-panel-header">
          <div>
            <h2>Order Information</h2>
            <p className="panel-subtitle">Customer and upstream order identifiers stored at submission time</p>
          </div>
        </div>

        <div className="admin-application-grid">
          <Link className="admin-application-block admin-application-block-wide admin-customer-link" href={`/admin/users/${order.applicationId}`}>
            <span>Customer</span>
            <strong>{order.customerName}</strong>
            <small>{order.customerEmail} | {order.businessName}</small>
          </Link>
          <DetailBlock label="Inflow Order Number" value={order.inflowOrderNumber || "Not returned"} />
          <DetailBlock label="Inflow Sales Order ID" value={order.inflowSalesOrderId || "Not returned"} />
          <DetailBlock label="Application ID" value={order.applicationId} />
        </div>
      </section>

      <section className="panel admin-application-card">
        <div className="table-panel-header">
          <div>
            <h2>Line Items</h2>
            <p className="panel-subtitle">Submitted product quantities and pricing snapshot</p>
          </div>
        </div>

        <div className="table-scroll">
          <table className="catalog-table admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Code</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.productName || line.productId}</td>
                  <td>{line.productCode || line.productId}</td>
                  <td>{line.quantity}</td>
                  <td>${Number(line.unitPrice).toFixed(2)}</td>
                  <td>${Number(line.lineTotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
