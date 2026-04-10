"use client";

import { useMemo, useState } from "react";

type OrderLineInput = {
  id: string;
  productId: string;
  productName: string | null;
  productCode: string | null;
  quantity: number;
  salesUomName: string | null;
  standardUomName: string | null;
  originalUnitPrice: string | null;
  unitPrice: string;
  discountPercent: string | null;
  lineTotal: string;
};

type AdjustmentInput = {
  id: string;
  label: string;
  amount: string;
};

type AdminOrderEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
  disabled: boolean;
  freightAmount: string;
  initialAdjustments: AdjustmentInput[];
  initialLines: OrderLineInput[];
  initialSubtotal: string;
  initialTaxName: string | null;
  initialTaxRate: string | null;
  initialTotal: string;
  orderId: string;
  salesRepNote: string | null;
  taxAmount: string;
};

type EditableLine = {
  id: string;
  productId: string;
  productName: string | null;
  productCode: string | null;
  quantity: number;
  salesUomName: string | null;
  standardUomName: string | null;
  originalUnitPrice: string;
  discountPercent: string;
};

type EditableAdjustment = {
  id: string;
  label: string;
  amount: string;
};

function parseMoney(value: string) {
  const numericValue = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function parsePercent(value: string) {
  const numericValue = Number(value.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, numericValue));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatQuantityLabel(quantity: number, uomName: string | null, standardUomName: string | null) {
  return `${quantity} ${uomName || standardUomName || "ea."}`;
}

function calculateLineSubtotal(line: EditableLine) {
  const originalUnitPrice = parseMoney(line.originalUnitPrice);
  const discountPercent = parsePercent(line.discountPercent);
  const discountedUnitPrice = originalUnitPrice * (1 - discountPercent / 100);
  return discountedUnitPrice * line.quantity;
}

export function OrderApprovalEditor({
  action,
  disabled,
  freightAmount,
  initialAdjustments,
  initialLines,
  initialSubtotal,
  initialTaxName,
  initialTaxRate,
  initialTotal,
  orderId,
  salesRepNote,
  taxAmount,
}: AdminOrderEditorProps) {
  const [lines, setLines] = useState<EditableLine[]>(
    initialLines.map((line) => ({
      id: line.id,
      productId: line.productId,
      productName: line.productName,
      productCode: line.productCode,
      quantity: line.quantity,
      salesUomName: line.salesUomName,
      standardUomName: line.standardUomName,
      originalUnitPrice: Number(line.originalUnitPrice || line.unitPrice).toFixed(2),
      discountPercent: line.discountPercent ? Number(line.discountPercent).toFixed(2) : "0.00",
    })),
  );
  const [adjustments, setAdjustments] = useState<EditableAdjustment[]>(
    initialAdjustments,
  );
  const [currentFreightAmount, setCurrentFreightAmount] = useState(Number(freightAmount).toFixed(2));
  const [currentTaxName, setCurrentTaxName] = useState(initialTaxName ?? "");
  const [currentTaxRate, setCurrentTaxRate] = useState(
    initialTaxRate ? Number(initialTaxRate).toFixed(2) : "",
  );

  const computed = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + calculateLineSubtotal(line), 0);
    const parsedFreight = parseMoney(currentFreightAmount);
    const parsedTaxRate = parsePercent(currentTaxRate);
    const computedTaxAmount = subtotal * (parsedTaxRate / 100);
    const adjustmentsTotal = adjustments.reduce((sum, adjustment) => sum + parseMoney(adjustment.amount), 0);
    const total = subtotal + parsedFreight + computedTaxAmount + adjustmentsTotal;

    return {
      adjustmentsTotal,
      freightAmount: parsedFreight,
      subtotal,
      taxAmount: computedTaxAmount,
      total,
    };
  }, [adjustments, currentFreightAmount, currentTaxRate, lines]);

  return (
    <form action={action} className="panel admin-application-card">
      <input name="orderId" type="hidden" value={orderId} />
      <div className="table-panel-header">
        <div>
          <h2>Line Items</h2>
          <p className="panel-subtitle">Review submitted quantities, pricing, notes, and additional charges before approving this order</p>
        </div>
        {!disabled ? (
          <button className="primary-button" type="submit">
            Approve Order
          </button>
        ) : null}
      </div>

      <div className="table-scroll">
        <table className="catalog-table admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Discount</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const lineSubtotal = calculateLineSubtotal(line);
              const uomLabel = line.salesUomName || line.standardUomName || "ea.";

              return (
                <tr key={line.id}>
                  <td>
                    <input name="lineId" type="hidden" value={line.id} />
                    <strong>{line.productName || line.productId}</strong>
                    <span>{line.productCode || line.productId}</span>
                  </td>
                  <td>
                    <div className="admin-order-stepper">
                      <button
                        className="admin-order-stepper-button"
                        disabled={disabled || line.quantity <= 1}
                        onClick={() =>
                          setLines((current) =>
                            current.map((entry) =>
                              entry.id === line.id
                                ? { ...entry, quantity: Math.max(1, entry.quantity - 1) }
                                : entry,
                            ),
                          )
                        }
                        type="button"
                      >
                        -
                      </button>
                      <input
                        className="admin-order-stepper-input"
                        disabled={disabled}
                        min={1}
                        name={`quantity:${line.id}`}
                        onChange={(event) =>
                          setLines((current) =>
                            current.map((entry) =>
                              entry.id === line.id
                                ? { ...entry, quantity: Math.max(1, Number(event.target.value) || 1) }
                                : entry,
                            ),
                          )
                        }
                        type="number"
                        value={line.quantity}
                      />
                      <span className="admin-order-stepper-uom">{uomLabel}</span>
                      <button
                        className="admin-order-stepper-button"
                        disabled={disabled}
                        onClick={() =>
                          setLines((current) =>
                            current.map((entry) =>
                              entry.id === line.id
                                ? { ...entry, quantity: entry.quantity + 1 }
                                : entry,
                            ),
                          )
                        }
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    <span className="admin-order-stepper-preview">
                      {formatQuantityLabel(line.quantity, line.salesUomName, line.standardUomName)}
                    </span>
                  </td>
                  <td>
                    <input
                      className="admin-order-line-input"
                      disabled={disabled}
                      inputMode="decimal"
                      name={`originalUnitPrice:${line.id}`}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((entry) =>
                            entry.id === line.id
                              ? { ...entry, originalUnitPrice: event.target.value }
                              : entry,
                          ),
                        )
                      }
                      type="text"
                      value={line.originalUnitPrice}
                    />
                  </td>
                  <td>
                    <input
                      className="admin-order-line-input"
                      disabled={disabled}
                      inputMode="decimal"
                      name={`discountPercent:${line.id}`}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((entry) =>
                            entry.id === line.id
                              ? { ...entry, discountPercent: event.target.value }
                              : entry,
                          ),
                        )
                      }
                      type="text"
                      value={line.discountPercent}
                    />
                  </td>
                  <td>
                    <strong className="admin-order-live-subtotal">{formatCurrency(lineSubtotal)}</strong>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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

        <div className="admin-order-financial-grid">
          <label className="admin-order-note-field">
            <span>Freight</span>
            <input
              className="admin-order-line-input"
              disabled={disabled}
              inputMode="decimal"
              name="freightAmount"
              onChange={(event) => setCurrentFreightAmount(event.target.value)}
              placeholder="0.00"
              type="text"
              value={currentFreightAmount}
            />
          </label>
          <label className="admin-order-note-field">
            <span>Tax Label</span>
            <input
              className="admin-order-line-input"
              disabled={disabled}
              name="taxName"
              onChange={(event) => setCurrentTaxName(event.target.value)}
              placeholder="Tax / 83501"
              type="text"
              value={currentTaxName}
            />
          </label>
          <label className="admin-order-note-field">
            <span>Tax Rate %</span>
            <input
              className="admin-order-line-input"
              disabled={disabled}
              inputMode="decimal"
              name="taxRate"
              onChange={(event) => setCurrentTaxRate(event.target.value)}
              placeholder="0.00"
              type="text"
              value={currentTaxRate}
            />
          </label>
        </div>

        {adjustments.map((adjustment) => (
          <div key={adjustment.id} style={{ display: "none" }}>
            <input name="adjustmentId" type="hidden" value={adjustment.id} />
            <input name={`adjustmentLabel:${adjustment.id}`} type="hidden" value={adjustment.label} />
            <input name={`adjustmentAmount:${adjustment.id}`} type="hidden" value={adjustment.amount} />
          </div>
        ))}
      </div>

      <div className="profile-order-summary admin-order-summary">
        <div className="profile-order-summary-row">
          <span>Subtotal</span>
          <strong>{formatCurrency(disabled ? parseMoney(initialSubtotal) : computed.subtotal)}</strong>
        </div>
        {(disabled ? Number(freightAmount) : computed.freightAmount) > 0 ? (
          <div className="profile-order-summary-row">
            <span>Freight</span>
            <strong>{formatCurrency(disabled ? parseMoney(freightAmount) : computed.freightAmount)}</strong>
          </div>
        ) : null}
        {(disabled ? parseMoney(taxAmount) : computed.taxAmount) > 0 ? (
          <div className="profile-order-summary-row">
            <span>
              {(disabled ? initialTaxName : currentTaxName)
                ? `${disabled ? initialTaxName : currentTaxName} ${parsePercent(disabled ? initialTaxRate ?? "0" : currentTaxRate).toFixed(2)}%`
                : "Tax"}
            </span>
            <strong>{formatCurrency(disabled ? parseMoney(taxAmount) : computed.taxAmount)}</strong>
          </div>
        ) : null}
        {(disabled ? initialAdjustments : adjustments).map((adjustment) => (
          <div className="profile-order-summary-row" key={adjustment.id}>
            <span>{adjustment.label}</span>
            <strong>{formatCurrency(parseMoney(adjustment.amount))}</strong>
          </div>
        ))}
        <div className="profile-order-summary-row profile-order-summary-total">
          <span>Total</span>
          <strong>{formatCurrency(disabled ? parseMoney(initialTotal) : computed.total)}</strong>
        </div>
      </div>
    </form>
  );
}
