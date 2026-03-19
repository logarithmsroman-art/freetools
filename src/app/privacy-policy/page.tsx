import React from "react";

export default function PrivacyPolicy() {
  return (
    <main className="container" style={{ padding: "4rem 1rem", maxWidth: "800px" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Privacy Policy</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Effective Date: {new Date().toLocaleDateString()}</p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <section>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>1. Local Processing First</h2>
          <p>
            At FreeTool, your privacy is our core principle. The vast majority of our tools runs entirely inside 
            your browser using web technologies (like WebAssembly and client-side JavaScript). This means your videos, 
            audio files, and internal documents <strong>never leave your computer</strong> and are never uploaded to any server.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>2. What We Collect</h2>
          <p>
            We do not require accounts, sign-ups, or login credentials. We collect anonymous, aggregated usage data 
            (such as page views or which tools are most popular) simply to maintain and improve the site. This tracking 
            does not identify you personally.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>3. Third-Party Services</h2>
          <p>
            For tools that strictly require heavy AI processing (such as transcription), data is transmitted securely 
            to trusted third-party APIs strictly for that active session, and promptly discarded. We may also display 
            advertisements from trusted networks (like Google AdSense or Monetag) which may use cookies to personalize ads.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>4. Changes to this Policy</h2>
          <p>
            We reserve the right to update this privacy policy at any time. Because we do not store emails or accounts, 
            all updates will be posted directly to this page.
          </p>
        </section>
      </div>
    </main>
  );
}
