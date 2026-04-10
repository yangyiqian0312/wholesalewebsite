import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogProduct } from "../../../components/catalog/catalog-api";
import { ProductDetailPurchase } from "../../../components/catalog/product-detail-purchase";
import { SiteHeader } from "../../../components/shared/site-header";
import { createClient } from "../../../utils/supabase/server";

type ProductDetailPageProps = {
  params: Promise<{
    sku: string;
  }>;
};

function calculateDiscountLabel(originalPrice: string, wholesalePrice: string) {
  const original = Number(originalPrice.replace(/[^0-9.]/g, ""));
  const wholesale = Number(wholesalePrice.replace(/[^0-9.]/g, ""));

  if (
    Number.isNaN(original) ||
    Number.isNaN(wholesale) ||
    original <= 0 ||
    wholesale <= 0 ||
    wholesale >= original
  ) {
    return null;
  }

  const discount = Math.round(((original - wholesale) / original) * 100);
  return discount > 0 ? `-${discount}%` : null;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { sku } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const product = await getCatalogProduct(sku);
    const discountLabel = calculateDiscountLabel(product.originalPrice, product.wholesale);

    return (
      <div className="page-shell product-detail-page-shell">
        <SiteHeader
          activePath="/catalog"
          searchDefaultValue={product.sku !== "N/A" ? product.sku : product.name}
        />

        <main className="page-layout product-detail-page-layout">
          <div className="breadcrumbs">
            <Link href="/catalog">Catalog</Link> / <span>{product.name}</span>
          </div>

          <section className="panel product-detail-panel">
            <div className="product-detail-grid">
              <div className="product-detail-media">
                <div className="product-detail-media-tags">
                  {product.tags.map((tag) => (
                    <span className="status-tag status-info" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                {product.imageUrl ? (
                  <img
                    alt={product.name}
                    className="product-detail-image"
                    src={product.imageUrl}
                  />
                ) : (
                  <div className="product-detail-fallback">{product.imageLabel}</div>
                )}
              </div>

              <div className="product-detail-content">
                <p className="eyebrow product-detail-eyebrow">Product Detail</p>
                <div className="product-detail-title-row">
                  <h1>{product.name}</h1>
                </div>

                <div className="product-detail-meta">
                  <div>
                    <span>SKU</span>
                    <strong>{product.sku}</strong>
                  </div>
                  <div>
                    <span>UPC</span>
                    <strong>{product.upc}</strong>
                  </div>
                  <div>
                    <span>Your Price</span>
                    {user ? (
                      <>
                        {product.originalPrice !== "N/A" ? (
                          <span className="product-detail-compare-price">{product.originalPrice}</span>
                        ) : null}
                        <strong className="product-detail-price-value">{product.wholesale}</strong>
                        {discountLabel ? (
                          <span className="product-detail-discount-inline">{discountLabel}</span>
                        ) : null}
                      </>
                    ) : (
                      <Link className="price-login-link" href="/login">
                        Log in to see price
                      </Link>
                    )}
                  </div>
                  <div>
                    <span>Release Date</span>
                    <strong>{product.releaseDate}</strong>
                  </div>
                </div>

                <ProductDetailPurchase
                  defaultQuantity={product.quantity || "1"}
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
                />

                {product.description ? (
                  <section className="product-detail-description">
                    <div className="product-detail-description-head">
                      <h2>Description</h2>
                    </div>
                    <div
                      className="product-detail-description-body"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  </section>
                ) : null}

                <Link className="text-button product-detail-back" href="/catalog">
                  Back to Catalog
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  } catch {
    notFound();
  }
}
