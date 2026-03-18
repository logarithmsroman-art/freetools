import { login } from './actions'

export default function AdminDoorPage() {
  return (
    <main className="container" style={{ padding: "4rem 1.5rem", maxWidth: "400px" }}>
      <div className="card">
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", textAlign: "center" }}>Secret Access</h1>
        
        <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label htmlFor="email" style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Email:</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              style={{
                padding: "0.5rem",
                borderRadius: "6px",
                border: "1px solid var(--border-color)",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label htmlFor="password" style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Password:</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              style={{
                padding: "0.5rem",
                borderRadius: "6px",
                border: "1px solid var(--border-color)",
                outline: "none"
              }}
            />
          </div>

          <button formAction={login} className="btn-primary" style={{ marginTop: "1rem" }}>
            Unlock Dashboard
          </button>
        </form>
      </div>
    </main>
  )
}
