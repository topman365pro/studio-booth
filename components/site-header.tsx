"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Logo } from "@/components/logo";

const nav = [
  { href: "/#about", label: "About" },
  { href: "/frames", label: "Frames" },
  { href: "/stickers", label: "Stickers" },
  { href: "/guide", label: "How it works" },
  { href: "/gallery", label: "My gallery" }
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const listener = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", listener, { passive: true });
    return () => window.removeEventListener("scroll", listener);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = light ? "light" : "dark";
  }, [light]);

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
        <Link href="/login" className="button button-outline header-login">Sign in</Link>
        <button className="menu-trigger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <nav className={`mobile-nav ${open ? "open" : ""}`} aria-label="Mobile navigation">
        {nav.map((item) => <Link key={item.href} onClick={() => setOpen(false)} href={item.href}>{item.label}</Link>)}
        <Link onClick={() => setOpen(false)} href="/login">Sign in</Link>
      </nav>
    </header>
  );
}
