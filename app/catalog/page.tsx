import Link from "next/link";
import type { ReactNode } from "react";
import { statusToneMap } from "../../components/catalog/catalog-data";
import {
  getCatalogCategoryOptions,
  getCatalogProducts,
} from "../../components/catalog/catalog-api";
import type {
  CatalogCategoryOption,
  CatalogPagination,
  CatalogProductRow,
} from "../../components/catalog/catalog-types";
import { AddToCartControl } from "../../components/cart/add-to-cart-control";
import { SiteHeader } from "../../components/shared/site-header";
import { createClient } from "../../utils/supabase/server";
import {
  getCatalogCategoryRule,
  isCatalogCategoryValue,
  type CatalogCategoryValue,
} from "../../utils/catalog-categories";

type Product = CatalogProductRow;
type ProductStatus = Product["tags"][number];

function FilterPanel({
  categoryOptions,
  selectedCategory,
  searchTerm,
}: {
  categoryOptions: readonly CatalogCategoryOption[];
  selectedCategory?: CatalogCategoryValue;
  searchTerm?: string;
}) {
  const selectedRule = selectedCategory ? getCatalogCategoryRule(selectedCategory) : null;

  function buildCatalogHref(category?: string) {
    const query = new URLSearchParams();

    if (category) {
      query.set("category", category);
    }

    if (searchTerm) {
      query.set("smart", searchTerm);
    }

    const queryString = query.toString();
    return queryString ? `/catalog?${queryString}` : "/catalog";
  }

  return (
    <aside className="panel filters">
      <div className="panel-header">
        <h2>Filters</h2>
        {selectedCategory || searchTerm ? (
          <Link className="text-button" href={buildCatalogHref()}>
            Clear All
          </Link>
        ) : null}
      </div>

      <section className="filter-group">
        <h3>Category</h3>
        <div className="checklist">
          {categoryOptions.map((option) => {
            const isSelected = option.value === selectedCategory;

            return (
              <Link
                className={isSelected ? "filter-option-link filter-option-link-active" : "filter-option-link"}
                href={isSelected ? buildCatalogHref() : buildCatalogHref(option.value)}
                key={option.value}
              >
                <span>{option.label}</span>
                <small>({option.count})</small>
              </Link>
            );
          })}
        </div>
      </section>

      {selectedRule ? (
        <section className="filter-group">
          <h3>Current Filter</h3>
          <div className="chip-row">
            <span className="filter-chip">{selectedRule.label}</span>
          </div>
        </section>
      ) : null}
    </aside>
  );
}

function StatusTag({ status }: { status: ProductStatus }) {
  return <span className={`status-tag ${statusToneMap[status]}`}>{status}</span>;
}

function maybeWrapWithLink(
  productPath: string | undefined,
  className: string,
  content: ReactNode,
) {
  if (!productPath) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link className={className} href={productPath}>
      {content}
    </Link>
  );
}

function renderPriceCell(product: Product, canSeePrice: boolean) {
  if (canSeePrice) {
    return maybeWrapWithLink(
      product.productPath,
      "row-link row-link-stack",
      <div className="catalog-price-stack">
        {product.originalPrice !== "N/A" ? (
          <div className="value-compare">{product.originalPrice}</div>
        ) : null}
        <div className="value-main">{product.wholesale}</div>
      </div>,
    );
  }

  return (
    <Link className="row-link row-link-stack price-login-link" href="/login">
      <div className="value-main">Log in to see price</div>
    </Link>
  );
}

function ProductRow({
  product,
  canSeePrice,
}: {
  product: Product;
  canSeePrice: boolean;
}) {
  return (
    <tr className="catalog-row">
      <td className="catalog-cell catalog-cell-image" data-label="Image">
        {maybeWrapWithLink(
          product.productPath,
          "row-link product-cell",
          <div className="product-thumb">
            {product.imageUrl ? (
              <img alt={product.name} className="product-thumb-image" src={product.imageUrl} />
            ) : (
              <span className="product-thumb-fallback">{product.imageLabel}</span>
            )}
          </div>,
        )}
      </td>
      <td className="catalog-cell catalog-cell-upc mono-cell" data-label="UPC">
        {maybeWrapWithLink(product.productPath, "row-link row-link-text", product.upc)}
      </td>
      <td className="catalog-cell catalog-cell-name" data-label="Name">
        {maybeWrapWithLink(
          product.productPath,
          "row-link row-link-stack",
          <>
          <div className="product-title">{product.name}</div>
          <div className="tag-row">
            {product.tags.map((tag) => (
              <StatusTag key={tag} status={tag} />
            ))}
          </div>
          </>,
        )}
      </td>
      <td className="catalog-cell catalog-cell-price" data-label="Your Price">
        {renderPriceCell(product, canSeePrice)}
      </td>
      <td className="catalog-cell catalog-cell-qty" data-label="Quantity">
        <AddToCartControl
          buttonClassName="primary-button cart-add-button"
          className="cart-cell"
          controlClassName="cart-control-compact"
          inputClassName="qty-input"
          product={{
            code: product.code,
            imageLabel: product.imageLabel,
            imageUrl: product.imageUrl,
            name: product.name,
            originalPrice: product.originalPrice !== "N/A" ? product.originalPrice : undefined,
            productPath: product.productPath,
            sku: product.sku,
            upc: product.upc,
            wholesale: product.wholesale,
          }}
          showFeedback={false}
        />
      </td>
      <td className="catalog-cell catalog-cell-release value-main" data-label="Release Date">
        {maybeWrapWithLink(product.productPath, "row-link row-link-text", product.releaseDate)}
      </td>
    </tr>
  );
}

function buildPaginationItems(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
}

function CatalogTable({
  products,
  pagination,
  canSeePrice,
  searchTerm,
  selectedCategory,
}: {
  products: readonly Product[];
  pagination: CatalogPagination;
  canSeePrice: boolean;
  searchTerm?: string;
  selectedCategory?: CatalogCategoryValue;
}) {
  const visibleStart = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const visibleEnd = Math.min(pagination.page * pagination.pageSize, pagination.totalItems);
  const paginationItems = buildPaginationItems(pagination.page, pagination.totalPages);

  function buildPageHref(page: number) {
    const query = new URLSearchParams({
      page: String(page),
    });

    if (searchTerm) {
      query.set("smart", searchTerm);
    }

    if (selectedCategory) {
      query.set("category", selectedCategory);
    }

    return `/catalog?${query.toString()}`;
  }

  return (
    <section className="panel table-panel">
      <div className="table-panel-header">
        <div>
          <h2>Catalog Results</h2>
          <p className="results-meta">
            {visibleStart}-{visibleEnd} of {pagination.totalItems} items
          </p>
        </div>
      </div>

      <div className="table-scroll">
        <table className="catalog-table">
          <colgroup>
            <col className="col-image" />
            <col className="col-upc" />
            <col className="col-name" />
            <col className="col-price" />
            <col className="col-quantity" />
            <col className="col-release" />
          </colgroup>
          <thead>
            <tr>
              <th>Image</th>
              <th>UPC</th>
              <th>Name</th>
              <th>Your Price</th>
              <th>Quantity</th>
              <th>Release Date</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <ProductRow canSeePrice={canSeePrice} key={product.code} product={product} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="results-meta">Showing live products from the local catalog database</div>
        <div className="pagination-controls">
          {pagination.page > 1 ? (
            <Link className="page-button" href={buildPageHref(pagination.page - 1)}>
              Prev
            </Link>
          ) : (
            <span className="page-button disabled">Prev</span>
          )}
          {paginationItems.map((page) => (
            <Link
              className={page === pagination.page ? "page-button active" : "page-button"}
              href={buildPageHref(page)}
              key={page}
            >
              {page}
            </Link>
          ))}
          {pagination.page < pagination.totalPages ? (
            <Link className="page-button" href={buildPageHref(pagination.page + 1)}>
              Next
            </Link>
          ) : (
            <span className="page-button disabled">Next</span>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const pageParam = Array.isArray(resolvedSearchParams.page)
    ? resolvedSearchParams.page[0]
    : resolvedSearchParams.page;
  const categoryParam = Array.isArray(resolvedSearchParams.category)
    ? resolvedSearchParams.category[0]
    : resolvedSearchParams.category;
  const smartParam = Array.isArray(resolvedSearchParams.smart)
    ? resolvedSearchParams.smart[0]
    : resolvedSearchParams.smart;
  const selectedCategory =
    categoryParam && isCatalogCategoryValue(categoryParam) ? categoryParam : undefined;
  const smart = smartParam?.trim() || undefined;
  const page = Math.max(1, Number(pageParam || "1") || 1);
  const [{ items: products, pagination }, categoryOptions] = await Promise.all([
    getCatalogProducts({ page, pageSize: 20, category: selectedCategory, smart }),
    getCatalogCategoryOptions({ smart }),
  ]);
  return (
    <div className="page-shell">
      <SiteHeader
        activePath="/catalog"
        searchDefaultValue={smart ?? ""}
      />

      <main className="page-layout">
        <div className="breadcrumbs">Home / Catalog / Trading Card Games / Pokemon</div>

        <section className="catalog-layout">
          <FilterPanel
            categoryOptions={categoryOptions}
            searchTerm={smart}
            selectedCategory={selectedCategory}
          />
          <CatalogTable
            canSeePrice={Boolean(user)}
            pagination={pagination}
            products={products}
            searchTerm={smart}
            selectedCategory={selectedCategory}
          />
        </section>
      </main>
    </div>
  );
}
