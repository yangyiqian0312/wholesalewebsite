import Link from "next/link";
import { fetchAdminApplications, formatAdminDate } from "../_lib/admin-data";
import { requireAdminPortalUser } from "../../../utils/admin-auth";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAdminPortalUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const status = Array.isArray(resolvedSearchParams.status)
    ? resolvedSearchParams.status[0]
    : resolvedSearchParams.status;
  const error = Array.isArray(resolvedSearchParams.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams.error;
  const message = Array.isArray(resolvedSearchParams.message)
    ? resolvedSearchParams.message[0]
    : resolvedSearchParams.message;
  const applications = await fetchAdminApplications();
  const approvedUsers = applications
    .filter((application) => application.status === "APPROVED")
    .filter((application) =>
      user.role === "admin"
        ? true
        : application.assignedSalesRepEmail?.trim().toLowerCase() === user.email?.trim().toLowerCase(),
    )
    .map((application) => ({
    id: application.id,
    accountNumber: application.accountNumber,
    name: application.contactName,
    email: application.email,
    businessName: application.businessName,
    phone: application.phone,
    status: application.status,
    assignedSalesRepEmail: application.assignedSalesRepEmail,
    createdAt: application.createdAt,
    reviewedAt: application.reviewedAt,
    }));

  return (
    <div className="admin-layout">
      {status === "deleted" ? (
        <section className="panel status-banner status-banner-success">
          <strong>User deleted.</strong>
          <span>The login account and customer record were removed.</span>
        </section>
      ) : null}

      {error === "delete-missing-user" ? (
        <section className="panel status-banner status-banner-error">
          <strong>User deletion failed.</strong>
          <span>{message || "The user record could not be identified for deletion."}</span>
        </section>
      ) : null}

      <section className="panel admin-table-panel">
        <div className="table-panel-header">
          <div>
            <h2>User List</h2>
            <p className="panel-subtitle">Approved customer contacts currently active in the system</p>
          </div>
        </div>

        <div className="table-scroll">
          <table className="catalog-table admin-table">
            <thead>
              <tr>
                <th>Account ID</th>
                <th>Contact</th>
                <th>Company</th>
                <th>Sales Rep</th>
                <th>Submitted</th>
                <th>Approved</th>
              </tr>
            </thead>
            <tbody>
              {approvedUsers.length ? approvedUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.accountNumber || "Pending"}</td>
                  <td>
                    <Link className="admin-table-link" href={`/admin/users/${user.id}`}>
                      <div className="admin-table-main">{user.name}</div>
                    </Link>
                    <div className="value-sub">
                      {user.email}
                      <br />
                      {user.phone}
                    </div>
                  </td>
                  <td>
                    <Link className="admin-table-link" href={`/admin/users/${user.id}`}>
                      {user.businessName}
                    </Link>
                  </td>
                  <td>{user.assignedSalesRepEmail || "Unassigned"}</td>
                  <td>{formatAdminDate(user.createdAt)}</td>
                  <td>{formatAdminDate(user.reviewedAt)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-table-empty">No approved users yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
