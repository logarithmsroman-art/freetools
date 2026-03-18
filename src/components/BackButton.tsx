'use client'
import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()
  return (
    <button
      className="no-print"
      onClick={() => router.back()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        background: "none",
        border: "none",
        color: "var(--text-secondary)",
        fontSize: "0.9rem",
        cursor: "pointer",
        marginBottom: "2rem",
        padding: 0,
        fontWeight: 500
      }}
    >
      ← Back
    </button>
  )
}
