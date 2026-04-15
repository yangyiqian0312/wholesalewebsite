"use client";

import { useMemo, useState } from "react";

type OrderLineInput = {
  id: string;
  productId: string;
  productName: string | null;
  productCode: string | null;
  imageSmallUrl: string | null;
  submittedQuantity: number;
  quantity: number;
  salesUomName: string | null;
  standardUomName: string | null;
  submittedOriginalUnitPrice: string | null;
  originalUnitPrice: string | null;
  submittedDiscountPercent: string | null;
  unitPrice: string;
  discountPercent: string | null;
  submittedLineTotal: string;
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
  imageSmallUrl: string | null;
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

function buildImageLabel(name: string | null, productId: string) {
  const source = (name || productId).trim();

  return (
    source
      .replace(/[^A-Za-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "P"
  );
}

function calculateLineSubtotal(line: EditableLine) {
  const originalUnitPrice = parseMoney(line.originalUnitPrice);
  const discountPercent = parsePercent(line.discountPercent);
  const discountedUnitPrice = originalUnitPrice * (1 - discountPercent / 100);
  return discountedUnitPrice * line.quantity;
}

function calculateLineOriginalTotal(line: EditableLine) {
  return parseMoney(line.originalUnitPrice) * line.quantity;
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
      imageSmallUrl: line.imageSmallUrl,
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
    <form action={action} className="panel admin-application-card admin-order-editor">
      <input name="orderId" type="hidden" value={orderId} />
      <div className="table-panel-header admin-order-editor-head">
        <div>
          <h2>Line Items</h2>
          <p className="panel-subtitle">Review submitted quantities, pricing, notes, and additional charges before approving this order</p>
        </div>
      </div>

      <div className="admin-order-lines-list">
        {lines.map((line) => {
          const originalLineTotal = calculateLineOriginalTotal(line);
          const lineSubtotal = calculateLineSubtotal(line);
          const discountAmount = Math.max(0, originalLineTotal - lineSubtotal);
          const uomLabel = line.salesUomName || line.standardUomName || "ea.";

          return (
            <section className="admin-order-line-card" key={line.id}>
              <input name="lineId" type="hidden" value={line.id} />

              <div className="admin-order-line-card-head">
                <div className="admin-order-line-card-product">
                  <div className="admin-order-line-card-product-main">
                    <div className="admin-order-line-card-thumb">
                      {line.imageSmallUrl ? (
                        <img alt={line.productName || line.productId} src={line.imageSmallUrl} />
                      ) : (
                        <span>{buildImageLabel(line.productName, line.productId)}</span>
                      )}
                    </div>
                    <div className="admin-order-line-card-product-copy">
                      <strong>{line.productName || line.productId}</strong>
                      <span>{line.productCode || line.productId}</span>
                    </div>
                  </div>
                </div>
                <div className="admin-order-line-card-subtotal">
                  <span>Original</span>
                  <strong>{formatCurrency(originalLineTotal)}</strong>
                  <span>Discount</span>
                  <strong className="admin-order-line-discount-amount">-{formatCurrency(discountAmount)}</strong>
                  <span>Subtotal</span>
                  <strong className="admin-order-live-subtotal">{formatCurrency(lineSubtotal)}</strong>
                </div>
              </div>

              <div className="admin-order-line-card-fields">
                <label className="admin-order-card-field admin-order-card-field-quantity">
                  <span>Quantity</span>
                  <div className="admin-order-stepper">
                    <button
                      className="admin-order-stepper-button"
                      disabled={disabled || line.quantity <= 0}
                      onClick={() =>
                        setLines((current) =>
                          current.map((entry) =>
                            entry.id === line.id
                              ? { ...entry, quantity: Math.max(0, entry.quantity - 1) }
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
                      min={0}
                      name={`quantity:${line.id}`}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((entry) =>
                            entry.id === line.id
                              ? { ...entry, quantity: Math.max(0, Number(event.target.value) || 0) }
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
                </label>

                <label className="admin-order-card-field">
                  <span>Unit Price</span>
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
                </label>

                <label className="admin-order-card-field">
                  <span>Discount</span>
                  <div className="admin-order-suffix-input">
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
                    <span className="admin-order-suffix-label">% off</span>
                  </div>
                </label>
              </div>
            </section>
          );
        })}
      </div>

      <div className="admin-order-bottom-grid">
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
        </div>

        <div className="admin-order-side-financials">
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

          {!disabled ? (
            <div className="admin-order-submit-row">
              <button className="primary-button" type="submit">
                Approve Order
              </button>
            </div>
          ) : null}
        </div>

        {adjustments.map((adjustment) => (
          <div key={adjustment.id} style={{ display: "none" }}>
            <input name="adjustmentId" type="hidden" value={adjustment.id} />
            <input name={`adjustmentLabel:${adjustment.id}`} type="hidden" value={adjustment.label} />
            <input name={`adjustmentAmount:${adjustment.id}`} type="hidden" value={adjustment.amount} />
          </div>
        ))}
      </div>
    </form>
  );
}
