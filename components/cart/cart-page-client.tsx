"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./cart-provider";

function parsePrice(value: string) {
  const normalized = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isNaN(normalized) ? 0 : normalized;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function CartPageClient() {
  const { items, updateItemQuantity, removeItem, clearCart, itemCount } = useCart();
  const subtotal = items.reduce((total, item) => total + parsePrice(item.wholesale) * item.quantity, 0);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  if (items.length === 0) {
    return (
      <section className="panel cart-page-empty">
        <h1>Your cart is empty</h1>
        <p>Browse the catalog and add products to build your order.</p>
        <Link className="primary-button cart-page-empty-link" href="/catalog">
          Continue Shopping
        </Link>
      </section>
    );
  }

  async function handleSubmitOrder() {
    setIsSubmittingOrder(true);
    setSubmitMessage("");

    try {
      const response = await fetch("/api/orders/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.code,
            productName: item.name,
            productCode: item.sku || item.code,
            quantity: item.quantity,
            originalUnitPrice: item.originalPrice,
            salesUomName: item.salesUomName,
            salesUomQuantity: item.salesUomQuantity,
            salesUomStandardQuantity: item.salesUomStandardQuantity,
            standardUomName: item.standardUomName,
            unitPrice: item.wholesale,
          })),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            localOrderId?: string | null;
            status?: string | null;
          }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to submit order");
      }

      clearCart();
      setSubmitMessage(
        payload?.status === "SUBMITTED"
          ? "Order submitted for review. Your sales rep will confirm pricing and quantities before payment."
          : "Order submitted for review.",
      );
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : "Failed to submit order");
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  return (
    <section className="cart-page-layout">
      <section className="panel cart-page-list">
        <div className="panel-header">
          <div>
            <h1>Cart</h1>
            <p className="panel-subtitle">{itemCount} total units ready for review</p>
          </div>
          <button className="text-button cart-clear-button" onClick={clearCart} type="button">
            Clear Cart
          </button>
        </div>

        <div className="cart-line-items">
          {items.map((item) => {
            const unitPrice = parsePrice(item.wholesale);
            const lineTotal = unitPrice * item.quantity;

            return (
            <article className="cart-line-item" key={item.code}>
              {item.productPath ? (
                <Link className="cart-line-media" href={item.productPath}>
                  {item.imageUrl ? (
                    <img alt={item.name} className="cart-line-image" src={item.imageUrl} />
                  ) : (
                    <div className="cart-line-fallback">{item.imageLabel}</div>
                  )}
                </Link>
              ) : (
                <div className="cart-line-media">
                  {item.imageUrl ? (
                    <img alt={item.name} className="cart-line-image" src={item.imageUrl} />
                  ) : (
                    <div className="cart-line-fallback">{item.imageLabel}</div>
                  )}
                </div>
              )}

              <div className="cart-line-copy">
                <div className="cart-line-head">
                  <div className="cart-line-details">
                    <h2>{item.name}</h2>
                    <p>SKU: {item.sku}</p>
                    <p>UPC: {item.upc}</p>
                  </div>
                </div>

                <div className="cart-line-price-summary">
                  <div className="cart-line-price-block">
                    <span className="cart-line-price-label">Unit Price</span>
                    <strong className="cart-line-price">{formatCurrency(unitPrice)}</strong>
                  </div>
                  <div className="cart-line-price-block cart-line-total-block">
                    <span className="cart-line-price-label">Total</span>
                    <strong className="cart-line-price">{formatCurrency(lineTotal)}</strong>
                  </div>
                </div>

                <div className="cart-line-actions">
                  <label className="cart-line-qty">
                    <span>Quantity</span>
                    <div className="cart-line-stepper">
                      <button
                        aria-label={`Decrease quantity for ${item.name}`}
                        className="cart-line-stepper-button"
                        onClick={() => updateItemQuantity(item.code, Math.max(1, item.quantity - 1))}
                        type="button"
                      >
                        -
                      </button>
                      <span className="cart-line-stepper-value">{item.quantity}</span>
                      <button
                        aria-label={`Increase quantity for ${item.name}`}
                        className="cart-line-stepper-button"
                        onClick={() => updateItemQuantity(item.code, item.quantity + 1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </label>

                  <button
                    className="text-button cart-remove-button"
                    onClick={() => removeItem(item.code)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      </section>

      <aside className="panel cart-summary">
        <h2>Order Summary</h2>
        <div className="cart-summary-row">
          <span>Items</span>
          <strong>{itemCount}</strong>
        </div>
        <div className="cart-summary-row">
          <span>Subtotal</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>
        {submitMessage ? <p className="cart-summary-note">{submitMessage}</p> : null}
        <p className="cart-summary-note">
          Submitted orders are reviewed by your sales rep before they are approved for payment.
        </p>
        <button className="primary-button cart-summary-link" disabled={isSubmittingOrder} onClick={handleSubmitOrder} type="button">
          {isSubmittingOrder ? "Submitting..." : "Submit Order"}
        </button>
        <Link className="primary-button cart-summary-link" href="/catalog">
          Add More Products
        </Link>
      </aside>
    </section>
  );
}
