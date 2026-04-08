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

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { sku } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const product = await getCatalogProduct(sku);

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
                <h1>{product.name}</h1>

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
                      <strong>{product.wholesale}</strong>
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

                <div className="tag-row">
                  {product.tags.map((tag) => (
                    <span className="status-tag status-info" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>

                <ProductDetailPurchase
                  defaultQuantity={product.quantity || "1"}
                  product={{
                    code: product.code,
                    imageLabel: product.imageLabel,
                    imageUrl: product.imageUrl,
                    name: product.name,
                    productPath: product.productPath,
                    sku: product.sku,
                    upc: product.upc,
                    wholesale: product.wholesale,
                  }}
                />

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
