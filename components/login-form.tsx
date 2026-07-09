"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Fingerprint, LoaderCircle } from "lucide-react";
import { USERNAME_RULES, normalizeUsername, usernameToAuthEmail } from "@/lib/auth/username";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/gallery";
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const passwordSignIn = async (loginEmail = usernameToAuthEmail(username)) => {
    const supabase = createClient();
    if (!supabase) throw new Error("Supabase is not configured yet. Add the variables from .env.example.");

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password
    });

    if (error) throw error;
  };

  const createAccount = async (event: FormEvent) => {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) return setMessage("Supabase is not configured yet. Add the variables from .env.example.");

    setBusy(true);
    setMessage("");

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(payload.error ?? "Could not create the account.");
      setBusy(false);
      return;
    }

    try {
      await passwordSignIn(payload.loginEmail);
      const { error } = await supabase.auth.registerPasskey();
      if (error) {
        window.location.assign(`/account?setupPasskey=1&next=${encodeURIComponent(next)}`);
        return;
      }
      window.location.assign(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not finish account setup.");
      setBusy(false);
    }
  };

  const passwordFallback = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      await passwordSignIn();
      window.location.assign(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign in.");
      setBusy(false);
    }
  };

  const passkey = async () => {
    const supabase = createClient();
    if (!supabase) return setMessage("Supabase is not configured yet. Add the variables from .env.example.");
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPasskey();
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }
    window.location.assign(next);
  };

  return (
    <div className="login-form">
      <button className="passkey-button" onClick={passkey} disabled={busy || !isSupabaseConfigured}><Fingerprint size={18} /> Sign in with a passkey</button>
      <div className="form-divider"><span>{mode === "signup" ? "new here?" : "fallback"}</span></div>
      <form onSubmit={mode === "signup" ? createAccount : passwordFallback}>
        <label>Username<input required value={username} onChange={event => setUsername(normalizeUsername(event.target.value))} placeholder="studio_guest" autoComplete="username" /></label>
        <label>Password<input required type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="8+ characters" autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>
        <button className="button button-solid" disabled={busy || !username || !password}>{busy ? <LoaderCircle className="spin" /> : mode === "signup" ? "Create account & passkey" : "Sign in with password"}</button>
      </form>
      <p className="auth-message">{message}</p>
      <small>{mode === "signup" ? `Passkey is primary. Password stays available as a fallback. ${USERNAME_RULES}` : "Use this only if your passkey is unavailable."}</small>
      <button className="auth-switch" type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); }}>
        {mode === "signup" ? "Already have an account? Use password fallback" : "New here? Create account & passkey"}
      </button>
    </div>
  );
}
