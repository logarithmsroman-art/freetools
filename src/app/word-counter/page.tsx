'use client'

import { useState } from 'react'
import BackButton from '@/components/BackButton'

export default function WordCounter() {
  const [text, setText] = useState('')

  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
  const charCount = text.length
  const charCountNoSpaces = text.replace(/\s/g, '').length
  const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length
  const paragraphCount = text.split(/\n+/).filter(Boolean).length

  return (
    <main className="container" style={{ padding: "4rem 1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
      <BackButton />
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", letterSpacing: "-0.5px" }}>Word Counter</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
          Instant and accurate count for words, characters, and sentences.
        </p>
      </header>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem" }}>
          <div className="card" style={{ padding: "1rem", textAlign: "center", backgroundColor: "var(--bg-primary)" }}>
            <span style={{ display: "block", fontSize: "1.5rem", fontWeight: "bold" }}>{wordCount}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Words</span>
          </div>
          <div className="card" style={{ padding: "1rem", textAlign: "center", backgroundColor: "var(--bg-primary)" }}>
            <span style={{ display: "block", fontSize: "1.5rem", fontWeight: "bold" }}>{charCount}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Chars</span>
          </div>
          <div className="card" style={{ padding: "1rem", textAlign: "center", backgroundColor: "var(--bg-primary)" }}>
            <span style={{ display: "block", fontSize: "1.5rem", fontWeight: "bold" }}>{sentenceCount}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Sentences</span>
          </div>
          <div className="card" style={{ padding: "1rem", textAlign: "center", backgroundColor: "var(--bg-primary)" }}>
            <span style={{ display: "block", fontSize: "1.5rem", fontWeight: "bold" }}>{paragraphCount}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Paragraphs</span>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type your content here for analysis..."
          style={{
            width: "100%",
            minHeight: "350px",
            padding: "1.5rem",
            fontSize: "1.1rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            resize: "vertical",
            fontFamily: "inherit",
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
            outline: "none",
            lineHeight: "1.6"
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          <span>Characters (no spaces): {charCountNoSpaces}</span>
          <button 
            onClick={() => setText('')} 
            style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.9rem" }}
          >
            Clear Text
          </button>
        </div>
      </div>

      <article style={{ marginTop: "4rem", color: "var(--text-secondary)", lineHeight: "1.8" }}>
        <h2 style={{ color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: "0.75rem" }}>About Word Counter</h2>
        <p>Paste or type any text and instantly see the word count, character count, sentence count, and paragraph count. Perfect for blog posts, essays, social media, and more.</p>
      </article>
    </main>
  )
}
