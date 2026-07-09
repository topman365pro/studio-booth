import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Passkey access" };

export default function LoginPage() {
  return (
    <main className="auth-page">
      <header><Logo /><Link href="/">Close</Link></header>
      <section><div><p className="kicker">PRIVATE BY DEFAULT</p><h1>Keep the<br />good ones.</h1><p>Create a passkey account, then save final exports and custom frames without uploading the original camera shots.</p></div>
      <Suspense fallback={<p>Loading…</p>}><LoginForm /></Suspense></section>
    </main>
  );
}
