"use client";

export type AccountOrder = {
  id: string;
  status: "SUBMITTED" | "APPROVED" | "PAID" | "CANCELLED";
  inflowOrderNumber: string | null;
  inflowSalesOrderId: string | null;
  subtotalAmount: string;
  totalAmount: string;
  salesRepNote: string | null;
  submittedAt: string;
  adjustments: Array<{
    id: string;
    label: string;
    amount: string;
  }>;
  lines: Array<{
    id: string;
    quantity: number;
    productName: string | null;
    productCode: string | null;
    unitPrice: string;
    discountPercent: string | null;
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
  return value ? `${value}%` : "-";
}

function formatProfileDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function OrderHistoryPanel({ orders }: { orders: AccountOrder[] }) {
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
        {orders.length ? orders.map((order) => (
          <article className="profile-order-card" key={order.id}>
            <div className="profile-order-head">
              <div>
                <strong>{order.inflowOrderNumber || order.inflowSalesOrderId || order.id}</strong>
                <span>{formatProfileDate(order.submittedAt)}</span>
              </div>
              <strong>{formatCurrency(order.totalAmount)}</strong>
            </div>
            <div className="profile-order-meta">
              <span>Status: {order.status}</span>
              <span>{order.lines.length} items</span>
            </div>
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
                  {order.lines.map((line) => (
                    <tr key={line.id}>
                      <td>
                        <strong>{line.productName || line.productCode || "Product"}</strong>
                        <span>{line.productCode || "Submitted item"}</span>
                      </td>
                      <td>{line.quantity}</td>
                      <td>{formatCurrency(line.unitPrice)}</td>
                      <td>{formatDiscount(line.discountPercent)}</td>
                      <td>{formatCurrency(line.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="profile-order-summary">
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

            {order.salesRepNote ? (
              <div className="profile-order-note">
                <span>Sales Rep Notes</span>
                <p>{order.salesRepNote}</p>
              </div>
            ) : null}
          </article>
        )) : (
          <div className="profile-document-empty">You have not submitted any orders yet.</div>
        )}
      </div>
    </section>
  );
}
