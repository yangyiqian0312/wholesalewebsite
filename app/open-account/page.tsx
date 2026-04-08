import { redirect } from "next/navigation";
import { OpenAccountForm } from "../../components/open-account/application-form";
import { SiteHeader } from "../../components/shared/site-header";
import { getBackendBaseUrl } from "../../utils/backend-api";

type EditableApplication = {
  publicEditToken: string | null;
  contactName: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  companyAddress: string;
  city: string;
  stateProvince: string;
  zipPostalCode: string;
  country: string;
  website: string | null;
  storeMarketplaceLink: string | null;
  businessModel: string;
  salesChannels: string[];
  physicalStoreAddress: string | null;
  onlineChannelNotes: string | null;
  productInterests: string[];
  expectedPurchaseVolume: string;
  hasResellerPermitOrTaxId: boolean;
  uploadedDocumentNames: string[];
  deniedReason: string | null;
};

async function fetchEditableApplication(publicEditToken: string) {
  const response = await fetch(
    `${getBackendBaseUrl()}/api/account-applications/edit/${publicEditToken}`,
    {
      cache: "no-store",
    },
  );

  if (response.status === 404 || response.status === 400) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch editable application: ${response.status}`);
  }

  return (await response.json()) as EditableApplication;
}

export default async function OpenAccountPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const status = Array.isArray(resolvedSearchParams.status)
    ? resolvedSearchParams.status[0]
    : resolvedSearchParams.status;
  const message = Array.isArray(resolvedSearchParams.message)
    ? resolvedSearchParams.message[0]
    : resolvedSearchParams.message;
  const token = Array.isArray(resolvedSearchParams.token)
    ? resolvedSearchParams.token[0]
    : resolvedSearchParams.token;
  const editableApplication = token ? await fetchEditableApplication(token) : null;
  const isEditingDeniedApplication = Boolean(editableApplication);

  if (token && !editableApplication && !status) {
    redirect("/open-account?status=invalid-link");
  }

  return (
    <div className="page-shell">
      <SiteHeader activePath="/open-account" />

      <main className="page-layout open-account-layout">
        <section className="open-account-hero">
          <div>
            <p className="eyebrow">Open A Wholesale Account</p>
            <h1>
              {isEditingDeniedApplication
                ? "Update your application and resubmit for review"
                : "Apply for approved B2B purchasing access"}
            </h1>
            <p className="open-account-copy">
              {isEditingDeniedApplication
                ? "Your previous application was denied, but you can correct the details below and resubmit the same application for another review."
                : "Submit your company information, sales channels, product interests, and tax credentials. Approved accounts can then log in for pricing and wholesale ordering."}
            </p>
          </div>

          <div className="open-account-aside">
            <strong>Review Flow</strong>
            <span>1. Submit application</span>
            <span>2. Admin reviews documents and business details</span>
            <span>3. Application is approved or denied with notes</span>
          </div>
        </section>

        <OpenAccountForm
          backendBaseUrl={getBackendBaseUrl()}
          editableApplication={editableApplication}
          initialMessage={message}
          initialStatus={status}
        />
      </main>
    </div>
  );
}
