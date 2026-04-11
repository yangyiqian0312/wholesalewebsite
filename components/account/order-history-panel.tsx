"use client";

import { useRouter } from "next/navigation";
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
      return { label: "Open", className: "status-info" };
    case "PAID":
      return { label: "Paid", className: "status-success" };
    case "SHIPPED":
      return { label: "Shipped", className: "status-success" };
    default:
      return { label: "Cancelled", className: "status-danger" };
  }
}

export function OrderHistoryPanel({ orders }: { orders: AccountOrder[] }) {
  const router = useRouter();
  const [currentOrders, setCurrentOrders] = useState(orders);
  const [feedbackByOrderId, setFeedbackByOrderId] = useState<Record<string, string>>({});
  const [expandedByOrderId, setExpandedByOrderId] = useState<Record<string, boolean>>({});
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

      const updatedOrder = payload.order;

      setCurrentOrders((current) =>
        current.map((order) => {
          if (order.id !== orderId) {
            return order;
          }

          if (payload.action === "cancelled") {
            return {
              ...order,
              ...updatedOrder,
              status: "CANCELLED",
              customerCancelRequestedAt: null,
              customerCancelRequestedByEmail: null,
              cancelledAt: updatedOrder.cancelledAt ?? new Date().toISOString(),
            };
          }

          return {
            ...order,
            ...updatedOrder,
            customerCancelRequestedAt: updatedOrder.customerCancelRequestedAt ?? new Date().toISOString(),
          };
        }),
      );
      setFeedbackByOrderId((current) => ({
        ...current,
        [orderId]:
          payload.action === "cancelled"
            ? "Order cancelled."
            : "Cancellation request sent to your sales rep.",
      }));
      router.refresh();
    });
  }

  return (
    <section className="panel profile-panel">
      <div className="profile-toolbar">
        <div className="profile-header">
          <div>
            <p className="eyebrow">Account</p>
            <h1>Order History</h1>
          </div>
        </div>
      </div>

      <div className="profile-order-list">
        {currentOrders.length ? currentOrders.map((order) => {
          const statusMeta = getOrderStatusMeta(order.status);
          const feedbackMessage = feedbackByOrderId[order.id];
          const isExpanded = Boolean(expandedByOrderId[order.id]);
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
                  <div className="profile-order-meta">
                    <span>{formatProfileDate(order.submittedAt)}</span>
                    <span>{order.lines.length} items</span>
                  </div>
                </div>
                <div className="profile-order-head-side">
                  <strong>{formatCurrency(order.totalAmount)}</strong>
                  <div className="profile-order-head-controls">
                    {actionLabel ? (
                      <button
                        className={`profile-order-head-action ${canCancelDirectly(order) ? "profile-order-head-action-danger" : ""}`}
                        disabled={isPending || Boolean(order.customerCancelRequestedAt)}
                        onClick={() => handleCancel(order.id)}
                        type="button"
                      >
                        {order.customerCancelRequestedAt ? "Cancellation Requested" : actionLabel}
                      </button>
                    ) : null}
                    <button
                      aria-expanded={isExpanded}
                      className="profile-order-toggle"
                      onClick={() =>
                        setExpandedByOrderId((current) => ({
                          ...current,
                          [order.id]: !current[order.id],
                        }))
                      }
                      type="button"
                    >
                      <svg
                        aria-hidden="true"
                        className={isExpanded ? "profile-order-toggle-icon profile-order-toggle-icon-open" : "profile-order-toggle-icon"}
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M5.25 7.5 10 12.25 14.75 7.5"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && order.customerCancelRequestedAt ? (
                <div className="profile-order-note profile-order-cancel-note">
                  <span>Cancellation Requested</span>
                  <p>Your request has been sent to your sales rep and is waiting for review.</p>
                </div>
              ) : null}

              {isExpanded ? (
                <>
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
                            <td data-label="Product">
                              <strong>{line.productName || line.productCode || "Product"}</strong>
                              <span>{line.productCode || "Submitted item"}</span>
                              {line.quantity === 0 && showLineChange ? (
                                <span className="profile-order-line-change-note">Removed by sales rep: out of stock</span>
                              ) : showLineChange ? (
                                <span className="profile-order-line-change-note">Updated by sales rep</span>
                              ) : null}
                            </td>
                            <td data-label="Quantity">
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
                            <td data-label="Unit Price">
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
                            <td data-label="Discount">
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
                            <td data-label="Subtotal">
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

                  <div className="profile-order-mobile-list">
                    {order.lines.map((line) => {
                      const showLineChange = shouldShowLineChange(order, line);

                      return (
                        <article
                          className={line.quantity === 0 && showLineChange ? "profile-order-mobile-card profile-order-line-removed" : showLineChange ? "profile-order-mobile-card profile-order-line-changed" : "profile-order-mobile-card"}
                          key={`${line.id}-mobile`}
                        >
                          <div className="profile-order-mobile-product">
                            <strong>{line.productName || line.productCode || "Product"}</strong>
                            <span>{line.productCode || "Submitted item"}</span>
                            {line.quantity === 0 && showLineChange ? (
                              <span className="profile-order-line-change-note">Removed by sales rep: out of stock</span>
                            ) : showLineChange ? (
                              <span className="profile-order-line-change-note">Updated by sales rep</span>
                            ) : null}
                          </div>

                          <div className="profile-order-mobile-row">
                            <span>Quantity</span>
                            {showLineChange ? (
                              <div className="profile-order-value-diff">
                                <span className="profile-order-value-previous">
                                  {formatQuantity(line.submittedQuantity, line.salesUomName)}
                                </span>
                                <strong>{formatQuantity(line.quantity, line.salesUomName)}</strong>
                              </div>
                            ) : (
                              <strong>{formatQuantity(line.quantity, line.salesUomName)}</strong>
                            )}
                          </div>

                          <div className="profile-order-mobile-row">
                            <span>Unit Price</span>
                            {showLineChange ? (
                              <div className="profile-order-value-diff">
                                <span className="profile-order-value-previous">
                                  {formatCurrency(line.submittedOriginalUnitPrice || line.originalUnitPrice || line.unitPrice)}
                                </span>
                                <strong>{formatCurrency(line.originalUnitPrice || line.unitPrice)}</strong>
                              </div>
                            ) : (
                              <strong>{formatCurrency(line.originalUnitPrice || line.unitPrice)}</strong>
                            )}
                          </div>

                          <div className="profile-order-mobile-row">
                            <span>Discount</span>
                            {showLineChange ? (
                              <div className="profile-order-value-diff">
                                <span className="profile-order-value-previous">
                                  {formatDiscount(line.submittedDiscountPercent)}
                                </span>
                                <strong>{formatDiscount(line.discountPercent)}</strong>
                              </div>
                            ) : (
                              <strong>{formatDiscount(line.discountPercent)}</strong>
                            )}
                          </div>

                          <div className="profile-order-mobile-row profile-order-mobile-row-total">
                            <span>Subtotal</span>
                            {showLineChange ? (
                              <div className="profile-order-value-diff">
                                <span className="profile-order-value-previous">
                                  {formatCurrency(line.submittedLineTotal)}
                                </span>
                                <strong>{formatCurrency(line.lineTotal)}</strong>
                              </div>
                            ) : (
                              <strong>{formatCurrency(line.lineTotal)}</strong>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {isExpanded && feedbackMessage ? (
                <div className="profile-order-actions">
                  <span className="profile-order-action-feedback">{feedbackMessage}</span>
                </div>
              ) : null}

              {isExpanded ? (
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
              ) : null}

              {isExpanded && order.salesRepNote ? (
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
