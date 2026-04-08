"use client";

import { useEffect, useState } from "react";
import { useCart } from "./cart-provider";
import type { CartProductInput } from "./cart-types";

type AddToCartControlProps = {
  product: CartProductInput;
  defaultQuantity?: string;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  label?: string;
  controlClassName?: string;
  showFeedback?: boolean;
};

function parseInputQuantity(value: string) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue) || numericValue <= 0) {
    return 1;
  }

  return Math.floor(numericValue);
}

export function AddToCartControl({
  product,
  defaultQuantity = "1",
  className,
  inputClassName,
  buttonClassName,
  label,
  controlClassName,
  showFeedback = true,
}: AddToCartControlProps) {
  const { addItem, getItemQuantity, openDrawer } = useCart();
  const [quantity, setQuantity] = useState(defaultQuantity || "1");
  const [feedback, setFeedback] = useState("");
  const cartQuantity = getItemQuantity(product.code);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => setFeedback(""), 1800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  function handleAddToCart() {
    const normalizedQuantity = parseInputQuantity(quantity);
    addItem(product, normalizedQuantity);
    openDrawer();
    setQuantity(String(normalizedQuantity));
    setFeedback(`Added ${normalizedQuantity} to cart`);
  }

  return (
    <div className={className}>
      {label ? <span>{label}</span> : null}
      <div className={controlClassName ?? "cart-control-inline"}>
        <input
          className={inputClassName}
          inputMode="numeric"
          min="1"
          onChange={(event) => setQuantity(event.target.value)}
          suppressHydrationWarning
          type="number"
          value={quantity}
        />
        <button
          className={buttonClassName}
          onClick={handleAddToCart}
          suppressHydrationWarning
          type="button"
        >
          Add to Cart
        </button>
      </div>
      {showFeedback ? (
        <small className="cart-feedback">
          {feedback || (cartQuantity > 0 ? `${cartQuantity} in cart` : "Ready to add")}
        </small>
      ) : null}
    </div>
  );
}
