import fs from 'fs'
import path from 'path'
import { parseMarkdown } from '@/lib/markdown'
import { notFound } from 'next/navigation'
import { DocsProvider } from '@/components/admin/docs/docs-context'
import { DocsWrapper } from '@/components/admin/docs/docs-wrapper'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string[] }>
}

export default async function DevDocPage({ params }: Props) {
  const { slug } = await params

  const safeSlugPath = slug.map(s => s.replace(/[^a-zA-Z0-9-]/g, '')).join('/')

  try {
    const docPath = path.join(process.cwd(), '..', '..', 'docs', 'internal-devsguide', `${safeSlugPath}.md`)
    const rawContent = fs.readFileSync(docPath, 'utf8')

    // blue = EduTrack theme accent
    const { elements, headings, repoPaths } = parseMarkdown(rawContent, 'blue')

    return (
      <DocsProvider defaultRepoPath={repoPaths[0] ?? null}>
        <DocsWrapper
          elements={elements}
          headings={headings}
          repoPaths={repoPaths}
          accent="blue"
        />
      </DocsProvider>
    )
  } catch {
    notFound()
  }
}
