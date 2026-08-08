# ADR 03: UI Polish and PWA Masking Strategy

## Date
2026-08-08

## Context
Following the initial UI canonicalization, several visual inconsistencies remained:
1. **Dusty Slate Theme**: Various cards, dropdowns, and modals still used `slate-900` or `slate-800` backgrounds, contrasting sharply with our richer deep navy palette.
2. **Logo Sockets**: The app logos in dashboards were rendered with `object-contain p-1.5`, creating an undesirable visual gap inside circular borders.
3. **PWA Icons**: The PWA desktop installation icons appeared as generic squares because the generation script applied a solid background to all icon sizes, which desktop platforms (like Windows/Chrome) do not automatically mask into circles.

## Decision

1. **Global Navy Enforcement**: We have fully purged all `slate-900`, `slate-800`, and `slate-950` backgrounds across the UI. They are strictly replaced with:
   - Deep Base: `bg-[#060d1a]`
   - Surface/Cards: `bg-[#0d1b2e]`
   - Elevated/Hovers/Borders: `bg-[#1a2744]` / `border-[#1a2744]`

2. **Seamless Logo Sockets**: We replaced `object-contain p-1.5` with `object-cover` across all dashboard logo containers. Because the primary logos use a solid navy background, this allows the image to bleed perfectly to the edges of the circular socket, achieving an elegant seamless finish.

3. **Dual-Track PWA Icon Generation**: We updated our `generate-pwa-icons.ps1` script to output two distinct sets of icons conforming to modern web app standards:
   - **Standard (`purpose: "any"`)**: Generated with a transparent background and a perfectly circular clip mask. These are used for standard desktop installations so they appear beautifully rounded on taskbars.
   - **Maskable (`purpose: "maskable"`)**: Generated as solid squares (no transparency). These are referenced explicitly in `manifest.ts` so mobile devices (Android/iOS) can safely apply their own corner radii or shape masks. 

## Status
Accepted

## Consequences
- **Positive**: The UI is now cohesively bound to the deep navy theme with no lingering slate elements. PWA installations on desktop now look native and premium.
- **Negative**: The icon generation script now requires ImageMagick (or Windows `System.Drawing` via PowerShell) to perform the circular clipping, complicating simple node-based generation without dependencies.
