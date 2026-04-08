"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "../../utils/supabase/client";
import { HeaderAccountMenu } from "./header-account-menu";

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

function getUserDisplayName(email: string | null | undefined) {
  if (!email) {
    return null;
  }

  return email.split("@")[0] || email;
}

export function HeaderAccountSlot() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const userDisplayName = getUserDisplayName(user?.email);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setUser(data.user ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (user?.email && userDisplayName) {
    return <HeaderAccountMenu displayName={userDisplayName} email={user.email} />;
  }

  return (
    <Link aria-label="Log in" className="header-action" href="/login">
      <span className="header-action-icon">
        <UserIcon />
      </span>
      <span className="header-action-copy">
        <strong>Account</strong>
        <small>Log In</small>
      </span>
    </Link>
  );
}
