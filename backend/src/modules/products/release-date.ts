function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function normalizeReleaseDateForStorage(value?: string | null) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  const isoMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const usMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (usMatch) {
    return `${usMatch[3]}-${pad(Number(usMatch[1]))}-${pad(Number(usMatch[2]))}`;
  }

  return trimmedValue;
}

export function formatReleaseDateForInflow(value?: string | null) {
  const normalizedValue = normalizeReleaseDateForStorage(value);

  if (!normalizedValue) {
    return "";
  }

  const isoMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!isoMatch) {
    return normalizedValue;
  }

  return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
}
