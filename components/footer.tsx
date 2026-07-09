import Link from "next/link";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <Logo />
      <p>Made by Topman</p>
      <nav>
        <Link href="/frames">Frames</Link>
        <Link href="/stickers">Stickers</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
      <p>© 2026</p>
    </footer>
  );
}
