"use client";

import { useState } from "react";
import { useSupportData } from "@/context/SupportDataContext";
import UserManagementTable from "@/components/support/UserManagementTable";
import DetailsModal from "@/components/support/DetailsModal";
import { ManagedUser } from "@/types/support";

export default function ManageUsersPage() {
  const { users, toggleUserBan } = useSupportData();
  const [viewingUser, setViewingUser] = useState<ManagedUser | null>(null);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white md:text-3xl">Manage Users</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {users.length} registered {users.length === 1 ? "user" : "users"} ·{" "}
          {users.filter((u) => u.status === "banned").length} banned
        </p>
      </div>

      <UserManagementTable users={users} onToggleBan={toggleUserBan} onViewDetails={setViewingUser} />

      {viewingUser && (
        <DetailsModal
          title={viewingUser.displayName}
          subtitle={viewingUser.email}
          fields={[
            { label: "Role", value: viewingUser.role },
            { label: "Status", value: viewingUser.status },
            { label: "Joined", value: viewingUser.joinedDate },
          ]}
          onClose={() => setViewingUser(null)}
        />
      )}
    </>
  );
}