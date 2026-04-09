"use client";

type ListingsPageSizeSelectProps = {
  defaultValue: number;
};

export default function ListingsPageSizeSelect({
  defaultValue,
}: ListingsPageSizeSelectProps) {
  return (
    <select
      className="admin-listings-page-size-select"
      defaultValue={String(defaultValue)}
      name="pageSize"
      onChange={(event) => {
        event.currentTarget.form?.requestSubmit();
      }}
    >
      <option value="20">20</option>
      <option value="50">50</option>
      <option value="100">100</option>
    </select>
  );
}
