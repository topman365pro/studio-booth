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

export function AccountClient() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadPasskeys = async () => {
    const { data } = await createClient()?.auth.passkey.list() ?? { data: null };
    setPasskeys(data ?? []);
  };

  useEffect(() => {
    const supabase = createClient();
    void supabase?.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) void loadPasskeys();
    });
  }, []);

  const registerPasskey = async () => {
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.auth.registerPasskey();
    setMessage(error ? error.message : `${data?.friendly_name ?? "Passkey"} is ready to use.`);
    if (!error) await loadPasskeys();
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
        {user ? <><section><User size={30} /><div><p>Email</p><h2>{user.email}</h2></div><div><p>Member since</p><h2>{new Date(user.created_at).toLocaleDateString()}</h2></div><Link href="/gallery" className="button button-outline">My gallery</Link><button className="button button-solid" onClick={signOut}><LogOut size={14} /> Sign out</button></section>
          <section className="account-passkeys">
            <div className="passkey-heading"><Fingerprint size={30} /><div><p>Passkeys</p><h2>Sign in without Google or a password</h2></div></div>
            <div className="passkey-list">
              {passkeys.map(passkey => <div className="passkey-row" key={passkey.id}><div><strong>{passkey.friendly_name ?? "Passkey"}</strong><small>Added {new Date(passkey.created_at).toLocaleDateString()}</small></div><button aria-label="Remove passkey" onClick={() => deletePasskey(passkey.id)} disabled={busy}><Trash2 size={14} /></button></div>)}
              {!passkeys.length && <p>No passkeys registered yet.</p>}
            </div>
            <button className="button button-solid" onClick={registerPasskey} disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <Fingerprint size={14} />} Create passkey</button>
            {message && <p className="auth-message">{message}</p>}
          </section></>
          : <section><p>You are currently using the booth as a guest.</p><Link className="button button-solid" href="/login?next=/account">Sign in</Link></section>}
      </main>
    </>
  );
}
