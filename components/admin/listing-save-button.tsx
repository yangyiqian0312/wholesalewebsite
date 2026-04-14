"use client";

import { useRef, useState, useTransition } from "react";

type ListingSaveButtonProps = {
  productId: string;
};

type SaveState = "idle" | "success" | "error";

function readInputValue(container: HTMLElement, name: string) {
  return (container.querySelector<HTMLInputElement>(`[name="${name}"]`)?.value ?? "").trim();
}

function readCheckboxValue(container: HTMLElement, name: string) {
  return container.querySelector<HTMLInputElement>(`[name="${name}"]`)?.checked ?? false;
}

export default function ListingSaveButton({ productId }: ListingSaveButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");

  function handleSave() {
    const container = buttonRef.current?.closest<HTMLElement>(".admin-listing-card");

    if (!container) {
      setSaveState("error");
      setMessage("We couldn't find this listing form.");
      return;
    }

    const unitPriceValue = readInputValue(container, `unitPrice:${productId}`);

    startTransition(async () => {
      setSaveState("idle");
      setMessage("");

      const response = await fetch(`/api/admin/listings/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: readInputValue(container, `name:${productId}`),
          unitPrice: unitPriceValue ? Number(unitPriceValue) : null,
          releaseDate: readInputValue(container, `releaseDate:${productId}`) || null,
          description: readInputValue(container, `description:${productId}`) || null,
          isActive: readCheckboxValue(container, `isActive:${productId}`),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setSaveState("error");
        setMessage(payload?.error || "Save failed. Please try again.");
        return;
      }

      setSaveState("success");
      setMessage("Saved.");
    });
  }

  return (
    <div className="admin-listing-save-group">
      {message ? (
        <span
          className={
            saveState === "error"
              ? "admin-listing-save-feedback is-error"
              : "admin-listing-save-feedback is-success"
          }
        >
          {message}
        </span>
      ) : null}
      <button
        className="admin-listing-save-button"
        disabled={isPending}
        onClick={handleSave}
        ref={buttonRef}
        type="button"
      >
        {isPending ? "Saving..." : "Save Listing"}
      </button>
    </div>
  );
}
