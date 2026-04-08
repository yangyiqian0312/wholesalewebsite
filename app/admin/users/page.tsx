import Link from "next/link";
import { fetchAdminApplications, formatAdminDate } from "../_lib/admin-data";

export default async function AdminUsersPage() {
  const applications = await fetchAdminApplications();
  const approvedUsers = applications
    .filter((application) => application.status === "APPROVED")
    .map((application) => ({
    id: application.id,
    name: application.contactName,
    email: application.email,
    businessName: application.businessName,
    phone: application.phone,
    status: application.status,
    createdAt: application.createdAt,
    reviewedAt: application.reviewedAt,
    }));

  return (
    <div className="admin-layout">
      <section className="admin-hero panel">
        <div>
          <p className="admin-hero-kicker">Users</p>
          <h1>Approved wholesale users</h1>
          <p className="admin-hero-copy">
            This view only shows approved accounts that are active in the wholesale system.
          </p>
        </div>
      </section>

      <section className="admin-summary-grid">
        <article className="panel admin-summary-card">
          <span>Approved Users</span>
          <strong>{approvedUsers.length}</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Reviewed Today</span>
          <strong>
            {approvedUsers.filter((user) => {
              if (!user.reviewedAt) {
                return false;
              }

              const reviewedDate = new Date(user.reviewedAt);
              const now = new Date();

              return reviewedDate.toDateString() === now.toDateString();
            }).length}
          </strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Newest Approval</span>
          <strong>{approvedUsers[0] ? formatAdminDate(approvedUsers[0].reviewedAt) : "None"}</strong>
        </article>
      </section>

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
                <th>Contact</th>
                <th>Company</th>
                <th>Submitted</th>
                <th>Approved</th>
              </tr>
            </thead>
            <tbody>
              {approvedUsers.length ? approvedUsers.map((user) => (
                <tr key={user.id}>
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
                  <td>{formatAdminDate(user.createdAt)}</td>
                  <td>{formatAdminDate(user.reviewedAt)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4}>
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
