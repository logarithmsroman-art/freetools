import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { TOOLS } from '@/data/tools'
import { togglePopularity, updateToolLock, saveAnnouncement, toggleAnnouncement } from './actions'
import Link from 'next/link'

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tab = (await searchParams).tab || 'popular'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/secret-admin-door')

  // Data Fetching
  const { data: configs } = await supabase.from('tool_configs').select('*')
  const configMap = Object.fromEntries(configs?.map(c => [c.id, c]) || [])

  const { data: announcements } = await supabase.from('site_announcements').select('*').order('created_at', { ascending: false })

  // Analytics Stats (Simplified for MVP)
  const today = new Date().toISOString().split('T')[0]
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = yesterdayDate.toISOString().split('T')[0]

  const { count: viewsToday } = await supabase.from('analytics_events').select('*', { count: 'exact', head: true }).gte('created_at', today)
  const { count: viewsYesterday } = await supabase.from('analytics_events').select('*', { count: 'exact', head: true }).gte('created_at', yesterday).lt('created_at', today)

  const SidebarItem = ({ name, icon, id }: { name: string, icon: string, id: string }) => (
    <Link 
      href={`/control-panel?tab=${id}`}
      style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "0.75rem", 
        padding: "0.85rem 1rem", 
        borderRadius: "8px",
        backgroundColor: tab === id ? "var(--accent)" : "transparent",
        color: tab === id ? "#fff" : "var(--text-primary)",
        textDecoration: "none",
        fontWeight: 600,
        fontSize: "0.9rem",
        transition: "all 0.2s"
      }}
    >
      <span>{icon}</span> {name}
    </Link>
  )

  return (
    <main style={{ padding: "3rem 0", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
         <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-1px" }}>Control Center</h1>
         <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
           <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>{user.email}</span>
           <form action="/auth/signout" method="post">
             <button type="submit" style={{ padding: "0.5rem 1rem", borderRadius: "6px", border: "1px solid var(--border-color)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>Sign Out</button>
           </form>
         </div>
      </div>

      <div className="responsive-grid-sidebar" style={{ gap: "2.5rem" }}>
        {/* Sidebar */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
           <SidebarItem icon="⭐" name="Top Tools" id="popular" />
           <SidebarItem icon="📊" name="Analytics" id="stats" />
           <SidebarItem icon="📢" name="Announcements" id="announcements" />
           <SidebarItem icon="🔒" name="Locked Tools" id="locks" />
        </aside>

        {/* Content Area */}
        <section className="card" style={{ padding: "2rem" }}>
          
          {tab === 'popular' && (
            <div>
              <h2 style={{ marginBottom: "1.5rem" }}>Popular Tools Management</h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                    <th style={{ padding: "1rem 0", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-secondary)" }}>Tool</th>
                    <th style={{ padding: "1rem 0", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-secondary)", textAlign: "center" }}>Visible Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {TOOLS.map(tool => {
                    const cfg = configMap[tool.path]
                    const isPop = cfg ? cfg.is_popular : tool.isPopular
                    const rank = cfg ? cfg.order_rank : 999
                    return (
                      <tr key={tool.path} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "1rem 0" }}>
                          <div style={{ fontWeight: 600 }}>{tool.name}</div>
                          <div style={{ fontSize: "0.75rem", opacity: 0.5 }}>{tool.path}</div>
                        </td>
                        <td style={{ padding: "1rem 0" }}>
                          <form action={async (formData) => {
                            'use server'
                            const pop = formData.get('status') === 'true'
                            const r = parseInt(formData.get('rank') as string) || 999
                            await togglePopularity(tool.path, pop, r)
                          }} style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                             <input type="number" name="rank" defaultValue={rank} style={{ width: "60px", padding: "0.4rem", borderRadius: "4px", border: "1px solid var(--border-color)" }} />
                             <select name="status" defaultValue={isPop ? 'true' : 'false'} style={{ padding: "0.4rem", borderRadius: "4px", border: "1px solid var(--border-color)" }}>
                               <option value="true">Show</option>
                               <option value="false">Hide</option>
                             </select>
                             <button className="btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}>Save</button>
                          </form>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'stats' && (
            <div>
              <h2 style={{ marginBottom: "1.5rem" }}>User Analytics</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "3rem" }}>
                 <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
                    <div style={{ fontSize: "2.5rem", fontWeight: 800 }}>{viewsToday || 0}</div>
                    <div style={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "1px", opacity: 0.6 }}>Views Today</div>
                 </div>
                 <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
                    <div style={{ fontSize: "2.5rem", fontWeight: 800 }}>{viewsYesterday || 0}</div>
                    <div style={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "1px", opacity: 0.6 }}>Views Yesterday</div>
                 </div>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Note: We track users anonymously via Shadow IDs. Total unique user sessions are counted per page view.</p>
            </div>
          )}

          {tab === 'announcements' && (
            <div>
              <h2 style={{ marginBottom: "1.5rem" }}>Site Announcements</h2>
              <form action={async (formData) => {
                'use server'
                const msg = formData.get('message') as string
                const active = formData.get('active') === 'on'
                await saveAnnouncement(msg, active)
              }} style={{ marginBottom: "3rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                 <textarea name="message" placeholder="What is the announcement?" required style={{ width: "100%", height: "100px", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-color)" }} />
                 <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                   <input type="checkbox" name="active" /> Make active immediately
                 </label>
                 <button className="btn-primary" style={{ height: "3.5rem" }}>Publish Announcement</button>
              </form>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {announcements?.map(a => (
                  <div key={a.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                       <div style={{ fontWeight: 600 }}>{a.message}</div>
                       <div style={{ fontSize: "0.7rem", opacity: 0.5 }}>{new Date(a.created_at).toLocaleString()}</div>
                    </div>
                    <form action={async () => {
                      'use server'
                      await toggleAnnouncement(a.id, !a.is_active)
                    }}>
                      <button className="btn-primary" style={{ backgroundColor: a.is_active ? "#ef4444" : "var(--accent)" }}>
                        {a.is_active ? "Disable" : "Enable"}
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'locks' && (
            <div>
              <h2 style={{ marginBottom: "1.5rem" }}>Locked Tools</h2>
              <p style={{ marginBottom: "2rem", color: "var(--text-secondary)" }}>When a tool is locked, users will see a maintenance message instead of the tool interface.</p>
              
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                    <th style={{ padding: "1rem 0", fontSize: "0.75rem", textTransform: "uppercase" }}>Tool</th>
                    <th style={{ padding: "1rem 0", fontSize: "0.75rem", textTransform: "uppercase" }}>Status & Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {TOOLS.map(tool => {
                    const cfg = configMap[tool.path]
                    const locked = cfg?.is_locked || false
                    const reason = cfg?.lock_reason || ''
                    return (
                      <tr key={tool.path} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "1rem 0" }}>
                           <div style={{ fontWeight: 600 }}>{tool.name}</div>
                        </td>
                        <td style={{ padding: "1rem 0" }}>
                          <form action={async (formData) => {
                            'use server'
                            const isL = formData.get('is_locked') === 'true'
                            const re = formData.get('reason') as string
                            await updateToolLock(tool.path, isL, re)
                          }} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.5rem" }}>
                             <select name="is_locked" defaultValue={locked ? 'true' : 'false'} style={{ padding: "0.4rem", borderRadius: "4px", border: "1px solid var(--border-color)" }}>
                               <option value="false">🔓 Open</option>
                               <option value="true">🔒 Locked</option>
                             </select>
                             <input name="reason" placeholder="Reason for locking" defaultValue={reason} style={{ padding: "0.4rem", borderRadius: "4px", border: "1px solid var(--border-color)" }} />
                             <button className="btn-primary" style={{ fontSize: "0.75rem" }}>Update</button>
                          </form>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

        </section>
      </div>
    </main>
  )
}
