import AdminPage from "./pages/Admin";
import Layout from "./components/Layout";

function App() {
  // Minimal routing without adding a router: switch on pathname
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  if (path === "/admin") {
    return (
      <Layout>
        <AdminPage />
      </Layout>
    );
  }
  return (
    <Layout>
      <div>
        <h1>Welcome to Mudskipper</h1>
        <p>Quality Management System</p>
        <p>Document management, task tracking, and operational data.</p>
      </div>
    </Layout>
  );
}

export default App;
