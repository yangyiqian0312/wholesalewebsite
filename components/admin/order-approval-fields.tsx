"use client";

import { useState } from "react";

type AdjustmentInput = {
  id: string;
  label: string;
  amount: string;
};

function createAdjustmentId() {
  return `adjustment-${Math.random().toString(36).slice(2, 10)}`;
}

export function OrderApprovalFields({
  adjustments,
  disabled,
  salesRepNote,
}: {
  adjustments: AdjustmentInput[];
  disabled: boolean;
  salesRepNote: string | null;
}) {
  const [items, setItems] = useState<AdjustmentInput[]>(
    adjustments.length
      ? adjustments
      : disabled
        ? []
        : [{ id: createAdjustmentId(), label: "", amount: "" }],
  );

  return (
    <div className="admin-order-extra-fields">
      <label className="admin-order-note-field">
        <span>Sales Rep Notes</span>
        <textarea
          defaultValue={salesRepNote ?? ""}
          disabled={disabled}
          name="salesRepNote"
          placeholder="Add any notes the customer should see with this order."
          rows={4}
        />
      </label>

      <div className="admin-order-adjustments">
        <div className="admin-order-adjustments-head">
          <div>
            <h3>Additional Charges</h3>
            <p className="panel-subtitle">Add freight, handling, or any other order-level charge.</p>
          </div>
          {!disabled ? (
            <button
              className="secondary-button"
              onClick={() =>
                setItems((current) => [...current, { id: createAdjustmentId(), label: "", amount: "" }])
              }
              type="button"
            >
              + Add Charge
            </button>
          ) : null}
        </div>

        <div className="admin-order-adjustment-list">
          {items.map((item, index) => (
            <div className="admin-order-adjustment-row" key={item.id}>
              <input name="adjustmentId" type="hidden" value={item.id} />
              <input
                className="admin-order-line-input"
                defaultValue={item.label}
                disabled={disabled}
                name={`adjustmentLabel:${item.id}`}
                placeholder={index === 0 ? "Freight" : "Charge label"}
                type="text"
              />
              <input
                className="admin-order-line-input"
                defaultValue={item.amount}
                disabled={disabled}
                inputMode="decimal"
                name={`adjustmentAmount:${item.id}`}
                placeholder="0.00"
                type="text"
              />
              {!disabled ? (
                <button
                  className="text-button"
                  onClick={() =>
                    setItems((current) => current.filter((entry) => entry.id !== item.id))
                  }
                  type="button"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
