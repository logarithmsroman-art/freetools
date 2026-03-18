import { createClient } from '@/utils/supabase/server'
import { TOOLS, CATEGORIES } from "@/data/tools";
import HomeDashboard from "@/components/HomeDashboard";

export default async function Home() {
  const supabase = await createClient()
  
  // Fetch popularity configs from Supabase
  const { data: configs, error } = await supabase.from('tool_configs').select('*')
  
  const configMap = Object.fromEntries(configs?.map(c => [c.id, c]) || [])

  // Merge static data with dynamic DB popularity
  let dynamicTools = TOOLS.map(tool => {
    const config = configMap[tool.path]
    return {
      ...tool,
      isPopular: config ? config.is_popular : tool.isPopular,
      orderRank: config ? config.order_rank : 999
    }
  })

  // Sort tools so that those with lower orderRank appear first among popular tools
  dynamicTools = dynamicTools.sort((a, b) => a.orderRank - b.orderRank)

  const categoriesWithCounts = CATEGORIES.map(cat => ({
    ...cat,
    count: dynamicTools.filter(t => t.categoryId === cat.id).length
  }));

  return <HomeDashboard initialTools={dynamicTools} categories={categoriesWithCounts} />
}
