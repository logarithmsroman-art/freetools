'use client'

import { useState, useEffect } from 'react'
import { trackToolUsage } from '@/components/AnalyticsTracker'

const CURRENCIES = [
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '€', code: 'EUR', name: 'Euro' },
  { symbol: '£', code: 'GBP', name: 'British Pound' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
  { symbol: '₦', code: 'NGN', name: 'Nigerian Naira' },
  { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
]

export default function ReceiptGenerator() {
  const [mounted, setMounted] = useState(false)
  const [storeName, setStoreName] = useState('Central Perk Cafe')
  const [storeAddress, setStoreAddress] = useState('123 Greenwich St, New York')
  const [storePhone, setStorePhone] = useState('+1 (555) 012-3456')
  const [currency, setCurrency] = useState(CURRENCIES[0])
  const [items, setItems] = useState([{ id: 1, name: 'Cappuccino', price: 4.50, qty: 1 }])
  const [taxRate, setTaxRate] = useState(8.875)
  const [id, setId] = useState(`ORD-${Math.floor(Math.random() * 900000) + 100000}`)

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax

  const addItem = () => setItems([...items, { id: Date.now(), name: 'New Item', price: 0, qty: 1 }])
  const removeItem = (id: number) => setItems(items.filter(item => item.id !== id))
  
  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <main className="container" style={{ padding: "4rem 0", maxWidth: "1100px" }}>
      <header style={{ marginBottom: "3rem" }}>
         <h1 style={{ fontSize: "2.5rem", letterSpacing: "-1.5px", fontWeight: 800 }}>Receipt Generator</h1>
         <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Create professional, beautiful receipts for your business or personal records.</p>
      </header>

      <div className="print-layout-reset responsive-grid-main" style={{ gap: "3rem", alignItems: "flex-start" }}>
        {/* Editor */}
        <div className="card no-print" style={{ padding: "2rem" }}>
          <h3 style={{ marginBottom: "1.5rem" }}>Details</h3>
          
          <div className="responsive-grid-2" style={{ gap: "1.5rem", marginBottom: "2rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Store Name</label>
              <input value={storeName} onChange={e => setStoreName(e.target.value)} className="input-field" style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Order ID</label>
              <input value={id} onChange={e => setId(e.target.value)} className="input-field" style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)" }} />
            </div>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Store Address</label>
            <input value={storeAddress} onChange={e => setStoreAddress(e.target.value)} className="input-field" style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)" }} />
          </div>

          <div style={{ marginBottom: "2rem" }}>
             <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Currency & Tax</label>
             <div style={{ display: "flex", gap: "1rem" }}>
               <select onChange={(e) => setCurrency(CURRENCIES.find(c => c.code === e.target.value)!)} style={{ flex: 1, padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
               </select>
               <input type="number" step="0.001" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value))} style={{ width: "80px", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }} />
               <span style={{ display: "flex", alignItems: "center", paddingTop: "0.75rem" }}>% Tax</span>
             </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
             <h4 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>Items</h4>
             {items.map((item, idx) => (
               <div key={item.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 40px", gap: "1rem", marginBottom: "0.75rem" }}>
                 <input placeholder="Item" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border-color)" }} />
                 <input type="number" placeholder="Price" value={item.price} onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value))} style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border-color)" }} />
                 <input type="number" placeholder="Qty" value={item.qty} onChange={e => updateItem(item.id, 'qty', parseInt(e.target.value))} style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border-color)" }} />
                 <button onClick={() => removeItem(item.id)} style={{ color: "red", border: "none", background: "none", cursor: "pointer" }}>✕</button>
               </div>
             ))}
             <button onClick={addItem} style={{ width: "100%", padding: "0.75rem", marginTop: "1rem", border: "1px dashed var(--accent)", color: "var(--accent)", background: "none", cursor: "pointer", borderRadius: "6px", fontWeight: 700 }}>+ Add Item</button>
          </div>
        </div>

        {/* Preview */}
        <div className="receipt-wrapper" style={{ position: "sticky", top: "2rem" }}>
           <div className="receipt-paper" style={{ 
             backgroundColor: "#fff", 
             padding: "3rem 2rem", 
             boxShadow: "0 10px 30px rgba(0,0,0,0.1)", 
             borderRadius: "2px",
             color: "#000",
             fontFamily: "'Courier New', Courier, monospace",
             minHeight: "500px",
             display: "flex",
             flexDirection: "column",
             margin: "0 auto",
             width: "100%",
             maxWidth: "400px" // Exact hardware print size limit roughly
           }}>
             <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.5rem", margin: "0 0 0.5rem", textTransform: "uppercase" }}>{storeName}</h2>
                <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>{storeAddress}</p>
                <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>{storePhone}</p>
                <p style={{ fontSize: "0.85rem", margin: "1rem 0" }}>ID: {id}</p>
             </div>

             <div style={{ borderTop: "1px dashed #ccc", borderBottom: "1px dashed #ccc", padding: "1.5rem 0", margin: "1rem 0" }}>
               {items.map(item => (
                 <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <span>{item.qty}x {item.name}</span>
                    <span>{currency.symbol}{(item.price * item.qty).toFixed(2)}</span>
                 </div>
               ))}
             </div>

             <div style={{ marginLeft: "auto", width: "100%", maxWidth: "200px", marginTop: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                   <span>Subtotal:</span>
                   <span>{currency.symbol}{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                   <span>Tax ({taxRate}%):</span>
                   <span>{currency.symbol}{tax.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.25rem", fontWeight: "bold", borderTop: "2px solid #000", marginTop: "1rem", paddingTop: "0.5rem" }}>
                   <span>TOTAL:</span>
                   <span>{currency.symbol}{total.toFixed(2)}</span>
                </div>
             </div>

             <div style={{ textAlign: "center", marginTop: "auto", paddingTop: "3rem", fontSize: "0.75rem", opacity: 0.5 }}>
                <p>Thank you for shopping with us!</p>
                <p>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
             </div>
           </div>

           <button 
             onClick={() => { trackToolUsage('Receipt Exported'); window.print(); }}
             className="btn-primary" 
             style={{ width: "100%", marginTop: "2rem", height: "3.5rem" }}
           >
             Print / Save as PDF
           </button>
        </div>
      </div>
    </main>
  )
}
