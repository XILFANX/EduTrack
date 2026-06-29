$roles = @("admin", "(dashboard)", "teacher", "parent", "bursar", "store", "transport")
foreach ($r in $roles) {
    $path = "apps/web/app/$r"
    New-Item -ItemType Directory -Force -Path $path | Out-Null
    
    $pageContent = @"
export default function Page() {
  return <div className="p-8 text-2xl font-bold capitalize">{`$r Portal`}</div>
}
"@
    Set-Content -Path "$path/page.tsx" -Value $pageContent

    $layoutContent = @"
export default function Layout({children}: {children: React.ReactNode}) {
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</div>
}
"@
    Set-Content -Path "$path/layout.tsx" -Value $layoutContent
}
