"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SyncState = "idle" | "success" | "error";
type RemoteSyncStatus = "idle" | "running" | "success" | "error";

type SyncStatusPayload = {
  status?: RemoteSyncStatus;
  syncedCount?: number | null;
  error?: string | null;
};

export default function ListingsSyncButton() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSyncing) {
      return;
    }

    let cancelled = false;

    async function pollSyncStatus() {
      try {
        const response = await fetch("/api/admin/listings/sync", {
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => null)) as SyncStatusPayload | null;

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setSyncState("error");
          setMessage(payload?.error || "Failed to fetch sync status.");
          setIsSyncing(false);
          return;
        }

        if (payload?.status === "running") {
          window.setTimeout(pollSyncStatus, 2000);
          return;
        }

        if (payload?.status === "success") {
          setSyncState("success");
          setMessage(
            typeof payload.syncedCount === "number"
              ? `Synced ${payload.syncedCount} products.`
              : "Sync complete.",
          );
          setIsSyncing(false);
          router.refresh();
          return;
        }

        if (payload?.status === "error") {
          setSyncState("error");
          setMessage(payload.error || "Sync failed.");
          setIsSyncing(false);
          return;
        }

        window.setTimeout(pollSyncStatus, 2000);
      } catch {
        if (cancelled) {
          return;
        }

        setSyncState("error");
        setMessage("Failed to fetch sync status.");
        setIsSyncing(false);
      }
    }

    void pollSyncStatus();

    return () => {
      cancelled = true;
    };
  }, [isSyncing, router]);

  async function handleSync() {
    setIsSyncing(true);
    try {
      setSyncState("idle");
      setMessage("");

      const response = await fetch("/api/admin/listings/sync", {
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setSyncState("error");
        setMessage(payload?.error || "Sync failed.");
        setIsSyncing(false);
        return;
      }
    } catch {
      setSyncState("error");
      setMessage("Sync failed.");
      setIsSyncing(false);
    }
  }

  return (
    <div className="admin-listings-sync-group">
      <button className="admin-listings-sync-button" disabled={isSyncing} onClick={handleSync} type="button">
        {isSyncing ? "Syncing..." : "Sync Now"}
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
