# iProduct Workspace — PRD (Reverse-Engineered)

> **Version**: 1.0.0  
> **Date**: 2026-09-01  
> **Status**: Implementation Complete  
> **Tech Stack**: React 18 + TypeScript + Tailwind CSS + Vite

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Global Design System](#2-global-design-system)
3. [Layout & AppShell](#3-layout--appshell)
4. [Topbar](#4-topbar)
5. [Sidebar](#5-sidebar)
6. [Main Area — My Workspace](#6-main-area--my-workspace)
7. [Main Area — Chat](#7-main-area--chat)
8. [Main Area — Monitor](#8-main-area--monitor)
9. [Right Rail](#9-right-rail)
10. [Confirmation Gate](#10-confirmation-gate)
11. [UI Component Library](#11-ui-component-library)
12. [State Management](#12-state-management)
13. [Data Model Reference](#13-data-model-reference)
14. [Interaction Patterns](#14-interaction-patterns)
15. [Animation & Motion](#15-animation--motion)

---

## 1. Product Overview

**iProduct Workspace** is an enterprise AI-enabled product development platform. It provides a multi-workbench environment where product teams interact with AI agents through a conversational interface, view operational dashboards, manage tasks, and monitor system health.

### Core Views

| View | Route Key | Description |
|------|-----------|-------------|
| My Workspace | `workspace` | Home screen with workbench capsules + summary cards |
| Chat | `chat` | Draft-first conversational interface with AI agents |
| Monitor | `monitor` | Runtime/governance observation dashboard |

### User Persona

- **Name**: Jordan Chen (demo)
- **Role**: Product Lead
- **Initials**: JC

---

## 2. Global Design System

### 2.1 Typography

| Property | Value |
|----------|-------|
| **Font Family** | `Inter`, `system-ui`, `-apple-system`, `sans-serif` |
| **Rendering** | `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale` |
| **Font Weights** | 400 (Regular), 500 (Medium), 600 (Semibold) |
| **Load Strategy** | Google Fonts with `preconnect` + `display=swap` |

#### Type Scale

| Usage | Class | Size |
|-------|-------|------|
| Page Title (H1) | `text-2xl font-semibold` | 24px / 600 |
| Section Title (H2) | `text-xl font-semibold` | 20px / 600 |
| Card Title (H3) | `text-base font-semibold` | 16px / 600 |
| Body / List Item | `text-sm` | 14px / 400 |
| Caption / Meta | `text-xs` | 12px / 400 |
| Micro Label | `text-[11px]` | 11px / 400 |
| Nano Label | `text-[10px]` | 10px / 500-600 |

### 2.2 Color System

#### Brand Ramp (Teal)

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-50` | `#f0fdfa` | Active item background, light tint |
| `brand-100` | `#ccfbf1` | — |
| `brand-200` | `#99f6e4` | Draft active border |
| `brand-300` | `#5eead4` | Hover border accent |
| `brand-400` | `#2dd4bf` | Mini bar charts |
| `brand-500` | `#14b8a6` | Focus ring |
| `brand-600` | `#0d9488` | **Primary action**, buttons, avatar, logo |
| `brand-700` | `#0f766e` | Button hover, text accent |
| `brand-800` | `#115e59` | Button active |
| `brand-900` | `#134e4a` | — |

#### Surface Ramp (Slate / Neutral)

| Token | Hex | Usage |
|-------|-----|-------|
| `surface-0` | `#ffffff` | Card / panel backgrounds |
| `surface-50` | `#f8fafc` | **Page background**, sidebar bg, input bg |
| `surface-100` | `#f1f5f9` | Hover states, divider fills, table header bg |
| `surface-200` | `#e2e8f0` | **Borders** (primary), dividers |
| `surface-300` | `#cbd5e1` | Scrollbar thumb, unfilled dots |
| `surface-400` | `#94a3b8` | **Placeholder text**, meta text, timestamps |
| `surface-500` | `#64748b` | **Secondary text**, icon default |
| `surface-600` | `#475569` | Menu text, body text |
| `surface-700` | `#334155` | **Card body text**, list items |
| `surface-800` | `#1e293b` | **Heading text**, primary text |
| `surface-900` | `#0f172a` | Page title, modal overlay (40% opacity) |

#### Semantic Colors

| Purpose | Background | Text | Dot / Icon |
|---------|-----------|------|------------|
| **Success** | `emerald-50` | `emerald-700` | `emerald-500` |
| **Warning** | `amber-50` | `amber-700` | `amber-500` |
| **Error** | `red-50` | `red-700` | `red-500` |
| **Info** | `sky-50` | `sky-700` | `sky-500` |
| **Default** | `surface-100` | `surface-600` | `surface-400` |

#### Workbench Accent Colors

| Workbench | Color Class |
|-----------|-------------|
| Portfolio Planning | `bg-sky-600` |
| Dev Project | `bg-emerald-600` |
| Product Design | `bg-rose-500` |
| Product Release | `bg-amber-500` |
| Product Ops | `bg-teal-600` |
| Knowledge Management | `bg-indigo-500` |

#### Chart Colors

| Trend | Bar Color |
|-------|-----------|
| Up | `bg-emerald-400` |
| Down | `bg-red-400` |
| Flat | `bg-brand-400` |

#### Confirmation Gate Risk Colors

| Risk Level | Background | Border | Icon Color |
|------------|-----------|--------|------------|
| Medium | `bg-amber-50` | `border-amber-200` | `text-amber-500` |
| High | `bg-orange-50` | `border-orange-200` | `text-orange-500` |
| Critical | `bg-red-50` | `border-red-200` | `text-red-500` |

### 2.3 Spacing System

Based on Tailwind's 4px base, the project consistently uses an **8px grid**:

| Token | Value | Common Usage |
|-------|-------|-------------|
| `p-1` / `gap-1` | 4px | Icon button internal gap |
| `p-2` / `gap-2` | 8px | Compact padding, sidebar items |
| `p-3` / `gap-3` | 12px | Card internal sections, button padding |
| `p-4` / `gap-4` | 16px | Right rail padding, grid gap |
| `p-5` | 20px | Table cells, workbench card padding |
| `p-6` | 24px | Main content padding, detail panels |
| `px-8 py-8` | 32px | Page-level horizontal/vertical padding |
| `mb-10` | 40px | Section vertical gap |

### 2.4 Border Radius

| Usage | Class | Value |
|-------|-------|-------|
| Buttons, inputs, small elements | `rounded-lg` | 8px |
| Cards, panels, modals | `rounded-xl` | 12px |
| Chat bubbles | `rounded-2xl` | 16px |
| Avatars, badges, dots | `rounded-full` | 50% |
| Logo icon | `rounded-lg` | 8px |
| Draft welcome icon | `rounded-2xl` | 16px |

### 2.5 Shadows & Elevation

| Level | Class | Usage |
|-------|-------|-------|
| Level 0 | No shadow | Default cards, panels |
| Level 1 | `shadow-sm` | Primary buttons |
| Level 2 | `shadow-md` | Card hover state |
| Level 3 | `shadow-xl` | Dropdowns, notifications |
| Level 4 | `shadow-2xl` | Modal dialog |

### 2.6 Icons

- **Library**: Lucide React (`lucide-react ^0.446.0`)
- **Default Size**: 16px (`w-4 h-4`)
- **Topbar Icons**: 18px (`w-[18px] h-[18px]`)
- **Detail Icons**: 20px (`w-5 h-5`)
- **Workbench Icons**: 20px inside 40px container
- **Draft Welcome Icon**: 28px (`w-7 h-7`)

#### Icon Inventory

| Icon | Usage |
|------|-------|
| `Activity` | Monitor nav button |
| `AlertCircle` | Blocked step, failed banner |
| `AlertTriangle` | Exception items |
| `ArrowLeft` | Chat back button |
| `BarChart2` | Confidence score indicator |
| `Bell` | Notifications |
| `BookOpen` | Prompt Library, Knowledge Management |
| `Briefcase` | Portfolio Planning |
| `Check` | Copy confirmation |
| `CheckCircle2` | Completed route step |
| `ChevronRight` | "More prompts" link |
| `Circle` | Pending route step |
| `Clock` | In-progress route step, timestamps |
| `Code2` | Dev Project |
| `Copy` | Copy prompt button |
| `Cpu` | (reserved) |
| `Database` | Evidence hint |
| `ExternalLink` | Source type indicator |
| `FileText` | Information detail, citation detail |
| `LogOut` | Sign out menu item |
| `Minus` | Flat trend indicator |
| `MoreHorizontal` | "All chats" link |
| `Palette` | Product Design |
| `PanelLeft` | Expand sidebar |
| `PanelLeftClose` | Collapse sidebar |
| `Paperclip` | Attachment button (composer) |
| `Plus` | New Chat |
| `RefreshCw` | Refresh button, sending spinner |
| `Rocket` | Product Release |
| `Search` | Search input icon |
| `Send` | Send button, empty chat state |
| `Settings` | Product Ops, user menu |
| `ShieldAlert` | Critical risk icon |
| `ShieldCheck` | Medium risk icon |
| `Sparkles` | Draft welcome, workbench context |
| `Tag` | Category tag |
| `TrendingDown` | Down trend |
| `TrendingUp` | Up trend |
| `User` | Profile menu item |
| `Users` | (reserved) |
| `X` | Close/clear buttons |

### 2.7 Scrollbar Styling

| Property | Value |
|----------|-------|
| Width | 6px (both axes) |
| Track | Transparent |
| Thumb | `surface-300` (#cbd5e1), 3px radius |
| Thumb Hover | `surface-400` (#94a3b8) |
| Firefox | `scrollbar-width: thin` |

---

## 3. Layout & AppShell

### Structure

```
+-------------------------------------------------------+
| Topbar (56px, col-span-full)                          |
+----------+----------------------------+---------------+
| Sidebar  |       Main Area            |  Right Rail   |
| 248/60px |       flex (min ~640px)    |  380/0px      |
+----------+----------------------------+---------------+
```

### CSS Grid Implementation

- **Grid**: `grid-rows-[56px_1fr]` with dynamic columns
- **Columns**: `${sidebarW} 1fr ${railW}`
- **Sidebar Expanded**: 248px
- **Sidebar Collapsed**: 60px
- **Right Rail Open**: 380px
- **Right Rail Closed**: 0px
- **Column Transition**: `transition-[grid-template-columns] duration-200 ease-in-out`
- **Viewport**: `h-screen w-screen overflow-hidden`

---

## 4. Topbar

| Property | Value |
|----------|-------|
| Height | 56px (grid row) |
| Background | `bg-white` |
| Border | `border-b border-surface-200` |
| Padding | `px-4` |
| Z-Index | `z-40` |
| Span | `col-span-full` |

### Left — Brand Logo (Clickable)

- **Action**: Click navigates to `workspace` view
- **Container**: `rounded-lg px-1 py-1` with `hover:bg-surface-50`
- **Logo Box**: 32x32px, `rounded-lg bg-brand-600`, text "iP" in white bold 14px
- **Text**: "iProduct" (`text-sm font-semibold text-surface-800`) + "Workspace" (`text-xs text-surface-400 ml-1.5`)
- **Focus**: `focus-visible:ring-2 focus-visible:ring-brand-500`

### Right — Actions Row

1. **Monitor Toggle** — `IconButton` with `Activity` icon; toggles between `monitor` and `workspace` views; `active` state when on monitor view
2. **Notifications Bell** — `IconButton` with `Bell` icon; badge shows unread count (red circle, 18px min, 10px bold white text); opens dropdown on click
3. **User Avatar** — 28px circle (`Avatar` size "sm"), `bg-brand-600` with initials "JC"; opens user menu dropdown

### Notification Dropdown

- **Position**: Absolute, `right-0 top-full mt-2`
- **Size**: `w-80`
- **Style**: `bg-white rounded-xl shadow-xl border border-surface-200 py-2`
- **Animation**: `animate-fade-in`
- **Z-Index**: `z-50`
- **Header**: "Notifications" in `text-sm font-semibold`
- **Item**: Full-width button, `px-4 py-3`, unread items get `bg-brand-50/30`
- **Max Height**: 256px scrollable
- **Click Outside**: Closes dropdown

### User Menu Dropdown

- **Position**: `right-0 top-full mt-2`
- **Size**: `w-56`
- **Style**: Same card treatment as notifications
- **Header**: Name (`text-sm font-semibold`) + Role (`text-xs text-surface-500`)
- **Items**: Profile, Settings (each `text-surface-600` with icon)
- **Divider**: `border-t border-surface-100 mt-1 pt-1`
- **Sign Out**: `text-red-600 hover:bg-red-50`

---

## 5. Sidebar

| Property | Expanded | Collapsed |
|----------|----------|-----------|
| Width | 248px | 60px |
| Background | `bg-surface-50` | Same |
| Border | `border-r border-surface-200` | Same |
| Transition | `transition-all duration-200` | Same |

### New Chat Button

- **Expanded**: Full-width with "New Chat" label + `Plus` icon, `text-sm font-medium`
- **Collapsed**: 40x40px square, `Plus` icon only with title tooltip
- **Default State**: `text-white bg-brand-600 hover:bg-brand-700`
- **Draft Active State**: `bg-brand-50 text-brand-700 border border-brand-200`
- **Action**: Opens Chat Draft (does NOT create a conversation)

### Collapse Toggle

- **Size**: 32x32px
- **Icons**: `PanelLeftClose` (expanded) / `PanelLeft` (collapsed)
- **Style**: `text-surface-400 hover:text-surface-600 hover:bg-surface-200`

### Chat History

- **Max Items**: 20 (sorted by `updatedAt` descending)
- **Grouping**: Today / Yesterday / Older
- **Group Label**: `text-[11px] font-semibold text-surface-400 uppercase tracking-wider`
- **Item Height**: Auto (`px-3 py-2`)
- **Active Indicator**: `bg-brand-50 text-brand-700`
- **Hover**: `hover:bg-surface-100`
- **Dot**: 8px circle using workbench accent color
- **Title**: `text-sm truncate`
- **Timestamp**: `text-[11px] text-surface-400 truncate`
- **Hidden when collapsed**

### "All Chats" Link

- **Position**: Below history list, `mt-2`
- **Icon**: `MoreHorizontal` 14px
- **Style**: `text-xs font-medium text-surface-500`
- **Action**: Opens Right Rail in `allChats` mode

---

## 6. Main Area — My Workspace

**Max Width**: `max-w-6xl` (1152px)  
**Padding**: `px-8 py-8` (32px)

### 6.1 Greeting Banner

- **Headline**: Time-aware greeting + first name — `text-2xl font-semibold text-surface-900`
  - Before 12:00 → "Good morning"
  - 12:00–16:59 → "Good afternoon"
  - 17:00+ → "Good evening"
- **Subtitle**: Role + "Here is your workspace overview" — `text-sm text-surface-500`
- **Bottom Margin**: `mb-10` (40px)

### 6.2 My Workbenchs Section

- **Title**: "My Workbenchs" (`text-base font-semibold text-surface-800`)
- **Action**: "Prompt Library" link (`text-sm text-brand-600 font-medium` with `BookOpen` icon)
- **Grid**: `grid-cols-3 gap-4`

#### Workbench Card

| Property | Value |
|----------|-------|
| Padding | `p-5` (20px) |
| Background | `bg-white` |
| Border | `border border-surface-200` |
| Radius | `rounded-xl` |
| Hover | `hover:border-brand-300 hover:shadow-md` |
| Transition | `transition-all duration-200` |

**Contents**:
1. **Icon**: 40x40px `rounded-lg` container with workbench accent color, white icon (20px)
2. **Name**: `text-sm font-semibold text-surface-800`, hover: `text-brand-700`
3. **Description**: `text-xs text-surface-500 mt-1 line-clamp-2`
4. **Capability Tags**: Up to 3, `text-[10px] px-2 py-0.5 bg-surface-50 text-surface-500 rounded-full border border-surface-100`

**Click Action**: Opens Chat Draft with workbench's `agentId` pre-set

#### Workbench Registry

| ID | Name | Icon | Color |
|----|------|------|-------|
| `portfolio-planning` | Portfolio Planning | `Briefcase` | `bg-sky-600` |
| `dev-project` | Dev Project | `Code2` | `bg-emerald-600` |
| `product-design` | Product Design | `Palette` | `bg-rose-500` |
| `product-release` | Product Release | `Rocket` | `bg-amber-500` |
| `product-ops` | Product Ops | `Settings` | `bg-teal-600` |
| `knowledge-management` | Knowledge Management | `BookOpen` | `bg-indigo-500` |

### 6.3 Summary Section

- **Title**: "Summary" (`text-base font-semibold text-surface-800 mb-4`)
- **Grid**: `grid-cols-3 gap-6`

#### Information Card

- **Header**: "Information" + item count
- **Items**: Up to 4 rows, each showing title (`text-sm font-medium text-surface-700`) + source/time (`text-xs text-surface-400`)
- **Click**: Opens Right Rail `informationDetail` mode

#### Dashboards Card

- **Header**: "Dashboards" + metric count
- **Items**: Up to 4 rows with title, value (`text-sm font-semibold text-surface-800`), MiniBar chart + trend percentage
- **MiniBar**: 7 vertical bars, 6px wide, `bg-brand-400`, height proportional to max value, `h-4` container
- **Trend Text**: Green for up (+), red for down, neutral for flat
- **Click**: Opens Right Rail `dashboardDetail` mode

#### Tasks Card

- **Header**: "Tasks" + task count
- **Items**: Up to 4 rows with title + status Badge + agent/priority meta
- **Status Badge Mapping**: `pending` → default, `in_progress` → info, `completed` → success, `blocked` → error
- **Click**: Opens Right Rail `taskRoutePreview` mode

---

## 7. Main Area — Chat

### 7.1 Chat Draft View

Displayed when the user clicks "New Chat" or a Workbench card. **No conversation is created** until the first message is sent. Navigating away without sending discards the draft silently.

#### Persona-Aware Welcome

- **Icon**: 56x56px `rounded-2xl bg-brand-600` with `Sparkles` (28px white)
- **Greeting**: Time-aware + first name (`text-xl font-semibold text-surface-900`)
- **Subtitle**: "How can I help you today?" (`text-sm text-surface-500`)
- **Alignment**: Center, `pt-12 pb-8`, `max-w-2xl mx-auto`

#### Context Hint

- **Workbench-specific**: Shows workbench icon (32px rounded-lg with accent color) + name + description
- **General**: Shows brand icon + "General Workspace" + generic description
- **Container**: `bg-surface-50 border border-surface-200 rounded-xl`, `px-4 py-3`
- **Bottom Margin**: `mb-8`

#### Quick Prompts

- **Heading**: "Suggested prompts" (`text-xs font-semibold text-surface-400 uppercase tracking-wider`)
- **Grid**: `grid-cols-2 gap-2.5`
- **Max Items**: 4 (filtered by workbench relevance when applicable)
- **Card**: `p-3.5 bg-white border border-surface-200 rounded-xl`
- **Hover**: `hover:border-brand-300 hover:shadow-sm`
- **Title**: `text-sm font-medium text-surface-700` → `text-brand-700` on hover
- **Description**: `text-xs text-surface-400 line-clamp-2`
- **Click**: Fills composer with template text and focuses textarea
- **"More prompts"**: `text-xs font-medium text-brand-600` with `ChevronRight`, opens Right Rail Prompt Library

#### Evidence Source Hint

- **Container**: `bg-sky-50/50 border border-sky-200/60 rounded-xl`
- **Icon**: `Database` in `text-sky-500`
- **Title**: "Evidence-backed responses" (`text-xs font-medium text-sky-800`)
- **Body**: Citation explanation (`text-[11px] text-sky-600 leading-relaxed`)

#### Composer (Draft)

- **Max Width**: `max-w-2xl mx-auto`
- **Left**: Attachment button (`Paperclip`, ghost style)
- **Center**: `<textarea>` — `bg-surface-50 border-surface-200 rounded-xl`, focus ring `brand-500`, max-height 128px, min-height 44px, `resize-none`
- **Right**: Send button — enabled: `bg-brand-600 text-white`, disabled: `bg-surface-100 text-surface-300`
- **Footer**: "Enter to send · Shift+Enter for new line" (`text-[11px] text-surface-400 text-center`)
- **Busy state**: Textarea disabled with `bg-surface-100 cursor-not-allowed`, spinner overlay

#### Draft Lifecycle

1. User types and presses Enter (or clicks Send)
2. State transitions to `sending` → composer clears + spinner shown
3. After 400ms delay: `PROMOTE_DRAFT` creates the `Conversation` with the user message, inserts it into history at top
4. State transitions to `answering` → typing indicator shown
5. After 1.5–2.5s: AI response appended with citations, state returns to `idle`

### 7.2 Conversation View

Displayed when a conversation is selected from history or after a draft is promoted.

#### Header Bar

- **Height**: Auto (~48px with padding)
- **Background**: `bg-white`
- **Border**: `border-b border-surface-200`
- **Left**: Back arrow (`ArrowLeft`, navigates to workspace + clears active conversation)
- **Center**: Conversation title (`text-sm font-semibold text-surface-800 truncate`) + workbench Badge (`variant="info"`)
- **Right**: Prompt Library button (`BookOpen`)

#### Message List

- **Container**: `flex-1 overflow-y-auto px-6 py-4 space-y-6`
- **Auto-scroll**: Scrolls to bottom on new messages / status changes

#### User Message Bubble

- **Alignment**: Right-aligned (`ml-auto flex-row-reverse`)
- **Avatar**: 28px circle, `bg-brand-600`, initials
- **Bubble**: `bg-brand-600 text-white rounded-2xl rounded-tr-md px-4 py-3`
- **Timestamp**: `text-[11px] text-surface-400` right-aligned

#### AI Message Bubble

- **Alignment**: Left-aligned
- **Avatar**: 28px circle, `bg-surface-800`, "AI" text (10px bold white)
- **Bubble**: `bg-surface-50 text-surface-800 rounded-2xl rounded-tl-md border border-surface-200 px-4 py-3`
- **Bold Rendering**: `**text**` patterns rendered as `<strong className="font-semibold">`
- **Citations**: Appear below message, separated by `border-t border-surface-200 mt-3 pt-3`
  - Each citation: `bg-brand-50 text-brand-700 rounded-md px-2 py-0.5 text-xs font-medium`
  - Shows label (e.g. "[1]") + truncated source name (max 120px)
  - Click: Opens Right Rail `contextDetail` mode

#### Message States

| State | Visual |
|-------|--------|
| **Idle** | Composer active, ready for input |
| **Sending** | Composer disabled + spinner; "Sending..." indicator bubble (right-aligned, `bg-brand-600/80`) |
| **Answering** | AI typing indicator with 3 pulsing dots + agent name |
| **Failed** | Red banner: `bg-red-50 border border-red-200 rounded-xl` with `AlertCircle`, Retry button (`bg-red-600`) + Dismiss |

#### Typing Indicator

- **Dots**: 3x 8px circles, `bg-surface-400`, `animate-pulse-dot` with staggered delays (0s, 0.3s, 0.6s)
- **Label**: "{Agent Name} is thinking..." in `text-xs text-surface-500`

#### Composer (Conversation)

Same as Draft Composer but `max-w-3xl`. No footer hint text.

---

## 8. Main Area — Monitor

**Max Width**: `max-w-6xl` (1152px)  
**Padding**: `px-8 py-8`

### Header

- **Icon**: `Activity` 20px in `text-brand-600`
- **Title**: "Monitor" (`text-xl font-semibold text-surface-900`)
- **Refresh Button**: `text-sm text-surface-600 bg-white border border-surface-200 rounded-lg`, icon `RefreshCw` (spins when refreshing)

### Tabs

5 tabs with item counts:

| Tab ID | Label | Content Type |
|--------|-------|-------------|
| `agentRuns` | Agent Runs | Table |
| `tasks` | Tasks | Table |
| `dependencies` | Dependencies | Card grid (2 cols) |
| `freshness` | Freshness | Table |
| `exceptions` | Exceptions | Card list |

### Tab Styling

- **Container**: `border-b border-surface-200`
- **Active Tab**: `text-brand-600` with `h-0.5 bg-brand-600 rounded-full` bottom indicator
- **Inactive Tab**: `text-surface-500 hover:text-surface-700`
- **Count Badge**: `text-xs px-1.5 py-0.5 rounded-full` — active: `bg-brand-50 text-brand-600`, inactive: `bg-surface-100 text-surface-500`

### Table Styling (Agent Runs, Tasks, Freshness)

- **Container**: `bg-white border border-surface-200 rounded-xl overflow-hidden`
- **Header Row**: `bg-surface-50`, `text-xs font-semibold text-surface-500 uppercase tracking-wider`, `px-5 py-3`
- **Body Rows**: `divide-y divide-surface-100`, `hover:bg-surface-50 transition-colors`
- **Cell Padding**: `px-5 py-3.5`
- **Font Weight**: First column `font-medium text-surface-800`, others `text-surface-500/600`
- **Monospace**: Duration column uses `font-mono text-xs`

### Dependency Cards

- **Grid**: `grid-cols-2 gap-4`
- **Card**: `bg-white border border-surface-200 rounded-xl p-5 hover:shadow-sm`
- **Header**: StatusDot + name + status Badge
- **Body**: Type (capitalized) + latency (monospace)
- **Footer**: "Last checked {time}" in `text-[11px] text-surface-400`

### Exception Cards

- **Stack**: `space-y-3`
- **Card**: `bg-white border border-surface-200 rounded-xl p-5 hover:shadow-sm`
- **Icon**: `AlertTriangle` — `text-red-500` (high/critical), `text-amber-500` (medium), `text-surface-400` (low)
- **Content**: Message + severity Badge + count/timestamps

---

## 9. Right Rail

### Container

| Property | Value |
|----------|-------|
| Width | 380px |
| Background | `bg-white` |
| Border | `border-l border-surface-200` |
| Animation | `animate-slide-in-right` (200ms ease-out) |

### Header

- **Height**: Auto, `px-4 py-3`
- **Border**: `border-b border-surface-200`
- **Title**: Dynamic by mode (`text-sm font-semibold text-surface-800`)
- **Close**: `X` icon button, `p-1.5 rounded-lg`

### Modes

| Mode | Title | Trigger |
|------|-------|---------|
| `allChats` | All Chats | Sidebar "All chats" link |
| `informationDetail` | Information | Workspace info card click |
| `dashboardDetail` | Dashboard | Workspace dashboard card click |
| `taskRoutePreview` | Task Route | Workspace task card click |
| `promptLibrary` | Prompt Library | "Prompt Library" links / buttons |
| `contextDetail` | Source Detail | Citation click in chat |

### All Chats Panel

- **Search**: `SearchInput` with "Search conversations..." placeholder
- **Count**: `text-xs text-surface-400`
- **Items**: Full conversation list (fuzzy-filtered), sorted by `updatedAt` descending
- **Item**: Workbench dot + title + agent name + relative time + last message preview (truncated)

### Information Detail

- **Header**: 40px icon (`bg-sky-50`, `FileText` in `text-sky-600`) + title + source
- **Meta**: Clock icon + relative time, Tag icon + category Badge
- **Summary**: `bg-surface-50 border border-surface-200 rounded-lg p-4` with `text-sm text-surface-700 leading-relaxed`

### Dashboard Detail

- **Header**: Category label (uppercase) + metric title
- **Value**: `text-3xl font-bold text-surface-900`
- **Trend**: Icon + percentage (colored by direction)
- **Chart**: 7-day bar chart in `bg-surface-50 border rounded-xl p-5`, bars colored by trend
- **Properties**: Category / Trend Direction / Change percentage

### Task Route Preview

- **Header**: Title + Status Badge + Priority Badge
- **Meta**: Agent name + due date
- **Route Steps**: Vertical timeline with icons:
  - Completed: `CheckCircle2` in `text-emerald-500`
  - In Progress: `Clock` in `text-sky-500`
  - Blocked: `AlertCircle` in `text-red-500`
  - Pending: `Circle` in `text-surface-300`
  - Connector: 2px line, `bg-emerald-300` (completed) or `bg-surface-200` (pending), `h-6 my-1`

### Prompt Library

- **Search**: SearchInput with "Search prompts..." placeholder
- **Count**: `{n} prompt templates`
- **Cards**: `bg-surface-50 border border-surface-200 rounded-lg p-4 hover:border-brand-300`
  - Title + description + category Badge
  - Template text: `font-mono text-xs bg-white border border-surface-100 rounded px-3 py-2`
  - Actions: "Use in Chat" (`bg-brand-600 text-white rounded-md`) + "Copy" (`bg-white border border-surface-200`)
  - Copy feedback: Icon changes to `Check` in `text-emerald-500`, label changes to "Copied" for 1.5s

### Context Detail (Citation Source)

- **Header**: 40px icon (`bg-brand-50`, `FileText` in `text-brand-600`) + "Source Reference" + subtitle
- **Citation Block**: `bg-surface-50 border rounded-xl p-5` with explanatory text
- **Confidence Score**: Progress bar (`bg-surface-200` track, `bg-emerald-500` fill) + percentage
- **Source Type**: `ExternalLink` icon + type label

---

## 10. Confirmation Gate

A modal overlay for high-risk operations.

### Modal Container

- **Overlay**: `bg-surface-900/40 backdrop-blur-sm`
- **Card**: `bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4`
- **Animation**: `animate-fade-in` (150ms)
- **Close**: Escape key or click overlay or X button

### Content

- **Risk Icon**: 48x48px container (`rounded-xl border`) with risk-colored background
  - Critical: `ShieldAlert`
  - High: `AlertTriangle`
  - Medium: `ShieldCheck`
- **Title**: `text-lg font-semibold text-surface-900`
- **Description**: `text-sm text-surface-600 leading-relaxed`
- **Actions**: Cancel (secondary) + Confirm (primary or danger if critical)

---

## 11. UI Component Library

### Button

| Variant | Resting | Hover | Active |
|---------|---------|-------|--------|
| Primary | `bg-brand-600 text-white shadow-sm` | `bg-brand-700` | `bg-brand-800` |
| Secondary | `bg-white text-surface-700 border-surface-200` | `bg-surface-50` | `bg-surface-100` |
| Ghost | `text-surface-600` | `bg-surface-100` | `bg-surface-200` |
| Danger | `bg-red-600 text-white shadow-sm` | `bg-red-700` | `bg-red-800` |

| Size | Padding | Font |
|------|---------|------|
| sm | `px-3 py-1.5` | `text-xs` |
| md | `px-4 py-2` | `text-sm` |
| lg | `px-5 py-2.5` | `text-sm` |

- **Radius**: `rounded-lg`
- **Font Weight**: `font-medium`
- **Transition**: `transition-colors duration-150`
- **Focus**: `focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2`
- **Disabled**: `opacity-50 cursor-not-allowed`

### Badge

- **Shape**: `rounded-full`, `px-2 py-0.5`, `text-xs font-medium`
- **Dot Variant**: Adds 6px colored circle before label

### Avatar

| Size | Dimensions | Font |
|------|-----------|------|
| sm | 28x28px | `text-xs` |
| md | 36x36px | `text-sm` |
| lg | 44x44px | `text-base` |

- **Shape**: `rounded-full`
- **Background**: `bg-brand-600`
- **Text**: White, `font-semibold`

### IconButton

- **Size**: 36x36px (`w-9 h-9`)
- **Shape**: `rounded-lg`
- **Default**: `text-surface-500`
- **Hover**: `text-surface-700 bg-surface-100`
- **Active State**: `bg-surface-100 text-surface-800`
- **Badge**: Absolute positioned, `min-w-[18px] h-[18px]`, `bg-red-500 text-white text-[10px] font-semibold rounded-full`

### SearchInput

- **Icon**: `Search` (16px) absolutely positioned left
- **Input**: `pl-9 pr-8 py-2 text-sm bg-surface-50 border-surface-200 rounded-lg`
- **Clear**: `X` icon (14px) appears when value is non-empty
- **Focus**: `ring-2 ring-brand-500 border-transparent`

### StatusDot

- **Size**: 10px (`h-2.5 w-2.5`)
- **Shape**: `rounded-full`
- **Pulse**: Optional animated ping ring (same color, 75% opacity)

### Tabs

- **Active indicator**: 2px bottom line, `bg-brand-600 rounded-full`
- **Count pill**: `text-xs rounded-full px-1.5 py-0.5`

### EmptyState

- **Layout**: Centered column, `py-16 px-8`
- **Icon**: `text-surface-300`
- **Title**: `text-base font-semibold text-surface-700`
- **Description**: `text-sm text-surface-500 max-w-xs`

---

## 12. State Management

### Architecture

Three React Context providers wrapping the app:

```
AppProvider → ChatProvider → MonitorProvider → AppShell
```

All use `useReducer` for predictable state transitions.

### AppState

```typescript
interface AppState {
  activeView: 'workspace' | 'chat' | 'monitor';
  sidebarCollapsed: boolean;
  rightRail: { open: boolean; mode: RightRailMode | null; entityId: string | null };
  confirmationGate: { open: boolean; title: string; description: string; riskLevel: 'medium' | 'high' | 'critical'; onConfirm: (() => void) | null };
  notifications: AppNotification[];
}
```

**Actions**: `NAVIGATE`, `TOGGLE_SIDEBAR`, `OPEN_RIGHT_RAIL`, `CLOSE_RIGHT_RAIL`, `OPEN_CONFIRMATION`, `CLOSE_CONFIRMATION`, `DISMISS_NOTIFICATION`

**Behavior**: `NAVIGATE` auto-closes Right Rail.

### ChatState

```typescript
interface ChatState {
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;
  draft: { active: boolean; agentId: string | null };
  composerText: string;
  sendStatus: 'idle' | 'sending' | 'answering' | 'failed';
  failedMessageText: string | null;
}
```

**Actions**: `SET_ACTIVE_CONVERSATION`, `OPEN_DRAFT`, `CLEAR_DRAFT`, `PROMOTE_DRAFT`, `CREATE_CONVERSATION`, `APPEND_MESSAGE`, `SET_COMPOSER`, `SET_SEND_STATUS`, `SET_FAILED_TEXT`, `DELETE_CONVERSATION`

**Key Behaviors**:
- `SET_ACTIVE_CONVERSATION` clears draft + composer + send status
- `OPEN_DRAFT` clears active conversation + resets all composer state
- `PROMOTE_DRAFT` creates conversation from draft, inserts at top of history
- Conversation title auto-generated from first message (truncated at 50 chars)

### MonitorState

```typescript
interface MonitorState {
  activeTab: 'agentRuns' | 'tasks' | 'dependencies' | 'freshness' | 'exceptions';
  isRefreshing: boolean;
}
```

---

## 13. Data Model Reference

### Conversation

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID (`conv-{timestamp}`) |
| `title` | string | Auto-generated from first message |
| `agentId` | string | Workbench ID |
| `messages` | Message[] | Ordered message array |
| `createdAt` | number | Unix ms |
| `updatedAt` | number | Unix ms (last message time) |
| `pinned` | boolean | Pin flag |

### Message

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID |
| `conversationId` | string | Parent conversation |
| `role` | `'user' \| 'assistant' \| 'system'` | Message author |
| `content` | string | Text content (supports `**bold**`) |
| `citations` | Citation[] | Optional evidence sources |
| `timestamp` | number | Unix ms |
| `status` | `'sending' \| 'sent' \| 'error'` | Delivery status |

### Citation

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID |
| `label` | string | Display label (e.g. "[1]") |
| `source` | string | Source name |
| `excerpt` | string | Relevant excerpt |
| `confidence` | number | 0–1 confidence score |

### Prompt Template

| Field | Type |
|-------|------|
| `id` | string |
| `title` | string |
| `description` | string |
| `category` | `'Research' \| 'Product' \| 'Analytics' \| 'Engineering' \| 'Growth' \| 'UX'` |
| `template` | string (with `[placeholder]` tokens) |

---

## 14. Interaction Patterns

### Keyboard Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| `Enter` | Composer (not Shift) | Send message |
| `Shift+Enter` | Composer | Insert newline |
| `Escape` | Modal open | Close modal |

### Click-Outside Dismissal

Applied to: Notification dropdown, User menu dropdown

### Draft Lifecycle Rules

1. Clicking "New Chat" or a Workbench card opens a Draft — **no conversation is created**
2. Draft populates the composer context (workbench-specific or general)
3. First message submission → Draft promoted to Conversation → appears in sidebar history
4. Navigating away without sending → Draft discarded silently (no history entry)
5. Selecting an existing conversation from sidebar → Draft cleared automatically

### Right Rail Rules

- Only one mode active at a time
- Opening a new mode replaces the current one
- Navigating views (`NAVIGATE`) auto-closes the Rail
- Close button returns Rail width to 0px

### Notification Behavior

- Click on notification marks it as read
- Unread count displayed as badge on bell icon (max "99+")

---

## 15. Animation & Motion

### Keyframe Definitions

| Name | Duration | Easing | Description |
|------|----------|--------|-------------|
| `slideInRight` | 200ms | ease-out | Right Rail entrance (`translateX: 100% → 0`) |
| `slideOutRight` | 200ms | ease-in | Right Rail exit (`translateX: 0 → 100%`) |
| `fadeIn` | 150ms | ease-out | Dropdowns, modals (`opacity: 0 → 1`) |
| `pulseDot` | 1500ms | ease-in-out, infinite | Typing indicator dots (`opacity: 1 → 0.4 → 1`) |

### Transition Patterns

| Element | Property | Duration |
|---------|----------|----------|
| Sidebar width | `transition-all` | 200ms |
| Grid columns | `grid-template-columns` | 200ms ease-in-out |
| Button colors | `transition-colors` | 150ms |
| Card hover (border + shadow) | `transition-all` | 200ms |
| Quick prompt hover | `transition-all` | 150ms |
| StatusDot pulse | `animate-ping` | Tailwind default |
| Refresh spinner | `animate-spin` | Tailwind default |

---

*End of Document*
