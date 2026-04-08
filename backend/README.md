# Backend

This backend now supports three separate responsibilities:

- reading catalog products from the local database
- manually syncing products from Inflow into the local database
- automatically syncing products from Inflow on a fixed schedule

## Environment

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL`
- `INFLOW_COMPANY_ID`
- `INFLOW_API_KEY`

Optional sync settings:

- `PRODUCT_SYNC_ENABLED=true`
- `PRODUCT_SYNC_INTERVAL_MINUTES=5`

## Run

```bash
npm install
npm run dev
```

## Endpoints

- `GET /api/health`
- `GET /api/catalog/products`
- `GET /api/inflow/products`
- `POST /api/sync/inflow/products`

## Sync behavior

- The catalog page reads from the local database, not directly from Inflow.
- A manual sync can be triggered with `npm run sync:products`.
- Automatic sync runs on a timer when `PRODUCT_SYNC_ENABLED=true`.
- The default interval is every `5` minutes.
