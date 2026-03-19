'use client'

import Link from "next/link";
import { useTheme } from "./ThemeProvider";

export default function Navbar() {
  const { theme, toggle } = useTheme()

  return (
    <nav style={{ padding: "1.5rem 0", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Link href="/" style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.5px", textDecoration: "none", display: "flex", alignItems: "center" }}>
        <span style={{ 
          color: 'var(--accent)', 
          textShadow: '0 0 12px var(--accent-light)', 
          fontStyle: 'italic', 
          marginRight: '2px',
          fontSize: '1.6rem',
          position: 'relative',
          top: '-1px'
        }}>F</span>
        <span style={{ color: 'var(--text-primary)' }}>reeTool</span>
      </Link>
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        {/* Theme Toggle Container */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
          <button
            onClick={toggle}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            style={{
              width: "40px",
              height: "24px",
              borderRadius: "50px",
              border: "none",
              backgroundColor: theme === 'dark' ? "var(--accent)" : "var(--border-color)",
              cursor: "pointer",
              position: "relative",
              transition: "background-color 0.3s ease",
              flexShrink: 0,
              padding: 0
            }}
            aria-label="Toggle dark mode"
          >
            <span style={{
              position: "absolute",
              top: "3px",
              left: theme === 'dark' ? "calc(100% - 21px)" : "3px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              backgroundColor: "#fff",
              transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px"
            }}>
              {theme === 'dark' ? '🌙' : '☀️'}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
