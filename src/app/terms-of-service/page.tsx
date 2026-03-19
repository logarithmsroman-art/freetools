import React from "react";

export default function TermsOfService() {
  return (
    <main className="container" style={{ padding: "4rem 1rem", maxWidth: "800px" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Terms of Service</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Last Updated: {new Date().toLocaleDateString()}</p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <section>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>1. Acceptance of Terms</h2>
          <p>
            By accessing or using FreeTool, you agree to be bound by these simple 
            Terms of Service. If you do not agree to these terms, simply do not use the website.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>2. Intended Use and Restrictions</h2>
          <p>
            This website provides completely free web-based utilities. You may use them as frequently 
            as you like without limits. However, any attempt to overwhelm the API limits, exploit our cloud 
            infrastructure, or programmatically scrape or abuse the site manually via scripts is strictly prohibited.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>3. Accuracy and "As-Is" Service</h2>
          <p>
            While we strive for high precision (such as in AI Transcriptions or Video Trimming), 
            we do not guarantee absolute 100% accuracy of any tool's output. The service is provided 
            strictly "AS IS" and "AS AVAILABLE," without warranties of any kind. 
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>4. Limitation of Liability</h2>
          <p>
            FreeTool, its creators, or partners shall not be held liable for any damages, 
            loss of data, corrupted media, or revenue loss resulting from the use or inability 
            to use our browser-based tools. 
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>5. File Processing</h2>
          <p>
            All heavily intensive file processing (e.g., video editing, PDF splitting) occurs securely 
            within your local device's memory. We hold no responsibility for caching, loss, or recovery 
            of files stored in entirely client-side browser sessions.
          </p>
        </section>
      </div>
    </main>
  );
}
