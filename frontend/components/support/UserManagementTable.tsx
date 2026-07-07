import { ManagedUser } from "@/types/support";
import StatusBadge from "./StatusBadge";

interface UserManagementTableProps {
  users: ManagedUser[];
  onToggleBan: (userId: string) => void;
  onViewDetails: (user: ManagedUser) => void;
}

export default function UserManagementTable({ users, onToggleBan, onViewDetails }: UserManagementTableProps) {
  if (users.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
        No registered users to display right now.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Name</th>
            <th scope="col" className="px-4 py-3 font-medium">Role</th>
            <th scope="col" className="px-4 py-3 font-medium">Joined</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {users.map((user) => (
            <tr key={user.id} className="bg-zinc-950/40 hover:bg-zinc-900/60">
              <td className="px-4 py-3">
                <p className="font-medium text-white">{user.displayName}</p>
                <p className="text-xs text-zinc-500">{user.email}</p>
              </td>
              <td className="px-4 py-3 capitalize text-zinc-300">{user.role}</td>
              <td className="px-4 py-3 text-zinc-400">{user.joinedDate}</td>
              <td className="px-4 py-3">
                <StatusBadge label={user.status} tone={user.status === "active" ? "green" : "red"} />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onViewDetails(user)}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleBan(user.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      user.status === "banned"
                        ? "bg-emerald-500 text-black hover:bg-emerald-400"
                        : "bg-red-500/90 text-white hover:bg-red-500"
                    }`}
                  >
                    {user.status === "banned" ? "Unban" : "Ban"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}