import Link from 'next/link'

export default function ToolUnavailablePage() {
  return (
    <main className="container" style={{ padding: "8rem 1.5rem", textAlign: "center", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{ maxWidth: "500px", padding: "3rem 2rem" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>🛠️</div>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "1rem", fontWeight: 800 }}>Tool Temporarily Unavailable</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.6 }}>
          This tool is currently undergoing maintenance or has been temporarily removed from the platform. 
          Please check back later or explore our other free AI tools.
        </p>
        
        <Link href="/" className="btn-primary" style={{ display: "inline-block", padding: "0.75rem 2rem", textDecoration: "none" }}>
          Back to All Tools
        </Link>
      </div>
    </main>
  )
}
