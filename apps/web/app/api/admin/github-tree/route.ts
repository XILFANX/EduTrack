import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/**
 * Secure server-side proxy for fetching repository file tree from GitHub API.
 * The GitHub PAT is never exposed to the client.
 *
 * Handles both full recursive trees and truncated repos by falling back to
 * fetching sub-trees on demand.
 *
 * Usage: GET /api/admin/github-tree?repo=XILFANX/EduTrack&branch=main
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify the user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify the developer docs session cookie is present
    const cookieStore = await cookies()
    if (!cookieStore.has('dev_docs_session_v2')) {
      return NextResponse.json({ error: 'Dev docs session required' }, { status: 403 })
    }

    // 3. Validate parameters
    const repo = request.nextUrl.searchParams.get('repo')
    const branch = request.nextUrl.searchParams.get('branch') || 'main'

    if (!repo) {
      return NextResponse.json({ error: 'Missing repo parameter (e.g. owner/repo)' }, { status: 400 })
    }

    // 4. Sanitize
    if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo)) {
      return NextResponse.json({ error: 'Invalid repo format' }, { status: 400 })
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(branch)) {
      return NextResponse.json({ error: 'Invalid branch format' }, { status: 400 })
    }

    const pat = process.env.GITHUB_PAT?.trim()
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'EduTrack-DevDocs',
    }
    if (pat) {
      headers['Authorization'] = `token ${pat}`
    }

    // 5. First try the fast recursive tree
    const treeUrl = `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`
    const res = await fetch(treeUrl, { headers, next: { revalidate: 120 } })

    if (!res.ok) {
      const body = await res.text()
      console.error('[github-tree] GitHub API error:', res.status, body)
      const hint = res.status === 404 ? ' (If private, ensure GITHUB_PAT is set and server restarted)' : ''
      return NextResponse.json(
        { error: `GitHub API returned ${res.status}: ${res.statusText}${hint}` },
        { status: res.status }
      )
    }

    const data = await res.json()

    // 6. If tree is not truncated, return it directly
    if (!data.truncated) {
      return NextResponse.json(data, {
        status: 200,
        headers: { 'Cache-Control': 'private, max-age=120' },
      })
    }

    // 7. Truncated: fall back to the Contents API to get top-level structure
    const contentsUrl = `https://api.github.com/repos/${repo}/contents?ref=${branch}`
    const contentsRes = await fetch(contentsUrl, { headers, next: { revalidate: 120 } })

    if (!contentsRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch contents: ${contentsRes.status}` },
        { status: contentsRes.status }
      )
    }

    const contentsData = await contentsRes.json()
    const tree = contentsData.map((item: any) => ({
      path: item.path,
      type: item.type === 'dir' ? 'tree' : 'blob',
      sha: item.sha,
      size: item.size,
    }))

    return NextResponse.json(
      { tree, truncated: true },
      {
        status: 200,
        headers: { 'Cache-Control': 'private, max-age=120' },
      }
    )
  } catch (err: any) {
    console.error('[github-tree]', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
