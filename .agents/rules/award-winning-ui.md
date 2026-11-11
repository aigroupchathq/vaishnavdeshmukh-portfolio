# Creative Portfolio & Award-Winning UI Invariants

## 1. True OLED Black Foundations
- Canvas backgrounds (`html`, `body`, section wrappers) must use pure `#000000`.
- Do not apply dark grey (`#121316`, `#0b0c0e`) or linear gradient wash to the base canvas.
- Surface cards must use subtle elevation (`#080808` with hover `#111111`) bounded by `#222222` hairline borders.
- Header bars and overlays must use pure black with glass blur (`rgba(0, 0, 0, 0.90)` and `backdrop-filter: blur(12px)`).

## 2. Compact Spatial Showcases (Deck Mode)
- Present extensive project lists via an interactive 3D stacked deck rather than requiring endless vertical scrolling.
- Cards must be layered with realistic 3D perspective (`perspective: 1200px`), scaling, vertical offset, and progressive opacity (`pos 0: 1.0`, `pos 1: 0.85`, `pos 2: 0.58`, `pos 3: 0.32`).
- Cards must support fluid pointer/touch dragging with real-time rotational tilt (`rotate(deltaX * 0.04deg)`), spring momentum dismissal beyond threshold (75px), and elastic snap-back.
- Always provide an accessible Deck ↔ Grid view toggle and category filter pills.

## 3. Documentary Truth Invariant
- Never synthesize or alter professional history, university degrees, founding years, or job titles.
- All technical badges, case studies, and external links must correspond to verified project files and authentic experience.

## 4. Editorial Typography & Metadata
- Combine oversized, bold geometric sans-serif headings with high-contrast body text (`#ffffff` / `#e4e4e7`).
- Pair primary titles with monospaced metadata, live status pulse indicators (`● Live Demo`), and real-time category counters.
