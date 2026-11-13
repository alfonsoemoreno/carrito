import { redirect } from "next/navigation";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";

export default async function AdminTemplatesPage() {
  await requireCurrentAdminPageAccess();
  redirect("/admin/zonas");
}
