'use client'

import { useState } from "react"
import Link from "next/link";
import { TOOLS, CATEGORIES } from "@/data/tools";

export default function AllToolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  const filteredTools = TOOLS.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategories.length === 0 || activeCategories.includes(t.categoryId);
    return matchesSearch && matchesCategory;
  });

  return (
    <main style={{ flex: 1, padding: "4rem 0" }}>
      <header style={{ marginBottom: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", letterSpacing: "-1.5px" }}>Tool Directory</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto 2.5rem" }}>
          Explore our complete directory of {TOOLS.length} free browser-based utilities. 100% private, 100% free.
        </p>
        
        {/* Professional Search Bar */}
        <div style={{ maxWidth: "600px", margin: "0 auto", position: "relative" }}>
          <input 
            type="text" 
            placeholder="Search for a tool (e.g. PDF, Text, Image)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "1rem 1.5rem", 
              borderRadius: "12px", 
              border: "1px solid var(--border-color)", 
              fontSize: "1rem",
              backgroundColor: "var(--bg-secondary)",
              boxShadow: "var(--shadow-sm)",
              outline: "none",
              transition: "border-color 0.2s ease"
            }} 
            className="search-input"
          />
        </div>
      </header>

      {/* Category Pills (Multi-Select) */}
      <nav style={{ 
        display: "flex", 
        flexWrap: "wrap",
        gap: "0.6rem", 
        justifyContent: "center",
        marginBottom: "2.5rem", 
        paddingBottom: "1rem",
        borderBottom: "1px solid var(--border-color)",
        position: "sticky",
        top: "0",
        backgroundColor: "var(--bg-primary)",
        zIndex: 10
      }}>
        {CATEGORIES.map(cat => {
          const isActive = activeCategories.includes(cat.id);
          return (
            <button 
              key={cat.id}
              onClick={() => {
                setActiveCategories(prev => 
                  prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                )
              }}
              style={{ 
                padding: "0.45rem 1.1rem", 
                borderRadius: "50px", 
                border: isActive ? "1px solid var(--accent)" : "1px solid var(--border-color)",
                backgroundColor: isActive ? "var(--accent)" : "transparent",
                color: isActive ? "#fff" : "var(--text-secondary)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.85rem",
                transition: "all 0.2s"
              }}
            >
              {cat.name}
            </button>
          )
        })}
      </nav>

      {/* Tools Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
        gap: "1.25rem" 
      }}>
        {filteredTools.length > 0 ? (
          filteredTools.map((tool) => (
            <Link key={tool.path} href={tool.path} className="card tool-card" style={{ padding: "1rem", display: "flex", gap: "0.85rem", alignItems: "flex-start", borderRadius: "10px" }}>
              <div style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "8px", 
                backgroundColor: "var(--accent-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.15rem",
                color: "var(--accent)",
                flexShrink: 0,
                fontWeight: "bold"
              }}>
                {tool.icon}
              </div>
              <div style={{ overflow: "hidden" }}>
                <h3 style={{ fontSize: "0.95rem", marginBottom: "0.2rem", color: "var(--text-primary)", fontWeight: 700 }}>{tool.name}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: "1.4" }}>{tool.desc}</p>
              </div>
            </Link>
          ))
        ) : (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "4rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
            <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>No tools found</h3>
            <p style={{ color: "var(--text-secondary)" }}>We couldn't find any results for "{searchQuery}"</p>
            <button 
              onClick={() => { setSearchQuery(""); setActiveCategories([]); }}
              style={{ marginTop: "1.5rem", padding: "0.75rem 1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)", cursor: "pointer", backgroundColor: "var(--bg-secondary)" }}
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
