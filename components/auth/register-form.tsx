"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../../utils/supabase/client";

export function RegisterForm({
  backendBaseUrl,
  registrationToken,
  approvedEmail,
}: {
  backendBaseUrl: string;
  registrationToken: string;
  approvedEmail: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: approvedEmail,
      password,
    });

    if (signUpError) {
      setIsSubmitting(false);
      setError(signUpError.message);
      return;
    }

    const completionResponse = await fetch(
      `${backendBaseUrl}/api/account-applications/register/${registrationToken}/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: approvedEmail,
        }),
      },
    );

    setIsSubmitting(false);

    if (!completionResponse.ok) {
      let message = "Account registration could not be completed.";

      try {
        const payload = (await completionResponse.json()) as {
          error?: string;
        };
        message = payload.error ?? message;
      } catch {
      }

      setError(message);
      return;
    }

    setSuccess("Account created. Please check your email for any confirmation step, then log in.");
    router.push("/login");
    router.refresh();
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="login-field">
        <span>Approved Email</span>
        <input disabled type="email" value={approvedEmail} />
      </label>

      <label className="login-field">
        <span>Password</span>
        <input
          autoComplete="new-password"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      <label className="login-field">
        <span>Confirm Password</span>
        <input
          autoComplete="new-password"
          minLength={8}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
      </label>

      {error ? <p className="login-error">{error}</p> : null}
      {success ? <p className="login-success">{success}</p> : null}

      <button className="primary-button login-submit" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Creating Account..." : "Create Account"}
      </button>
    </form>
  );
}
