import type { ReactNode } from "react";
import Link from "next/link";
import { PageBreadcrumbs } from "../../../components/shared/page-breadcrumbs";
import { fetchAdminApplications, fetchAdminOrders, formatAdminDate, formatOrderStatusLabel } from "../_lib/admin-data";
import { requireAdminPortalUser } from "../../../utils/admin-auth";

const orderStatusOptions = ["SUBMITTED", "APPROVED", "PAID", "SHIPPED", "CANCELLED"] as const;

function readSearchParam(
  value: string | string[] | undefined,
) {
  return Array.isArray(value) ? value[0] : value;
}

function FilterHiddenInputs({
  customer,
  status,
  company,
  items,
  exclude,
}: {
  customer?: string;
  status?: string;
  company?: string;
  items?: string;
  exclude: Array<"customer" | "status" | "company" | "items">;
}) {
  return (
    <>
      {!exclude.includes("customer") && customer ? <input name="customer" type="hidden" value={customer} /> : null}
      {!exclude.includes("status") && status ? <input name="status" type="hidden" value={status} /> : null}
      {!exclude.includes("company") && company ? <input name="company" type="hidden" value={company} /> : null}
      {!exclude.includes("items") && items ? <input name="items" type="hidden" value={items} /> : null}
    </>
  );
}

function ColumnFilter({
  label,
  children,
  isActive = false,
}: {
  label: string;
  children: ReactNode;
  isActive?: boolean;
}) {
  return (
    <details className={`admin-column-filter ${isActive ? "is-active" : ""}`}>
      <summary className="admin-column-filter-trigger">
        <span>{label}</span>
        <span aria-hidden="true" className="admin-column-filter-chevron">
          ▾
        </span>
      </summary>
      <div className="admin-column-filter-panel">{children}</div>
    </details>
  );
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAdminPortalUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const customerParam = readSearchParam(resolvedSearchParams.customer);
  const statusParam = readSearchParam(resolvedSearchParams.status);
  const companyParam = readSearchParam(resolvedSearchParams.company);
  const itemsParam = readSearchParam(resolvedSearchParams.items);
  const [orders, applications] = await Promise.all([
    fetchAdminOrders(),
    fetchAdminApplications(),
  ]);
  const customerFilter = customerParam?.trim().toLowerCase() ?? "";
  const companyFilter = companyParam?.trim().toLowerCase() ?? "";
  const statusFilter = orderStatusOptions.includes(statusParam as (typeof orderStatusOptions)[number])
    ? statusParam
    : "";
  const itemsFilterValue = Number(itemsParam?.trim() ?? "");
  const itemsFilter = Number.isInteger(itemsFilterValue) && itemsFilterValue > 0 ? itemsFilterValue : null;
  const visibleApplicationIds = new Set(
    applications
      .filter((application) =>
        user.role === "admin"
          ? true
          : application.assignedSalesRepEmail?.trim().toLowerCase() === user.email?.trim().toLowerCase(),
      )
      .map((application) => application.id),
  );
  const visibleOrders = orders
    .filter((order) => visibleApplicationIds.has(order.applicationId))
    .filter((order) => {
      if (statusFilter && order.status !== statusFilter) {
        return false;
      }

      if (customerFilter) {
        const customerHaystack = [
          order.customerName,
          order.customerEmail,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!customerHaystack.includes(customerFilter)) {
          return false;
        }
      }

      if (companyFilter && !order.businessName.toLowerCase().includes(companyFilter)) {
        return false;
      }

      if (itemsFilter !== null && order.lines.length !== itemsFilter) {
        return false;
      }

      return true;
    });

  return (
    <div className="admin-layout">
      <PageBreadcrumbs items={[{ href: "/admin", label: "Admin" }, { label: "Orders" }]} />
      <section className="panel admin-table-panel">
        <div className="table-panel-header">
          <div>
            <h2>Order List</h2>
          </div>
        </div>

        <div className="table-scroll admin-orders-table-scroll">
          <table className="catalog-table admin-table admin-orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>
                  <ColumnFilter isActive={Boolean(statusFilter)} label="Status">
                    <form action="/admin/orders" className="admin-column-filter-form" method="get">
                      <FilterHiddenInputs
                        company={companyParam}
                        customer={customerParam}
                        exclude={["status"]}
                        items={itemsParam}
                        status={statusParam}
                      />
                      <label className="admin-column-filter-field">
                        <span>Status</span>
                        <select defaultValue={statusFilter} name="status">
                          <option value="">All statuses</option>
                          {orderStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {formatOrderStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="admin-column-filter-actions">
                        <button className="admin-column-filter-apply" type="submit">
                          Apply
                        </button>
                        {statusFilter ? (
                          <Link
                            className="admin-column-filter-clear"
                            href={`/admin/orders${
                              customerParam || companyParam || itemsParam
                                ? `?${new URLSearchParams(
                                    Object.entries({
                                      customer: customerParam ?? "",
                                      company: companyParam ?? "",
                                      items: itemsParam ?? "",
                                    }).filter(([, value]) => value),
                                  ).toString()}`
                                : ""
                            }`}
                          >
                            Clear
                          </Link>
                        ) : null}
                      </div>
                    </form>
                  </ColumnFilter>
                </th>
                <th>
                  <ColumnFilter isActive={Boolean(customerFilter)} label="Customer">
                    <form action="/admin/orders" className="admin-column-filter-form" method="get">
                      <FilterHiddenInputs
                        company={companyParam}
                        customer={customerParam}
                        exclude={["customer"]}
                        items={itemsParam}
                        status={statusParam}
                      />
                      <label className="admin-column-filter-field">
                        <span>Name or email</span>
                        <input
                          defaultValue={customerParam ?? ""}
                          name="customer"
                          placeholder="Search customer"
                          type="search"
                        />
                      </label>
                      <div className="admin-column-filter-actions">
                        <button className="admin-column-filter-apply" type="submit">
                          Apply
                        </button>
                        {customerFilter ? (
                          <Link
                            className="admin-column-filter-clear"
                            href={`/admin/orders${
                              statusParam || companyParam || itemsParam
                                ? `?${new URLSearchParams(
                                    Object.entries({
                                      status: statusParam ?? "",
                                      company: companyParam ?? "",
                                      items: itemsParam ?? "",
                                    }).filter(([, value]) => value),
                                  ).toString()}`
                                : ""
                            }`}
                          >
                            Clear
                          </Link>
                        ) : null}
                      </div>
                    </form>
                  </ColumnFilter>
                </th>
                <th>
                  <ColumnFilter isActive={Boolean(companyFilter)} label="Company">
                    <form action="/admin/orders" className="admin-column-filter-form" method="get">
                      <FilterHiddenInputs
                        company={companyParam}
                        customer={customerParam}
                        exclude={["company"]}
                        items={itemsParam}
                        status={statusParam}
                      />
                      <label className="admin-column-filter-field">
                        <span>Company</span>
                        <input
                          defaultValue={companyParam ?? ""}
                          name="company"
                          placeholder="Search company"
                          type="search"
                        />
                      </label>
                      <div className="admin-column-filter-actions">
                        <button className="admin-column-filter-apply" type="submit">
                          Apply
                        </button>
                        {companyFilter ? (
                          <Link
                            className="admin-column-filter-clear"
                            href={`/admin/orders${
                              statusParam || customerParam || itemsParam
                                ? `?${new URLSearchParams(
                                    Object.entries({
                                      status: statusParam ?? "",
                                      customer: customerParam ?? "",
                                      items: itemsParam ?? "",
                                    }).filter(([, value]) => value),
                                  ).toString()}`
                                : ""
                            }`}
                          >
                            Clear
                          </Link>
                        ) : null}
                      </div>
                    </form>
                  </ColumnFilter>
                </th>
                <th>
                  <ColumnFilter isActive={itemsFilter !== null} label="Items">
                    <form action="/admin/orders" className="admin-column-filter-form" method="get">
                      <FilterHiddenInputs
                        company={companyParam}
                        customer={customerParam}
                        exclude={["items"]}
                        items={itemsParam}
                        status={statusParam}
                      />
                      <label className="admin-column-filter-field">
                        <span>Item count</span>
                        <input
                          defaultValue={itemsParam ?? ""}
                          min="1"
                          name="items"
                          placeholder="e.g. 2"
                          type="number"
                        />
                      </label>
                      <div className="admin-column-filter-actions">
                        <button className="admin-column-filter-apply" type="submit">
                          Apply
                        </button>
                        {itemsFilter !== null ? (
                          <Link
                            className="admin-column-filter-clear"
                            href={`/admin/orders${
                              statusParam || customerParam || companyParam
                                ? `?${new URLSearchParams(
                                    Object.entries({
                                      status: statusParam ?? "",
                                      customer: customerParam ?? "",
                                      company: companyParam ?? "",
                                    }).filter(([, value]) => value),
                                  ).toString()}`
                                : ""
                            }`}
                          >
                            Clear
                          </Link>
                        ) : null}
                      </div>
                    </form>
                  </ColumnFilter>
                </th>
                <th>Subtotal</th>
                <th>Submitted</th>
              </tr>
            </thead>
            {visibleOrders.length ? (
              <tbody>
                {visibleOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link className="admin-table-link" href={`/admin/orders/${order.id}`}>
                      <div className="admin-table-main">{order.inflowOrderNumber || order.inflowSalesOrderId || order.id}</div>
                    </Link>
                    <div className="value-sub">{order.source}</div>
                  </td>
                  <td>
                    {formatOrderStatusLabel(order.status)}
                    {order.customerCancelRequestedAt ? (
                      <div className="value-sub">Customer requested cancellation</div>
                    ) : null}
                  </td>
                  <td>
                    <Link className="admin-table-link" href={`/admin/users/${order.applicationId}`}>
                      {order.customerName}
                    </Link>
                    <div className="value-sub">{order.customerEmail}</div>
                  </td>
                  <td>{order.businessName}</td>
                  <td>{order.lines.length}</td>
                  <td>${Number(order.subtotalAmount).toFixed(2)}</td>
                  <td>{formatAdminDate(order.submittedAt)}</td>
                </tr>
                ))}
              </tbody>
            ) : null}
          </table>
          {!visibleOrders.length ? (
            <div className="admin-orders-empty-state">
              {customerFilter || statusFilter || companyFilter || itemsFilter !== null
                ? "No orders match the current filters."
                : "No submitted orders yet."}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
