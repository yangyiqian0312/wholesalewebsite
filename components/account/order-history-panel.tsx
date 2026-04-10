"use client";

import { useState, useTransition } from "react";

export type AccountOrder = {
  id: string;
  status: "SUBMITTED" | "APPROVED" | "PAID" | "SHIPPED" | "CANCELLED";
  inflowOrderNumber: string | null;
  inflowSalesOrderId: string | null;
  subtotalAmount: string;
  totalAmount: string;
  salesRepNote: string | null;
  freightAmount: string;
  taxName: string | null;
  taxRate: string | null;
  taxAmount: string;
  submittedAt: string;
  customerCancelRequestedAt: string | null;
  customerCancelRequestedByEmail: string | null;
  cancelledAt: string | null;
  cancelledByEmail: string | null;
  adjustments: Array<{
    id: string;
    label: string;
    amount: string;
  }>;
  lines: Array<{
    id: string;
    submittedQuantity: number;
    quantity: number;
    productName: string | null;
    productCode: string | null;
    salesUomName: string | null;
    unitPrice: string;
    submittedOriginalUnitPrice: string | null;
    originalUnitPrice: string | null;
    submittedDiscountPercent: string | null;
    discountPercent: string | null;
    submittedLineTotal: string;
    lineTotal: string;
  }>;
};

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

function canRequestCancellation(order: AccountOrder) {
  return order.status === "APPROVED" || order.status === "PAID";
}

function canCancelDirectly(order: AccountOrder) {
  return order.status === "SUBMITTED";
}

function hasLineChanged(line: AccountOrder["lines"][number]) {
  return (
    line.quantity !== line.submittedQuantity ||
    (line.originalUnitPrice || "") !== (line.submittedOriginalUnitPrice || "") ||
    (line.discountPercent || "0") !== (line.submittedDiscountPercent || "0") ||
    line.lineTotal !== line.submittedLineTotal
  );
}

function shouldShowLineChange(order: AccountOrder, line: AccountOrder["lines"][number]) {
  if (order.status === "SUBMITTED") {
    return false;
  }

  return hasLineChanged(line);
}

function formatProfileDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getOrderStatusMeta(status: AccountOrder["status"]) {
  switch (status) {
    case "SUBMITTED":
      return { label: "Submitted", className: "status-warning-soft" };
    case "APPROVED":
      return { label: "Approved", className: "status-info" };
    case "PAID":
      return { label: "Paid", className: "status-success" };
    case "SHIPPED":
      return { label: "Shipped", className: "status-success" };
    default:
      return { label: "Cancelled", className: "status-danger" };
  }
}

export function OrderHistoryPanel({ orders }: { orders: AccountOrder[] }) {
  const [currentOrders, setCurrentOrders] = useState(orders);
  const [feedbackByOrderId, setFeedbackByOrderId] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function handleCancel(orderId: string) {
    startTransition(async () => {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "PATCH",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            action?: "cancelled" | "requested";
            order?: AccountOrder;
          }
        | null;

      if (!response.ok || !payload?.order) {
        setFeedbackByOrderId((current) => ({
          ...current,
          [orderId]: payload?.error ?? "We could not update this order right now.",
        }));
        return;
      }

      setCurrentOrders((current) =>
        current.map((order) => (order.id === orderId ? payload.order! : order)),
      );
      setFeedbackByOrderId((current) => ({
        ...current,
        [orderId]:
          payload.action === "cancelled"
            ? "Order cancelled."
            : "Cancellation request sent to your sales rep.",
      }));
    });
  }

  return (
    <section className="panel profile-panel">
      <div className="profile-toolbar">
        <div className="profile-header">
          <div>
            <p className="eyebrow">Account</p>
            <h1>Order History</h1>
            <p className="profile-copy">Review orders submitted from this wholesale account.</p>
          </div>
        </div>
      </div>

      <div className="profile-order-list">
        {currentOrders.length ? currentOrders.map((order) => {
          const statusMeta = getOrderStatusMeta(order.status);
          const feedbackMessage = feedbackByOrderId[order.id];
          const actionLabel = canCancelDirectly(order)
            ? "Cancel Order"
            : canRequestCancellation(order)
              ? "Request to Cancel"
              : null;

          return (
            <article className="profile-order-card" key={order.id}>
              <div className="profile-order-head">
                <div>
                  <div className="profile-order-title-row">
                    <strong>{order.inflowOrderNumber || order.inflowSalesOrderId || order.id}</strong>
                    <span className={`status-tag ${statusMeta.className}`}>{statusMeta.label}</span>
                  </div>
                  <span>{formatProfileDate(order.submittedAt)}</span>
                </div>
                <strong>{formatCurrency(order.totalAmount)}</strong>
              </div>

              <div className="profile-order-meta">
                <span>{order.lines.length} items</span>
              </div>

              {order.customerCancelRequestedAt ? (
                <div className="profile-order-note profile-order-cancel-note">
                  <span>Cancellation Requested</span>
                  <p>Your request has been sent to your sales rep and is waiting for review.</p>
                </div>
              ) : null}

              <div className="table-scroll profile-order-table-scroll">
                <table className="catalog-table profile-order-table">
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
                    {order.lines.map((line) => {
                      const showLineChange = shouldShowLineChange(order, line);

                      return (
                      <tr
                        className={line.quantity === 0 && showLineChange ? "profile-order-line-removed" : showLineChange ? "profile-order-line-changed" : undefined}
                        key={line.id}
                      >
                        <td>
                          <strong>{line.productName || line.productCode || "Product"}</strong>
                          <span>{line.productCode || "Submitted item"}</span>
                          {line.quantity === 0 && showLineChange ? (
                            <span className="profile-order-line-change-note">Removed by sales rep: out of stock</span>
                          ) : showLineChange ? (
                            <span className="profile-order-line-change-note">Updated by sales rep</span>
                          ) : null}
                        </td>
                        <td>
                          {showLineChange ? (
                            <div className="profile-order-value-diff">
                              <span className="profile-order-value-previous">
                                {formatQuantity(line.submittedQuantity, line.salesUomName)}
                              </span>
                              <strong>{formatQuantity(line.quantity, line.salesUomName)}</strong>
                            </div>
                          ) : (
                            formatQuantity(line.quantity, line.salesUomName)
                          )}
                        </td>
                        <td>
                          {showLineChange ? (
                            <div className="profile-order-value-diff">
                              <span className="profile-order-value-previous">
                                {formatCurrency(line.submittedOriginalUnitPrice || line.originalUnitPrice || line.unitPrice)}
                              </span>
                              <strong>{formatCurrency(line.originalUnitPrice || line.unitPrice)}</strong>
                            </div>
                          ) : (
                            formatCurrency(line.originalUnitPrice || line.unitPrice)
                          )}
                        </td>
                        <td>
                          {showLineChange ? (
                            <div className="profile-order-value-diff">
                              <span className="profile-order-value-previous">
                                {formatDiscount(line.submittedDiscountPercent)}
                              </span>
                              <strong>{formatDiscount(line.discountPercent)}</strong>
                            </div>
                          ) : (
                            formatDiscount(line.discountPercent)
                          )}
                        </td>
                        <td>
                          {showLineChange ? (
                            <div className="profile-order-value-diff">
                              <span className="profile-order-value-previous">
                                {formatCurrency(line.submittedLineTotal)}
                              </span>
                              <strong>{formatCurrency(line.lineTotal)}</strong>
                            </div>
                          ) : (
                            formatCurrency(line.lineTotal)
                          )}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {actionLabel ? (
                <div className="profile-order-actions">
                  <button
                    className={`text-button ${canCancelDirectly(order) ? "text-button-danger" : ""}`}
                    disabled={isPending || Boolean(order.customerCancelRequestedAt)}
                    onClick={() => handleCancel(order.id)}
                    type="button"
                  >
                    {order.customerCancelRequestedAt ? "Cancellation Requested" : actionLabel}
                  </button>
                  {feedbackMessage ? <span className="profile-order-action-feedback">{feedbackMessage}</span> : null}
                </div>
              ) : feedbackMessage ? (
                <div className="profile-order-actions">
                  <span className="profile-order-action-feedback">{feedbackMessage}</span>
                </div>
              ) : null}

              <div className="profile-order-summary">
                <div className="profile-order-summary-row">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(order.subtotalAmount)}</strong>
                </div>
                {Number(order.freightAmount) > 0 ? (
                  <div className="profile-order-summary-row">
                    <span>Freight</span>
                    <strong>{formatCurrency(order.freightAmount)}</strong>
                  </div>
                ) : null}
                {Number(order.taxAmount) > 0 ? (
                  <div className="profile-order-summary-row">
                    <span>{order.taxName ? `${order.taxName} ${Number(order.taxRate || "0").toFixed(2)}%` : "Tax"}</span>
                    <strong>{formatCurrency(order.taxAmount)}</strong>
                  </div>
                ) : null}
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

              {order.salesRepNote ? (
                <div className="profile-order-note">
                  <span>Sales Rep Notes</span>
                  <p>{order.salesRepNote}</p>
                </div>
              ) : null}
            </article>
          );
        }) : (
          <div className="profile-document-empty">You have not submitted any orders yet.</div>
        )}
      </div>
    </section>
  );
}
