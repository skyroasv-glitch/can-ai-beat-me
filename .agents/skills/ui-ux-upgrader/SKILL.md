---
name: ui-ux-upgrader
description: >
  UI/UX upgrade intelligence for any project — landing pages, portfolios, SaaS dashboards, mobile apps,
  and design system audits. Use this skill whenever the user asks to upgrade, improve, redesign, beautify,
  or review any UI. Covers audit-first redesign workflows, anti-slop frontend patterns, 50+ visual styles,
  161 color palettes, 57 font pairings, 99 UX guidelines, and multi-stack implementation (React, Next.js,
  Vue, Svelte, SwiftUI, Flutter, Tailwind, shadcn/ui, HTML/CSS, and more). Trigger on: "upgrade my UI",
  "make this look better", "redesign", "improve UX", "audit my frontend", "add polish", "it looks generic",
  "it looks like AI built it", "make this premium", "fix the design", "landing page", "portfolio site",
  "dashboard upgrade", "style my app", "choose a color palette", "pick fonts". Also trigger proactively
  whenever producing any frontend component, page, or visual layout — don't wait to be asked.
---

# UI/UX Upgrader

> Audit → Read → Upgrade. Never guess the right direction first.
> This skill combines anti-slop frontend taste (landing pages, portfolios, SaaS marketing) with
> broad UI/UX data intelligence (all project types, stacks, and visual styles).

---

## 0. WHICH MODE TO USE

| User's project type | Primary mode |
|---|---|
| Landing page, portfolio, SaaS marketing, agency site | **Taste Mode** (Sections 1-3) |
| Dashboard, admin panel, app UI, mobile app | **Data Mode** (Section 4) |
| "Upgrade / redesign / audit" an existing project | **Upgrade Mode** (Section 5) — always runs first |
| Choosing palette, fonts, design system, or style | **Data Mode** (Section 4) |
| Any visual UI output (any project type) | **Pre-Flight** (Section 6) before shipping |

When in doubt: run Upgrade Mode's audit first (Section 5.A), then apply the right mode.

---

## 1. BRIEF INFERENCE (Do This Before Anything)

Before touching code, **read the room**.

### 1.A Read these signals
1. **Page kind** — landing (SaaS/consumer/agency/event), portfolio (dev/designer/studio), redesign, app UI, dashboard, mobile.
2. **Vibe words** — "minimalist", "Linear-style", "Awwwards", "brutalist", "Apple-y", "dark tech", "premium", "playful", "serious B2B", "editorial".
3. **References** — URLs, screenshots, brands named, competitors.
4. **Audience** — B2B procurement vs design-conscious consumer vs developer vs recruiter.
5. **Existing brand assets** — logo, colors, type. For redesigns, these are starting material.
6. **Quiet constraints** — accessibility-first, public-sector, kids, healthcare, regulated. These OVERRIDE aesthetic preference.

### 1.B Output a one-line Design Read
> "Reading this as: \<page kind> for \<audience>, \<vibe> language, leaning \<design system or aesthetic family>."

Examples:
- *"Reading this as: B2B SaaS landing for technical buyers, Linear-style minimalist, leaning Tailwind + Geist + restrained motion."*
- *"Reading this as: upgrade of a dev portfolio, existing dark aesthetic preserved, dial target: VARIANCE 7 / MOTION 6 / DENSITY 3."*

If genuinely ambiguous, ask **one** clarifying question. If you can confidently infer, don't ask.

### 1.C Anti-Default Discipline
Do NOT default to: AI-purple gradients, centered hero over dark mesh, three equal feature cards, generic glassmorphism, Inter as the font, infinite micro-animations. These are LLM tells. Reach past them.

---

## 2. THE THREE DIALS (Landing Pages and Portfolios)

Set these after the design read. Every layout, motion, and density decision is gated by these.

- **`DESIGN_VARIANCE`** — 1 = perfect symmetry, 10 = artsy chaos
- **`MOTION_INTENSITY`** — 1 = static, 10 = cinematic/physics
- **`VISUAL_DENSITY`** — 1 = art gallery/airy, 10 = cockpit/data-packed

**Baseline for landing pages:** `8 / 6 / 4`

### 2.A Dial Inference Table
| Signal | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| "minimalist / clean / calm / Linear-style" | 5-6 | 3-4 | 2-3 |
| "premium consumer / Apple-y / luxury" | 7-8 | 5-7 | 3-4 |
| "playful / Awwwards / experimental / agency" | 9-10 | 8-10 | 3-4 |
| Landing page / portfolio (default) | 7-9 | 6-8 | 3-5 |
| Trust-first / public-sector / accessibility-critical | 3-4 | 2-3 | 4-5 |
| Redesign - preserve | match existing | +1 | match existing |
| Redesign - overhaul | +2 | +2 | match existing |

---

## 3. DESIGN ENGINEERING DIRECTIVES (Taste Mode)

### 3.A Design System Selection
When the brief maps to a real design system, use the official package — not hand-rolled recreation.

| Brief reads as | Use |
|---|---|
| Microsoft/enterprise SaaS | `@fluentui/react-components` |
| Google/Material-flavored | `@material/web` + Material 3 tokens |
| IBM B2B/analytics | `@carbon/react` + `@carbon/styles` |
| Shopify admin surfaces | Polaris React |
| GitHub devtool/community | `@primer/css` or `@primer/react-brand` |
| UK public-sector | `govuk-frontend` |
| US public-sector | `uswds` |
| Modern accessible React | `@radix-ui/themes` |
| Modern SaaS / own components | `shadcn/ui` — never ship default state |
| Indie/small-team SaaS | Tailwind v4 + dark: variant |

For aesthetics (glassmorphism, brutalism, bento, editorial), build with native CSS + Tailwind and label clearly.

### 3.B Typography Rules
- **Headlines:** `text-4xl md:text-6xl tracking-tighter leading-none`
- **Body:** `text-base text-gray-600 leading-relaxed max-w-[65ch]`
- **Default sans:** `Geist`, `Outfit`, `Cabinet Grotesk`, `Satoshi` — NOT Inter (overused AI default)
- **Serif is VERY discouraged as default.** Only use when the brand brief explicitly names it or the aesthetic is genuinely editorial/luxury/heritage.
- **Banned serif defaults:** `Fraunces` and `Instrument_Serif` (LLM clichés)
- **No mixed-family emphasis** in headlines (don't inject a random serif word into a sans headline)
- **Italic descender clearance:** `leading-[1.1]` min + `pb-1` for any italic with `y g j p q`

### 3.C Color Rules
- Max 1 accent color. Saturation < 80% by default.
- **THE LILA RULE:** No automatic AI-purple button glows, no random neon gradients. Use neutral bases (Zinc/Slate/Stone) + high-contrast singular accents.
- **COLOR CONSISTENCY LOCK:** One accent across the whole page. No warm-grey site suddenly getting a blue CTA in section 7.
- **PREMIUM-CONSUMER PALETTE BAN:** For premium/luxury/wellness briefs, do NOT default to warm beige/cream + brass/clay/oxblood. Banned families include: `#f5f1ea`, `#f7f5f1`, `#b08947`, `#b6553a`, `#1a1714`. Use instead: cold luxury (silver+chrome), forest (deep green+bone), cobalt+cream, terracotta+slate, or pure monochrome + one saturated pop.
- **One palette per project.** No mixing warm and cool grays.

### 3.D Layout Rules
- **ANTI-CENTER BIAS** when `DESIGN_VARIANCE > 4`: force Split Screen (50/50), Left-aligned/right-asset, or Asymmetric white-space.
- `min-h-[100dvh]` for hero sections — NEVER `h-screen` (iOS Safari jumps)
- CSS Grid over flex percentage math
- Cards only when elevation communicates real hierarchy
- **SHAPE CONSISTENCY LOCK:** One corner-radius system for the entire page

### 3.E Motion Rules
- Animate ONLY `transform` and `opacity` — never `top`, `left`, `width`, `height`
- **`prefers-reduced-motion`** is mandatory for everything `MOTION_INTENSITY > 3`
- **Motion must be motivated.** Ask "what does this animate communicate?" before adding it.
- **Marquee max-one-per-page**
- No `window.addEventListener("scroll", ...)` — use Motion's `useScroll()`, GSAP ScrollTrigger, or CSS scroll-driven animations

### 3.F AI-Tell Avoidance (Section 9 from design-taste)
These are banned as defaults — they read as "AI built this":
- Three equal feature cards in a row
- Centered hero over dark mesh gradient
- AI-purple glow buttons
- Generic glassmorphism on everything
- Em-dashes (`—`) anywhere — use hyphens, periods, or commas
- Fake div-based product screenshots in the hero
- `Jane Doe`, `Acme Corp`, `John Smith` as placeholder copy
- "Quietly trusted by", "From the field", status dots on every nav item
- Locale/weather strips in nav/footer
- Section-numbering eyebrows (`00 / INDEX`, `001 · Capabilities`)
- Scroll cues (`↓ scroll`, "Scroll to explore")
- Version stamps (`v0.6.2-rc.1`) on marketing pages

### 3.G Icons
- Use: `@phosphor-icons/react`, `hugeicons-react`, `@radix-ui/react-icons`, `@tabler/icons-react`
- Discouraged: `lucide-react` (unless already in project)
- NEVER hand-roll SVG icon paths. NEVER use emoji as structural icons.
- One icon family per project. Consistent `strokeWidth`.

---

## 4. DATA MODE — Style, Color, Typography, UX Intelligence

Use the bundled scripts to query the data CSVs. Run from `scripts/`:

### 4.A Search Commands
```bash
# Search by style/aesthetic
python search.py "glassmorphism dark SaaS" --domain style

# Search by color palette
python search.py "premium startup" --domain color

# Search by typography / font pairings
python search.py "modern editorial sans" --domain typography

# Search by landing page pattern
python search.py "hero-centric B2B" --domain landing

# Search by UX guideline
python search.py "touch target mobile" --domain ux

# Search by chart type
python search.py "real-time monitoring" --domain chart

# Generate full design system recommendation for a project
python search.py "sports analytics SaaS dark" --design-system -p "StatScout"

# Stack-specific guidance (react, nextjs, vue, svelte, tailwind, shadcn, flutter, swiftui, etc.)
python search.py "dark dashboard data-dense" --stack nextjs
```

### 4.B Available Domains
`style`, `color`, `typography`, `landing`, `ux`, `chart`, `product`, `app-interface`, `google-fonts`, `icons`, `react-performance`

### 4.C Available Stacks
`react`, `nextjs`, `vue`, `svelte`, `astro`, `swiftui`, `react-native`, `flutter`, `nuxtjs`, `nuxt-ui`, `html-tailwind`, `shadcn`, `jetpack-compose`, `threejs`

### 4.D UX Priority Rules (apply in this order)
| Priority | Category | Key Checks |
|---|---|---|
| 1 | Accessibility | Contrast 4.5:1, alt text, keyboard nav, aria-labels |
| 2 | Touch & Interaction | Min 44×44px targets, 8px spacing, loading feedback |
| 3 | Performance | WebP/AVIF, lazy loading, CLS < 0.1 |
| 4 | Style Selection | Match product type, consistency, SVG icons |
| 5 | Layout & Responsive | Mobile-first, viewport meta, no horizontal scroll |
| 6 | Typography & Color | 16px base, 1.5 line-height, semantic color tokens |
| 7 | Animation | 150-300ms, motivated motion, reduced-motion respect |
| 8 | Forms & Feedback | Visible labels, inline errors, progressive disclosure |
| 9 | Navigation | Predictable back, bottom nav ≤5 items, deep linking |
| 10 | Charts & Data | Legends, tooltips, colorblind-safe palettes |

---

## 5. UPGRADE MODE — Audit-First Redesign Workflow

**Always run this section before modifying an existing project.**

### 5.A Audit Checklist (run before writing any upgrade code)
- [ ] **Identify the page kind and current design read.** What dials does the existing design imply?
- [ ] **Typography debt:** Is Inter used as a cliché? Is the type scale consistent? Descender clipping?
- [ ] **Color debt:** Multiple accent colors? Warm/cool gray mixing? Beige+brass for premium?
- [ ] **Layout debt:** Three-equal-card monotony? Center-biased for a brief that needs variance?
- [ ] **AI-tell audit:** Run through Section 3.F. List every tell present.
- [ ] **Accessibility audit:** Contrast, touch targets, focus rings, keyboard nav.
- [ ] **Motion debt:** `window.addEventListener("scroll")` in use? React state for continuous values? Missing `prefers-reduced-motion`?
- [ ] **Performance debt:** Hero image not preloaded? CLS from unsized elements? Missing `min-h-[100dvh]`?
- [ ] **Design system consistency:** Corner-radius mixing? Multiple competing accent colors?

### 5.B Preservation Rules (redesign constraints)
Never change silently without explicit user approval:
- URL structure / route slugs (SEO risk)
- Primary nav labels and anchor IDs (muscle memory + SEO)
- Form field names or order (breaks analytics + autofill)
- Brand logo or wordmark
- Existing legal/consent/cookie copy
- Analytics event names (button text, IDs)

### 5.C Upgrade Priority Order
Apply in order — stop when the brief is satisfied:
1. **Typography refresh** — biggest visual lift per unit of risk
2. **Spacing and rhythm** — increase section padding, fix vertical rhythm
3. **Color recalibration** — desaturate, unify neutrals, keep brand accent
4. **Motion layer** — add `MOTION_INTENSITY`-appropriate micro-interactions
5. **Hero and key-section recomposition** — restructure top-of-funnel
6. **Full block replacement** — only when existing block is unsalvageable

### 5.D Decision Tree
- IA and content are sound → **targeted evolution** (Priority 1-4). ~70% value, ~40% risk.
- Visual debt is structural (broken IA, no design system, broken mobile) → **full redesign** with strict content preservation.
- Brand is changing → **greenfield** with brand asset extraction first.

---

## 6. PRE-FLIGHT CHECK (Run Before Every Delivery)

**All boxes mandatory. If any fails, fix before shipping.**

**Brief & Architecture**
- [ ] Design read declared (Section 1.B one-liner)?
- [ ] Dial values explicit (Section 2) — or Data Mode path chosen (Section 4)?
- [ ] Design system chosen or aesthetic labeled honestly (Section 3.A)?
- [ ] If redesign: audit done, preservation rules checked (Section 5)?

**Color & Typography**
- [ ] Zero em-dashes (`—`) anywhere on the page (headlines, body, captions, buttons, quotes)?
- [ ] ONE accent color used identically across all sections?
- [ ] ONE theme (light/dark/auto) — no section flips mid-page?
- [ ] ONE corner-radius system applied consistently?
- [ ] Button contrast: every CTA text is readable against button background (WCAG AA 4.5:1)?
- [ ] No Inter as default font (unless explicitly brief-required)?
- [ ] No Fraunces or Instrument_Serif as default serif?
- [ ] No beige+brass+oxblood palette for premium-consumer brief?
- [ ] Italic descender clearance applied (`leading-[1.1]` + `pb-1`) for italic with `y g j p q`?

**Layout & Components**
- [ ] Hero uses `min-h-[100dvh]`, not `h-screen`?
- [ ] Hero: headline ≤ 2 lines, subtext ≤ 20 words, CTA visible without scroll?
- [ ] No three-equal-card sections (Section 3.F)?
- [ ] No div-based fake product screenshots in hero?
- [ ] No emoji as structural icons?
- [ ] Icons from an approved library, one family per project (Section 3.G)?
- [ ] Cards used only where elevation communicates hierarchy?

**AI-Tell Audit**
- [ ] No AI-purple auto-glows?
- [ ] No "Jane Doe / Acme Corp" placeholder copy?
- [ ] No "Quietly trusted by" / "From the field" labels?
- [ ] No scroll cues (`↓ scroll`, "Scroll to explore")?
- [ ] No section-numbering eyebrows (`00 / INDEX`)?
- [ ] No decorative locale/weather strips?
- [ ] No version stamps (`v0.6.2-rc.1`) on marketing pages?
- [ ] No marquee overuse (max 1 per page)?

**Motion & Accessibility**
- [ ] `prefers-reduced-motion` respected for everything `MOTION_INTENSITY > 3`?
- [ ] No `window.addEventListener("scroll")`?
- [ ] No React state for continuous pointer/scroll values (use `useMotionValue`)?
- [ ] All interactive elements: visible focus rings, min 44×44px touch target?
- [ ] WCAG AA contrast (4.5:1 text, 3:1 large text) met everywhere?
- [ ] Dark mode tokens tested?

**Performance**
- [ ] Core Web Vitals plausible (LCP < 2.5s, INP < 200ms, CLS < 0.1)?
- [ ] Hero image preloaded (`next/image priority` or `<link rel="preload">`)?
- [ ] Empty/loading/error states provided?

---

## 7. REFERENCE VOCABULARY (Pattern Names)

Know these to communicate and build. Reach for them when the design read calls.

**Hero Paradigms:** Asymmetric Split Hero, Editorial Manifesto Hero, Video/Media Mask Hero, Kinetic-Type Hero, Curtain-Reveal Hero, Scroll-Pinned Hero

**Layout:** Bento Grid, Masonry Layout, Chroma Grid, Split-Screen Scroll, Sticky-Stack Sections

**Cards:** Parallax Tilt Card, Spotlight Border Card, Glassmorphism Panel, Holographic Foil Card, Morphing Modal

**Scroll Animations:** Sticky Scroll Stack, Horizontal Scroll Hijack, Zoom Parallax, Scroll Progress Path

**Navigation:** Mac OS Dock Magnification, Magnetic Button, Gooey Menu, Dynamic Island, Mega Menu Reveal

---

## 8. CANONICAL CODE SKELETONS

### 8.A Sticky-Stack
```tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";
gsap.registerPlugin(ScrollTrigger);

export function StickyStack({ cards }: { cards: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce || !ref.current) return;
    const ctx = gsap.context(() => {
      const cardEls = gsap.utils.toArray<HTMLElement>(".stack-card");
      cardEls.forEach((card, i) => {
        if (i === cardEls.length - 1) return;
        ScrollTrigger.create({ trigger: card, start: "top top",
          endTrigger: cardEls[cardEls.length - 1], end: "top top",
          pin: true, pinSpacing: false });
        gsap.to(card, { scale: 0.92, opacity: 0.55, ease: "none",
          scrollTrigger: { trigger: cardEls[i + 1], start: "top bottom",
            end: "top top", scrub: true } });
      });
    }, ref);
    return () => ctx.revert();
  }, [reduce]);
  return <div ref={ref}>{cards.map((c, i) => <div key={i} className="stack-card">{c}</div>)}</div>;
}
```
Key: `start: "top top"` — not `"top center"`.

### 8.B Scroll-Reveal Stagger (Motion, lighter than GSAP)
```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";
export function RevealStagger({ items }: { items: string[] }) {
  const reduce = useReducedMotion();
  return (
    <ul className="grid gap-6">
      {items.map((item, i) => (
        <motion.li key={item}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}>
          {item}
        </motion.li>
      ))}
    </ul>
  );
}
```

---

## 9. INSTALL REFERENCE

```bash
# Tailwind v4
npm install tailwindcss @tailwindcss/vite  # or @tailwindcss/postcss

# Motion (formerly Framer Motion)
npm install motion
# Import: import { motion } from "motion/react"

# shadcn/ui
npx shadcn@latest init

# Icon libraries (pick one)
npm install @phosphor-icons/react
npm install @tabler/icons-react
npm install hugeicons-react

# GSAP
npm install gsap

# Radix Themes
npm install @radix-ui/themes
```

---

## 10. DATA FILES (bundled CSVs for search.py)

`data/styles.csv` — 50+ visual styles with palette, effects, compatibility, AI prompt keywords
`data/colors.csv` — 161 color palette recommendations with semantic context
`data/typography.csv` — 57 font pairings with use-case and stack compatibility
`data/landing.csv` — landing page patterns with section order and CTA strategy
`data/ux-guidelines.csv` — 99 UX guidelines across accessibility, touch, layout, forms, nav, charts
`data/charts.csv` — 25 chart types with usage context and accessibility notes
`data/google-fonts.csv` — curated Google Font pairings
`data/icons.csv` — icon library recommendations by style and stack
`data/stacks/` — per-stack component and package guidance (react, nextjs, vue, flutter, swiftui, etc.)

Always query with `search.py` before hardcoding style decisions. The data beats training memory.
