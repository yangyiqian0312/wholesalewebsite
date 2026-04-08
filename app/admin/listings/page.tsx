import { fetchAdminListings } from "../_lib/admin-data";
import { updateListingAction } from "../_lib/listing-actions";

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
  const smart = smartParam?.trim() || "";
  const listings = await fetchAdminListings({ smart });

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
        <article className="panel admin-summary-card">
          <span>Total Listings</span>
          <strong>{listings.length}</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Active</span>
          <strong>{listings.filter((listing) => listing.isActive).length}</strong>
        </article>
        <article className="panel admin-summary-card">
          <span>Out of Stock</span>
          <strong>{listings.filter((listing) => Number(listing.totalQuantityOnHand) <= 0).length}</strong>
        </article>
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
            : "Search uses the same local catalog matching logic as the customer catalog."}
        </p>
      </section>

      <section className="admin-card-stack">
        {listings.slice(0, 24).map((listing) => (
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
    </div>
  );
}
