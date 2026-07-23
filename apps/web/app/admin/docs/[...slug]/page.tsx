import fs from 'fs'
import path from 'path'
import { parseMarkdown } from '@/lib/markdown'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string[] }>
}

export default async function DevDocPage({ params }: Props) {
  const { slug } = await params
  
  // Safe joining to prevent directory traversal
  const safeSlugPath = slug.map(s => s.replace(/[^a-zA-Z0-9-]/g, '')).join('/')
  
  try {
    const docPath = path.join(process.cwd(), '..', '..', 'docs', 'internal-devsguide', `${safeSlugPath}.md`)
    const rawContent = fs.readFileSync(docPath, 'utf8')
    const { elements, headings } = parseMarkdown(rawContent)
    
    return (
      <div className="dark flex xl:gap-16 lg:gap-10 pb-20 font-sans">
        
        {/* Main Document Content */}
        <article className="flex-1 min-w-0 max-w-4xl">
          {/* We wrap the output in a div that enforces typography and colors suited for dark mode */}
          <div className="prose prose-invert prose-emerald max-w-none">
            {elements}
          </div>
          
          <div className="mt-20 pt-8 border-t border-zinc-800 flex items-center justify-between text-sm text-zinc-500 font-mono">
            <p>INTERNAL_CONFIDENTIAL</p>
            <p>Updated: {new Date().toISOString().split('T')[0]}</p>
          </div>
        </article>
        
        {/* Right Sidebar: Table of Contents */}
        <div className="hidden xl:block w-64 shrink-0 font-mono">
          <div className="sticky top-24">
            <h4 className="font-bold text-white mb-4 text-xs tracking-widest uppercase">[TOC]</h4>
            {headings.length > 0 ? (
              <ul className="space-y-2">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a 
                      href={`#${heading.id}`}
                      className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors line-clamp-2"
                    >
                      &gt; {heading.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-zinc-600 italic">No headings found.</p>
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}
