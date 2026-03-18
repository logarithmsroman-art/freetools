'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tool, Category } from '@/data/tools'

export default function HomeDashboard({ 
  initialTools, 
  categories 
}: { 
  initialTools: Tool[], 
  categories: (Category & { count: number })[] 
}) {
  const [query, setQuery] = useState('')

  const filtered = initialTools.filter(t => 
    t.name.toLowerCase().includes(query.toLowerCase()) || 
    t.desc.toLowerCase().includes(query.toLowerCase())
  )

  const popularTools = query ? filtered : initialTools.filter(t => t.isPopular)

  return (
    <div style={{ display: "flex", flex: 1, paddingTop: "3rem", gap: "4rem" }}>
      {/* Sidebar */}
      <aside style={{ width: "260px", flexShrink: 0 }} className="desktop-sidebar">
        <div style={{ position: "sticky", top: "2rem" }}>
          <div style={{ marginBottom: "2rem" }}>
            <input 
              type="text" 
              placeholder="Search tools..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ 
                width: "100%", 
                padding: "0.75rem 1rem", 
                borderRadius: "10px", 
                border: "1px solid var(--border-color)", 
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                outline: "none",
                fontSize: "0.9rem"
              }} 
            />
          </div>

          <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", marginBottom: "1rem", fontWeight: 600 }}>Categories</h3>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {categories.map(cat => (
              <li key={cat.id}>
                <Link href={`/tools?category=${cat.id}`} style={{ display: "flex", justifyContent: "space-between", color: "var(--text-primary)", padding: "0.6rem 0.8rem", borderRadius: "8px", textDecoration: "none" }} className="hover-bg">
                  <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{cat.name}</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", backgroundColor: "var(--bg-secondary)", padding: "2px 8px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>{cat.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, paddingBottom: "4rem" }}>
        <header style={{ marginBottom: "4rem" }}>
          <h1 style={{ fontSize: "3rem", marginBottom: "1rem", letterSpacing: "-1.5px", lineHeight: "1.1", fontWeight: 800 }}>Simplify your work. <br/>100% free online tools.</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem", maxWidth: "600px", lineHeight: "1.6" }}>
            A massive collection of professional utilities. All processing happens safely in your browser. No sign-ups, no limits.
          </p>
        </header>

        <section style={{ marginBottom: "4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{query ? 'Search Results' : 'Popular Tools'}</h2>
            {!query && <Link href="/tools" style={{ color: "var(--accent)", fontSize: "0.95rem", fontWeight: 600 }}>Explore all {initialTools.length} tools &rarr;</Link>}
          </div>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", 
            gap: "1.25rem" 
          }}>
            {popularTools.length > 0 ? (
              popularTools.map((tool) => (
                <Link key={tool.path} href={tool.path} className="card tool-card" style={{ padding: "1.5rem", display: "flex", gap: "1.25rem", alignItems: "flex-start", borderRadius: "12px" }}>
                  <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "10px", 
                    backgroundColor: "var(--accent-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                    color: "var(--accent)",
                    flexShrink: 0
                  }}>
                    {tool.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", marginBottom: "0.35rem", color: "var(--text-primary)", fontWeight: 700 }}>{tool.name}</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: "1.5" }}>{tool.desc}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div style={{ gridColumn: "1 / -1", padding: "4rem 2rem", textAlign: "center", backgroundColor: "var(--bg-secondary)", borderRadius: "12px", border: "1px dashed var(--border-color)" }}>
                 <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>No tools found matching "{query}"</p>
                 <button onClick={() => setQuery('')} style={{ marginTop: "1rem", color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Clear search</button>
              </div>
            )}
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-secondary)", padding: "3rem", borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "2rem", fontWeight: 700 }}>Why Use FreeTool?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "3rem" }}>
            <div>
              <strong style={{ display: "block", marginBottom: "0.75rem", fontSize: "1rem" }}>🛡️ Privacy First</strong>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6" }}>Your files never leave your computer. Processing happens locally in your browser.</p>
            </div>
            <div>
              <strong style={{ display: "block", marginBottom: "0.75rem", fontSize: "1rem" }}>⚡ Instant Processing</strong>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6" }}>No queues, no waiting. Get your results in milliseconds with zero lag.</p>
            </div>
            <div>
              <strong style={{ display: "block", marginBottom: "0.75rem", fontSize: "1rem" }}>🚀 Purely Free</strong>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6" }}>No subscriptions, no hidden limits, and no constant pop-ups asking for money.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
