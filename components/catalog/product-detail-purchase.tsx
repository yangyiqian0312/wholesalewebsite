"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "../cart/cart-provider";
import type { CartProductInput } from "../cart/cart-types";

type ProductDetailPurchaseProps = {
  product: CartProductInput;
  defaultQuantity?: string;
};

function parseInputQuantity(value: string) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue) || numericValue <= 0) {
    return 1;
  }

  return Math.floor(numericValue);
}

export function ProductDetailPurchase({
  product,
  defaultQuantity = "1",
}: ProductDetailPurchaseProps) {
  const { addItem, getItemQuantity, openDrawer } = useCart();
  const [quantity, setQuantity] = useState(defaultQuantity || "1");
  const [feedback, setFeedback] = useState("");
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const cartQuantity = getItemQuantity(product.code);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => setFeedback(""), 1800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    const anchor = anchorRef.current;

    if (!anchor) {
      return;
    }

    const updateFloatingBarVisibility = () => {
      const rect = anchor.getBoundingClientRect();
      setShowFloatingBar(rect.bottom < 24);
    };

    updateFloatingBarVisibility();
    window.addEventListener("scroll", updateFloatingBarVisibility, { passive: true });
    window.addEventListener("resize", updateFloatingBarVisibility);

    return () => {
      window.removeEventListener("scroll", updateFloatingBarVisibility);
      window.removeEventListener("resize", updateFloatingBarVisibility);
    };
  }, []);

  function handleAddToCart() {
    const normalizedQuantity = parseInputQuantity(quantity);
    addItem(product, normalizedQuantity);
    openDrawer();
    setQuantity(String(normalizedQuantity));
    setFeedback(`Added ${normalizedQuantity} to cart`);
  }

  function renderControls(isFloating: boolean) {
    return (
      <div className={isFloating ? "product-detail-actions-bar is-floating" : "product-detail-actions"}>
        <div className="product-detail-purchase-head">
          <span className="product-detail-purchase-label">Quantity</span>
          <small className="cart-feedback product-detail-feedback">
            {feedback || (cartQuantity > 0 ? `${cartQuantity} in cart` : "Ready to add")}
          </small>
        </div>
        <div className="product-detail-cart-control">
          <input
            className="product-detail-qty-input"
            inputMode="numeric"
            min="1"
            onChange={(event) => setQuantity(event.target.value)}
            type="number"
            value={quantity}
          />
          <button
            className="primary-button product-detail-button"
            onClick={handleAddToCart}
            type="button"
          >
            Add to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={anchorRef}>{renderControls(false)}</div>
      <div
        aria-hidden={!showFloatingBar}
        className={`product-detail-floating-bar${showFloatingBar ? " is-visible" : ""}`}
      >
        {renderControls(true)}
      </div>
    </>
  );
}
