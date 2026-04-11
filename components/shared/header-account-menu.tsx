"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

type HeaderAccountMenuProps = {
  email: string;
  displayName: string;
};

function UserIcon() {
  return (
    <svg aria-hidden="true" className="header-icon-svg" viewBox="0 0 24 24">
      <path
        d="M12 12a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm0 2.25c-4.25 0-7.75 2.31-7.75 5.25 0 .41.34.75.75.75h14a.75.75 0 0 0 .75-.75c0-2.94-3.5-5.25-7.75-5.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function HeaderAccountMenu({ email, displayName }: HeaderAccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);

    const supabase = createClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    const query = searchParams.toString();
    const currentUrl = query ? `${pathname}?${query}` : pathname;
    router.replace(currentUrl);
    router.refresh();
  }

  return (
    <div className="header-account-menu" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`${displayName} account menu`}
        className="header-action header-action-button"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span className="header-action-icon">
          <UserIcon />
        </span>
        <span className="header-action-copy">
          <strong>{displayName}</strong>
        </span>
      </button>

      {isOpen ? (
        <div className="header-dropdown" role="menu">
          <div className="header-dropdown-meta">
            <strong>{displayName}</strong>
            <span>{email}</span>
          </div>
          <Link
            className="header-dropdown-item"
            href="/profile"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            Edit Profile
          </Link>
          <Link
            className="header-dropdown-item"
            href="/profile/orders"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            Order History
          </Link>
          <button
            className="header-dropdown-item"
            disabled={isLoggingOut}
            onClick={handleLogout}
            role="menuitem"
            type="button"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
