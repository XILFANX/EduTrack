# ADR 02: Finalized UI Design System & Aesthetics

**Date:** 2026-08-08
**Status:** Accepted

## Context
The UI previously suffered from fragmented styling across different portals and components. There were mixtures of cyan-to-blue gradients, orange for badges and buttons, traditional red for destructive actions, dusty slate colors (`slate-800`/`slate-900`) for dark mode backgrounds, and inconsistent formatting for circular app logos (which often rendered with black edges). The system required a unified, premium aesthetic to wow users and ensure consistency across both EduTrack and EstateTrack.

## Decision
We have canonicalized the UI design system around a strict "Electric Blue & Navy" aesthetic. All future components, pages, and sub-portals MUST adhere to the following rules:

### 1. Primary Action Color (Electric Blue)
- **Rule**: All interactive elements, active states, tab highlighters, icon borders, and action buttons MUST use Electric Blue (`hsl(221, 83%, 53%)` / `blue-600`).
- **Purge**: The colors `orange` and standalone `cyan` are strictly prohibited for UI elements.

### 2. Destructive Actions
- **Rule**: The CSS `--destructive` token is mapped to Electric Blue, NOT red.
- **Application**: All destructive actions (e.g., Delete, Remove) use the primary blue button style. Red (`bg-red-600`) and orange are banned to maintain global brand consistency.

### 3. Hero Banners
- **Rule**: All portal/dashboard hero sections MUST use the exact gradient pattern: `bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600`.
- **Details**: Hero sections must include the `absolute ... bg-white/10 blur-[50px]` glow ring and use `bg-white/10` with `border-white/20` for internal glassmorphism stat cards. Text inside hero cards must be `text-white` or `text-blue-50`/`text-blue-100`.

### 4. Dark Mode Backgrounds (Navy)
- **Rule**: Dusty slate colors are banned for major layout backgrounds. 
- **Application**: Use deep, premium navy (`#0d1b2e` for cards/surfaces, `#060d1a` for deep backgrounds) instead of `bg-slate-800` or `bg-slate-900`.

### 5. Circular Logo Sockets
- **Rule**: Wherever the app logo or a client logo is displayed in a circular container (e.g., login screens, admin dashboards), it MUST use the following exact structure to prevent black edges and ensure perfect fit:
- **Classes**: `w-20 h-20 rounded-full bg-[#0d1b2e] border-4 border-blue-600/30 overflow-hidden`
- **Image**: `object-contain p-1.5` (Never use `object-cover` for the logos).

### 6. Modals, Dialogs, and UX Provider
- **Rule**: All global modals (`ConfirmDialog`, `UXProvider` success/error states) MUST use the navy background (`bg-[#0d1b2e]`).
- **Icons**: Warning and Error dialog icons MUST use blue styling (`bg-blue-500/10 text-blue-400`) instead of red.

### 7. PWA and Browser Theme
- **Rule**: The browser status bar and PWA frame must be electric blue.
- **Implementation**: The root `layout.tsx` MUST include `<meta name="theme-color" content="#2563eb" />` and configure `appleWebApp.statusBarStyle` to `'black-translucent'`.

## Consequences
- Developers and agents must not introduce ad-hoc colors (orange, cyan, red, emerald) for UI components.
- The separation of concerns between EduTrack and EstateTrack remains, but they share this identical underlying visual design language.
