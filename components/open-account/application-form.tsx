"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
  salesChannels: string[];
  physicalStoreAddress: string | null;
  onlineChannelNotes: string | null;
  productInterests: string[];
  expectedPurchaseVolume: string;
  hasResellerPermitOrTaxId: boolean;
  uploadedDocumentNames: string[];
  deniedReason: string | null;
};

type ParsedShippingAddress = {
  addressee: string;
  streetAddress: string;
  city: string;
  stateProvince: string;
  zipPostalCode: string;
  country: string;
};

const interestOptions = [
  "Card Games",
  "CCG's",
  "Supplies",
  "Trading Cards",
  "Toys",
  "Other",
] as const;

const salesChannels = [
  "Wholesale/Distributor",
  "Brick & Mortar",
  "Conventions",
  "Retail Chain",
  "Flea Market",
  "Internet",
  "Other",
] as const;

const ownershipOptions = [
  "Corporation",
  "LLC",
  "Individual Owner",
  "Partnership",
] as const;

type FormState = {
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
  website: string;
  salesChannels: string[];
  shippingAddressee: string;
  shippingStreetAddress: string;
  shippingCity: string;
  shippingStateProvince: string;
  shippingZipPostalCode: string;
  shippingCountry: string;
  productInterests: string[];
  expectedPurchaseVolume: string;
  hasResellerPermitOrTaxId: string;
  uploadedDocumentNames: string[];
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function normalizeOptionalString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function mergeFiles(currentFiles: File[], nextFiles: File[]) {
  const fileMap = new Map<string, File>();

  for (const file of [...currentFiles, ...nextFiles]) {
    fileMap.set(`${file.name}-${file.size}-${file.lastModified}`, file);
  }

  return Array.from(fileMap.values());
}

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
  const [addressee = "", streetAddress = "", cityStateZip = "", country = ""] = lines;
  const cityStateZipMatch = cityStateZip.match(/^(.*?)(?:,\s*([A-Za-z .'-]+))?(?:\s+([A-Za-z0-9-]+))?$/);

  return {
    addressee,
    streetAddress,
    city: cityStateZipMatch?.[1]?.trim() ?? "",
    stateProvince: cityStateZipMatch?.[2]?.trim() ?? "",
    zipPostalCode: cityStateZipMatch?.[3]?.trim() ?? "",
    country,
  };
}

function buildShippingAddressValue(state: FormState) {
  return [
    state.shippingAddressee.trim(),
    state.shippingStreetAddress.trim(),
    [state.shippingCity.trim(), state.shippingStateProvince.trim()].filter(Boolean).join(", "),
    state.shippingZipPostalCode.trim(),
    state.shippingCountry.trim(),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildInitialState(defaults: EditableApplication | null | undefined): FormState {
  const shippingAddress = parseShippingAddress(defaults?.physicalStoreAddress);

  return {
    contactName: defaults?.contactName ?? "",
    email: defaults?.email ?? "",
    phone: defaults?.phone ?? "",
    businessName: defaults?.businessName ?? "",
    businessType: defaults?.businessType ?? "",
    companyAddress: defaults?.companyAddress ?? "",
    city: defaults?.city ?? "",
    stateProvince: defaults?.stateProvince ?? "",
    zipPostalCode: defaults?.zipPostalCode ?? "",
    country: defaults?.country ?? "",
    website: defaults?.website ?? "",
    salesChannels: defaults?.salesChannels ?? [],
    shippingAddressee: shippingAddress.addressee,
    shippingStreetAddress: shippingAddress.streetAddress,
    shippingCity: shippingAddress.city,
    shippingStateProvince: shippingAddress.stateProvince,
    shippingZipPostalCode: shippingAddress.zipPostalCode,
    shippingCountry: shippingAddress.country,
    productInterests: defaults?.productInterests ?? [],
    expectedPurchaseVolume: defaults?.expectedPurchaseVolume ?? "",
    hasResellerPermitOrTaxId: defaults?.hasResellerPermitOrTaxId ? "Yes" : "",
    uploadedDocumentNames: defaults?.uploadedDocumentNames ?? [],
  };
}

function validateForm(state: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!state.contactName.trim()) errors.contactName = "Contact Name is required.";
  if (!state.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!state.phone.trim()) errors.phone = "Phone is required.";
  if (!state.businessName.trim()) errors.businessName = "Business Name is required.";
  if (!state.businessType.trim()) errors.businessType = "Business Type is required.";
  if (!state.companyAddress.trim()) errors.companyAddress = "Company Address is required.";
  if (!state.city.trim()) errors.city = "City is required.";
  if (!state.stateProvince.trim()) errors.stateProvince = "State / Province is required.";
  if (!state.zipPostalCode.trim()) errors.zipPostalCode = "ZIP / Postal Code is required.";
  if (!state.country.trim()) errors.country = "Country is required.";
  if (!state.expectedPurchaseVolume.trim()) {
    errors.expectedPurchaseVolume = "Expected Purchase Volume is required.";
  }
  else if (!/^\d+$/.test(state.expectedPurchaseVolume.trim())) {
    errors.expectedPurchaseVolume = "Expected Purchase Volume must be a number.";
  }
  if (!state.hasResellerPermitOrTaxId.trim()) {
    errors.hasResellerPermitOrTaxId = "Please select Yes or No.";
  }

  return errors;
}

function LabelText({ label, required = false }: { label: string; required?: boolean }) {
  return (
    <>
      {label}
      {required ? <em className="field-required">*</em> : null}
    </>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel open-account-section">
      <div className="open-account-section-head">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="open-account-grid">{children}</div>
    </section>
  );
}

type TextFieldProps = {
  label: string;
  name: keyof FormState;
  placeholder: string;
  value: string;
  required?: boolean;
  type?: string;
  error?: string;
  onChange: (value: string) => void;
};

function TextField({
  label,
  name,
  placeholder,
  value,
  required = false,
  type = "text",
  error,
  onChange,
}: TextFieldProps) {
  return (
    <label className="open-account-field">
      <span>
        <LabelText label={label} required={required} />
      </span>
      <input
        aria-invalid={Boolean(error)}
        className={classNames(error && "field-input-error")}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? <small className="field-error-text">{error}</small> : null}
    </label>
  );
}

function CurrencyField({
  label,
  name,
  placeholder,
  value,
  required = false,
  error,
  onChange,
}: Omit<TextFieldProps, "type">) {
  return (
    <label className="open-account-field">
      <span>
        <LabelText label={label} required={required} />
      </span>
      <div className={classNames("field-with-prefix", error && "field-with-prefix-error")}>
        <span className="field-prefix" aria-hidden="true">$</span>
        <input
          aria-invalid={Boolean(error)}
          name={name}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
      </div>
      {error ? <small className="field-error-text">{error}</small> : null}
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  name: keyof FormState;
  options: readonly string[];
  value: string;
  required?: boolean;
  error?: string;
  onChange: (value: string) => void;
};

function SelectField({
  label,
  name,
  options,
  value,
  required = false,
  error,
  onChange,
}: SelectFieldProps) {
  return (
    <label className="open-account-field">
      <span>
        <LabelText label={label} required={required} />
      </span>
      <select
        aria-invalid={Boolean(error)}
        className={classNames(error && "field-input-error")}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <small className="field-error-text">{error}</small> : null}
    </label>
  );
}

function TextAreaField({
  label,
  name,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  name: keyof FormState;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="open-account-field open-account-field-full">
      <span>{label}</span>
      <textarea
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        value={value}
      />
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
    <label className="choice-pill">
      <input checked={checked} onChange={onToggle} type="checkbox" value={label} />
      <span>{label}</span>
    </label>
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

export function OpenAccountForm({
  editableApplication,
  initialStatus,
  initialMessage,
}: {
  editableApplication: EditableApplication | null;
  initialStatus?: string;
  initialMessage?: string;
}) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(() => buildInitialState(editableApplication));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(initialStatus === "error" ? initialMessage ?? null : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [shippingAddressSameAsCompany, setShippingAddressSameAsCompany] = useState(
    !editableApplication?.physicalStoreAddress?.trim(),
  );

  const isEditingDeniedApplication = Boolean(editableApplication);
  const isSuccessState = initialStatus === "submitted" || initialStatus === "resubmitted";
  const isInvalidLinkState = initialStatus === "invalid-link";

  const successBanner = useMemo(() => {
    if (initialStatus === "submitted") {
      return "Your application is now in the review queue.";
    }

    if (initialStatus === "resubmitted") {
      return "Your updated application is back in the review queue.";
    }

    return null;
  }, [initialStatus]);

  if (isSuccessState) {
    return (
      <section className="panel status-banner status-banner-success">
        <strong>{initialStatus === "resubmitted" ? "Application resubmitted." : "Application submitted."}</strong>
        <span>{successBanner}</span>
      </section>
    );
  }

  if (isInvalidLinkState) {
    return (
      <section className="panel status-banner status-banner-error">
        <strong>Application link is invalid.</strong>
        <span>This edit link is no longer available. Please contact support if you still need help.</span>
      </section>
    );
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));

    setFieldErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[key];
      return nextErrors;
    });

    setSubmitError(null);
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

    const nextErrors = validateForm(formState);

    if (!shippingAddressSameAsCompany) {
      if (!formState.shippingAddressee.trim()) {
        nextErrors.shippingAddressee = "Shipping Addressee is required.";
      }
      if (!formState.shippingStreetAddress.trim()) {
        nextErrors.shippingStreetAddress = "Street Address is required.";
      }
      if (!formState.shippingCity.trim()) {
        nextErrors.shippingCity = "City is required.";
      }
      if (!formState.shippingStateProvince.trim()) {
        nextErrors.shippingStateProvince = "State / Province is required.";
      }
      if (!formState.shippingZipPostalCode.trim()) {
        nextErrors.shippingZipPostalCode = "ZIP / Postal Code is required.";
      }
      if (!formState.shippingCountry.trim()) {
        nextErrors.shippingCountry = "Country is required.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setSubmitError("Please fix the highlighted fields before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      contactName: formState.contactName.trim(),
      email: formState.email.trim(),
      phone: formState.phone.trim(),
      businessName: formState.businessName.trim(),
      businessType: formState.businessType.trim(),
      companyAddress: formState.companyAddress.trim(),
      city: formState.city.trim(),
      stateProvince: formState.stateProvince.trim(),
      zipPostalCode: formState.zipPostalCode.trim(),
      country: formState.country.trim(),
      website: normalizeOptionalString(formState.website),
      salesChannels: formState.salesChannels,
      physicalStoreAddress: shippingAddressSameAsCompany
        ? undefined
        : normalizeOptionalString(buildShippingAddressValue(formState)),
      productInterests: formState.productInterests,
      expectedPurchaseVolume: formState.expectedPurchaseVolume.trim(),
      hasResellerPermitOrTaxId: formState.hasResellerPermitOrTaxId === "Yes",
      uploadedDocumentNames: formState.uploadedDocumentNames,
    };

    const requestUrl = editableApplication?.publicEditToken
      ? `/api/account-applications/edit/${editableApplication.publicEditToken}`
      : "/api/account-applications";
    const requestMethod = editableApplication?.publicEditToken ? "PUT" : "POST";

    try {
      const response = await fetch(requestUrl, selectedFiles.length > 0
        ? (() => {
            const formData = new FormData();
            formData.append("payload", JSON.stringify(payload));

            for (const file of selectedFiles) {
              formData.append("documents", file);
            }

            return {
              method: requestMethod,
              body: formData,
            };
          })()
        : {
            method: requestMethod,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

      if (!response.ok) {
        let errorMessage = "Submission failed. Please review your entries and try again.";

        try {
          const errorPayload = (await response.json()) as {
            error?: string;
            details?: {
              fieldErrors?: Record<string, string[] | undefined>;
            };
          };

          const backendFieldErrors = errorPayload.details?.fieldErrors ?? {};
          const nextBackendErrors: FieldErrors = {};

          for (const [key, messages] of Object.entries(backendFieldErrors)) {
            if (Array.isArray(messages) && messages.length > 0) {
              nextBackendErrors[key as keyof FormState] = messages[0];
            }
          }

          if (Object.keys(nextBackendErrors).length > 0) {
            setFieldErrors(nextBackendErrors);
          }

          const firstFieldError = Object.values(nextBackendErrors)[0];
          errorMessage = firstFieldError ?? errorPayload.error ?? errorMessage;
        } catch {
        }

        setSubmitError(errorMessage);
        return;
      }

      setSelectedFiles([]);

      router.push(
        editableApplication?.publicEditToken
          ? "/open-account?status=resubmitted"
          : "/open-account?status=submitted",
      );
      router.refresh();
    } catch {
      setSubmitError("Failed to reach the application service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="open-account-form" onSubmit={handleSubmit} noValidate>
      {isEditingDeniedApplication && editableApplication?.deniedReason ? (
        <section className="panel status-banner status-banner-error">
          <strong>Previous application denied.</strong>
          <span>{editableApplication.deniedReason}</span>
        </section>
      ) : null}

      {submitError ? (
        <section className="panel status-banner status-banner-error">
          <strong>Submission blocked.</strong>
          <span>{submitError}</span>
        </section>
      ) : null}

      <FormSection
        description="Main contact for account review, onboarding, and quote communication."
        title="Personal Information"
      >
        <TextField
          error={fieldErrors.contactName}
          label="Contact Name"
          name="contactName"
          onChange={(value) => updateField("contactName", value)}
          placeholder="Jane Smith"
          required
          value={formState.contactName}
        />
        <TextField
          error={fieldErrors.email}
          label="Email"
          name="email"
          onChange={(value) => updateField("email", value)}
          placeholder="buyer@yourstore.com"
          required
          type="email"
          value={formState.email}
        />
        <TextField
          error={fieldErrors.phone}
          label="Phone"
          name="phone"
          onChange={(value) => updateField("phone", value)}
          placeholder="(555) 555-0199"
          required
          value={formState.phone}
        />
      </FormSection>

      <FormSection
        description="Business identity, address, and public-facing business links."
        title="Company Information"
      >
        <TextField
          error={fieldErrors.businessName}
          label="Business Name"
          name="businessName"
          onChange={(value) => updateField("businessName", value)}
          placeholder="Your Store LLC"
          required
          value={formState.businessName}
        />
        <SelectField
          error={fieldErrors.businessType}
          label="Type of Ownership"
          name="businessType"
          onChange={(value) => updateField("businessType", value)}
          options={ownershipOptions}
          required
          value={formState.businessType}
        />
        <TextField
          error={fieldErrors.companyAddress}
          label="Company Address"
          name="companyAddress"
          onChange={(value) => updateField("companyAddress", value)}
          placeholder="123 Main Street"
          required
          value={formState.companyAddress}
        />
        <TextField
          error={fieldErrors.city}
          label="City"
          name="city"
          onChange={(value) => updateField("city", value)}
          placeholder="Los Angeles"
          required
          value={formState.city}
        />
        <TextField
          error={fieldErrors.stateProvince}
          label="State / Province"
          name="stateProvince"
          onChange={(value) => updateField("stateProvince", value)}
          placeholder="California"
          required
          value={formState.stateProvince}
        />
        <TextField
          error={fieldErrors.zipPostalCode}
          label="ZIP / Postal Code"
          name="zipPostalCode"
          onChange={(value) => updateField("zipPostalCode", value)}
          placeholder="90001"
          required
          value={formState.zipPostalCode}
        />
        <TextField
          error={fieldErrors.country}
          label="Country"
          name="country"
          onChange={(value) => updateField("country", value)}
          placeholder="United States"
          required
          value={formState.country}
        />
        <TextField
          label="Website"
          name="website"
          onChange={(value) => updateField("website", value)}
          placeholder="https://yourstore.com or crossingcards.com"
          value={formState.website}
        />
        <div className="open-account-field open-account-field-full">
          <span>Shipping Address</span>
          <CheckboxField
            checked={shippingAddressSameAsCompany}
            label="Shipping address is the same as company address"
            onChange={setShippingAddressSameAsCompany}
          />
        </div>
        {!shippingAddressSameAsCompany ? (
          <>
            <TextField
              error={fieldErrors.shippingAddressee}
              label="Shipping Addressee"
              name="shippingAddressee"
              onChange={(value) => updateField("shippingAddressee", value)}
              placeholder="Receiving contact or business name"
              required
              value={formState.shippingAddressee}
            />
            <TextField
              error={fieldErrors.shippingStreetAddress}
              label="Street Address"
              name="shippingStreetAddress"
              onChange={(value) => updateField("shippingStreetAddress", value)}
              placeholder="123 Shipping Street"
              required
              value={formState.shippingStreetAddress}
            />
            <TextField
              error={fieldErrors.shippingCity}
              label="City"
              name="shippingCity"
              onChange={(value) => updateField("shippingCity", value)}
              placeholder="Los Angeles"
              required
              value={formState.shippingCity}
            />
            <TextField
              error={fieldErrors.shippingStateProvince}
              label="State / Province"
              name="shippingStateProvince"
              onChange={(value) => updateField("shippingStateProvince", value)}
              placeholder="California"
              required
              value={formState.shippingStateProvince}
            />
            <TextField
              error={fieldErrors.shippingZipPostalCode}
              label="ZIP / Postal Code"
              name="shippingZipPostalCode"
              onChange={(value) => updateField("shippingZipPostalCode", value)}
              placeholder="90001"
              required
              value={formState.shippingZipPostalCode}
            />
            <TextField
              error={fieldErrors.shippingCountry}
              label="Country"
              name="shippingCountry"
              onChange={(value) => updateField("shippingCountry", value)}
              placeholder="United States"
              required
              value={formState.shippingCountry}
            />
          </>
        ) : null}
      </FormSection>

      <FormSection
        description="Business operations and assortment planning used during account review."
        title="Business Operations"
      >
        <label className="open-account-field open-account-field-full">
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

        <div className="open-account-field open-account-field-full">
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
        </div>

        <CurrencyField
          error={fieldErrors.expectedPurchaseVolume}
          label="Expected Purchase Volume Per Month"
          name="expectedPurchaseVolume"
          onChange={(value) => updateField("expectedPurchaseVolume", value.replace(/[^\d]/g, ""))}
          placeholder="1000"
          required
          value={formState.expectedPurchaseVolume}
        />
      </FormSection>

      <FormSection
        description="If you have a reseller permit or tax ID, provide the details and upload your document."
        title="Tax And Reseller Credentials"
      >
        <SelectField
          error={fieldErrors.hasResellerPermitOrTaxId}
          label="Reseller Permit / Tax ID"
          name="hasResellerPermitOrTaxId"
          onChange={(value) => updateField("hasResellerPermitOrTaxId", value)}
          options={["Yes", "No"]}
          required
          value={formState.hasResellerPermitOrTaxId}
        />

        <label className="open-account-field open-account-field-full">
          <span>Upload Reseller Permit / Tax Document</span>
          <div className="upload-dropzone">
            <strong>Add one or more files</strong>
            <small>
              Prototype behavior: file names are recorded for review.
              {formState.uploadedDocumentNames.length
                ? ` Previous files: ${formState.uploadedDocumentNames.join(", ")}`
                : ""}
            </small>
            <label className="upload-picker">
              <span className="upload-picker-plus" aria-hidden="true">+</span>
              <span>Add files</span>
              <input
                multiple
                onChange={(event) => {
                  const nextFiles = Array.from(event.target.files ?? []);
                  const mergedFiles = mergeFiles(selectedFiles, nextFiles);
                  setSelectedFiles(mergedFiles);
                  updateField("uploadedDocumentNames", mergedFiles.map((file) => file.name));
                  event.target.value = "";
                }}
                type="file"
              />
            </label>
            {formState.uploadedDocumentNames.length ? (
              <div className="upload-file-list">
                {formState.uploadedDocumentNames.map((fileName) => (
                  <span className="upload-file-chip" key={fileName}>
                    {fileName}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </label>
      </FormSection>

      <section className="panel open-account-submit">
        <div>
          <h2>Submit Application</h2>
          <p>
            By submitting you agree to our{" "}
            <Link href="/terms-of-sale">Terms of Sale</Link>.
          </p>
        </div>

        <div className="open-account-submit-actions">
          <Link className="text-button" href="/login">
            Already approved? Log in
          </Link>
          <button className="primary-button open-account-submit-button" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? "Submitting..."
              : isEditingDeniedApplication
                ? "Resubmit Application"
                : "Submit Application"}
          </button>
        </div>
      </section>
    </form>
  );
}
