"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../../utils/supabase/client";

export function LoginForm({
  redirectTo = "/catalog",
  adminEmails = [],
}: {
  redirectTo?: string;
  adminEmails?: readonly string[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const isAdmin = adminEmails.includes(email.trim().toLowerCase());

    router.push(isAdmin ? "/admin" : redirectTo);
    router.refresh();
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="login-field">
        <span>Email</span>
        <input
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>

      <label className="login-field">
        <span>Password</span>
        <input
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      {error ? <p className="login-error">{error}</p> : null}

      <button className="primary-button login-submit" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing In..." : "Log In"}
      </button>
    </form>
  );
}
