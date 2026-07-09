"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Fingerprint, LoaderCircle, LogOut, Trash2, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/client";

type Passkey = {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
};

type Profile = {
  username?: string | null;
  display_name?: string | null;
};

export function AccountClient() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [setupPasskey, setSetupPasskey] = useState(false);
  const [continueTo, setContinueTo] = useState("/gallery");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadPasskeys = async () => {
    const { data } = await createClient()?.auth.passkey.list() ?? { data: null };
    setPasskeys(data ?? []);
  };

  const loadProfile = async (userId: string) => {
    const { data } = await createClient()?.from("profiles").select("username, display_name").eq("id", userId).single() ?? { data: null };
    setProfile(data);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldSetupPasskey = params.get("setupPasskey") === "1";
    const next = params.get("next");
    setSetupPasskey(shouldSetupPasskey);
    setContinueTo(next?.startsWith("/") && !next.startsWith("//") ? next : "/gallery");
    if (shouldSetupPasskey) setMessage("Almost there — create your passkey to finish account setup.");

    const supabase = createClient();
    void supabase?.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        void loadPasskeys();
        void loadProfile(data.user.id);
      }
    });
  }, []);

  const registerPasskey = async (continueAfterSetup = false) => {
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.auth.registerPasskey();
    if (error) {
      setMessage(error.message);
    } else {
      setMessage(`${data?.friendly_name ?? "Passkey"} is ready to use.`);
      setSetupPasskey(false);
      await loadPasskeys();
      if (continueAfterSetup) window.setTimeout(() => window.location.assign(continueTo), 900);
    }
    setBusy(false);
  };

  const deletePasskey = async (passkeyId: string) => {
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.passkey.delete({ passkeyId });
    setMessage(error ? error.message : "Passkey removed.");
    if (!error) await loadPasskeys();
    setBusy(false);
  };

  const signOut = async () => {
    await createClient()?.auth.signOut();
    window.location.href = "/";
  };
  return (
    <>
      <SiteHeader />
      <main className="account-page">
        <p className="kicker">ACCOUNT</p><h1>Your studio<br />identity.</h1>
        {user ? <><section><User size={30} /><div><p>Username</p><h2>{profile?.username ?? profile?.display_name ?? "Studio member"}</h2></div><div><p>Member since</p><h2>{new Date(user.created_at).toLocaleDateString()}</h2></div><Link href="/gallery" className="button button-outline">My gallery</Link><button className="button button-solid" onClick={signOut}><LogOut size={14} /> Sign out</button></section>
          <section className="account-passkeys">
            <div className="passkey-heading"><Fingerprint size={30} /><div><p>Passkeys</p><h2>Passkey-first sign-in</h2></div></div>
            <div className="passkey-list">
              {setupPasskey && <div className="passkey-setup-card"><strong>Finish your passkey signup</strong><small>Your account is ready. Create a passkey on this device to complete setup.</small></div>}
              {passkeys.map(passkey => <div className="passkey-row" key={passkey.id}><div><strong>{passkey.friendly_name ?? "Passkey"}</strong><small>Added {new Date(passkey.created_at).toLocaleDateString()}</small></div><button aria-label="Remove passkey" onClick={() => deletePasskey(passkey.id)} disabled={busy}><Trash2 size={14} /></button></div>)}
              {!passkeys.length && <p>No passkeys registered yet.</p>}
            </div>
            <button className="button button-solid" onClick={() => registerPasskey(setupPasskey)} disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <Fingerprint size={14} />} {setupPasskey ? "Create passkey & continue" : "Create passkey"}</button>
            {message && <p className="auth-message">{message}</p>}
          </section></>
          : <section><p>You are currently using the booth as a guest.</p><Link className="button button-solid" href="/login?next=/account">Sign in or create passkey</Link></section>}
      </main>
    </>
  );
}
