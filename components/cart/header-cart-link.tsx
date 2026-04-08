"use client";

import { useCart } from "./cart-provider";

function CartIcon() {
  return (
    <svg aria-hidden="true" className="header-icon-svg" viewBox="0 0 24 24">
      <path
        d="M8.25 18.5a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Zm8 0a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM4 4.25h1.64c.36 0 .67.26.73.62l.31 1.88h11.67c.48 0 .83.46.7.92l-1.42 4.94a2.25 2.25 0 0 1-2.16 1.63H9.14a2.25 2.25 0 0 1-2.19-1.75L5.43 5.75H4a.75.75 0 0 1 0-1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function HeaderCartLink() {
  const { itemCount, isDrawerOpen, openDrawer } = useCart();
  const label = itemCount === 1 ? "1 item" : `${itemCount} items`;

  return (
    <button
      aria-expanded={isDrawerOpen}
      aria-haspopup="dialog"
      aria-label="Cart"
      className="header-action header-action-button header-action-cart"
      onClick={openDrawer}
      type="button"
    >
      <span className="header-action-icon">
        <CartIcon />
      </span>
      <span className="header-action-copy">
        <strong>Cart</strong>
        <small>{label}</small>
      </span>
      <span className="header-action-badge">{itemCount}</span>
    </button>
  );
}
