import fs from 'fs'
import path from 'path'
import { parseMarkdown } from '@/lib/markdown'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function HelpDocPage({ params }: Props) {
  const { slug } = await params
  const safeSlug = slug.replace(/[^a-zA-Z0-9-]/g, '')
  
  try {
    const docPath = path.join(process.cwd(), '..', '..', 'docs', 'public-userguide', `${safeSlug}.md`)
    const rawContent = fs.readFileSync(docPath, 'utf8')
    const { elements, headings } = parseMarkdown(rawContent)
    
    return (
      <div className="flex xl:gap-16 lg:gap-10 pb-20">
        
        {/* Main Document Content */}
        <article className="flex-1 min-w-0 max-w-3xl">
          {/* Mobile TOC */}
          {headings.length > 0 && (
            <div className="xl:hidden mb-10 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm tracking-wide uppercase">On this page</h4>
              <ul className="space-y-3">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a 
                      href={`#${heading.id}`}
                      className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {heading.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {elements}
          
          <div className="mt-20 pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <p>Still need help? <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Contact Support</Link></p>
            <p>Last updated: Today</p>
          </div>
        </article>
        
        {/* Right Sidebar: Table of Contents */}
        <div className="hidden xl:block w-64 shrink-0">
          <div className="sticky top-28">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm tracking-wide uppercase">On this page</h4>
            {headings.length > 0 ? (
              <ul className="space-y-2.5">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a 
                      href={`#${heading.id}`}
                      className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 leading-relaxed"
                    >
                      {heading.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">No headings on this page.</p>
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}
