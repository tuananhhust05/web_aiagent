# ForSkale Sidebar Design System

> Reusable sidebar component with collapsible toggle, navigation, and user profile.

---

## Quick Start

Wrap any page with `AppLayout` to get the sidebar:

```tsx
import { AppLayout } from "@/components/atlas/AppLayout";

const MyPage = () => (
  <AppLayout>
    {/* your page content */}
  </AppLayout>
);
```

---

## File Structure

| File | Purpose |
|------|---------|
| `src/components/atlas/AppLayout.tsx` | Layout wrapper (sidebar + content area) |
| `src/components/atlas/Sidebar.tsx` | Full sidebar component |
| `src/assets/forskale-logo.png` | Brand logo |
| `src/index.css` | Design tokens (CSS variables) |
| `tailwind.config.ts` | Tailwind color mappings |

---

## Design Tokens (CSS Variables)

### Sidebar Theme

```css
--sidebar-background: 224 100% 10%;    /* Deep navy */
--sidebar-foreground: 200 33% 93%;     /* Light text */
--sidebar-primary: 174 56% 55%;        /* Teal accent */
--sidebar-primary-foreground: 224 100% 10%;
--sidebar-accent: 224 60% 15%;         /* Slightly lighter navy */
--sidebar-accent-foreground: 174 56% 55%;
--sidebar-border: 174 56% 55% / 0.1;
--sidebar-ring: 174 56% 55%;
```

### Brand Colors

```css
--forskale-green: 97 72% 48%;    /* Vibrant green */
--forskale-teal: 174 56% 55%;    /* Teal */
--forskale-blue: 213 88% 31%;    /* Deep blue */
```

---

## Component Architecture

### AppLayout (`AppLayout.tsx`)

```tsx
import { AtlasSidebar } from "@/components/atlas/Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AtlasSidebar />
      <div className="relative flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
```

### Sidebar (`Sidebar.tsx`)

#### Collapse/Expand Behavior

- **Expanded width**: `w-60` (240px)
- **Collapsed width**: `w-[72px]` (72px)
- **Transition**: `duration-300 ease-in-out`
- **State**: Local `useState(false)` — starts expanded

#### Collapse Toggle Button

- White circular pill (`rounded-full bg-white`)
- Positioned at sidebar edge (`absolute top-16 -right-4`)
- Visible only on sidebar hover (`invisible group-hover/sidebar:visible`)
- Rotates 180° when collapsed
- Shadow: `0_2px_8px_rgba(0,0,0,0.15)` → `0_4px_12px_rgba(0,0,0,0.2)` on hover

#### Sidebar Background

```
bg-gradient-to-b from-[hsl(var(--sidebar-accent))] to-[hsl(var(--sidebar-background))]
```

---

## Sections

### 1. Logo Header

- Logo: `h-16 w-16` with white glow `drop-shadow-[0_0_14px_rgba(255,255,255,0.7)]`
- Brand text hidden when collapsed

### 2. Record Button (CTA)

```
bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue
shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]
hover:-translate-y-0.5 hover:shadow-[0_6px_16px_hsl(var(--forskale-green)/0.4)]
```

### 3. Navigation Items

| Icon | Label |
|------|-------|
| `CalendarDays` | Meeting Intelligence |
| `Video` | Meeting Insights |
| `BarChart3` | Performance |
| `ClipboardCheck` | Action Ready |
| `HelpCircle` | Q&A Engine |
| `BookOpen` | Knowledge |

#### Active State

- Background: `bg-sidebar-accent`
- Text: `text-sidebar-accent-foreground font-medium`
- Left accent bar: 3px gradient from `forskale-green` to `forskale-teal`

#### Inactive/Hover State

- Text: `text-sidebar-foreground/70`
- Hover: `bg-[hsl(var(--forskale-teal)/0.08)]`

### 4. Gradient Dividers

```
mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent
```

### 5. Bottom Section

- **Invite button**: Ghost style with `UserPlus` icon
- **User avatar**: Gradient circle (`forskale-green` → `forskale-teal`) with initials
- User name + email (hidden when collapsed)

---

## Tailwind Config Colors

```ts
sidebar: {
  DEFAULT: "hsl(var(--sidebar-background))",
  foreground: "hsl(var(--sidebar-foreground))",
  primary: "hsl(var(--sidebar-primary))",
  "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
  accent: "hsl(var(--sidebar-accent))",
  "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
  border: "hsl(var(--sidebar-border))",
  ring: "hsl(var(--sidebar-ring))",
},
forskale: {
  green: "hsl(var(--forskale-green))",
  teal: "hsl(var(--forskale-teal))",
  blue: "hsl(var(--forskale-blue))",
},
```

---

## Usage on New Pages

```tsx
import { AppLayout } from "@/components/atlas/AppLayout";

const PerformancePage = () => (
  <AppLayout>
    <div className="flex-1 p-6">
      <h1>Performance Dashboard</h1>
      {/* page content */}
    </div>
  </AppLayout>
);

export default PerformancePage;
```
