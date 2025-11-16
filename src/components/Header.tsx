import { useAuthenticator } from "@aws-amplify/ui-react";

export default function Header() {
  const { user, signOut } = useAuthenticator();

  return (
    <header style={{
      height: "60px",
      backgroundColor: "#1a1a1a",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      borderBottom: "1px solid #333",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}>Mudskipper</h1>
        <nav style={{ display: "flex", gap: "15px" }}>
          <a href="/" style={{ color: "white", textDecoration: "none" }}>Home</a>
          <a href="/admin" style={{ color: "white", textDecoration: "none" }}>Admin</a>
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <span style={{ fontSize: "0.9rem" }}>
          {user?.signInDetails?.loginId || "User"}
        </span>
        <button
          onClick={signOut}
          style={{
            padding: "8px 16px",
            backgroundColor: "#333",
            color: "white",
            border: "1px solid #555",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

