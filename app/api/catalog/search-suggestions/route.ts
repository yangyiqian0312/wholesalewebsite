import { NextRequest, NextResponse } from "next/server";
import { mapInflowProductToCatalogRow } from "../../../../components/catalog/catalog-mappers";
import { getBackendBaseUrl } from "../../../../utils/backend-api";

export async function GET(request: NextRequest) {
  const smart = request.nextUrl.searchParams.get("smart")?.trim();

  if (!smart) {
    return NextResponse.json({
      items: [],
    });
  }

  const query = new URLSearchParams({
    smart,
    inStockOnly: "true",
    page: "1",
    pageSize: "5",
  });

  try {
    const response = await fetch(
      `${getBackendBaseUrl()}/api/catalog/products?${query.toString()}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to load search suggestions",
        },
        {
          status: response.status,
        },
      );
    }

    const payload = (await response.json()) as {
      items?: Array<Record<string, unknown>>;
    };

    const items = Array.isArray(payload.items)
      ? payload.items.map((product) =>
          mapInflowProductToCatalogRow(
            product as Parameters<typeof mapInflowProductToCatalogRow>[0],
          ),
        )
      : [];

    return NextResponse.json({
      items: items.map((item) => ({
        code: item.code,
        name: item.name,
        sku: item.sku,
        upc: item.upc,
        imageUrl: item.imageUrl,
        imageLabel: item.imageLabel,
        productPath: item.productPath,
      })),
    });
  } catch {
    return NextResponse.json(
      {
        error: "Failed to load search suggestions",
      },
      {
        status: 500,
      },
    );
  }
}
