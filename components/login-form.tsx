"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Fingerprint, LoaderCircle } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/gallery";
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const magicLink = async (event: FormEvent) => {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) return setMessage("Supabase is not configured yet. Add the variables from .env.example.");
    setBusy(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setMessage(error ? error.message : "Check your email for a private sign-in link.");
    setBusy(false);
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
      <div className="form-divider"><span>first time?</span></div>
      <form onSubmit={magicLink}>
        <label>Email address<input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <button className="button button-solid" disabled={busy || !email}>{busy ? <LoaderCircle className="spin" /> : "Send magic link"}</button>
      </form>
      <p className="auth-message">{message}</p>
      <small>New here? Use a magic link once, then create a passkey from your account page.</small>
    </div>
  );
}
