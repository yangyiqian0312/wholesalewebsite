"use client";

import { useState } from "react";

export type AccountProfile = {
  id: string;
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
  documents: Array<{
    id: string;
    originalFilename: string;
    createdAt: string;
  }>;
};

type ProfileFormProps = {
  profile: AccountProfile;
};

type ParsedShippingAddress = {
  addressee: string;
  streetAddress: string;
  city: string;
  stateProvince: string;
  zipPostalCode: string;
  country: string;
};

const salesChannels = [
  "Wholesale/Distributor",
  "Brick & Mortar",
  "Conventions",
  "Retail Chain",
  "Flea Market",
  "Internet",
  "Other",
] as const;

const interestOptions = [
  "Card Games",
  "CCG's",
  "Supplies",
  "Trading Cards",
  "Toys",
  "Other",
] as const;

function parseShippingAddress(value?: string | null): ParsedShippingAddress {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return {
      addressee: "",
      streetAddress: "",
      city: "",
      stateProvince: "",
      zipPostalCode: "",
      country: "",
    };
  }

  const lines = trimmedValue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const addressee = lines[0] ?? "";
  const streetAddress = lines[1] ?? "";
  const cityStateLine = lines[2] ?? "";
  const postalCode = lines[3] ?? "";
  const country = lines[4] ?? "";
  const cityStateMatch = cityStateLine.match(/^(.*?)(?:,\s*([A-Za-z .'-]+))?$/);

  return {
    addressee,
    streetAddress,
    city: cityStateMatch?.[1]?.trim() ?? "",
    stateProvince: cityStateMatch?.[2]?.trim() ?? "",
    zipPostalCode: postalCode,
    country,
  };
}

function buildShippingAddressValue(state: {
  shippingAddressee: string;
  shippingStreetAddress: string;
  shippingCity: string;
  shippingStateProvince: string;
  shippingZipPostalCode: string;
  shippingCountry: string;
}) {
  const cityState = [state.shippingCity.trim(), state.shippingStateProvince.trim()].filter(Boolean).join(", ");

  return [
    state.shippingAddressee.trim(),
    state.shippingStreetAddress.trim(),
    cityState,
    state.shippingZipPostalCode.trim(),
    state.shippingCountry.trim(),
  ]
    .filter(Boolean)
    .join("\n");
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
  textarea = false,
  hint,
  className,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  textarea?: boolean;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`profile-field${className ? ` ${className}` : ""}`}>
      <span>{label}</span>
      {textarea ? (
        <textarea
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          rows={4}
          value={value}
        />
      ) : (
        <input
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          type="text"
          value={value}
        />
      )}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function ChoicePill({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={checked ? "choice-pill choice-pill-active" : "choice-pill"}
      onClick={onToggle}
      type="button"
    >
      {label}
    </button>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="open-account-checkbox-field">
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const shippingAddress = parseShippingAddress(profile.physicalStoreAddress);
  const [formState, setFormState] = useState({
    contactName: profile.contactName,
    phone: profile.phone,
    businessName: profile.businessName,
    businessType: profile.businessType,
    companyAddress: profile.companyAddress,
    city: profile.city,
    stateProvince: profile.stateProvince,
    zipPostalCode: profile.zipPostalCode,
    country: profile.country,
    website: profile.website ?? "",
    storeMarketplaceLink: profile.storeMarketplaceLink ?? "",
    businessModel: profile.businessModel,
    salesChannels: profile.salesChannels,
    shippingAddressee: shippingAddress.addressee,
    shippingStreetAddress: shippingAddress.streetAddress,
    shippingCity: shippingAddress.city,
    shippingStateProvince: shippingAddress.stateProvince,
    shippingZipPostalCode: shippingAddress.zipPostalCode,
    shippingCountry: shippingAddress.country,
    onlineChannelNotes: profile.onlineChannelNotes ?? "",
    productInterests: profile.productInterests,
    expectedPurchaseVolume: profile.expectedPurchaseVolume,
    hasResellerPermitOrTaxId: profile.hasResellerPermitOrTaxId,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [shippingAddressSameAsCompany, setShippingAddressSameAsCompany] = useState(
    !profile.physicalStoreAddress?.trim(),
  );

  function updateField<K extends keyof typeof formState>(key: K, value: (typeof formState)[K]) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleArrayValue(key: "salesChannels" | "productInterests", value: string) {
    setFormState((current) => {
      const currentValues = current[key];
      return {
        ...current,
        [key]: currentValues.includes(value)
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value],
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("payload", JSON.stringify({
        profile: {
          contactName: formState.contactName.trim(),
          phone: formState.phone.trim(),
          businessName: formState.businessName.trim(),
          businessType: formState.businessType.trim(),
          companyAddress: formState.companyAddress.trim(),
          city: formState.city.trim(),
          stateProvince: formState.stateProvince.trim(),
          zipPostalCode: formState.zipPostalCode.trim(),
          country: formState.country.trim(),
          website: formState.website.trim(),
          storeMarketplaceLink: formState.storeMarketplaceLink.trim(),
          businessModel: formState.businessModel.trim(),
          salesChannels: formState.salesChannels,
          physicalStoreAddress: shippingAddressSameAsCompany ? "" : buildShippingAddressValue(formState),
          onlineChannelNotes: formState.onlineChannelNotes.trim(),
          productInterests: formState.productInterests,
          expectedPurchaseVolume: formState.expectedPurchaseVolume.trim(),
          hasResellerPermitOrTaxId: formState.hasResellerPermitOrTaxId,
        },
      }));

      for (const file of selectedFiles) {
        formData.append("documents", file);
      }

      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        body: formData,
      });

      const responsePayload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(responsePayload?.error ?? "Failed to save profile");
      }

      setSelectedFiles([]);
      setMessage(selectedFiles.length ? "Profile and documents updated." : "Profile updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="panel profile-panel" onSubmit={handleSubmit}>
      <div className="profile-toolbar">
        <div className="profile-header">
          <div>
            <p className="eyebrow">Account</p>
            <h1>Edit Profile</h1>
            <p className="profile-copy">Update the company and contact information used for your wholesale account.</p>
          </div>
        </div>
        <button className="primary-button profile-save-button" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {message ? <p className="profile-message">{message}</p> : null}

      <div className="profile-sections">
        <section className="profile-section">
          <div className="profile-section-heading">
            <h2>Personal Info</h2>
            <p>Your primary contact details. Email stays fixed to the approved account.</p>
          </div>
          <div className="profile-grid">
            <Field
              className="profile-field-full"
              disabled
              hint="Email is locked to your approved account."
              label="Email"
              value={profile.email}
            />
            <Field label="Full Name" onChange={(value) => updateField("contactName", value)} value={formState.contactName} />
            <Field label="Phone" onChange={(value) => updateField("phone", value)} value={formState.phone} />
          </div>
        </section>

        <section className="profile-section">
          <div className="profile-section-heading">
            <h2>Business Details</h2>
            <p>Core business information used on future orders and wholesale review.</p>
          </div>
          <div className="profile-grid">
            <Field label="Business Name" onChange={(value) => updateField("businessName", value)} value={formState.businessName} />
            <Field label="Type of Ownership" onChange={(value) => updateField("businessType", value)} value={formState.businessType} />
            <Field label="Business Model" onChange={(value) => updateField("businessModel", value)} value={formState.businessModel} />
            <Field
              label="Expected Purchase Volume"
              onChange={(value) => updateField("expectedPurchaseVolume", value)}
              value={formState.expectedPurchaseVolume}
            />
            <Field label="Website" onChange={(value) => updateField("website", value)} value={formState.website} />
            <Field
              label="Store / Marketplace Link"
              onChange={(value) => updateField("storeMarketplaceLink", value)}
              value={formState.storeMarketplaceLink}
            />
          </div>
        </section>

        <section className="profile-section">
          <div className="profile-section-heading">
            <h2>Business Address</h2>
            <p>Main company address and shipping destination used on future orders.</p>
          </div>
          <div className="profile-grid">
            <Field
              className="profile-field-full"
              label="Company Address"
              onChange={(value) => updateField("companyAddress", value)}
              value={formState.companyAddress}
            />
            <Field label="City" onChange={(value) => updateField("city", value)} value={formState.city} />
            <Field label="State / Province" onChange={(value) => updateField("stateProvince", value)} value={formState.stateProvince} />
            <Field label="ZIP / Postal Code" onChange={(value) => updateField("zipPostalCode", value)} value={formState.zipPostalCode} />
            <Field label="Country" onChange={(value) => updateField("country", value)} value={formState.country} />

            <div className="profile-field profile-field-full">
              <span>Shipping Address</span>
              <CheckboxField
                checked={shippingAddressSameAsCompany}
                label="Shipping address is the same as company address"
                onChange={setShippingAddressSameAsCompany}
              />
            </div>

            {!shippingAddressSameAsCompany ? (
              <>
                <Field
                  label="Shipping Addressee"
                  onChange={(value) => updateField("shippingAddressee", value)}
                  value={formState.shippingAddressee}
                />
                <Field
                  label="Street Address"
                  onChange={(value) => updateField("shippingStreetAddress", value)}
                  value={formState.shippingStreetAddress}
                />
                <Field label="City" onChange={(value) => updateField("shippingCity", value)} value={formState.shippingCity} />
                <Field
                  label="State / Province"
                  onChange={(value) => updateField("shippingStateProvince", value)}
                  value={formState.shippingStateProvince}
                />
                <Field
                  label="ZIP / Postal Code"
                  onChange={(value) => updateField("shippingZipPostalCode", value)}
                  value={formState.shippingZipPostalCode}
                />
                <Field
                  label="Country"
                  onChange={(value) => updateField("shippingCountry", value)}
                  value={formState.shippingCountry}
                />
              </>
            ) : null}
          </div>
        </section>

        <section className="profile-section">
          <div className="profile-section-heading">
            <h2>Business Operations</h2>
            <p>Sales channels, product interests, and tax / reseller information.</p>
          </div>
          <div className="profile-grid">
            <label className="profile-field profile-field-full">
              <span>Sales Channels</span>
              <div className="open-account-check-grid">
                {salesChannels.map((channel) => (
                  <ChoicePill
                    checked={formState.salesChannels.includes(channel)}
                    key={channel}
                    label={channel}
                    onToggle={() => toggleArrayValue("salesChannels", channel)}
                  />
                ))}
              </div>
            </label>

            <label className="profile-field profile-field-full">
              <span>Product Interests</span>
              <div className="open-account-interest-grid">
                {interestOptions.map((interest) => (
                  <ChoicePill
                    checked={formState.productInterests.includes(interest)}
                    key={interest}
                    label={interest}
                    onToggle={() => toggleArrayValue("productInterests", interest)}
                  />
                ))}
              </div>
            </label>

            <div className="profile-field profile-field-full">
              <span>Reseller Permit / Tax ID</span>
              <div className="open-account-check-grid">
                <ChoicePill
                  checked={formState.hasResellerPermitOrTaxId}
                  label="Yes"
                  onToggle={() => updateField("hasResellerPermitOrTaxId", true)}
                />
                <ChoicePill
                  checked={!formState.hasResellerPermitOrTaxId}
                  label="No"
                  onToggle={() => updateField("hasResellerPermitOrTaxId", false)}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="profile-section">
          <div className="profile-section-heading">
            <h2>Online Notes</h2>
            <p>Optional selling channel context.</p>
          </div>
          <div className="profile-grid">
            <Field
              className="profile-field-full"
              label="Online Channel Notes"
              onChange={(value) => updateField("onlineChannelNotes", value)}
              textarea
              value={formState.onlineChannelNotes}
            />
          </div>
        </section>

        <section className="profile-section">
          <div className="profile-section-heading">
            <h2>Submitted Documents</h2>
            <p>Review the files from your original application or upload replacements if needed.</p>
          </div>

          <div className="profile-documents">
            <div className="profile-document-list">
              {profile.documents.length ? profile.documents.map((document) => (
                <a
                  className="profile-document-link"
                  href={`/api/account/profile/documents/${document.id}`}
                  key={document.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  <strong>{document.originalFilename}</strong>
                  <span>Submitted document</span>
                </a>
              )) : (
                <div className="profile-document-empty">No documents were uploaded with the original application.</div>
              )}
            </div>

            <label className="profile-upload-field">
              <span>Upload New Documents</span>
              <input
                multiple
                onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
                type="file"
              />
              <small>
                Uploading new files will replace the current submitted documents. You can leave this empty if nothing needs to change.
              </small>
            </label>

            {selectedFiles.length ? (
              <div className="profile-upload-list">
                {selectedFiles.map((file) => (
                  <span className="profile-upload-chip" key={`${file.name}-${file.size}`}>
                    {file.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </form>
  );
}
