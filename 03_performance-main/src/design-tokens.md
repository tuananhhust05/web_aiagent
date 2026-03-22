# ForSkale Design Tokens Reference

## Colors (HSL)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | `0 0% 100%` | `224 100% 10%` | Page background |
| `--foreground` | `224 30% 15%` | `0 0% 100%` | Primary text |
| `--card` | `220 20% 97%` | `216 24% 19%` | Card surfaces |
| `--primary` | `174 56% 45%` | `174 56% 55%` | Brand teal, CTAs |
| `--secondary` | `220 20% 95%` | `224 60% 15%` | Secondary surfaces |
| `--muted` | `220 14% 94%` | `216 24% 19%` | Muted backgrounds |
| `--muted-foreground` | `215 16% 47%` | `215 20% 65%` | Subtle text |
| `--destructive` | `0 84.2% 60.2%` | `0 62.8% 30.6%` | Error/danger |
| `--border` | `220 13% 88%` | `224 30% 20%` | Borders |

### Brand Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--forskale-green` | `97 72% 48%` | Accent green |
| `--forskale-teal` | `174 56% 45%` | Primary teal |
| `--forskale-blue` | `213 88% 31%` | Deep blue |

### Surface Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--dark` | `224 30% 15%` | Dark surfaces |
| `--dark-blue` | `224 30% 20%` | Dark blue surfaces |
| `--slate` | `220 20% 97%` | Light slate |
| `--mid` | `220 14% 90%` | Mid-tone surfaces |

---

## Typography

### Font Families

| Role | Stack |
|------|-------|
| Display / Heading | `Plus Jakarta Sans`, `Inter`, `system-ui`, `sans-serif` |
| Body / Sans | `Inter`, `system-ui`, `sans-serif` |

### Type Scale

| Element | Class | Weight |
|---------|-------|--------|
| Page title | `text-2xl` | `font-bold font-display` |
| Section heading | `text-base` | `font-semibold` |
| Card title | `text-sm` | `font-semibold` |
| Metric value | `text-sm` | `font-bold font-display tabular-nums` |
| Body text | `text-sm` | `font-normal` |
| Label (small) | `text-[11px]` | `font-semibold` |
| Subtext | `text-[10px]` | `font-normal` |
| Uppercase label | `text-xs` | `font-semibold uppercase tracking-wider` |

---

## Spacing

### Page Layout

| Context | Value |
|---------|-------|
| Page padding | `p-8` |
| Max content width | `max-w-7xl` |
| Container max | `1400px` with `2rem` padding, centered |

### Section Spacing

| Context | Value |
|---------|-------|
| Between major sections | `mb-8` |
| Between related groups | `gap-6` |
| Between tabs and content | `mb-8` |

### Component Internal Padding

| Context | Class |
|---------|-------|
| Compact card | `px-4 py-3` |
| Standard card | `px-5 py-4` |
| Large panel | `px-6 pt-5 pb-6` |
| Button (default) | `px-4 py-2.5` |
| Button (small) | `px-3` |

### Gaps

| Context | Value |
|---------|-------|
| Card list gap | `gap-2` |
| Section gap | `gap-6` |
| Tab gap | `gap-8` |
| Inline element gap | `gap-1.5` to `gap-3` |

---

## Border Radius

| Token | Value |
|-------|-------|
| `--radius` (base) | `0.75rem` |
| `rounded-lg` | `var(--radius)` = `0.75rem` |
| `rounded-md` | `calc(var(--radius) - 2px)` |
| `rounded-sm` | `calc(var(--radius) - 4px)` |

### Common Usage

| Element | Class |
|---------|-------|
| Small cards / buttons | `rounded-xl` |
| Large panels / charts | `rounded-3xl` |
| Tags / badges | `rounded-lg` |
| Progress bars | `rounded-full` |

---

## Sizing

### Buttons

| Variant | Height | Width |
|---------|--------|-------|
| Small | `h-9` | auto |
| Default | `h-10` | auto |
| Large | `h-11` | auto |
| Icon | `h-10 w-10` | square |

### Icons

| Context | Size |
|---------|------|
| Hero / empty state | `h-10 w-10` |
| Standard (in buttons) | `h-4 w-4` |
| Small (in labels) | `h-2.5 w-2.5` |

### Fixed Dimensions

| Element | Value |
|---------|-------|
| Chart height | `h-[400px]` |
| Metric sidebar width | `w-36` |

---

## Effects

### Shadows

| Context | Value |
|---------|-------|
| Large panel | `shadow-2xl` |
| Hover elevation | `shadow-[0_8px_32px_rgba(0,0,0,0.3)]` |
| Glow (active) | `shadow-[0_0_20px_hsl(var(--forskale-teal)/0.2)]` |
| Tab indicator glow | `shadow-[0_0_8px_hsl(var(--forskale-teal))]` |

### Backdrop Blur

| Context | Value |
|---------|-------|
| Subtle blur | `backdrop-blur-sm` |
| Heavy blur | `backdrop-blur-xl` |

### Border Opacity

| Context | Value |
|---------|-------|
| Default subtle | `border-border/30` |
| Lighter | `border-border/20` |
| Hover | `border-border/60` |
| Active | `border-primary` |

### Background Opacity

| Context | Value |
|---------|-------|
| Glass surface | `bg-secondary/30` |
| Hover surface | `bg-secondary/50` |
| Tint overlay | `bg-forskale-blue/[0.02]` |

---

## Gradients

| Name | Value | Usage |
|------|-------|-------|
| Brand gradient | `from-forskale-green to-forskale-teal` | CTAs, active indicators |
| Hover overlay | `from-forskale-green/5 to-forskale-blue/5` | Card hover effect |
| Chart fill | `hsl(174,56%,55%)` @ 0.2 → 0 opacity | Area chart gradient |

---

## Transitions

| Context | Value |
|---------|-------|
| Default | `transition-all` |
| Duration (standard) | `duration-300` |
| Duration (slow) | `duration-500` |
| Hover opacity | `hover:opacity-90` |

---

## Sidebar

| Token | Value |
|-------|-------|
| `--sidebar-background` | `224 30% 15%` (light) / `224 100% 10%` (dark) |
| `--sidebar-foreground` | `0 0% 100%` |
| `--sidebar-primary` | `174 56% 55%` |
| `--sidebar-accent` | `224 40% 20%` (light) / `224 60% 15%` (dark) |
| `--sidebar-border` | `224 30% 25%` (light) / `224 30% 20%` (dark) |
