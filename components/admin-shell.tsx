import Link from "next/link";
import { Frame, Images, LayoutDashboard, LogOut, Sticker } from "lucide-react";
import { Logo } from "@/components/logo";

export function AdminShell({ children, identity }: { children: React.ReactNode; identity: string }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Logo href="/admin" />
        <nav>
          <Link href="/admin"><LayoutDashboard />Overview</Link>
          <Link href="/admin/frames"><Frame />Frames</Link>
          <Link href="/admin/stickers"><Sticker />Stickers</Link>
          <Link href="/frames"><Images />Public library</Link>
        </nav>
        <div className="admin-identity"><span>Signed in as</span><b>{identity}</b><Link href="/account"><LogOut />Account</Link></div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
