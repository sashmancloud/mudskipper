import { useState } from "react";

type Props = {
  open: boolean;
  currentLevel: number;
  email: string;
  onClose: () => void;
  onSubmit: (newLevel: number) => void;
};

export default function EditPermissionDialog({ open, currentLevel, email, onClose, onSubmit }: Props) {
  const [level, setLevel] = useState(currentLevel);
  if (!open) return null;
  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginTop: 16 }}>
      <h3>Edit Permission</h3>
      <div>{email}</div>
      <div>
        <label>Permission level (1-5)</label><br />
        <input type="number" min={1} max={5} value={level} onChange={e => setLevel(Number(e.target.value))} />
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => onSubmit(level)}>Save</button>
        <button onClick={onClose} style={{ marginLeft: 8 }}>Cancel</button>
      </div>
    </div>
  );
}


