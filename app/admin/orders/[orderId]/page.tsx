import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchAdminApplicationById, fetchAdminOrderById, formatAdminDate, formatOrderStatusLabel } from "../../_lib/admin-data";
import { approveOrderAction, cancelOrderAction } from "../../_lib/order-actions";
import { OrderApprovalEditor } from "../../../../components/admin/order-approval-editor";
import { PageBreadcrumbs } from "../../../../components/shared/page-breadcrumbs";
import { requireAdminPortalUser } from "../../../../utils/admin-auth";

function formatCurrency(value: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

function getOrderStatusTone(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "admin-order-status-pending";
    case "APPROVED":
      return "admin-order-status-open";
    case "PAID":
      return "admin-order-status-paid";
    case "SHIPPED":
      return "admin-order-status-shipped";
    default:
      return "admin-order-status-cancelled";
  }
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
          <div className="admin-order-title-row">
            <h1>{order.inflowOrderNumber || order.inflowSalesOrderId || order.id}</h1>
            <span className={`status-tag admin-order-status-pill ${getOrderStatusTone(order.status)}`}>
              {formatOrderStatusLabel(order.status)}
            </span>
          </div>
          <p className="admin-hero-copy">
            Submitted {formatAdminDate(order.submittedAt)}
          </p>
        </div>
        <div>
          <Link aria-label="Back to order list" className="admin-order-back-button" href="/admin/orders">
            <span aria-hidden="true">←</span>
          </Link>
        </div>
      </section>

      {feedbackMessage ? <p className="admin-inline-message">{feedbackMessage}</p> : null}
      {order.customerCancelRequestedAt ? (
        <p className="admin-inline-message">
          Customer requested cancellation on {formatAdminDate(order.customerCancelRequestedAt)}
          {order.customerCancelRequestedByEmail ? ` by ${order.customerCancelRequestedByEmail}` : ""}.
        </p>
      ) : null}

      <section className="admin-order-layout">
        <div className="admin-order-main">
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
        </div>

        <aside className="admin-order-sidebar">
          <section className="panel admin-application-card admin-order-sidebar-card">
            <div className="admin-order-sidebar-head">
              <h2>Customer</h2>
            </div>
            <Link className="admin-order-customer-link" href={`/admin/users/${order.applicationId}`}>
              <strong>{order.customerName}</strong>
              <span>{order.customerEmail}</span>
              <span>{order.businessName}</span>
            </Link>
          </section>

          <section className="panel admin-application-card admin-order-sidebar-card">
            <div className="admin-order-sidebar-head">
              <h2>Order Info</h2>
            </div>
            <div className="admin-order-sidebar-list admin-order-sidebar-list-meta">
              <div className="admin-order-sidebar-row">
                <span>Approved by</span>
                <strong>{order.approvedByEmail || "Not approved yet"}</strong>
              </div>
              <div className="admin-order-sidebar-row">
                <span>Approved at</span>
                <strong>{order.approvedAt ? formatAdminDate(order.approvedAt) : "Not approved yet"}</strong>
              </div>
              <div className="admin-order-sidebar-row">
                <span>Inflow order number</span>
                <strong>{order.inflowOrderNumber || "Not created yet"}</strong>
              </div>
              <div className="admin-order-sidebar-row">
                <span>Inflow sales order ID</span>
                <strong>{order.inflowSalesOrderId || "Not created yet"}</strong>
              </div>
              <div className="admin-order-sidebar-row">
                <span>Cancelled</span>
                <strong>{order.cancelledAt ? formatAdminDate(order.cancelledAt) : "Active"}</strong>
              </div>
              <div className="admin-order-sidebar-row">
                <span>Application ID</span>
                <strong>{order.applicationId}</strong>
              </div>
            </div>

            {canCancelOrder ? (
              <form action={cancelOrderAction} className="admin-order-sidebar-action">
                <input name="orderId" type="hidden" value={order.id} />
                <button className="text-button text-button-danger" type="submit">
                  Cancel Order
                </button>
              </form>
            ) : null}
          </section>
        </aside>
      </section>
    </div>
  );
}
