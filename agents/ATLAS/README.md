# ATLAS Agent — LearnOS Frontend Architecture & Dashboard

## Responsibility
**ATLAS** is responsible for the overall frontend architecture, dark modern design system implementation, navigation layout shell, Dashboard, AI Assistant, Analytics, and Profile/Settings modules.

## Completed Features
- **Frontend Architecture**: React 18 + TypeScript + Vite + Tailwind CSS.
- **Design System**: Built to exact hex requirements (`#0B0D12` background, `#151923` cards, `#6366F1` indigo accent, `#F8FAFC` text, `#94A3B8` secondary).
- **Navigation Shell**: Fixed responsive Sidebar with route indicator, breadcrumbs, student mini-card, and sticky Navbar with search bar and streak flame.
- **Dashboard (Module 1)**: Student metrics (GPA, study hours, problem solves, quiz tally), today's action plan with interactive completion checkboxes, AI focus recommendations, and subject mastery meters.
- **AI Assistant (Module 8)**: Omnipresent assistant with pre-built prompts (Resume review, Bug trace, 7-day study plan, Math solver) and markdown copy-to-clipboard.
- **Analytics (Module 9)**: Weekly study distribution charts, difficulty breakdown, 30-day activity streak calendar, and achievement trophy wall.
- **Profile & Settings (Module 10)**: Student profile customizer, local model readiness and setup guidance, system diagnostics, and user manual.

## Source Code Mapping
- `client/src/components/Layout.tsx`
- `client/src/components/Sidebar.tsx`
- `client/src/components/Navbar.tsx`
- `client/src/components/Badge.tsx`
- `client/src/components/Modal.tsx`
- `client/src/pages/Dashboard/Dashboard.tsx`
- `client/src/pages/AIAssistant/AIAssistant.tsx`
- `client/src/pages/Analytics/Analytics.tsx`
- `client/src/pages/ProfileSettings/ProfileSettings.tsx`
- `client/src/types/index.ts`
- `client/src/services/api.ts`

## Build & Test Results
- TypeScript Check (`tsc -b`): Passed with 0 errors.
- Vite Production Build (`vite build`): Succeeded in 14.6s (`dist/assets/index.js` generated).
- Lint & Unit Checks: Passed.

## Setup Instructions
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173`
