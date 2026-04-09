import Link from "next/link";
import {
  AccountApplication,
  fetchAdminApplications,
  formatAdminDate,
} from "../_lib/admin-data";
import { getFrontendBaseUrl } from "../../../utils/backend-api";
import {
  approveApplicationAction,
  denyApplicationAction,
} from "../_lib/application-actions";

const applicationTabs = [
  {
    key: "pending",
    label: "Pending",
    getCount: (counts: { pending: number; approved: number; rejected: number }) => counts.pending,
    emptyTitle: "No pending applications right now.",
    emptyCopy: "New submissions from the open account form will appear here.",
  },
  {
    key: "approved",
    label: "Approved",
    getCount: (counts: { pending: number; approved: number; rejected: number }) => counts.approved,
    emptyTitle: "No approved applications yet.",
    emptyCopy: "Approved applications will appear here after review.",
  },
  {
    key: "rejected",
    label: "Rejected",
    getCount: (counts: { pending: number; approved: number; rejected: number }) => counts.rejected,
    emptyTitle: "No rejected applications yet.",
    emptyCopy: "Rejected applications will appear here after review.",
  },
] as const;

type ApplicationTabKey = (typeof applicationTabs)[number]["key"];

function ApplicationCard({
  application,
}: {
  application: AccountApplication;
}) {
  const statusClassName =
    application.status === "APPROVED"
      ? "status-success"
      : application.status === "DENIED"
        ? "status-danger"
        : "status-warning-soft";

  return (
    <article className="panel admin-application-card">
      <div className="admin-application-head">
        <div>
          <p className="admin-application-kicker">Submitted {formatAdminDate(application.createdAt)}</p>
          <h2>{application.businessName}</h2>
          <p className="admin-application-contact">
            {application.contactName} | {application.email} | {application.phone}
          </p>
        </div>

        <span className={`status-tag ${statusClassName}`}>{application.status}</span>
      </div>

      <div className="admin-application-grid">
        <div className="admin-application-block">
          <span>Business Type</span>
          <strong>{application.businessType}</strong>
        </div>
        <div className="admin-application-block">
          <span>Business Model</span>
          <strong>{application.businessModel}</strong>
        </div>
        <div className="admin-application-block admin-application-block-wide">
          <span>Address</span>
          <strong>
            {application.companyAddress}, {application.city}, {application.stateProvince}{" "}
            {application.zipPostalCode}, {application.country}
          </strong>
        </div>
        <div className="admin-application-block">
          <span>Website</span>
          <strong>{application.website || "Not provided"}</strong>
        </div>
        <div className="admin-application-block">
          <span>Store / Marketplace</span>
          <strong>{application.storeMarketplaceLink || "Not provided"}</strong>
        </div>
        <div className="admin-application-block admin-application-block-wide">
          <span>Sales Channels</span>
          <strong>{application.salesChannels.join(", ") || "None selected"}</strong>
        </div>
        <div className="admin-application-block admin-application-block-wide">
          <span>Product Interests</span>
          <strong>{application.productInterests.join(", ") || "None selected"}</strong>
        </div>
        <div className="admin-application-block">
          <span>Purchase Volume</span>
          <strong>{application.expectedPurchaseVolume}</strong>
        </div>
        <div className="admin-application-block">
          <span>Permit / Tax ID</span>
          <strong>{application.hasResellerPermitOrTaxId ? "Yes" : "No"}</strong>
        </div>
        <div className="admin-application-block admin-application-block-wide">
          <span>Uploaded Documents</span>
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
            <strong>{application.uploadedDocumentNames.join(", ") || "No files selected"}</strong>
          )}
        </div>
        {application.physicalStoreAddress ? (
          <div className="admin-application-block admin-application-block-wide">
            <span>Physical Store Address</span>
            <strong>{application.physicalStoreAddress}</strong>
          </div>
        ) : null}
        {application.onlineChannelNotes ? (
          <div className="admin-application-block admin-application-block-wide">
            <span>Channel Notes</span>
            <strong>{application.onlineChannelNotes}</strong>
          </div>
        ) : null}
      </div>

      {application.status === "DENIED" && application.deniedReason ? (
        <div className="admin-review-note admin-review-note-denied">
          <span>Denied Reason</span>
          <strong>{application.deniedReason}</strong>
        </div>
      ) : null}

      {application.status === "DENIED" && application.publicEditToken ? (
        <div className="admin-review-note">
          <span>Resubmission Link</span>
          <strong className="admin-link-wrap">
            {`${getFrontendBaseUrl()}/open-account?token=${application.publicEditToken}`}
          </strong>
        </div>
      ) : null}

      {application.reviewedAt ? (
        <div className="admin-review-meta">
          Reviewed {formatAdminDate(application.reviewedAt)}
          {application.reviewedByEmail ? ` by ${application.reviewedByEmail}` : ""}
        </div>
      ) : null}

      {application.status === "PENDING" ? (
        <div className="admin-review-actions">
          <form action={approveApplicationAction}>
            <input name="applicationId" type="hidden" value={application.id} />
            <button className="primary-button admin-approve-button" type="submit">
              Approve
            </button>
          </form>

          <form action={denyApplicationAction} className="admin-deny-form">
            <input name="applicationId" type="hidden" value={application.id} />
            <label className="open-account-field admin-deny-field">
              <span>Deny Reason</span>
              <textarea
                name="deniedReason"
                placeholder="Tell the applicant why this was denied."
                rows={3}
              />
            </label>
            <button className="admin-deny-button" type="submit">
              Deny Application
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const applications = await fetchAdminApplications();
  const pendingApplications = applications.filter((application) => application.status === "PENDING");
  const approvedApplications = applications.filter((application) => application.status === "APPROVED");
  const rejectedApplications = applications.filter((application) => application.status === "DENIED");
  const resolvedSearchParams = (await searchParams) ?? {};
  const error = Array.isArray(resolvedSearchParams.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams.error;
  const message = Array.isArray(resolvedSearchParams.message)
    ? resolvedSearchParams.message[0]
    : resolvedSearchParams.message;
  const requestedTab = Array.isArray(resolvedSearchParams.tab)
    ? resolvedSearchParams.tab[0]
    : resolvedSearchParams.tab;
  const activeTab: ApplicationTabKey = requestedTab === "approved" || requestedTab === "rejected"
    ? requestedTab
    : "pending";
  const activeApplications = activeTab === "approved"
    ? approvedApplications
    : activeTab === "rejected"
      ? rejectedApplications
      : pendingApplications;
  const activeTabConfig = applicationTabs.find((tab) => tab.key === activeTab) ?? applicationTabs[0];
  const tabCounts = {
    pending: pendingApplications.length,
    approved: approvedApplications.length,
    rejected: rejectedApplications.length,
  };

  return (
    <div className="admin-layout">

      {error === "missing-deny-reason" ? (
        <section className="panel status-banner status-banner-error">
          <strong>Deny reason required.</strong>
          <span>Please add a denial reason before denying an application.</span>
        </section>
      ) : null}

      {error === "review-failed" ? (
        <section className="panel status-banner status-banner-error">
          <strong>Review action failed.</strong>
          <span>Please try the action again. If it keeps failing, we should inspect the backend.</span>
        </section>
      ) : null}

      {error === "email-failed" ? (
        <section className="panel status-banner status-banner-error">
          <strong>Application updated, but the email failed.</strong>
          <span>{message || "The application status changed, but the notification email did not go out."}</span>
        </section>
      ) : null}

      <section className="admin-section">
        <div className="admin-section-head">
          <div>
            <h2>Application Queue</h2>
            <p>{activeApplications.length} applications in this view</p>
          </div>
          <div className="admin-tab-row" role="tablist" aria-label="Application status tabs">
            {applicationTabs.map((tab) => (
              <Link
                aria-selected={tab.key === activeTab}
                className={`admin-tab${tab.key === activeTab ? " is-active" : ""}`}
                href={`/admin/applications?tab=${tab.key}`}
                key={tab.key}
                role="tab"
              >
                <span>{tab.label}</span>
                <strong>{tab.getCount(tabCounts)}</strong>
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-card-stack">
          {activeApplications.length ? (
            activeApplications.map((application) => (
              <ApplicationCard application={application} key={application.id} />
            ))
          ) : (
            <section className="panel admin-empty-state">
              <strong>{activeTabConfig.emptyTitle}</strong>
              <span>{activeTabConfig.emptyCopy}</span>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
