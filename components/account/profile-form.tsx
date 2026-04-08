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
  physicalStoreAddress: string | null;
  onlineChannelNotes: string | null;
  expectedPurchaseVolume: string;
  documents: Array<{
    id: string;
    originalFilename: string;
    createdAt: string;
  }>;
};

type ProfileFormProps = {
  profile: AccountProfile;
};

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

export function ProfileForm({ profile }: ProfileFormProps) {
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
    physicalStoreAddress: profile.physicalStoreAddress ?? "",
    onlineChannelNotes: profile.onlineChannelNotes ?? "",
    expectedPurchaseVolume: profile.expectedPurchaseVolume,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  function updateField<K extends keyof typeof formState>(key: K, value: (typeof formState)[K]) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("payload", JSON.stringify({ profile: formState }));

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
            <p>Core business information used on future orders.</p>
          </div>
          <div className="profile-grid">
            <Field label="Business Name" onChange={(value) => updateField("businessName", value)} value={formState.businessName} />
            <Field label="Business Type" onChange={(value) => updateField("businessType", value)} value={formState.businessType} />
            <Field label="Business Model" onChange={(value) => updateField("businessModel", value)} value={formState.businessModel} />
            <Field
              label="Expected Purchase Volume"
              onChange={(value) => updateField("expectedPurchaseVolume", value)}
              value={formState.expectedPurchaseVolume}
            />
            <Field label="Website" onChange={(value) => updateField("website", value)} value={formState.website} />
            <Field
              label="Marketplace / Store Link"
              onChange={(value) => updateField("storeMarketplaceLink", value)}
              value={formState.storeMarketplaceLink}
            />
          </div>
        </section>

        <section className="profile-section">
          <div className="profile-section-heading">
            <h2>Business Address</h2>
            <p>Main company address and store location.</p>
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
            <Field
              className="profile-field-full"
              label="Physical Store Address"
              onChange={(value) => updateField("physicalStoreAddress", value)}
              value={formState.physicalStoreAddress}
            />
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
