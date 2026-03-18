'use client'

import { useState } from 'react'

export default function CaseConverter() {
  const [text, setText] = useState('')

  const handleConvert = (type: 'upper' | 'lower' | 'title' | 'sentence' | 'clean') => {
    let newText = text

    switch (type) {
      case 'upper':
        newText = text.toUpperCase()
        break
      case 'lower':
        newText = text.toLowerCase()
        break
      case 'title':
        newText = text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
        break
      case 'sentence':
        newText = text.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, (c) => c.toUpperCase())
        break
      case 'clean':
        // Replace multiple spaces with a single space, and trim newlines/edges
        newText = text.replace(/ +/g, ' ').trim()
        break
    }

    setText(newText)
  }

  return (
    <main style={{ padding: "4rem 0", maxWidth: "800px" }}>
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>Case Converter</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
          Instantly convert your text to UPPERCASE, lowercase, Title Case, and more.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here..."
          style={{
            width: "100%",
            minHeight: "300px",
            padding: "1rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            resize: "vertical",
            fontFamily: "inherit",
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)"
          }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <button onClick={() => handleConvert('upper')} className="btn-primary" style={{ flex: "1 1 auto" }}>UPPERCASE</button>
          <button onClick={() => handleConvert('lower')} className="btn-primary" style={{ flex: "1 1 auto" }}>lowercase</button>
          <button onClick={() => handleConvert('title')} className="btn-primary" style={{ flex: "1 1 auto" }}>Title Case</button>
          <button onClick={() => handleConvert('sentence')} className="btn-primary" style={{ flex: "1 1 auto" }}>Sentence case</button>
          <button onClick={() => handleConvert('clean')} className="btn-primary" style={{ flex: "1 1 auto", backgroundColor: "var(--text-secondary)" }}>Clean Spaces</button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          <span>Character Count: {text.length}</span>
          <span>Word Count: {text.trim() === '' ? 0 : text.trim().split(/\s+/).length}</span>
        </div>
      </div>

      <article style={{ marginTop: "4rem", color: "var(--text-secondary)", lineHeight: "1.8" }}>
        <h2 style={{ color: "var(--text-primary)", fontSize: "1.5rem", marginBottom: "1rem" }}>Why Use a Case Converter?</h2>
        <p style={{ marginBottom: "1rem" }}>
          Formatting text manually can be a tedious and error-prone process, especially when dealing with large documents or data sets. A case converter tool automates this task, saving you valuable time and ensuring consistency across your content.
        </p>
        <p>
          Whether you need to standardize titles for a blog post (Title Case), format a casual message (lowercase), or shout on the internet (UPPERCASE 😂), this tool runs instantly inside your browser ensuring your text stays completely private.
        </p>
      </article>
    </main>
  )
}
