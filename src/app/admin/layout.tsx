import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      <AdminSidebar user={session.user} />
      <main className="flex-1 p-6 lg:p-8 ml-0 lg:ml-64">{children}</main>
    </div>
  );
}
