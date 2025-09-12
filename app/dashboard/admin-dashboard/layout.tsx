import { ReactNode } from "react";
import AdminHeader from "../../../components/AdminHeader";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      {/* <AdminHeader /> */}
      <div>{children}</div>
    </div>
  );
}