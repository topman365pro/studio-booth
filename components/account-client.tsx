"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/client";

export function AccountClient() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  useEffect(() => {
    const supabase = createClient();
    void supabase?.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);
  const signOut = async () => {
    await createClient()?.auth.signOut();
    window.location.href = "/";
  };
  return (
    <>
      <SiteHeader />
      <main className="account-page">
        <p className="kicker">ACCOUNT</p><h1>Your studio<br />identity.</h1>
        {user ? <section><User size={30} /><div><p>Email</p><h2>{user.email}</h2></div><div><p>Member since</p><h2>{new Date(user.created_at).toLocaleDateString()}</h2></div><Link href="/gallery" className="button button-outline">My gallery</Link><button className="button button-solid" onClick={signOut}><LogOut size={14} /> Sign out</button></section>
          : <section><p>You are currently using the booth as a guest.</p><Link className="button button-solid" href="/login?next=/account">Sign in</Link></section>}
      </main>
    </>
  );
}
