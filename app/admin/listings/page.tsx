import ListingsBulkControls from "../../../components/admin/listings-bulk-controls";
import ListingDescriptionEditor from "../../../components/admin/listing-description-editor";
import ListingSaveButton from "../../../components/admin/listing-save-button";
import ListingsSyncButton from "../../../components/admin/listings-sync-button";
import ListingsPageSizeSelect from "../../../components/admin/listings-page-size-select";
import { PageBreadcrumbs } from "../../../components/shared/page-breadcrumbs";
import { fetchAdminListings } from "../_lib/admin-data";
import { updateListingAction } from "../_lib/listing-actions";

function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

function isPaginationNumber(value: number | string): value is number {
  return typeof value === "number";
}

function formatSyncTimestamp(value?: string | null) {
  if (!value) {
    return "Not synced yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatReleaseDateValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const trimmedValue = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  const usMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (usMatch) {
    return `${usMatch[3]}-${usMatch[1].padStart(2, "0")}-${usMatch[2].padStart(2, "0")}`;
  }

  const parsedDate = new Date(trimmedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().slice(0, 10);
}

function buildListingImageUrl(listing: {
  imageSmallUrl?: string;
  defaultImage?: {
    mediumUrl?: string;
    smallUrl?: string;
    thumbUrl?: string;
    largeUrl?: string;
    originalUrl?: string;
  };
}) {
  return (
    listing.defaultImage?.mediumUrl ||
    listing.defaultImage?.smallUrl ||
    listing.defaultImage?.thumbUrl ||
    listing.defaultImage?.largeUrl ||
    listing.defaultImage?.originalUrl ||
    listing.imageSmallUrl ||
    undefined
  );
}

function buildListingImageLabel(name: string) {
  return (
    name
      .replace(/[^A-Za-z0-9 ]/g, " ")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join(" ")
      .toUpperCase() || "PRODUCT"
  );
}

function resolvePageSize(value?: string) {
  const parsedValue = Number(value || "20");
  return parsedValue === 50 || parsedValue === 100 ? parsedValue : 20;
}

function formatPriceLabel(value?: string) {
  if (!value) {
    return "N/A";
  }

  const amount = Number(value);
  return Number.isNaN(amount) ? value : `$${amount.toFixed(2)}`;
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const error = Array.isArray(resolvedSearchParams.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams.error;
  const status = Array.isArray(resolvedSearchParams.status)
    ? resolvedSearchParams.status[0]
    : resolvedSearchParams.status;
  const smartParam = Array.isArray(resolvedSearchParams.smart)
    ? resolvedSearchParams.smart[0]
    : resolvedSearchParams.smart;
  const pageParam = Array.isArray(resolvedSearchParams.page)
    ? resolvedSearchParams.page[0]
    : resolvedSearchParams.page;
  const pageSizeParam = Array.isArray(resolvedSearchParams.pageSize)
    ? resolvedSearchParams.pageSize[0]
    : resolvedSearchParams.pageSize;
  const listingStatusParam = Array.isArray(resolvedSearchParams.statusFilter)
    ? resolvedSearchParams.statusFilter[0]
    : resolvedSearchParams.statusFilter;
  const smart = smartParam?.trim() || "";
  const page = Math.max(1, Number(pageParam || "1") || 1);
  const pageSize = resolvePageSize(pageSizeParam);
  const listingStatus =
    listingStatusParam === "active" || listingStatusParam === "oos"
      ? listingStatusParam
      : undefined;
  const listingsResponse = await fetchAdminListings({ smart, listingStatus, page, pageSize });
  const listings = listingsResponse.items;

  function buildListingsHref({
    nextStatus,
    nextPage,
    nextPageSize,
  }: {
    nextStatus?: "active" | "oos";
    nextPage?: number;
    nextPageSize?: number;
  } = {}) {
    const query = new URLSearchParams();

    if (smart) {
      query.set("smart", smart);
    }

    if (nextStatus) {
      query.set("statusFilter", nextStatus);
    }

    const resolvedPageSize = nextPageSize ?? pageSize;

    if (resolvedPageSize !== 20) {
      query.set("pageSize", String(resolvedPageSize));
    }

    if (nextPage && nextPage > 1) {
      query.set("page", String(nextPage));
    }

    const queryString = query.toString();
    return queryString ? `/admin/listings?${queryString}` : "/admin/listings";
  }

  const paginationItems = buildPaginationItems(
    listingsResponse.pagination.page,
    listingsResponse.pagination.totalPages,
  );
  const visibleStart =
    listingsResponse.pagination.totalItems === 0
      ? 0
      : (listingsResponse.pagination.page - 1) * listingsResponse.pagination.pageSize + 1;
  const visibleEnd = Math.min(
    listingsResponse.pagination.page * listingsResponse.pagination.pageSize,
    listingsResponse.pagination.totalItems,
  );

  return (
    <div className="admin-layout">
      <PageBreadcrumbs items={[{ href: "/admin", label: "Admin" }, { label: "Listings" }]} />
      {status === "updated" ? (
        <section className="panel status-banner status-banner-success">
          <strong>Listing updated.</strong>
          <span>The local catalog record has been saved.</span>
        </section>
      ) : null}

      {error === "update-failed" ? (
        <section className="panel status-banner status-banner-error">
          <strong>Listing update failed.</strong>
          <span>Please try again. If it keeps failing, we should inspect the backend route.</span>
        </section>
      ) : null}

      <section className="admin-section-head admin-listings-summary-head">
        <div>
          <h2>Listing Overview</h2>
          <p className="admin-listings-sync-note">
            Last synced at {formatSyncTimestamp(listingsResponse.summary.latestSyncedAt)}
          </p>
        </div>
        <div className="admin-tab-row admin-listings-summary-tabs">
          <a
            className={`admin-tab admin-listings-summary-tab${!listingStatus ? " is-active" : ""}`}
            href={buildListingsHref()}
          >
            <span>Total</span>
            <strong>{listingsResponse.summary.totalListings}</strong>
          </a>
          <a
            className={`admin-tab admin-listings-summary-tab${listingStatus === "active" ? " is-active" : ""}`}
            href={buildListingsHref({ nextStatus: "active" })}
          >
            <span>Active</span>
            <strong>{listingsResponse.summary.activeListings}</strong>
          </a>
          <a
            className={`admin-tab admin-listings-summary-tab${listingStatus === "oos" ? " is-active" : ""}`}
            href={buildListingsHref({ nextStatus: "oos" })}
          >
            <span>OOS</span>
            <strong>{listingsResponse.summary.outOfStockListings}</strong>
          </a>
        </div>
      </section>

      <section className="admin-listings-search-shell">
        <form action="/admin/listings" className="admin-listings-search" method="get">
          <input name="statusFilter" type="hidden" value={listingStatus ?? ""} />
          <input name="pageSize" type="hidden" value={String(pageSize)} />
          <label className="admin-listings-search-field">
            <input
              defaultValue={smart}
              name="smart"
              placeholder="Search by name, SKU, UPC, or barcode"
              type="search"
            />
          </label>
          <button aria-label="Search listings" className="admin-listings-search-button" type="submit">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M13.2 13.2 17 17"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </form>
      </section>

      <form action={updateListingAction} className="admin-card-stack">
        <input name="smart" type="hidden" value={smart} />
        <input name="statusFilter" type="hidden" value={listingStatus ?? ""} />
        <input name="page" type="hidden" value={String(listingsResponse.pagination.page)} />
        <input name="pageSize" type="hidden" value={String(pageSize)} />

        <section className="admin-listings-toolbar">
          <ListingsBulkControls />
        </section>

        {listings.map((listing, index) => (
          <details
            className="panel admin-listing-card"
            data-product-id={listing.productId}
            key={listing.productId}
            open={index === 0}
          >
            <input name="productIds" type="hidden" value={listing.productId} />
            <summary className="admin-listing-summary">
              <div className="admin-listing-title-group">
                <div className="admin-listing-thumb">
                  {buildListingImageUrl(listing) ? (
                    <img
                      alt={listing.name}
                      className="admin-listing-thumb-image"
                      src={buildListingImageUrl(listing)}
                    />
                  ) : (
                    <span className="admin-listing-thumb-fallback">
                      {buildListingImageLabel(listing.name)}
                    </span>
                  )}
                </div>
                <div className="admin-listing-summary-copy">
                  <h2>{listing.name}</h2>
                  <div className="admin-listing-meta-row">
                    <p className="admin-application-contact">
                      SKU: {listing.sku || "N/A"} | UPC: {listing.upc || listing.barcode || "N/A"}
                    </p>
                    <span className="admin-listing-stock-pill">On hand: {listing.totalQuantityOnHand}</span>
                    <span className="admin-listing-expand-hint">Open details</span>
                  </div>
                </div>
              </div>
              <span className={`status-tag ${listing.isActive ? "status-success" : "status-danger"}`}>
                {listing.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </summary>

            <div className="admin-listing-panel">
              <div className="admin-listing-details-grid">
                <label className="admin-listing-input-field admin-listing-name-field">
                  <span>Name</span>
                  <input defaultValue={listing.name} name={`name:${listing.productId}`} />
                </label>

                <div className="admin-listing-static-field admin-listing-readonly-field">
                  <span>SKU</span>
                  <strong>{listing.sku || "N/A"}</strong>
                </div>

                <div className="admin-listing-static-field admin-listing-readonly-field">
                  <span>UPC</span>
                  <strong>{listing.upc || listing.barcode || "N/A"}</strong>
                </div>

                <label className="admin-listing-input-field admin-listing-date-field">
                  <span>Release Date</span>
                  <input
                    defaultValue={formatReleaseDateValue(listing.lastModifiedDateTime)}
                    name={`releaseDate:${listing.productId}`}
                    type="date"
                  />
                </label>

                <div className="admin-listing-inline-value-field admin-listing-market-price-field admin-listing-readonly-field">
                  <span>Market Price</span>
                  <strong>{formatPriceLabel(listing.marketPrice)}</strong>
                </div>

                <label className="admin-listing-input-field admin-listing-price-field">
                  <span>Your Price</span>
                  <input
                    defaultValue={listing.defaultPrice?.unitPrice ?? ""}
                    inputMode="decimal"
                    name={`unitPrice:${listing.productId}`}
                    placeholder="0.00"
                  />
                </label>
              </div>

              <div className="admin-listing-description-field">
                <div className="admin-listing-description-header">
                  <div>
                    <span>Description</span>
                    <p>Rich product notes for the local catalog. Add copy, lists, links, or image embeds.</p>
                  </div>
                </div>
                <ListingDescriptionEditor
                  initialValue={listing.description}
                  name={`description:${listing.productId}`}
                />
              </div>

              <div className="admin-listing-inline-actions">
                <label className="admin-toggle-field admin-listing-toggle-field">
                  <input
                    defaultChecked={listing.isActive}
                    name={`isActive:${listing.productId}`}
                    type="checkbox"
                  />
                  <span>Listing is active in local catalog</span>
                </label>
                <ListingSaveButton productId={listing.productId} />
              </div>
            </div>
          </details>
        ))}
      </form>

      <section className="panel table-panel">
        <div className="pagination">
          <div className="admin-listings-pagination-start">
            <div className="results-meta">
              {visibleStart}-{visibleEnd} of {listingsResponse.pagination.totalItems} items
            </div>
            <ListingsSyncButton />
          </div>
          <div className="admin-listings-pagination-tools">
            <form action="/admin/listings" className="admin-listings-page-size-form" method="get">
              <input name="smart" type="hidden" value={smart} />
              <input name="statusFilter" type="hidden" value={listingStatus ?? ""} />
              <label className="admin-listings-page-size-label">
                <span>Show</span>
                <ListingsPageSizeSelect defaultValue={pageSize} />
                <span>per page</span>
              </label>
            </form>
            <div className="pagination-controls">
              {listingsResponse.pagination.page > 1 ? (
                <a
                  className="page-button"
                  href={buildListingsHref({
                    nextStatus: listingStatus,
                    nextPage: listingsResponse.pagination.page - 1,
                  })}
                  aria-label="Previous page"
                >
                  &lsaquo;
                </a>
              ) : (
                <span className="page-button disabled" aria-hidden="true">
                  &lsaquo;
                </span>
              )}
              {paginationItems.map((paginationPage, index) =>
                !isPaginationNumber(paginationPage) ? (
                  <span className="page-button page-button-ellipsis disabled" key={`ellipsis-${index}`}>
                    ...
                  </span>
                ) : (
                  <a
                    className={
                      paginationPage === listingsResponse.pagination.page
                        ? "page-button active"
                        : "page-button"
                    }
                    href={buildListingsHref({
                      nextStatus: listingStatus,
                      nextPage: paginationPage,
                    })}
                    key={paginationPage}
                  >
                    {paginationPage}
                  </a>
                ),
              )}
              {listingsResponse.pagination.page < listingsResponse.pagination.totalPages ? (
                <a
                  className="page-button"
                  href={buildListingsHref({
                    nextStatus: listingStatus,
                    nextPage: listingsResponse.pagination.page + 1,
                  })}
                  aria-label="Next page"
                >
                  &rsaquo;
                </a>
              ) : (
                <span className="page-button disabled" aria-hidden="true">
                  &rsaquo;
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
