import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchAdminApplicationById, fetchAdminOrderById, formatAdminDate, formatOrderStatusLabel } from "../../_lib/admin-data";
import { approveOrderAction, cancelOrderAction } from "../../_lib/order-actions";
import { OrderApprovalEditor } from "../../../../components/admin/order-approval-editor";
import { PageBreadcrumbs } from "../../../../components/shared/page-breadcrumbs";
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
  return value && Number(value) > 0 ? `${Number(value).toFixed(2)}%` : "-";
}

function formatQuantity(quantity: number, uomName: string | null) {
  return `${quantity} ${uomName || "ea."}`;
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
      : resolvedSearchParams.status === "cancelled"
        ? "Order cancelled."
      : resolvedSearchParams.error === "approve-failed"
        ? resolvedSearchParams.message || "Order approval failed."
        : resolvedSearchParams.error === "cancel-failed"
          ? resolvedSearchParams.message || "Order cancellation failed."
        : null;
  const isApproved = order.status !== "SUBMITTED";
  const isCancelled = order.status === "CANCELLED";
  const canCancelOrder = !isCancelled && (order.status === "SUBMITTED" || order.status === "APPROVED" || order.status === "PAID");

  return (
    <div className="admin-layout">
      <PageBreadcrumbs
        items={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/orders", label: "Orders" },
          { label: order.inflowOrderNumber || order.inflowSalesOrderId || order.id },
        ]}
      />
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
          <strong>{formatOrderStatusLabel(order.status)}</strong>
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
          <span>Freight</span>
          <strong>{formatCurrency(order.freightAmount)}</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Total</span>
          <strong>{formatCurrency(order.totalAmount)}</strong>
        </article>
      </section>

      {feedbackMessage ? <p className="admin-inline-message">{feedbackMessage}</p> : null}
      {order.customerCancelRequestedAt ? (
        <p className="admin-inline-message">
          Customer requested cancellation on {formatAdminDate(order.customerCancelRequestedAt)}
          {order.customerCancelRequestedByEmail ? ` by ${order.customerCancelRequestedByEmail}` : ""}.
        </p>
      ) : null}

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
          <DetailBlock label="Cancelled At" value={order.cancelledAt ? formatAdminDate(order.cancelledAt) : "Active"} />
          <DetailBlock label="Cancelled By" value={order.cancelledByEmail || "Not cancelled"} />
          <DetailBlock label="Application ID" value={order.applicationId} />
        </div>
      </section>

      {canCancelOrder ? (
        <form action={cancelOrderAction} className="panel admin-application-card">
          <input name="orderId" type="hidden" value={order.id} />
          <div className="table-panel-header">
            <div>
              <h2>Cancellation</h2>
              <p className="panel-subtitle">
                {order.customerCancelRequestedAt
                  ? "Customer requested cancellation. Sales can confirm the cancellation here."
                  : "Cancel this order from the admin portal and sync the cancellation to Inflow when a sales order exists."}
              </p>
            </div>
            <button className="text-button text-button-danger" type="submit">
              Cancel Order
            </button>
          </div>
        </form>
      ) : null}

      <OrderApprovalEditor
        action={approveOrderAction}
        disabled={isApproved || isCancelled}
        freightAmount={order.freightAmount}
        initialAdjustments={order.adjustments.map((adjustment) => ({
          id: adjustment.id,
          label: adjustment.label,
          amount: Number(adjustment.amount).toFixed(2),
        }))}
        initialLines={order.lines}
        initialSubtotal={order.subtotalAmount}
        initialTaxName={order.taxName}
        initialTaxRate={order.taxRate}
        initialTotal={order.totalAmount}
        orderId={order.id}
        salesRepNote={order.salesRepNote}
        taxAmount={order.taxAmount}
      />
    </div>
  );
}
