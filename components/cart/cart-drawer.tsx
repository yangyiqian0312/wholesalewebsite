"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
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

export function CartDrawer() {
  const {
    items,
    itemCount,
    isDrawerOpen,
    updateItemQuantity,
    removeItem,
    closeDrawer,
  } = useCart();
  const label = itemCount === 1 ? "1 item" : `${itemCount} items`;
  const subtotal = useMemo(
    () => items.reduce((total, item) => total + parsePrice(item.wholesale) * item.quantity, 0),
    [items],
  );

  useEffect(() => {
    if (!isDrawerOpen) {
      document.body.style.overflow = "";
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDrawer();
      }
    }

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [closeDrawer, isDrawerOpen]);

  if (!isDrawerOpen) {
    return null;
  }

  return (
    <div
      className="cart-drawer-overlay"
      onClick={closeDrawer}
      role="presentation"
    >
      <aside
        aria-label="Shopping cart"
        className="cart-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="cart-drawer-header">
          <div>
            <h2>Cart</h2>
            <p>{label} ready for review</p>
          </div>
          <button
            aria-label="Close cart"
            className="cart-drawer-close"
            onClick={closeDrawer}
            type="button"
          >
            Close
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-drawer-empty">
            <div className="cart-drawer-empty-copy">
              <strong>Your cart is empty</strong>
              <p>Add a few products to start building your order.</p>
            </div>
            <Link className="primary-button cart-drawer-empty-link" href="/catalog" onClick={closeDrawer}>
              Explore Catalog
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-drawer-items">
              {items.map((item) => (
                <article className="cart-drawer-item" key={item.code}>
                  <div className="cart-drawer-item-name-block">
                    <strong className="cart-drawer-item-name">{item.name}</strong>
                    <span className="cart-drawer-item-meta">SKU: {item.sku}</span>
                  </div>

                  <div className="cart-drawer-item-controls">
                    <label className="cart-drawer-item-qty">
                      <span>Qty</span>
                      <input
                        min="1"
                        onChange={(event) => updateItemQuantity(item.code, Number(event.target.value) || 1)}
                        type="number"
                        value={item.quantity}
                      />
                    </label>

                    <div className="cart-drawer-item-price-block">
                      <span>Total</span>
                      <strong className="cart-drawer-item-total">
                        {formatCurrency(parsePrice(item.wholesale) * item.quantity)}
                      </strong>
                    </div>

                    <button
                      aria-label={`Remove ${item.name}`}
                      className="cart-drawer-item-remove"
                      onClick={() => removeItem(item.code)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="cart-drawer-footer">
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <div className="cart-drawer-footer-actions">
                <Link className="secondary-button cart-summary-link" href="/catalog" onClick={closeDrawer}>
                  Continue Shopping
                </Link>
                <Link className="primary-button cart-summary-link" href="/cart" onClick={closeDrawer}>
                  Go to Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

