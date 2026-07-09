import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?next=/admin");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: profile } = await supabase.from("profiles").select("role, username, display_name").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/account");
  return <AdminShell identity={profile.username ?? profile.display_name ?? "Administrator"}>{children}</AdminShell>;
}
