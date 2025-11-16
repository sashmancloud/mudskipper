import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { getCurrentUserPermissionLevel, isSuperAdmin } from "../auth/permissions";
import InviteUserDialog from "../components/admin/InviteUserDialog";
import EditPermissionDialog from "../components/admin/EditPermissionDialog";

const client = generateClient<Schema>();
const INVITE_URL = "https://oggc3qgyzohxvgr2swkeuvhziy0faviq.lambda-url.eu-north-1.on.aws/";
const UPDATE_URL = "https://ak3of5c35gfisw7oheh5ieaw7y0aeedz.lambda-url.eu-north-1.on.aws/";

export default function AdminPage() {
  const { user } = useAuthenticator();
  const [permissionLevel, setPermissionLevel] = useState(0);
  const [users, setUsers] = useState<Array<Schema["Users"]["type"]>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<{ open: boolean; user?: Schema["Users"]["type"] }>({ open: false });

  function openEdit(u: Schema["Users"]["type"]) {
    setEditOpen({ open: true, user: u });
  }

  useEffect(() => {
    (async () => {
      try {
        const level = await getCurrentUserPermissionLevel(user);
        setPermissionLevel(level);
        if (isSuperAdmin(level)) {
          const { data } = await client.models.Users.list();
          setUsers(data);
        }
      } catch (e) {
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function onInviteSubmit(data: { email: string; firstName?: string; lastName?: string; permissionLevel: number }) {
    setInviteOpen(false);
    try {
      await fetch(INVITE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          permissionLevel: data.permissionLevel,
          invitedBy: user?.signInDetails?.loginId ?? "",
        }),
      });
  
      const { data: refreshed } = await client.models.Users.list();
      setUsers(refreshed);
    } catch {
      alert("Failed to invite user");
    }
  }

  async function onEditSubmit(newLevel: number) {
    const u = editOpen.user;
    setEditOpen({ open: false });
    if (!u) return;
  
    try {
      await fetch(UPDATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: u.id,
          permissionLevel: newLevel,
          updatedBy: user?.signInDetails?.loginId ?? "",
        }),
      });
  
      const { data: refreshed } = await client.models.Users.list();
      setUsers(refreshed);
    } catch {
      alert("Failed to update permission");
    }
  }

  if (!isSuperAdmin(permissionLevel)) {
    return <div><h2>Admin</h2><p>Access denied.</p></div>;
  }
  if (loading) return <div><h2>Admin</h2><p>Loading…</p></div>;
  if (error) return <div><h2>Admin</h2><p>{error}</p></div>;

  return (
    <div>
      <h2>Admin</h2>
      <button onClick={() => setInviteOpen(true)}>Invite user</button>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Permission</th>
            <th>Status</th>
            <th>Invited By</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{[u.first_name, u.last_name].filter(Boolean).join(" ")}</td>
              <td>{u.permission_level}</td>
              <td>{u.status}</td>
              <td>{u.invited_by}</td>
              <td>{u.updated_at}</td>
              <td><button onClick={() => openEdit(u)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <InviteUserDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={onInviteSubmit}
      />
      <EditPermissionDialog
      open={editOpen.open}
      email={editOpen.user?.email ?? ""}
      currentLevel={editOpen.user?.permission_level ?? 1}
      onClose={() => setEditOpen({ open: false })}
      onSubmit={onEditSubmit}
    />
    </div>
  );
}