import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/**
 * Secure server-side proxy for fetching repository file tree from GitHub API.
 * The GitHub PAT is never exposed to the client.
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
    if (!cookieStore.has('dev_docs_session')) {
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

    // 5. Fetch tree from GitHub API with server-side PAT
    const githubApiUrl = `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`
    const pat = process.env.GITHUB_PAT?.trim()

    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Antigravity-IDE-Client',
    }
    if (pat) {
      headers['Authorization'] = `token ${pat}`
    }

    const res = await fetch(githubApiUrl, {
      headers,
      next: { revalidate: 300 }, // cache for 5 minutes
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub API returned ${res.status}: ${res.statusText}` },
        { status: res.status }
      )
    }

    const data = await res.json()

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (err: any) {
    console.error('[github-tree]', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
