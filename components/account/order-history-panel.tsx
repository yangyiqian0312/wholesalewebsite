"use client";

export type AccountOrder = {
  id: string;
  inflowOrderNumber: string | null;
  inflowSalesOrderId: string | null;
  subtotalAmount: string;
  submittedAt: string;
  lines: Array<{
    id: string;
    quantity: number;
    productName: string | null;
    productCode: string | null;
    lineTotal: string;
  }>;
};

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
              <strong>${Number(order.subtotalAmount).toFixed(2)}</strong>
            </div>
            <div className="profile-order-meta">
              <span>{order.lines.length} items</span>
            </div>
            <div className="profile-order-lines">
              {order.lines.map((line) => (
                <div className="profile-order-line" key={line.id}>
                  <div>
                    <strong>{line.productName || line.productCode || "Product"}</strong>
                    <span>{line.productCode || "Submitted item"}</span>
                  </div>
                  <span>{line.quantity} pcs | ${Number(line.lineTotal).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </article>
        )) : (
          <div className="profile-document-empty">You have not submitted any orders yet.</div>
        )}
      </div>
    </section>
  );
}
