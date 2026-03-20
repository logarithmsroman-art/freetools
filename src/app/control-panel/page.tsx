import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { TOOLS } from '@/data/tools'
import { updateToolSettings, updateToolLock, saveAnnouncement, toggleAnnouncement } from './actions'
import Link from 'next/link'

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ tab?: string, start?: string, end?: string }> }) {
  const p = await searchParams
  const tab = p.tab || 'popular'
  const filterStart = p.start
  const filterEnd = p.end
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/secret-admin-door')

  // Data Fetching
  const { data: configs } = await supabase.from('tool_configs').select('*')
  const configMap = Object.fromEntries(configs?.map(c => [c.id, c]) || [])

  const { data: announcements } = await supabase.from('site_announcements').select('*').order('created_at', { ascending: false })

  // --- Analytics Stats Logic ---
  const todayDate = new Date()
  const todayStr = todayDate.toISOString().split('T')[0]
  
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0]

  const firstOfThisMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1).toISOString()
  const firstOfLastMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1).toISOString()
  const lastOfLastMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 0, 23, 59, 59).toISOString()

  const { count: visitorsToday } = await supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('action', 'Page View').gte('created_at', todayStr)
  const { count: usageToday } = await supabase.from('analytics_events').select('*', { count: 'exact', head: true }).neq('action', 'Page View').gte('created_at', todayStr)

  const { count: visitorsYesterday } = await supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('action', 'Page View').gte('created_at', yesterdayStr).lt('created_at', todayStr)
  const { count: usageYesterday } = await supabase.from('analytics_events').select('*', { count: 'exact', head: true }).neq('action', 'Page View').gte('created_at', yesterdayStr).lt('created_at', todayStr)

  const { count: visitorsThisMonth } = await supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('action', 'Page View').gte('created_at', firstOfThisMonth)
  const { count: usageThisMonth } = await supabase.from('analytics_events').select('*', { count: 'exact', head: true }).neq('action', 'Page View').gte('created_at', firstOfThisMonth)

  const { count: visitorsLastMonth } = await supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('action', 'Page View').gte('created_at', firstOfLastMonth).lte('created_at', lastOfLastMonth)
  const { count: usageLastMonth } = await supabase.from('analytics_events').select('*', { count: 'exact', head: true }).neq('action', 'Page View').gte('created_at', firstOfLastMonth).lte('created_at', lastOfLastMonth)
  
  // Custom Date Range for the Tools Breakdown (defaults to this month)
  const activeStart = filterStart ? new Date(filterStart).toISOString() : firstOfThisMonth
  
  // To include the entirety of the end day, we add 23:59:59 to it if it's a simple YYYY-MM-DD
  const activeEndObj = filterEnd ? new Date(filterEnd) : new Date()
  if (filterEnd) activeEndObj.setHours(23, 59, 59, 999)
  const activeEnd = activeEndObj.toISOString()

  let toolViews: { tool: string, views: number }[] = []
  let toolUsage: { tool: string, views: number }[] = []
  if (tab === 'stats') {
    const [{ data: vData }, { data: uData }] = await Promise.all([
      supabase.rpc('get_analytics_summary', { start_d: activeStart, end_d: activeEnd, is_usage: false }),
      supabase.rpc('get_analytics_summary', { start_d: activeStart, end_d: activeEnd, is_usage: true })
    ])
    toolViews = vData || []
    toolUsage = uData || []
  }

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
           <SidebarItem icon="🌐" name="Visibility & Search" id="popular" />
           <SidebarItem icon="📊" name="Analytics" id="stats" />
           <SidebarItem icon="📢" name="Announcements" id="announcements" />
           <SidebarItem icon="🔒" name="Locked Tools" id="locks" />
        </aside>

        {/* Content Area */}
        <section className="card" style={{ padding: "2rem" }}>           {tab === 'popular' && (
            <div>
              <h2 style={{ marginBottom: "0.5rem" }}>Global Tool Management</h2>
              <p style={{ marginBottom: "1.5rem", fontSize: "0.85rem", opacity: 0.6 }}>Control tool visibility across the website and adjust display priority.</p>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                    <th style={{ padding: "1rem 0", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-secondary)" }}>Tool</th>
                    <th style={{ padding: "1rem 0", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-secondary)", textAlign: "right" }}>Settings</th>
                  </tr>
                </thead>
                <tbody>
                  {TOOLS.map(tool => {
                    const cfg = configMap[tool.path]
                    const isPop = cfg ? cfg.is_popular : tool.isPopular
                    const rank = cfg ? cfg.order_rank : 999
                    const isEnabled = cfg ? (cfg.is_enabled !== false) : true
                    return (
                      <tr key={tool.path} style={{ borderBottom: "1px solid var(--border-color)", opacity: isEnabled ? 1 : 0.6 }}>
                        <td style={{ padding: "1.25rem 0" }}>
                          <div style={{ fontWeight: 600 }}>{tool.name}</div>
                          <div style={{ fontSize: "0.75rem", opacity: 0.5 }}>{tool.path}</div>
                        </td>
                        <td style={{ padding: "1.25rem 0" }}>
                          <form action={async (formData) => {
                            'use server'
                            const active = formData.get('is_enabled') === 'true'
                            const pop = formData.get('status') === 'true'
                            const r = parseInt(formData.get('rank') as string) || 999
                            const { updateToolSettings } = await import('./actions')
                            await updateToolSettings(tool.path, pop, r, active)
                          }} style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", alignItems: "center" }}>
                              
                              <select name="is_enabled" defaultValue={isEnabled ? 'true' : 'false'} style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: isEnabled ? "var(--accent-light)" : "transparent" }}>
                                <option value="true">🟢 Active</option>
                                <option value="false">⚪ Hidden</option>
                              </select>

                              <input type="number" name="rank" defaultValue={rank} placeholder="Rank" style={{ width: "80px", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)" }} />
                              
                              <select name="status" defaultValue={isPop ? 'true' : 'false'} style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                                <option value="true">⭐ Popular</option>
                                <option value="false">Standard</option>
                              </select>

                              <button className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}>Save</button>
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
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
                 <div className="card" style={{ padding: "1.5rem" }}>
                    <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.6, marginBottom: "0.5rem" }}>Today</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div><span style={{ fontSize: "2rem", fontWeight: 800 }}>{visitorsToday || 0}</span> <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>Visitors</span></div>
                      <div><span style={{ fontSize: "2rem", fontWeight: 800 }}>{usageToday || 0}</span> <span style={{ fontSize: "0.8rem", color: "var(--accent)" }}>Actions</span></div>
                    </div>
                 </div>
                 <div className="card" style={{ padding: "1.5rem" }}>
                    <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.6, marginBottom: "0.5rem" }}>Yesterday</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div><span style={{ fontSize: "2rem", fontWeight: 800 }}>{visitorsYesterday || 0}</span> <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>Visitors</span></div>
                      <div><span style={{ fontSize: "2rem", fontWeight: 800 }}>{usageYesterday || 0}</span> <span style={{ fontSize: "0.8rem", color: "var(--accent)" }}>Actions</span></div>
                    </div>
                 </div>
                 <div className="card" style={{ padding: "1.5rem" }}>
                    <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.6, marginBottom: "0.5rem" }}>This Month</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div><span style={{ fontSize: "2rem", fontWeight: 800 }}>{visitorsThisMonth || 0}</span> <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>Visitors</span></div>
                      <div><span style={{ fontSize: "2rem", fontWeight: 800 }}>{usageThisMonth || 0}</span> <span style={{ fontSize: "0.8rem", color: "var(--accent)" }}>Actions</span></div>
                    </div>
                 </div>
                 <div className="card" style={{ padding: "1.5rem" }}>
                    <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.6, marginBottom: "0.5rem" }}>Last Month</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div><span style={{ fontSize: "2rem", fontWeight: 800 }}>{visitorsLastMonth || 0}</span> <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>Visitors</span></div>
                      <div><span style={{ fontSize: "2rem", fontWeight: 800 }}>{usageLastMonth || 0}</span> <span style={{ fontSize: "0.8rem", color: "var(--accent)" }}>Actions</span></div>
                    </div>
                 </div>
              </div>

              <h3 style={{ marginBottom: "1rem" }}>Tool Performance Breakdown</h3>
              <form method="GET" action="/control-panel" style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "2rem" }}>
                <input type="hidden" name="tab" value="stats" />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.75rem", opacity: 0.7 }}>Start Date</label>
                  <input type="date" name="start" defaultValue={filterStart || firstOfThisMonth.split('T')[0]} style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.75rem", opacity: 0.7 }}>End Date</label>
                  <input type="date" name="end" defaultValue={filterEnd || todayStr} style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)" }} />
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: "1.2rem", padding: "0.5rem 1rem" }}>Filter</button>
              </form>

              <div className="responsive-grid-2" style={{ gap: "2.5rem" }}>
                <div>
                  <h4 style={{ fontSize: "0.9rem", color: "var(--accent)", marginBottom: "1rem" }}>Actual Tool Usage (Actions)</h4>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                        <th style={{ padding: "1rem 0", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-secondary)" }}>Tool Path</th>
                        <th style={{ padding: "1rem 0", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-secondary)", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {toolUsage.length === 0 ? (
                        <tr><td colSpan={2} style={{ padding: "2rem 0", textAlign: "center", opacity: 0.5 }}>No usage recorded.</td></tr>
                      ) : (
                        toolUsage.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                            <td style={{ padding: "1rem 0", fontWeight: 600 }}>{item.tool}</td>
                            <td style={{ padding: "1rem 0", textAlign: "right", fontWeight: 800, color: "var(--accent)" }}>{item.views.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>Page Views (Visitors)</h4>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                        <th style={{ padding: "1rem 0", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-secondary)" }}>Tool Path</th>
                        <th style={{ padding: "1rem 0", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-secondary)", textAlign: "right" }}>Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {toolViews.length === 0 ? (
                        <tr><td colSpan={2} style={{ padding: "2rem 0", textAlign: "center", opacity: 0.5 }}>No data found.</td></tr>
                      ) : (
                        toolViews.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                            <td style={{ padding: "1rem 0", fontWeight: 600 }}>{item.tool}</td>
                            <td style={{ padding: "1rem 0", textAlign: "right", fontWeight: 800 }}>{item.views.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "1rem" }}>Note: We track users anonymously via LocalStorage Shadow IDs. Total unique user sessions are counted per page view natively in the browser without cookies.</p>
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
