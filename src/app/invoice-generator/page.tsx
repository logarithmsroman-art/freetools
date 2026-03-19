'use client'

import { useState, useEffect } from 'react'
import BackButton from '@/components/BackButton'
import { trackToolUsage } from '@/components/AnalyticsTracker'

interface LineItem {
  id: string
  description: string
  quantity: number
  price: number
}

export default function InvoiceGenerator() {
  const [mounted, setMounted] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState('INV-1001')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [currency, setCurrency] = useState('$')
  
  const [companyInfo, setCompanyInfo] = useState("Your Company Name\n123 Business Rd\nCity, State 12345")
  const [clientInfo, setClientInfo] = useState("Client Name\nClient Address")
  
  const [items, setItems] = useState<LineItem[]>([{ id: '1', description: 'Web Development Services', quantity: 1, price: 500 }])
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState("Thank you for your business.")

  const addItem = () => setItems([...items, { id: Math.random().toString(), description: '', quantity: 1, price: 0 }])
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id))
  
  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const handlePrint = () => {
    trackToolUsage('Invoice Exported')
    window.print()
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <main className="container" style={{ padding: "4rem 0", maxWidth: "900px" }}>
      <BackButton />

      <header style={{ textAlign: "center", marginBottom: "3rem" }} className="no-print">
        <h1 style={{ fontSize: "2.5rem", letterSpacing: "-1.5px", fontWeight: 800 }}>Professional Invoice Generator</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Create, customize, and save beautiful PDF invoices instantly.</p>
      </header>

      {/* Actual Printable Invoice Card */}
      <div className="card" id="invoice-paper" style={{ padding: "3rem", backgroundColor: "#fff", color: "#000" }}>
        
        {/* Top Header */}
        <div className="responsive-flex-col" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3rem", gap: "2rem" }}>
          <div>
            <h2 style={{ fontSize: "2rem", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, color: "var(--accent)", marginBottom: "1rem" }}>INVOICE</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }} className="no-print">
                <span style={{ fontWeight: 600, width: "70px" }}>Number:</span>
                <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} style={{ border: "1px dashed #ccc", padding: "2px", width: "120px" }} />
              </div>
              <div style={{ display: "none" }} className="print-only"><strong>Invoice #:</strong> {invoiceNumber}</div>

              <div style={{ display: "flex", gap: "0.5rem" }} className="no-print">
                <span style={{ fontWeight: 600, width: "70px" }}>Date:</span>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ border: "1px dashed #ccc", padding: "2px", width: "120px" }} />
              </div>
              <div style={{ display: "none" }} className="print-only"><strong>Date:</strong> {date}</div>

              <div style={{ display: "flex", gap: "0.5rem" }} className="no-print">
                <span style={{ fontWeight: 600, width: "70px" }}>Due Date:</span>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ border: "1px dashed #ccc", padding: "2px", width: "120px" }} />
              </div>
              {dueDate && <div style={{ display: "none" }} className="print-only"><strong>Due Date:</strong> {dueDate}</div>}
            </div>
          </div>

          <div className="no-print" style={{ textAlign: "right", border: "1px dashed #ccc", padding: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "#666", display: "block", marginBottom: "0.5rem" }}>Your Company Info (Editable)</span>
            <textarea value={companyInfo} onChange={e => setCompanyInfo(e.target.value)} style={{ width: "100%", maxWidth: "250px", height: "80px", textAlign: "right", border: "none", resize: "none", fontWeight: 600, fontSize: "1rem" }} />
          </div>
          <div className="print-only" style={{ textAlign: "right", whiteSpace: "pre-wrap", fontWeight: 600 }}>{companyInfo}</div>
        </div>

        {/* Bill To */}
        <div style={{ marginBottom: "3rem" }}>
          <h3 style={{ fontSize: "1rem", color: "#666", borderBottom: "2px solid #eee", paddingBottom: "0.5rem", marginBottom: "1rem", textTransform: "uppercase" }}>Bill To</h3>
          <textarea className="no-print" value={clientInfo} onChange={e => setClientInfo(e.target.value)} style={{ width: "100%", maxWidth: "300px", height: "80px", border: "1px dashed #ccc", resize: "none", fontSize: "1rem" }} />
          <div className="print-only" style={{ whiteSpace: "pre-wrap" }}>{clientInfo}</div>
        </div>

        {/* Currency select (hidden on print) */}
        <div className="no-print" style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, marginRight: "0.5rem" }}>Currency Symbol:</label>
          <input type="text" value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: "40px", padding: "0.2rem", border: "1px solid #ccc", textAlign: "center" }} />
        </div>

        {/* Items Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2rem" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "2px solid #ccc" }}>Description</th>
              <th style={{ padding: "0.75rem", textAlign: "center", borderBottom: "2px solid #ccc", width: "80px" }}>Qty</th>
              <th style={{ padding: "0.75rem", textAlign: "right", borderBottom: "2px solid #ccc", width: "120px" }}>Price</th>
              <th style={{ padding: "0.75rem", textAlign: "right", borderBottom: "2px solid #ccc", width: "120px" }}>Total</th>
              <th className="no-print" style={{ width: "40px", borderBottom: "2px solid #ccc" }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "0.75rem" }}>
                  <input className="no-print" type="text" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} style={{ width: "100%", border: "1px dashed #ccc", padding: "4px" }} placeholder="Item description" />
                  <span className="print-only">{item.description}</span>
                </td>
                <td style={{ padding: "0.75rem", textAlign: "center" }}>
                  <input className="no-print" type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} style={{ width: "60px", border: "1px dashed #ccc", padding: "4px", textAlign: "center" }} />
                  <span className="print-only">{item.quantity}</span>
                </td>
                <td style={{ padding: "0.75rem", textAlign: "right" }}>
                  <div className="no-print" style={{ display: "inline-flex", alignItems: "center" }}>
                    <span>{currency}</span>
                    <input type="number" min="0" step="0.01" value={item.price} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} style={{ width: "80px", border: "1px dashed #ccc", padding: "4px", textAlign: "right", marginLeft: "4px" }} />
                  </div>
                  <span className="print-only">{currency}{item.price.toFixed(2)}</span>
                </td>
                <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 600 }}>
                  {currency}{(item.quantity * item.price).toFixed(2)}
                </td>
                <td className="no-print" style={{ textAlign: "center" }}>
                  <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "red", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <button onClick={addItem} className="no-print btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", marginBottom: "3rem" }}>+ Add Line Item</button>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "3rem" }}>
          <div style={{ width: "100%", maxWidth: "300px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
              <span style={{ color: "#666" }}>Subtotal</span>
              <span>{currency}{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #eee", alignItems: "center" }}>
              <span style={{ color: "#666" }}>
                Tax Rate 
                <span className="no-print" style={{ marginLeft: "0.5rem" }}>(<input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} style={{ width: "40px", padding: "2px", border: "1px dashed #ccc" }} />%)</span>
                <span className="print-only"> ({taxRate}%)</span>
              </span>
              <span>{currency}{taxAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem 0", borderBottom: "2px solid var(--accent)", fontSize: "1.25rem", fontWeight: 800 }}>
              <span>Total Due</span>
              <span>{currency}{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <h3 style={{ fontSize: "0.85rem", color: "#666", textTransform: "uppercase", marginBottom: "0.5rem" }}>Notes / Instructions</h3>
          <textarea className="no-print" value={notes} onChange={e => setNotes(e.target.value)} style={{ width: "100%", height: "60px", border: "1px dashed #ccc", resize: "none", padding: "4px" }} />
          <div className="print-only" style={{ whiteSpace: "pre-wrap", color: "#444" }}>{notes}</div>
        </div>
      </div>

      <div className="no-print" style={{ marginTop: "2rem", textAlign: "center" }}>
        <button onClick={handlePrint} className="btn-primary" style={{ padding: "1.25rem 3rem", fontSize: "1.1rem" }}>
          💾 Save & Download PDF
        </button>
      </div>

    </main>
  )
}
