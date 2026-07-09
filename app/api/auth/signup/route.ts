import { NextResponse } from "next/server";
import { USERNAME_RULES, isValidUsername, normalizeUsername, usernameToAuthEmail } from "@/lib/auth/username";
import { createAdminClient } from "@/lib/supabase/admin";

type SignupBody = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as SignupBody | null;
  const username = normalizeUsername(body?.username ?? "");
  const password = body?.password ?? "";

  if (!isValidUsername(username)) {
    return NextResponse.json({ error: USERNAME_RULES }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Use a password with at least 8 characters." }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin credentials are not configured." }, { status: 500 });
  }

  const loginEmail = usernameToAuthEmail(username);
  const { data, error } = await supabase.auth.admin.createUser({
    email: loginEmail,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      display_name: username,
      intended_auth_method: "passkey"
    }
  });

  if (error) {
    const message = error.message.toLowerCase().includes("already")
      ? "That username is already taken."
      : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!data.user) {
    return NextResponse.json({ error: "Could not create the account." }, { status: 500 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: data.user.id,
      username,
      display_name: username
    }, { onConflict: "id" });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ username, loginEmail });
}
