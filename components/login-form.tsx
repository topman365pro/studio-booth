"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Fingerprint, LoaderCircle } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const canonicalOrigin = () => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return configured || window.location.origin;
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/gallery";
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const passkeySignup = async (event: FormEvent) => {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) return setMessage("Supabase is not configured yet. Add the variables from .env.example.");
    setBusy(true);
    setMessage("");
    const setupPath = `/account?setupPasskey=1&next=${encodeURIComponent(next)}`;
    const redirectTo = `${canonicalOrigin()}/auth/callback?next=${encodeURIComponent(setupPath)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
        data: { intended_auth_method: "passkey" }
      }
    });
    setMessage(error ? error.message : "Check your email, then tap the link to create your passkey.");
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
      <div className="form-divider"><span>new here?</span></div>
      <form onSubmit={passkeySignup}>
        <label>Email address<input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <button className="button button-solid" disabled={busy || !email}>{busy ? <LoaderCircle className="spin" /> : "Create account with passkey"}</button>
      </form>
      <p className="auth-message">{message}</p>
      <small>Supabase requires one email confirmation before a new passkey can be registered. After that, you can sign in with the passkey only.</small>
    </div>
  );
}
