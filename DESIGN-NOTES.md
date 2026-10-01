# Intro splash design notes

## Reference review

- [Motion Primitives](https://motion-primitives.com/docs/animated-group) demonstrates short, staggered entrances for related elements.
- [Motion Primitives transition panels](https://motion-primitives.com/docs/transition-panel) use transitions to clarify a change of state.
- [Realtime Colors](https://www.realtimecolors.com/) is useful for checking foreground, background, primary, secondary, and accent colors in context instead of in isolation.

## Applied direction

- Keep the splash to the visitor's name, one concise role line, and the two entry actions.
- Use near-black `#050505`, white `#f5f5f5`, and neutral gray for the canvas, typography, button, and focus state. The animated canvas is grayscale so its existing color data cannot introduce colored accents.
- Let the name, role, and primary action arrive in a restrained stagger. Keep the 500 ms fade for dismissing the overlay and disable the entrance and exit motion for reduced-motion preferences.
- Use a direct click or keyboard activation to enter. Remove the hold timer, neural telemetry, location, availability, discipline badges, and redundant instructions from the intro.
