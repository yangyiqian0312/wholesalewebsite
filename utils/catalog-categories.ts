export const catalogCategoryRules = [
  {
    value: "pokemon-japanese",
    label: "Pokemon Japanese",
    skuPrefix: "PKMJP",
  },
  {
    value: "pokemon-english",
    label: "Pokemon English",
    skuPrefix: "PKMEN",
  },
] as const;

export type CatalogCategoryValue = (typeof catalogCategoryRules)[number]["value"];

export function isCatalogCategoryValue(value: string): value is CatalogCategoryValue {
  return catalogCategoryRules.some((rule) => rule.value === value);
}

export function getCatalogCategoryRule(value: CatalogCategoryValue) {
  return catalogCategoryRules.find((rule) => rule.value === value) ?? null;
}

export function getCatalogCategoryFromSku(sku?: string | null): CatalogCategoryValue | null {
  if (!sku) {
    return null;
  }

  const normalizedSku = sku.trim().toUpperCase();
  const rule = catalogCategoryRules.find((entry) => normalizedSku.startsWith(entry.skuPrefix));

  return rule?.value ?? null;
}
