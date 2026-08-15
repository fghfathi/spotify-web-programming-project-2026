"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

type Mode = "login" | "register";
type Role = "listener" | "artist" | "support" | "admin";

export default function Home() {
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("listener");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [artistPending, setArtistPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const { login, register, isAuthenticated, loading } = useAuth();

  // If the user is already signed in, skip the auth screen.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/home");
    }
  }, [loading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const displayName = (formData.get("displayName") as string) || "";
    const birthdate = formData.get("birthdate") as string;
    const gender = formData.get("gender") as string;
    const privacy = formData.get("privacy");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Password must contain both letters and numbers.
    const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;

    if (!email || !password) {
      setError("Please fill all required fields.");
      return;
    }
    if (!emailRegex.test(email)) {
      setError("Invalid email format.");
      return;
    }

    // --- Login ------------------------------------------------------------
    if (mode === "login") {
      setSubmitting(true);
      try {
        await login(email, password);
        router.replace("/home");
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to log in. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // --- Register ---------------------------------------------------------
    if (role === "support" || role === "admin") {
      setError("Staff accounts cannot be self-registered.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!strongPasswordRegex.test(password)) {
      setError("Password must contain both letters and numbers.");
      return;
    }

    const isArtist = role === "artist";
    if (!isArtist) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!birthdate) {
        setError("Please enter your birth date.");
        return;
      }
      if (!gender) {
        setError("Please select your gender.");
        return;
      }
      if (!privacy) {
        setError("You must accept the Privacy Policy.");
        return;
      }
    }

    // The artist's "artistic name" input reuses the displayName field.
    const fullName = displayName;
    setSubmitting(true);
    try {
      await register({ email, password, fullName, role });
      if (isArtist) {
        // Account created with a pending verification profile.
        setArtistPending(true);
      } else {
        router.replace("/home");
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to create the account. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-black to-zinc-900 px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-7 shadow-2xl backdrop-blur">
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-bold text-white">Shpotify</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Login or create an account to start streaming music
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-zinc-800 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setForgotPassword(false);
              setError(null);
            }}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              mode === "login"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("register");
              setForgotPassword(false);
              setError(null);
            }}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              mode === "register"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            {error}
          </div>
        )}

        {forgotPassword ? (
          <form className="space-y-4">
            <input
              name="email"
              type="email"
              placeholder="Account email"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-white"
            />

            <button
              type="button"
              className="w-full rounded-lg bg-white py-2.5 font-semibold text-black hover:bg-zinc-200"
            >
              Send verification code
            </button>

            <input
              type="text"
              placeholder="Verification code"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-white"
            />

            <input
              type="password"
              placeholder="New password"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-white"
            />

            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-500 py-2.5 font-semibold text-white hover:bg-emerald-400"
            >
              Reset password
            </button>

            <button
              type="button"
              onClick={() => setForgotPassword(false)}
              className="w-full text-sm text-zinc-400 hover:text-white"
            >
              Back to login
            </button>
          </form>
        ) : artistPending ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
            <h2 className="text-lg font-semibold text-amber-200">
              Account Pending Approval
            </h2>

            <p className="mt-3 text-sm text-zinc-300">
              Your artist account has been created and is awaiting verification.
            </p>

            <p className="mt-1 text-sm text-zinc-400">
              You can log in now, but some artist features stay locked until an
              admin verifies your account.
            </p>

            <button
              onClick={() => {
                setArtistPending(false);
                setMode("login");
              }}
              className="mt-5 w-full rounded-lg bg-white py-2.5 font-semibold text-black"
            >
              Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-white"
              >
                <option value="listener">Listener</option>
                <option value="artist">Artist</option>
                <option value="support">Support</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {mode === "register" && role === "artist" ? (
              <>
                <input
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-white"
                />

                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-white"
                />

                <input
                  name="displayName"
                  type="text"
                  placeholder="Your artistic name"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-white"
                />

                <textarea
                  name="portfolio"
                  placeholder="Portfolio / Sample works"
                  rows={4}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-white"
                />

                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Artist accounts will be marked as pending approval after
                  submission.
                </p>
              </>
            ) : (
              <>
                {mode === "register" && (
                  <input
                    name="displayName"
                    type="text"
                    placeholder="Display name"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-white"
                  />
                )}

                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-white"
                />

                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-white"
                />

                {mode === "register" && (
                  <>
                    <input
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-white"
                    />

                    <input
                      name="birthdate"
                      type="date"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-white"
                    />

                    <select
                      name="gender"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-white"
                    >
                      <option value="">Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>

                    <label className="flex items-start gap-3 text-sm text-zinc-400">
                      <input type="checkbox" name="privacy" className="mt-1" />
                      <span>
                        I agree to the{" "}
                        <button
                          type="button"
                          onClick={() => setShowPolicy(true)}
                          className="text-white underline"
                        >
                          Privacy Policy
                        </button>
                      </span>
                    </label>
                  </>
                )}
              </>
            )}

            {mode === "login" && (
              <button
                type="button"
                onClick={() => setForgotPassword(true)}
                className="text-sm text-zinc-400 hover:text-white"
              >
                Forgot password?
              </button>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-white py-2.5 font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
            >
              {submitting
                ? "Please wait…"
                : mode === "login"
                ? "Login"
                : role === "artist"
                ? "Submit for review"
                : "Create account"}
            </button>
          </form>
        )}

        <p className="mt-7 text-center text-xs text-zinc-500">
          © 2026 Shpotify Streaming Platform
        </p>
      </section>

      {showPolicy && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 p-4">
          <div className="max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-sm text-zinc-300">
            <h2 className="mb-3 text-lg font-semibold text-white">
              Privacy Policy
            </h2>

            <p className="mb-3">
              Shpotify collects basic account information such as email, display
              name, and profile data to provide music streaming services.
            </p>

            <p className="mb-3">
              Your information will not be shared with third parties except when
              required for security or legal compliance.
            </p>

            <button
              onClick={() => setShowPolicy(false)}
              className="w-full rounded-lg bg-white py-2 font-semibold text-black"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
