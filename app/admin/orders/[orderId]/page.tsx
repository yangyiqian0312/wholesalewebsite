import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchAdminApplicationById, fetchAdminOrderById, formatAdminDate } from "../../_lib/admin-data";
import { approveOrderAction } from "../../_lib/order-actions";
import { OrderApprovalFields } from "../../../../components/admin/order-approval-fields";
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

function formatCurrency(value: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

function formatDiscount(value: string | null) {
  return value ? `${value}%` : "-";
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<{ status?: string; error?: string; message?: string }>;
}) {
  const user = await requireAdminPortalUser();
  const { orderId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
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

  const feedbackMessage =
    resolvedSearchParams.status === "approved"
      ? resolvedSearchParams.message
        ? `Order approved. ${resolvedSearchParams.message}`
        : "Order approved."
      : resolvedSearchParams.error === "approve-failed"
        ? resolvedSearchParams.message || "Order approval failed."
        : null;
  const isApproved = order.status === "APPROVED";

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
          <strong>{order.status}</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Submitted</span>
          <strong>{formatAdminDate(order.submittedAt)}</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Subtotal</span>
          <strong>{formatCurrency(order.subtotalAmount)}</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Total</span>
          <strong>{formatCurrency(order.totalAmount)}</strong>
        </article>
      </section>

      {feedbackMessage ? <p className="admin-inline-message">{feedbackMessage}</p> : null}

      <section className="panel admin-application-card">
        <div className="table-panel-header">
          <div>
            <h2>Order Information</h2>
            <p className="panel-subtitle">Customer and order review details stored for this wholesale order</p>
          </div>
        </div>

        <div className="admin-application-grid">
          <Link className="admin-application-block admin-application-block-wide admin-customer-link" href={`/admin/users/${order.applicationId}`}>
            <span>Customer</span>
            <strong>{order.customerName}</strong>
            <small>{order.customerEmail} | {order.businessName}</small>
          </Link>
          <DetailBlock label="Approved By" value={order.approvedByEmail || "Not approved yet"} />
          <DetailBlock label="Approved At" value={order.approvedAt ? formatAdminDate(order.approvedAt) : "Not approved yet"} />
          <DetailBlock label="Inflow Order Number" value={order.inflowOrderNumber || "Not created yet"} />
          <DetailBlock label="Inflow Sales Order ID" value={order.inflowSalesOrderId || "Not created yet"} />
          <DetailBlock label="Application ID" value={order.applicationId} />
        </div>
      </section>

      <form action={approveOrderAction} className="panel admin-application-card">
        <input name="orderId" type="hidden" value={order.id} />
        <div className="table-panel-header">
          <div>
            <h2>Line Items</h2>
            <p className="panel-subtitle">Review submitted quantities, pricing, notes, and additional charges before approving this order</p>
          </div>
          {!isApproved ? (
            <button className="primary-button" type="submit">
              Approve Order
            </button>
          ) : null}
        </div>

        <div className="table-scroll">
          <table className="catalog-table admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    <input name="lineId" type="hidden" value={line.id} />
                    <strong>{line.productName || line.productId}</strong>
                    <span>{line.productCode || line.productId}</span>
                  </td>
                  <td>
                    <input
                      className="admin-order-line-input"
                      defaultValue={String(line.quantity)}
                      disabled={isApproved}
                      min={1}
                      name={`quantity:${line.id}`}
                      type="number"
                    />
                  </td>
                  <td>
                    <input
                      className="admin-order-line-input"
                      defaultValue={Number(line.unitPrice).toFixed(2)}
                      disabled={isApproved}
                      inputMode="decimal"
                      name={`unitPrice:${line.id}`}
                      type="text"
                    />
                  </td>
                  <td>{formatDiscount(line.discountPercent)}</td>
                  <td>{formatCurrency(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <OrderApprovalFields
          adjustments={order.adjustments.map((adjustment) => ({
            id: adjustment.id,
            label: adjustment.label,
            amount: Number(adjustment.amount).toFixed(2),
          }))}
          disabled={isApproved}
          salesRepNote={order.salesRepNote}
        />

        <div className="profile-order-summary admin-order-summary">
          <div className="profile-order-summary-row">
            <span>Subtotal</span>
            <strong>{formatCurrency(order.subtotalAmount)}</strong>
          </div>
          {order.adjustments.map((adjustment) => (
            <div className="profile-order-summary-row" key={adjustment.id}>
              <span>{adjustment.label}</span>
              <strong>{formatCurrency(adjustment.amount)}</strong>
            </div>
          ))}
          <div className="profile-order-summary-row profile-order-summary-total">
            <span>Total</span>
            <strong>{formatCurrency(order.totalAmount)}</strong>
          </div>
        </div>
      </form>
    </div>
  );
}
