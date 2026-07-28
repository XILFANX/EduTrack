import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/**
 * Secure server-side proxy for fetching live source code from GitHub.
 * The GitHub PAT is never exposed to the client.
 *
 * Usage: GET /api/admin/github-source?path=XILFANX/EduTrack/main/apps/web/app/page.tsx
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

    // 3. Validate the path parameter
    const repoPath = request.nextUrl.searchParams.get('path')
    if (!repoPath) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
    }

    // 4. Sanitize: only allow alphanumeric, slashes, dots, underscores, hyphens
    if (!/^[a-zA-Z0-9/_.\-]+$/.test(repoPath)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    // 5. Fetch from GitHub with server-side PAT
    const githubUrl = `https://raw.githubusercontent.com/${repoPath}`
    const pat = process.env.GITHUB_PAT?.trim()

    const headers: HeadersInit = {
      'Accept': 'text/plain',
    }
    if (pat) {
      headers['Authorization'] = `token ${pat}`
    }

    const res = await fetch(githubUrl, {
      headers,
      next: { revalidate: 60 }, // cache for 60s to avoid hammering GitHub API
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub returned ${res.status}: ${res.statusText}` },
        { status: res.status }
      )
    }

    const content = await res.text()

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch (err: any) {
    console.error('[github-source]', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
