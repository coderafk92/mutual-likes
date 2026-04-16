

## Plan: Apply Futuristic Glassmorphism to Onboarding, Profile, Discover, SwipeCard, and BottomNav

### Summary
Apply the same frosted glass, neon glow, Orbitron headings, floating particles, and gradient accent design from the Auth page across all remaining pages for visual consistency.

### Changes

**1. `src/pages/Onboarding.tsx`**
- Add animated floating particles background (same as Auth)
- Wrap the form in a `glass` card with `glow-cyan` border
- Use `font-display` (Orbitron) for step titles
- Style progress bar segments with `glow-cyan` active state
- Apply `bg-muted/40 backdrop-blur-sm` to all inputs/selects
- Role selection cards get glass styling with neon border on select
- Navigation buttons get the `gradient-primary` with hover glow shadow

**2. `src/pages/Profile.tsx`**
- Add subtle floating particles background
- Wrap entire content in a glass container card
- Use `font-display text-gradient` for "Profile Settings" heading
- Photo grid items get glass borders with subtle glow
- Role-specific sections (Founder/Investor/Pro) get `glass` panels instead of plain `bg-card`
- All inputs/selects get `bg-muted/40 backdrop-blur-sm` treatment
- Tag/chip buttons get glass styling with cyan glow when active
- Save button gets hover glow: `hover:shadow-[0_0_30px_hsl(185_100%_50%_/_0.35)]`

**3. `src/pages/Discover.tsx`**
- Add floating particles background behind content
- Header uses `font-display` for brand name with `text-gradient`
- Filter button gets glass styling; filter panel gets `glass` container
- Stats bar gets subtle glass pill styling
- Empty state icon gets `glow-cyan` ring

**4. `src/components/SwipeCard.tsx`**
- Card container gets `glass` border treatment with subtle cyan glow
- Info overlay at bottom uses `backdrop-blur-xl` glass effect instead of plain gradient
- Role badge chips get glass styling
- LIKE/NOPE stamps get neon glow effect

**5. `src/components/SwipeCard.tsx` (SwipeActions)**
- Action buttons (Pass, Like, Friend, Follow, Message, Skip) get `glass` backgrounds
- Like button keeps gradient but adds pulsing glow animation
- Secondary action pills get `glass` + hover glow

**6. `src/components/BottomNav.tsx`**
- Apply `glass` utility instead of `bg-card/90 backdrop-blur-lg`
- Active tab icon gets `glow-cyan` drop shadow
- Add subtle top-border glow line using `border-t border-[hsl(185_100%_50%_/_0.15)]`

### Technical Details
- Reuse existing CSS utilities: `.glass`, `.glow-cyan`, `.glow-purple`, `.text-gradient`, `.font-display`, `.gradient-primary`, `.shadow-elevated`
- Floating particles: extract a shared `FloatingParticles` component from Auth.tsx into `src/components/FloatingParticles.tsx` for reuse
- No database or backend changes needed
- No new dependencies

