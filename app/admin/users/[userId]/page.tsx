import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchAdminApplicationById,
  fetchAdminOrdersByApplicationId,
  formatAdminDate,
} from "../../_lib/admin-data";
import { requireAdminPortalUser } from "../../../../utils/admin-auth";
import { deleteUserAction } from "../../_lib/user-actions";

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="admin-application-block">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAdminPortalUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const error = Array.isArray(resolvedSearchParams.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams.error;
  const message = Array.isArray(resolvedSearchParams.message)
    ? resolvedSearchParams.message[0]
    : resolvedSearchParams.message;
  const { userId } = await params;
  const application = await fetchAdminApplicationById(userId);

  if (!application) {
    notFound();
  }

  if (
    user.role === "sales_rep" &&
    application.assignedSalesRepEmail?.trim().toLowerCase() !== user.email?.trim().toLowerCase()
  ) {
    notFound();
  }

  const orders = await fetchAdminOrdersByApplicationId(application.id);
  const totalOrdered = orders
    .reduce((sum, order) => sum + Number(order.subtotalAmount), 0)
    .toFixed(2);

  return (
    <div className="admin-layout">
      {error === "delete-auth-failed" || error === "delete-record-failed" ? (
        <section className="panel status-banner status-banner-error">
          <strong>User deletion failed.</strong>
          <span>{message || "Please try again. If it keeps failing, we should inspect the backend logs."}</span>
        </section>
      ) : null}

      <section className="admin-hero panel">
        <div>
          <p className="admin-hero-kicker">User Detail</p>
          <h1>{application.contactName}</h1>
          <p className="admin-hero-copy">
            {application.businessName} | {application.email} | {application.phone}
          </p>
        </div>
        <div className="admin-user-detail-actions">
          <Link className="text-button" href="/admin/users">
            Back to user list
          </Link>
          {user.role === "admin" ? (
            <form action={deleteUserAction}>
              <input name="applicationId" type="hidden" value={application.id} />
              <input name="email" type="hidden" value={application.email} />
              <button className="text-button text-button-danger" type="submit">
                Delete user
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <section className="admin-summary-grid">
        <article className="panel admin-summary-card">
          <span>Account ID</span>
          <strong>{application.accountNumber || "Pending"}</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Status</span>
          <strong>{application.status}</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Submitted Revenue</span>
          <strong>${totalOrdered}</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Sales Rep</span>
          <strong>{application.assignedSalesRepEmail || "Unassigned"}</strong>
        </article>
      </section>

      <section className="panel admin-application-card">
        <div className="table-panel-header">
          <div>
            <h2>Company Information</h2>
            <p className="panel-subtitle">Business and contact details from the application</p>
          </div>
        </div>

        <div className="admin-application-grid">
          <DetailBlock label="Account ID" value={application.accountNumber || "Pending"} />
          <DetailBlock label="Business Name" value={application.businessName} />
          <DetailBlock label="Type of Ownership" value={application.businessType} />
          <DetailBlock label="Email" value={application.email} />
          <DetailBlock label="Phone" value={application.phone} />
          <DetailBlock label="Purchase Volume" value={application.expectedPurchaseVolume} />
          <div className="admin-application-block admin-application-block-wide">
            <span>Company Address</span>
            <strong>
              {application.companyAddress}, {application.city}, {application.stateProvince}{" "}
              {application.zipPostalCode}, {application.country}
            </strong>
          </div>
          <DetailBlock label="Website" value={application.website || "Not provided"} />
          <DetailBlock
            label="Permit / Tax ID"
            value={application.hasResellerPermitOrTaxId ? "Yes" : "No"}
          />
          <div className="admin-application-block admin-application-block-wide">
            <span>Type of Operation</span>
            <strong>{application.salesChannels.join(", ") || "None selected"}</strong>
          </div>
          <div className="admin-application-block admin-application-block-wide">
            <span>I Intend To Order</span>
            <strong>{application.productInterests.join(", ") || "None selected"}</strong>
          </div>
          {application.physicalStoreAddress ? (
            <div className="admin-application-block admin-application-block-wide">
              <span>Shipping Address</span>
              <strong>{application.physicalStoreAddress}</strong>
            </div>
          ) : (
            <div className="admin-application-block admin-application-block-wide">
              <span>Shipping Address</span>
              <strong>Same as company address</strong>
            </div>
          )}
          {application.onlineChannelNotes ? (
            <div className="admin-application-block admin-application-block-wide">
              <span>Channel Notes</span>
              <strong>{application.onlineChannelNotes}</strong>
            </div>
          ) : null}
        </div>
      </section>

      {application.deniedReason ? (
        <section className="panel admin-review-note admin-review-note-denied">
          <span>Denied Reason</span>
          <strong>{application.deniedReason}</strong>
        </section>
      ) : null}

      <section className="panel admin-application-card">
        <div className="table-panel-header">
          <div>
            <h2>Submitted Files</h2>
            <p className="panel-subtitle">Documents currently stored for this application</p>
          </div>
        </div>

        {application.documents.length ? (
          <div className="admin-document-list">
            {application.documents.map((document) => (
              <Link
                className="admin-document-link"
                href={`/admin/documents/${document.id}`}
                key={document.id}
                prefetch={false}
                target="_blank"
              >
                {document.originalFilename}
              </Link>
            ))}
          </div>
        ) : (
          <p className="panel-subtitle">
            No stored files on this application yet. Older prototype submissions only saved file
            names.
          </p>
        )}
      </section>

      <section className="panel admin-application-card">
        <div className="table-panel-header">
          <div>
            <h2>Order History</h2>
            <p className="panel-subtitle">Orders submitted by this approved user through the storefront</p>
          </div>
        </div>

        {orders.length ? (
          <div className="table-scroll">
            <table className="catalog-table admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Items</th>
                  <th>Subtotal</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link className="admin-table-link" href={`/admin/orders/${order.id}`}>
                        <div className="admin-table-main">
                          {order.inflowOrderNumber || order.inflowSalesOrderId || order.id}
                        </div>
                      </Link>
                      <div className="value-sub">{order.source}</div>
                    </td>
                    <td>{order.lines.length}</td>
                    <td>${Number(order.subtotalAmount).toFixed(2)}</td>
                    <td>{formatAdminDate(order.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="panel-subtitle">This user has not submitted any orders yet.</p>
        )}
      </section>
    </div>
  );
}
