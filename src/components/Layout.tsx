import Header from "./Header";
import FolderTree from "./FolderTree";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
    }}>
      <Header />
      <div style={{
        display: "flex",
        flex: 1,
        overflow: "hidden",
      }}>
        <aside style={{
          width: "280px",
          flexShrink: 0,
          overflow: "hidden",
        }}>
          <FolderTree />
        </aside>
        <main style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: "white",
          padding: "20px",
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}

