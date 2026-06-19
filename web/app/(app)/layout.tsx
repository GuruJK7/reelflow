import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <Header email={user?.email} />
      <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
    </div>
  );
}
