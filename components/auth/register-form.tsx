"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm({
  registrationToken,
  approvedEmail,
}: {
  registrationToken: string;
  approvedEmail: string;
}) {
  const router = useRouter();
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

    const completionResponse = await fetch(
      "/api/auth/register-approved",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationToken,
          email: approvedEmail,
          password,
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

    setSuccess("Account created. You can log in now.");
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
