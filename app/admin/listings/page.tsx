import { fetchAdminListings } from "../_lib/admin-data";
import { updateListingAction } from "../_lib/listing-actions";

function buildPaginationItems(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
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
  const listingStatusParam = Array.isArray(resolvedSearchParams.statusFilter)
    ? resolvedSearchParams.statusFilter[0]
    : resolvedSearchParams.statusFilter;
  const smart = smartParam?.trim() || "";
  const page = Math.max(1, Number(pageParam || "1") || 1);
  const listingStatus =
    listingStatusParam === "active" || listingStatusParam === "oos"
      ? listingStatusParam
      : undefined;
  const listingsResponse = await fetchAdminListings({ smart, listingStatus, page });
  const listings = listingsResponse.items;

  function buildListingsHref({
    nextStatus,
    nextPage,
  }: {
    nextStatus?: "active" | "oos";
    nextPage?: number;
  } = {}) {
    const query = new URLSearchParams();

    if (smart) {
      query.set("smart", smart);
    }

    if (nextStatus) {
      query.set("statusFilter", nextStatus);
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
      <section className="admin-hero panel">
        <div>
          <p className="admin-hero-kicker">Listings</p>
          <h1>Manage local catalog listings</h1>
          <p className="admin-hero-copy">
            This section edits the local catalog only. It does not write back to Inflow. Use it
            for operational adjustments such as local title cleanup, pricing, release date, and
            visibility.
          </p>
        </div>
      </section>

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

      <section className="admin-summary-grid">
        <a
          className={`panel admin-summary-card admin-summary-link${!listingStatus ? " is-active" : ""}`}
          href={buildListingsHref()}
        >
          <span>Total Listings</span>
          <strong>{listingsResponse.summary.totalListings}</strong>
        </a>
        <a
          className={`panel admin-summary-card admin-summary-link${listingStatus === "active" ? " is-active" : ""}`}
          href={buildListingsHref({ nextStatus: "active" })}
        >
          <span>Active</span>
          <strong>{listingsResponse.summary.activeListings}</strong>
        </a>
        <a
          className={`panel admin-summary-card admin-summary-link${listingStatus === "oos" ? " is-active" : ""}`}
          href={buildListingsHref({ nextStatus: "oos" })}
        >
          <span>Out of Stock</span>
          <strong>{listingsResponse.summary.outOfStockListings}</strong>
        </a>
      </section>

      <section className="panel admin-listings-search-panel">
        <form action="/admin/listings" className="admin-listings-search" method="get">
          <label className="open-account-field admin-listings-search-field">
            <span>Search Listings</span>
            <input
              defaultValue={smart}
              name="smart"
              placeholder="Search by name, SKU, UPC, or barcode"
              type="search"
            />
          </label>
          <button className="primary-button" type="submit">
            Search
          </button>
          {smart ? (
            <a className="text-button admin-listings-clear" href="/admin/listings">
              Clear
            </a>
          ) : null}
        </form>
        <p className="panel-subtitle">
          {smart
            ? `Showing ${listings.length} listing${listings.length === 1 ? "" : "s"} for "${smart}".`
            : listingStatus === "active"
              ? `Showing ${visibleStart}-${visibleEnd} of ${listingsResponse.summary.activeListings} active listing${listingsResponse.summary.activeListings === 1 ? "" : "s"}.`
              : listingStatus === "oos"
                ? `Showing ${visibleStart}-${visibleEnd} of ${listingsResponse.summary.outOfStockListings} out-of-stock listing${listingsResponse.summary.outOfStockListings === 1 ? "" : "s"}.`
                : `Showing ${visibleStart}-${visibleEnd} of ${listingsResponse.summary.totalListings} listings.`}
        </p>
      </section>

      <section className="admin-card-stack">
        {listings.map((listing) => (
          <article className="panel admin-listing-card" key={listing.productId}>
            <div className="admin-listing-head">
              <div>
                <h2>{listing.name}</h2>
                <p className="admin-application-contact">
                  SKU: {listing.sku || "N/A"} | UPC: {listing.upc || listing.barcode || "N/A"} |
                  On hand: {listing.totalQuantityOnHand}
                </p>
              </div>
              <span className={`status-tag ${listing.isActive ? "status-success" : "status-danger"}`}>
                {listing.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>

            <form action={updateListingAction} className="admin-listing-form">
              <input name="productId" type="hidden" value={listing.productId} />
              <input name="smart" type="hidden" value={smart} />

              <label className="open-account-field">
                <span>Name</span>
                <input defaultValue={listing.name} name="name" />
              </label>

              <label className="open-account-field">
                <span>Your Price</span>
                <input
                  defaultValue={listing.defaultPrice?.unitPrice ?? ""}
                  inputMode="decimal"
                  name="unitPrice"
                  placeholder="0.00"
                />
              </label>

              <label className="open-account-field">
                <span>Release Date</span>
                <input
                  defaultValue={listing.lastModifiedDateTime ?? ""}
                  name="releaseDate"
                  placeholder="YYYY-MM-DD or source label"
                />
              </label>

              <label className="admin-toggle-field">
                <input defaultChecked={listing.isActive} name="isActive" type="checkbox" />
                <span>Listing is active in local catalog</span>
              </label>

              <button className="primary-button" type="submit">
                Save Listing
              </button>
            </form>
          </article>
        ))}
      </section>

      <section className="panel table-panel">
        <div className="pagination">
          <div className="results-meta">
            {visibleStart}-{visibleEnd} of {listingsResponse.pagination.totalItems} items
          </div>
          <div className="pagination-controls">
            {listingsResponse.pagination.page > 1 ? (
              <a
                className="page-button"
                href={buildListingsHref({
                  nextStatus: listingStatus,
                  nextPage: listingsResponse.pagination.page - 1,
                })}
              >
                Prev
              </a>
            ) : (
              <span className="page-button disabled">Prev</span>
            )}
            {paginationItems.map((paginationPage) => (
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
            ))}
            {listingsResponse.pagination.page < listingsResponse.pagination.totalPages ? (
              <a
                className="page-button"
                href={buildListingsHref({
                  nextStatus: listingStatus,
                  nextPage: listingsResponse.pagination.page + 1,
                })}
              >
                Next
              </a>
            ) : (
              <span className="page-button disabled">Next</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
