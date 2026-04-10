alter table "AccountApplication"
add column if not exists "assignedSalesRepEmail" text;

create index if not exists "AccountApplication_assignedSalesRepEmail_status_idx"
on "AccountApplication" ("assignedSalesRepEmail", "status");
