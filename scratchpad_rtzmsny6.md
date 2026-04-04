# Watermelon UI Exploration

## What is Watermelon UI?
- High-quality React components registry.
- It's a "copy-paste" library similar to shadcn/ui.
- Uses the `shadcn` CLI to fetch components from its own registry.
- Specifically targets React 19+ and Tailwind CSS v4.

## Installation / Prerequisites
- Node.js 18.0 or later.
- React 19 or later.
- Tailwind CSS v4.
- Project initialized with `shadcn`.
- Key command: `npx shadcn@latest add https://registry.watermelon.sh/r/r/[component].json`

## Setup Steps
1. Initialize project with React 19 and Tailwind v4.
2. Install dependencies: `npm install tw-animate-css`.
3. Add CSS configuration:
   ```css
   @import "tailwindcss";
   @import "tw-animate-css";
   ```
4. Add components via CLI: `npx shadcn@latest add https://registry.watermelon.sh/r/r/[component].json`

## Available Component Categories
- Accordian
- Action
- Buttons
- Cards
- Carousel
- Choice-chips
- Dialog
- Disclosure
- Dropdown
- Filters
- Hooks
- Inputs
- Interaction
- Lists
- Map
- Marketing
- Media
- Micro-interaction
- Navigation
- Pagination
- Popover

## Todo
- [ ] List specific components under each category.
- [ ] Check "Basic Usage" and "Framework Support" pages.
- [ ] Check "CLI" page for any specific Watermelon CLI or tools.
