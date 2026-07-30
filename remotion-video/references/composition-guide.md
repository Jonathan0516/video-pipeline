# Composition Guide

## Timeline

`Video.tsx` maps each Manifest scene to a `<Series.Sequence>` with
`durationInFrames = round(durationSec * fps)`. Scenes play back-to-back. The PiP
overlay and the `<Audio>` narration span the whole composition. `Root.tsx`
computes the total duration as the sum of scene durations, so editing
`durationSec` in the Manifest is all you need.

## Dimensions & fps

Set in the Manifest's `render` block (defaults 1920×1080 @ 30fps):

```jsonc
"render": { "fps": 30, "width": 1920, "height": 1080 }
```

Match `fps` to the fps you captured at, so `<OffthreadVideo>` playback is 1:1.

## Capture mode (A)

Nothing extra: `MainLayer` renders `<OffthreadVideo src={staticFile(capture)}>`
full-frame with `objectFit: cover`. Capture at the final resolution to avoid
upscaling softness.

## Component mode (B)

Importing a real app's components into Remotion needs three things:

### 1. Register components — `src/scenes.gen.ts`
```ts
import { DashCard } from "../../<project>/src/components/dashboard/DashCard";
export const componentRegistry: Record<string, React.FC> = { "dash-card": DashCard };
```

### 2. Provide context — `src/AppShell.tsx`
Wrap components in the providers they assume, with **static** data:
```tsx
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
});
queryClient.setQueryData(["me"], fixtures.me);   // pre-seed everything read
// <QueryClientProvider><I18nextProvider><MemoryRouter initialEntries={[route]}>…
```
No network, no `Date.now()`/`Math.random()` without a seed, no wall-clock timers.

### 3. Bundler + Tailwind — `remotion.config.ts`
- Allow imports from the project's `src` (add its path to module resolution).
- Reuse the project's Tailwind so components look right. With
  `@remotion/tailwind-v4` (already in the blank template) import the project's
  CSS entry in `src/index.css`, or point Tailwind's content globs at the
  imported component paths.

### Taming self-clock animation libs
- **echarts**: pass `animation: false`; drive reveals with `useCurrentFrame`.
- **reactflow**: render static, `fitView`, disable auto-layout animation.
- Any CSS transition/`requestAnimationFrame` loop: gate it on frame, or disable.

Remotion renders frames out of order and in parallel — a component that isn't a
pure function of `(props, frame)` will flicker or desync.
