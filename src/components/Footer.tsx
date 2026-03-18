import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ padding: "2rem 0", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "auto" }}>
      <p>&copy; {new Date().getFullYear()} FreeTool. All rights reserved.</p>
      <div style={{ display: "flex", gap: "1.5rem" }}>
        <Link href="#" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Privacy Policy</Link>
        <Link href="#" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Terms of Service</Link>
      </div>
    </footer>
  );
}
