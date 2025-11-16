import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import AdminPage from "./pages/Admin";
import Layout from "./components/Layout";

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }
    
  function deleteTodo(id: string) {
    client.models.Todo.delete({ id })
  }

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
        
        <div style={{ marginTop: "30px" }}>
          <h2>Demo: Todos</h2>
          <button onClick={createTodo}>+ new</button>
          <ul>
            {todos.map((todo) => (
              <li 
                onClick={() => deleteTodo(todo.id)}
                key={todo.id}
              >
                {todo.content}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  );
}

export default App;
