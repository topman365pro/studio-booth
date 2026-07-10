"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/frames", label: "Frames" },
  { href: "/stickers", label: "Stickers" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/gallery", label: "My gallery" }
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [accountLabel, setAccountLabel] = useState("Sign in");
  const signedIn = accountLabel !== "Sign in";

  useEffect(() => {
    const listener = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", listener, { passive: true });
    return () => window.removeEventListener("scroll", listener);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = light ? "light" : "dark";
  }, [light]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    let mounted = true;
    const setUserLabel = async (userId?: string, fallbackUsername?: string) => {
      if (!userId) {
        if (mounted) setAccountLabel("Sign in");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", userId)
        .single();
      if (!mounted) return;

      const label = data?.username ?? data?.display_name ?? fallbackUsername ?? "Account";
      setAccountLabel(label === "Account" ? label : `@${label}`);
    };

    void supabase.auth.getUser().then(({ data }) => {
      void setUserLabel(data.user?.id, data.user?.user_metadata?.username);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void setUserLabel(session?.user.id, session?.user.user_metadata?.username);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
      <Logo />
      <nav className="desktop-nav" aria-label="Primary">
        {nav.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
      </nav>
      <div className="header-actions">
        <button className="icon-btn" onClick={() => setLight(!light)} aria-label="Toggle theme">
          {light ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <Link href={signedIn ? "/account" : "/login"} className="header-account">{accountLabel}</Link>
        <Link href="/guide" className="button header-start">Open booth <ArrowRight size={14} /></Link>
        <button className="menu-trigger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Close menu" : "Menu"}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <nav className={`mobile-nav ${open ? "open" : ""}`} aria-label="Mobile navigation">
        {nav.map((item) => <Link key={item.href} onClick={() => setOpen(false)} href={item.href}>{item.label}</Link>)}
        <Link onClick={() => setOpen(false)} href={signedIn ? "/account" : "/login"}>{accountLabel}</Link>
        <Link onClick={() => setOpen(false)} href="/guide">Open booth <ArrowRight size={15} /></Link>
      </nav>
    </header>
  );
}
