# DESIGN.md · Vaishnav Deshmukh Portfolio Design Specification

> Standardized visual identity and design tokens specification conforming to `getdesign.md` and `google-labs-code/design.md`.

---

## 1. Aesthetic North Star: The Mechanical Atelier
Software viewed through the lens of interdependent physical and cognitive systems: mechanical tolerances, supply chain throughput, and ergonomics. The visual execution avoids all generic corporate SaaS templates and "AI slop" (no purple gradients, no unanchored eyebrows, no cookie-cutter cards). 

### Core Tenets (via Hallmark & Impeccable):
1. **True OLED Black (`#000000`)**: Deep pitch canvas that allows physical pixels to shut completely off.
2. **Architectural Typographic Tension**: Monolithic geometric headings (`Syne`) paired with high-contrast literary serif accents (`Instrument Serif`) and precision monospace telemetry (`JetBrains Mono`).
3. **Tactile Spring Fluidity**: Every transition adheres to Apple spring physics (`cubic-bezier(0.16, 1, 0.3, 1)`) with zero layout shift.
4. **Documentary Truth**: Every case study, metric, and repository corresponds to real engineering artifacts.

---

## 2. Design Tokens (`:root`)

```css
:root {
  /* Canvas & Elevation */
  --canvas-base: #000000;              /* OLED pitch black */
  --canvas-surface: #080808;           /* Subtle elevated card surface */
  --canvas-surface-hover: #121212;     /* Interactive card hover */
  --canvas-surface-elevated: #18181b;  /* Modal / popover surface */
  
  /* Borders & Dividers */
  --canvas-border: rgba(255, 255, 255, 0.08);       /* Hairline border */
  --canvas-border-mid: rgba(255, 255, 255, 0.14);   /* Interactive border */
  --canvas-border-strong: rgba(255, 255, 255, 0.28);/* Active / focus border */
  
  /* Typography Colors */
  --text-primary: #ffffff;             /* Headers and crisp white titles */
  --text-secondary: #e4e4e7;           /* High-contrast body copy */
  --text-muted: #888888;               /* Metadata, timestamps, kickers */
  --text-dim: #52525b;                 /* Subtle telemetry labels */
  
  /* Accents & Signals */
  --accent-champagne: #eeeae1;         /* Warm editorial accent */
  --accent-emerald: #10b981;           /* Live telemetry pulse */
  --accent-amber: #f59e0b;             /* Concept stage indicator */
  
  /* Font Stacks */
  --font-display: 'Syne', sans-serif;
  --font-body: 'Geist', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-splash: 'Plus Jakarta Sans', system-ui, sans-serif;
}
```

---

## 3. Typographic Hierarchy & Optical Sizing

| Level | Family | Weight | Size / Clamp | Tracking | Leading |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `Syne` | `800` | `clamp(2.75rem, 7.5vw, 4.85rem)` | `-0.05em` | `1.03` |
| **Section Title** | `Syne` | `800` | `clamp(2.15rem, 5vw, 3.4rem)` | `-0.04em` | `1.08` |
| **Card Title** | `Syne` | `700` | `clamp(1.3rem, 2.3vw, 1.65rem)` | `-0.03em` | `1.18` |
| **Serif Accent** | `Instrument Serif` | `400 italic` | `1.14em` (optical boost) | `-0.015em` | `inherit` |
| **Splash Title** | `Plus Jakarta Sans` | `600` | `clamp(2.5rem, 6vw, 5rem)` | `-0.06em` | `1.08` |
| **Body Copy** | `Geist` | `400` | `0.9375rem` / `15px` | `-0.015em` | `1.65` |
| **Telemetry / Code**| `JetBrains Mono` | `500` | `0.75rem` / `12px` (`tnum`) | `0.08em` | `1.4` |

---

## 4. Component Blueprints & Patterns

### 1. 3D Project Deck
- Perspective: `1200px` with perspective-origin `50% 30%`.
- Stack coordinates: Pos 0 (`scale(1)`), Pos 1 (`translate3d(0, -20px, -40px) scale(0.95)`), Pos 2 (`scale(0.90)`).
- Gestures: 1:1 finger tracking, real-time tilt `rotate(deltaX * 0.04deg)`, velocity flick dismiss threshold (`> 0.32`).

### 2. High-Contrast Action Buttons
- Primary: White background (`#ffffff`), Pure black bold text (`#000000 !important`), 0.015em letter-spacing.
- Secondary / Inspect: Dark surface (`#121212`), Hairline border (`#2e2e2e`), Light zinc text (`#f4f4f5`).

### 3. Icon Morphing (Morphicons Standard)
- Interactive buttons (Audio Toggle, Spec Flip, View Toggle) use spring-driven path transformation instead of static swaps.

---

## 5. Anti-Slop Quality Invariants (Hallmark Floor)
- No `transition: all`.
- No animated layout metrics (`width`, `height`, `top`, `left`).
- No generic purple/indigo linear gradients.
- Strict `overflow-x: clip` on `html` and `body`.
- Explicit `:focus-visible` with high contrast on every clickable element.
