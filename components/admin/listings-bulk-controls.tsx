"use client";

import { useState, useTransition, type MouseEvent } from "react";

type ListingsBulkControlsProps = {
  checkboxSelector?: string;
};

export default function ListingsBulkControls({
  checkboxSelector = 'input[type="checkbox"][name^="isActive:"]',
}: ListingsBulkControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function updateVisibleListingStates(nextChecked: boolean) {
    const checkboxes = Array.from(
      document.querySelectorAll<HTMLInputElement>(checkboxSelector),
    );

    for (const checkbox of checkboxes) {
      checkbox.checked = nextChecked;
    }
  }

  function readInputValue(container: HTMLElement, name: string) {
    return (container.querySelector<HTMLInputElement>(`[name="${name}"]`)?.value ?? "").trim();
  }

  function readCheckboxValue(container: HTMLElement, name: string) {
    return container.querySelector<HTMLInputElement>(`[name="${name}"]`)?.checked ?? false;
  }

  function handleBulkUpdate(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.closest("form");

    if (!form) {
      setIsError(true);
      setMessage("We couldn't find the listings form.");
      return;
    }

    const productIds = Array.from(
      new Set(
        Array.from(form.querySelectorAll<HTMLInputElement>('input[name="productIds"]'))
          .map((input) => input.value.trim())
          .filter(Boolean),
      ),
    );

    if (!productIds.length) {
      setIsError(true);
      setMessage("No listings found to update.");
      return;
    }

    startTransition(async () => {
      setIsError(false);
      setMessage("");

      const response = await fetch("/api/admin/listings/bulk", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: productIds.map((productId) => {
            const unitPriceValue = readInputValue(form, `unitPrice:${productId}`);

            return {
              productId,
              name: readInputValue(form, `name:${productId}`),
              unitPrice: unitPriceValue ? Number(unitPriceValue) : null,
              releaseDate: readInputValue(form, `releaseDate:${productId}`) || null,
              description: readInputValue(form, `description:${productId}`) || null,
              isActive: readCheckboxValue(form, `isActive:${productId}`),
            };
          }),
        }),
      });

      if (!response.ok) {
        setIsError(true);
        setMessage("Bulk update failed. Please try again.");
        return;
      }

      setMessage(`Updated ${productIds.length} listings.`);
    });
  }

  return (
    <div className="admin-listings-toolbar-actions">
      <button
        className="admin-listing-save-button"
        onClick={() => updateVisibleListingStates(true)}
        type="button"
      >
        All Active
      </button>
      <button
        className="admin-listing-save-button"
        onClick={() => updateVisibleListingStates(false)}
        type="button"
      >
        All Inactive
      </button>
      <button className="primary-button" disabled={isPending} onClick={handleBulkUpdate} type="button">
        {isPending ? "Updating..." : "Bulk Update"}
      </button>
      {message ? (
        <span className={isError ? "admin-listing-save-feedback is-error" : "admin-listing-save-feedback is-success"}>
          {message}
        </span>
      ) : null}
    </div>
  );
}
