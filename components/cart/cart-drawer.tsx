"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useCart } from "./cart-provider";
import { createClient } from "../../utils/supabase/client";

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
  const supabase = useMemo(() => createClient(), []);
  const {
    items,
    itemCount,
    isDrawerOpen,
    updateItemQuantity,
    removeItem,
    closeDrawer,
  } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const canSeePrice = Boolean(user);
  const label = itemCount === 1 ? "1 item" : `${itemCount} items`;
  const subtotal = useMemo(
    () => items.reduce((total, item) => total + parsePrice(item.wholesale) * item.quantity, 0),
    [items],
  );

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setUser(data.user ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

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
            ×
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
                        {canSeePrice
                          ? formatCurrency(parsePrice(item.wholesale) * item.quantity)
                          : "Hidden until login"}
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
                <strong>{canSeePrice ? formatCurrency(subtotal) : "Log in to see price"}</strong>
              </div>
              {!canSeePrice ? (
                <p className="cart-drawer-login-note">Log in to view pricing and continue to checkout.</p>
              ) : null}
              <div className="cart-drawer-footer-actions">
                <Link className="secondary-button cart-summary-link" href="/catalog" onClick={closeDrawer}>
                  Continue Shopping
                </Link>
                <Link className="primary-button cart-summary-link" href={canSeePrice ? "/cart" : "/login"} onClick={closeDrawer}>
                  {canSeePrice ? "Go to Checkout" : "Log In"}
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

