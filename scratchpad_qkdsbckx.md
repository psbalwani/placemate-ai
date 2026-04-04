# Watermelon UI Research

## Basic Usage
- Components are copy-paste ready.
- Installation via CLI example: `npx shadcn@latest add https://registry.watermelon.sh/r/r/button-01.json`
- Import example: `import { Button } from "@/components/ui/button";`
- Usage: Use like standard React components.
- AI-Powered Prompts: Every component includes prompts for V0, Cursor, Lovable, Bolt.

## Installation
- Prerequisites:
  - Node.js 18.0 or later
  - React 19 or later (Tailwind v4 support)
  - Tailwind CSS v4
  - A project initialized with shadcn
- Command: `npx shadcn@latest add https://registry.watermelon.sh/r/r/[component].json`
- Dependencies: `tailwindcss`, `motion`, `clsx`, `tailwind-merge`, `class-variance-authority`, `tw-animate-css`.
- Tailwind v4 Config (in global CSS):
  - `@import "tailwindcss";`
  - `@import "tw-animate-css";`
  - Custom `:root` (oklch vars) and `@theme inline` variables are needed.

## Framework Support
- **Next.js 14+ (App Router)**:
  - `npm install tailwindcss @tailwindcss/postcss`
  - Configure `postcss.config.mjs` with `@tailwindcss/postcss: {}`.
- **Vite + React 5+**:
  - Use the Tailwind CSS v4 Vite plugin.

## Component Categories
- Accordian, Action, Buttons, Cards, Carousel, Choice-chips, Dialog, Disclosure, Dropdown, Filters, Hooks, Inputs, Interaction, Lists, Map, Marketing, Media, Micro-interaction, Navigation, Pagination, Popover, Sliders, Tabs, Text, Toast, Tooltip, Widgets.
