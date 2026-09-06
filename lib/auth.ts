import { supabase } from "@/lib/supabase";

export type StaffRole = "admin" | "barber";

export type StaffProfile = {
  id: string;
  user_id: string;
  role: StaffRole;
  barber_id: string | null;
  full_name: string;
  active: boolean;
};

export type AuthContext = {
  user: NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]>;
  staffProfile: StaffProfile;
  role: StaffRole;
  barberId: string | null;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: staffProfile, error: profileError } = await supabase
    .from("staff_profiles")
    .select("id,user_id,role,barber_id,full_name,active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !staffProfile || !staffProfile.active) return null;

  if (staffProfile.role !== "admin" && staffProfile.role !== "barber") {
    return null;
  }

  return {
    user,
    staffProfile: staffProfile as StaffProfile,
    role: staffProfile.role,
    barberId: staffProfile.barber_id,
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}
