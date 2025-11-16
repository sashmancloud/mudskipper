import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { email: string; firstName?: string; lastName?: string; permissionLevel: number }) => void;
};

export default function InviteUserDialog({ open, onClose, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [permissionLevel, setPermissionLevel] = useState(1);
  if (!open) return null;
  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginTop: 16 }}>
      <h3>Invite User</h3>
      <div>
        <label>Email</label><br />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
      </div>
      <div>
        <label>First name</label><br />
        <input value={firstName} onChange={e => setFirstName(e.target.value)} />
      </div>
      <div>
        <label>Last name</label><br />
        <input value={lastName} onChange={e => setLastName(e.target.value)} />
      </div>
      <div>
        <label>Permission level (1-5)</label><br />
        <input type="number" min={1} max={5} value={permissionLevel} onChange={e => setPermissionLevel(Number(e.target.value))} />
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => onSubmit({ email, firstName, lastName, permissionLevel })}>Invite</button>
        <button onClick={onClose} style={{ marginLeft: 8 }}>Cancel</button>
      </div>
    </div>
  );
}


