"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type SyncState = "idle" | "success" | "error";

export default function ListingsSyncButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [message, setMessage] = useState("");

  function handleSync() {
    startTransition(async () => {
      setSyncState("idle");
      setMessage("");

      const response = await fetch("/api/admin/listings/sync", {
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setSyncState("error");
        setMessage(payload?.error || "Sync failed.");
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { syncedCount?: number; syncedAt?: string }
        | null;

      setSyncState("success");
      setMessage(
        typeof payload?.syncedCount === "number"
          ? `Synced ${payload.syncedCount} products.`
          : "Sync complete.",
      );
      router.refresh();
    });
  }

  return (
    <div className="admin-listings-sync-group">
      <button className="admin-listings-sync-button" disabled={isPending} onClick={handleSync} type="button">
        {isPending ? "Syncing..." : "Sync Now"}
      </button>
      {message ? (
        <span
          className={
            syncState === "error"
              ? "admin-listing-save-feedback is-error"
              : "admin-listing-save-feedback is-success"
          }
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}
