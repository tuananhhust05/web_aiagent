# ForSkale Frontend Documentation

> **Purpose**: This document provides a comprehensive specification of the ForSkale frontend application for backend developers to understand the data flow, user interactions, and required API endpoints.

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [Technology Stack](#technology-stack)
3. [Routing & Navigation](#routing--navigation)
4. [Internationalization (i18n)](#internationalization-i18n)
5. [Page Specifications](#page-specifications)
   - [Landing Page (Index)](#landing-page-index)
   - [Sign Up Page](#sign-up-page)
   - [Login Page](#login-page)
   - [Onboarding Flow](#onboarding-flow)
6. [Data Models & State](#data-models--state)
7. [API Requirements](#api-requirements)
8. [User Flow Diagrams](#user-flow-diagrams)

---

## Application Overview

ForSkale is an AI-powered Sales Coach platform. The frontend is a React-based SPA (Single Page Application) that wraps a static HTML landing page (`/forskale.html`) and provides React-managed authentication and onboarding flows.

### Key Features

- Multi-language support (English, Italian, Spanish)
- OAuth authentication (Google, Microsoft, Apple)
- Email/password authentication
- 3-step onboarding wizard
- Responsive design (mobile + desktop)

---

## Technology Stack

| Technology      | Purpose                 |
| --------------- | ----------------------- |
| React 18        | UI Framework            |
| TypeScript      | Type Safety             |
| React Router v6 | Client-side Routing     |
| TanStack Query  | Server State Management |
| Tailwind CSS    | Styling                 |
| Vite            | Build Tool              |

---

## Routing & Navigation

### Routes Configuration

| Route         | Component    | Description                               |
| ------------- | ------------ | ----------------------------------------- |
| `/`           | `Index`      | Landing page (iframe to `/forskale.html`) |
| `/login`      | `Login`      | User authentication                       |
| `/signup`     | `SignUp`     | New user registration                     |
| `/onboarding` | `Onboarding` | 3-step user profile setup                 |
| `*`           | `NotFound`   | 404 catch-all                             |

### Navigation Flow

```
Landing Page (/)
    ├── Click "Log In" → /login
    └── Click "Sign Up" → /signup
                              │
                              ▼
                        /onboarding (3 steps)
                              │
                              ▼
                         Dashboard (/)
```

---

## Internationalization (i18n)

### Supported Languages

| Code | Language | Default       |
| ---- | -------- | ------------- |
| `en` | English  | No            |
| `it` | Italian  | Yes (default) |
| `es` | Spanish  | No            |

### Implementation

```typescript
// Language Context provides:
interface LanguageContextType {
  lang: Lang;           // Current language: "en" | "it" | "es"
  setLang: (lang: Lang) => void;  // Change language
  t: (key: TranslationKey) => string;  // Get translated string
}
```

### Language Switcher

- Available on all pages (top-right corner)
- Persists in React state (NOT persisted to localStorage/backend currently)
- **Backend Requirement**: Store user's preferred language in user profile

---

## Page Specifications

---

### Landing Page (Index)

**Route**: `/`

**Description**: Displays the static ForSkale landing page via iframe.

**Implementation Details**:

- Renders `/forskale.html` in a fullscreen iframe
- Loads Mouseflow analytics script for session recording

**External Links**:

- The HTML file contains links to `/login` and `/signup` which navigate to React routes

**Analytics Integration**:

```javascript
// Mouseflow project tracking
window._mfq = window._mfq || [];
// Script: https://cdn.mouseflow.com/projects/8002b794-c4a1-4999-bc9f-753bfd71d119.js
```

---

### Sign Up Page

**Route**: `/signup`

**Layout**: Two-column (desktop), single column (mobile)

#### Left Panel (Desktop Only)

- ForSkale logo
- Marketing headline: "Your AI Sales Coach"
- Feature highlights: Top sales professionals use ForSkale to prepare better, close faster, and improve every day.

#### Right Panel (Main Form)

**UI Elements**:

| Element         | Type                   | Description                      |
| --------------- | ---------------------- | -------------------------------- |
| Email Input     | `<input type="email">` | User's work email                |
| Sign Up Button  | `<button>`             | Submits email form               |
| Google OAuth    | `<button>`             | OAuth with Google                |
| Microsoft OAuth | `<button>`             | OAuth with Microsoft             |
| Terms Links     | `<a>`                  | Terms of Service, Privacy Policy |
| Login Link      | `<Link>`               | Navigate to `/login`             |

**User Actions & Expected Behavior**:

| Action                | Current Behavior           | Required Backend Behavior                         |
| --------------------- | -------------------------- | ------------------------------------------------- |
| Submit email form     | Navigates to `/onboarding` | POST `/api/auth/signup` with email, then redirect |
| Click Google OAuth    | Navigates to `/onboarding` | Initiate OAuth flow, create user, redirect        |
| Click Microsoft OAuth | Navigates to `/onboarding` | Initiate OAuth flow, create user, redirect        |
| Click "Log In"        | Navigates to `/login`      | Client-side only                                  |

**Data Captured**:

```typescript
{
  email: string;  // User-entered email
}
```

---

### Login Page

**Route**: `/login`

**Layout**: Two-column (desktop), single column (mobile)

#### Left Panel (Desktop Only)

- ForSkale logo
- Marketing headline: "Your AI Sales Coach"
- Description text
- Stats note: "800,000+ Sales professionals..."

#### Right Panel (Main Form)

**UI Elements**:

| Element         | Type                      | State Variable | Description           |
| --------------- | ------------------------- | -------------- | --------------------- |
| Email Input     | `<input type="email">`    | `email`        | Work email            |
| Password Input  | `<input type="password">` | `password`     | User password         |
| Keep Signed In  | `<input type="checkbox">` | `keepSignedIn` | Remember session      |
| Forgot Password | `<a>`                     | -              | Password reset link   |
| Login Button    | `<button type="submit">`  | -              | Submit credentials    |
| Google OAuth    | `<button>`                | -              | OAuth with Google     |
| Microsoft OAuth | `<button>`                | -              | OAuth with Microsoft  |
| Apple OAuth     | `<button>`                | -              | OAuth with Apple      |
| Sign Up Link    | `<Link>`                  | -              | Navigate to `/signup` |

**User Actions & Expected Behavior**:

| Action                  | Current Behavior | Required Backend Behavior                    |
| ----------------------- | ---------------- | -------------------------------------------- |
| Submit login form       | Console log only | POST `/api/auth/login` with email, password  |
| Click Google OAuth      | None             | Initiate Google OAuth flow                   |
| Click Microsoft OAuth   | None             | Initiate Microsoft OAuth flow                |
| Click Apple OAuth       | None             | Initiate Apple OAuth flow                    |
| Click "Forgot Password" | None (href="#")  | Navigate to password reset flow              |
| Check "Keep Signed In"  | State update     | Include in auth request for extended session |

**Data Captured**:

```typescript
{
  email: string;
  password: string;
  keepSignedIn: boolean;
}
```

---

### Onboarding Flow

**Route**: `/onboarding`

**Total Steps**: 3

**Layout**:

- Logo positioned in top-left corner inside an off-white circular badge with a subtle pulsing animation
- Language switcher in top-right corner (dark variant)
- Form card centered on screen
- Mobile: Same top-bar layout, card fills width

**Visual Design**:

- Background: Dark gradient (`hsl(220 40% 13%)` → `hsl(200 50% 15%)` → `hsl(180 40% 18%)`)
- Off-white logo circle with pulse animation (simulates "listening" effect)
- Glassmorphism card effect (white card on dark background)
- Animated floating orbs (subtle teal/green on dark)
- Typography: 'Plus Jakarta Sans'
- Key form fields (selects, inputs) use **bold** text when filled to improve scanability

---

#### Progress Indicator (StepIndicator)

Visual progress bar showing current step.

```typescript
interface StepIndicatorProps {
  current: number;  // 0-indexed current step
  total: number;    // Total steps (3)
}
```

**Behavior**:

- Current step: Expanded pill (48px wide) with gradient
- Completed steps: Small dot with gradient
- Future steps: Small gray dot

---

#### Step 0: Professional Information

**Title**: "Tell us about yourself"

**Form Fields**:

| Field              | Type       | Variable           | Options/Values                                          | Order |
| ------------------ | ---------- | ------------------ | ------------------------------------------------------- | ----- |
| Meeting Language   | Select     | `language`         | en-US, en-AU, en-IN, en-GB, es-ES, es-MX, it-IT         | 1     |
| Department         | Select     | `department`       | Sales, HR/Recruiting, Marketing, Strategy, Other        | 2     |
| Job Title          | Select     | `jobTitle`         | (depends on department - see below)                     | 3     |
| Team Size          | Select     | `teamSize`         | Only me, 2-3, 4-10, 11-20, 21-50, 50+                   | 4     |
| How Found Us       | Select     | `source`           | Referred, Search Engine, Social Media, Community, Other | 5     |
| Source Detail      | Text Input | `sourceDetail`     | Free text (shown when source is selected)               | 6     |
| Company Website    | Text Input | `companyWebsite`   | Free text (e.g., "acme.com")                            | 7     |
| No Company Website | Checkbox   | `noCompanyWebsite` | Boolean                                                 | 8     |

**Job Titles by Department**:

```typescript
const JOB_TITLE_KEYS = {
  Sales: [
    "Sales Development Rep / Business Development Rep",
    "Sales Executive",
    "Sales Manager Operations",
    "Sales Manager",
    "Sales Intern",
    "Other"
  ],
  "HR/Recruiting": [
    "Recruiter",
    "Talent Acquisition Specialist",
    "HR Manager",
    "Other HR Roles"
  ],
  Marketing: [
    "Marketing Manager",
    "Growth Marketer",
    "Content Marketer",
    "Other Marketing Roles"
  ],
  Strategy: [
    "Strategy Consultant",
    "Business Development",
    "Strategy Manager",
    "Other Strategy Roles"
  ],
  Other: [
    "Founder / Co-Founder",
    "CEO",
    "COO",
    "Consultant",
    "Advisor",
    "Freelancer",
    "Student",
    "Other"
  ]
};
```

**User Actions**:

| Action                     | Behavior                                                     |
| -------------------------- | ------------------------------------------------------------ |
| Select Department          | Clears Job Title selection, shows department-specific titles |
| Check "No company website" | Disables website input, clears value                         |
| Select "How Found Us"      | Shows detail input field                                     |
| Click "Continue"           | Advances to Step 1                                           |

---

#### Step 1: Goals Selection

**Title**: "Which goals do you want to focus on here?"

**Subtitle**: "What you pick helps set you up for success in ForSkale."

**Component**: `StepGoals`

**Selection Type**: Multi-select (chips/pills)

**Available Goals**:

| Key    | Goal Text                                     |
| ------ | --------------------------------------------- |
| goal1  | Understand my sales calls better              |
| goal2  | Detect objections, intent, and buying signals |
| goal3  | AI analysis of conversations                  |
| goal4  | Improve my deal strategy                      |
| goal5  | AI strategic insights for every meeting       |
| goal6  | Identify risks and opportunities              |
| goal7  | Automate follow-ups after meetings            |
| goal8  | AI-generated emails and next steps            |
| goal9  | Tasks created automatically                   |
| goal10 | Prepare better for upcoming meetings          |
| goal11 | Prospect intelligence                         |
| goal12 | Suggested talking points                      |
| goal13 | Train and coach my sales team                 |

**Data Captured**:

```typescript
{
  selectedGoals: string[];  // Array of selected goal keys
}
```

**User Actions**:

| Action           | Behavior                                 |
| ---------------- | ---------------------------------------- |
| Click goal chip  | Toggle selection (add/remove from array) |
| Click "Back"     | Returns to Step 0                        |
| Click "Continue" | Advances to Step 2 with selected goals   |

---

#### Step 2: Familiarity Level

**Title**: "How familiar are you with tools like ForSkale?"

**Subtitle**: "Your answer sets the right pace for getting started in ForSkale."

**Component**: `StepFamiliarity`

**Selection Type**: Single-select (radio-style cards)

**Options**:

| ID          | Label                      | Icon |
| ----------- | -------------------------- | ---- |
| new         | I'm new to tools like this | 🌱   |
| some        | I've used similar tools    | 🔧   |
| experienced | I'm experienced            | 🚀   |

**Data Captured**:

```typescript
{
  familiarityLevel: "new" | "some" | "experienced";
}
```

**User Actions**:

| Action                     | Behavior                               |
| -------------------------- | -------------------------------------- |
| Click option card          | Selects that option (single selection) |
| Click "Back"               | Returns to Step 1                      |
| Click "Enter the platform" | Completes onboarding, navigates to `/` |

**Button States**:

- Disabled (gray) when no selection
- Enabled (gradient) when option selected

---

#### Complete Onboarding Data Model

When onboarding completes, all collected data should be sent to the backend:

```typescript
interface OnboardingData {
  // Step 0: Professional Info
  meetingLanguage: string;      // e.g., "en-US", "it-IT"
  department: string;           // Department key
  jobTitle: string;             // Job title key
  teamSize: string;             // e.g., "Only me", "2-3", "4-10"
  companyWebsite: string | null; // URL or null if checkbox checked
  acquisitionSource: string;    // e.g., "Referred", "Search Engine"
  acquisitionDetail: string;    // Free text detail

  // Step 1: Goals
  selectedGoals: string[];      // Array of goal keys

  // Step 2: Familiarity
  familiarityLevel: "new" | "some" | "experienced";
}
```

**Current Console Output** (for reference):

```javascript
console.log("Onboarding complete:", {
  language,
  department,
  jobTitle,
  teamSize,
  source,
  sourceDetail,
  familiarity
});
```

---

## Data Models & State

### User Profile (Expected)

```typescript
interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  preferredLanguage: "en" | "it" | "es";
  onboardingCompleted: boolean;
  onboardingData?: OnboardingData;
  createdAt: Date;
  updatedAt: Date;
}
```

### Authentication State (Expected)

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
}
```

---

## API Requirements

### Authentication Endpoints

| Method | Endpoint                    | Description          | Request Body                        | Response                                |
| ------ | --------------------------- | -------------------- | ----------------------------------- | --------------------------------------- |
| POST   | `/api/auth/signup`          | Register new user    | `{ email: string }`                 | `{ userId, verificationSent: boolean }` |
| POST   | `/api/auth/login`           | Email/password login | `{ email, password, keepSignedIn }` | `{ accessToken, refreshToken, user }`   |
| POST   | `/api/auth/logout`          | End session          | -                                   | `{ success: boolean }`                  |
| POST   | `/api/auth/refresh`         | Refresh tokens       | `{ refreshToken }`                  | `{ accessToken, refreshToken }`         |
| POST   | `/api/auth/forgot-password` | Request reset        | `{ email }`                         | `{ sent: boolean }`                     |
| POST   | `/api/auth/reset-password`  | Reset password       | `{ token, newPassword }`            | `{ success: boolean }`                  |

### OAuth Endpoints

| Method | Endpoint                       | Description              |
| ------ | ------------------------------ | ------------------------ |
| GET    | `/api/auth/google`             | Initiate Google OAuth    |
| GET    | `/api/auth/google/callback`    | Google OAuth callback    |
| GET    | `/api/auth/microsoft`          | Initiate Microsoft OAuth |
| GET    | `/api/auth/microsoft/callback` | Microsoft OAuth callback |
| GET    | `/api/auth/apple`              | Initiate Apple OAuth     |
| GET    | `/api/auth/apple/callback`     | Apple OAuth callback     |

### User Endpoints

| Method | Endpoint             | Description      | Request Body                         |
| ------ | -------------------- | ---------------- | ------------------------------------ |
| GET    | `/api/user/profile`  | Get current user | -                                    |
| PATCH  | `/api/user/profile`  | Update profile   | Partial user data                    |
| PATCH  | `/api/user/language` | Update language  | `{ language: "en" \| "it" \| "es" }` |

### Onboarding Endpoints

| Method | Endpoint                   | Description        | Request Body     |
| ------ | -------------------------- | ------------------ | ---------------- |
| POST   | `/api/onboarding/complete` | Submit onboarding  | `OnboardingData` |
| GET    | `/api/onboarding/status`   | Check if completed | -                |

---

## User Flow Diagrams

### Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           NEW USER FLOW                                  │
└─────────────────────────────────────────────────────────────────────────┘

[Landing Page] ──────────────────────────────────────────────────────────┐
      │                                                                   │
      ▼                                                                   │
[Click "Sign Up"]                                                         │
      │                                                                   │
      ▼                                                                   │
┌─────────────────────┐                                                   │
│    /signup Page     │                                                   │
├─────────────────────┤                                                   │
│ ┌─────────────────┐ │                                                   │
│ │ Enter Email     │ │                                                   │
│ └────────┬────────┘ │                                                   │
│          │          │                                                   │
│          ▼          │                                                   │
│ ┌─────────────────┐ │        ┌─────────────────┐                        │
│ │ Click Submit    │─┼───────►│  POST /signup   │                        │
│ └─────────────────┘ │        └────────┬────────┘                        │
│                     │                 │                                 │
│        OR           │                 ▼                                 │
│                     │        ┌─────────────────┐                        │
│ ┌─────────────────┐ │        │ Create Account  │                        │
│ │ Click Google    │─┼───────►│ Send Verify     │                        │
│ └─────────────────┘ │        └────────┬────────┘                        │
│                     │                 │                                 │
│ ┌─────────────────┐ │                 │                                 │
│ │ Click Microsoft │─┤                 │                                 │
│ └─────────────────┘ │                 │                                 │
└─────────────────────┘                 │                                 │
                                        │                                 │
                                        ▼                                 │
                              ┌─────────────────────┐                     │
                              │   /onboarding       │                     │
                              ├─────────────────────┤                     │
                              │                     │                     │
                              │ Step 0: Profile     │                     │
                              │   - Language        │                     │
                              │   - Department      │                     │
                              │   - Job Title       │                     │
                              │   - Team Size       │                     │
                              │   - Company Website │                     │
                              │   - How Found Us    │                     │
                              │         │           │                     │
                              │         ▼           │                     │
                              │ Step 1: Goals       │                     │
                              │   - Multi-select    │                     │
                              │     13 options      │                     │
                              │         │           │                     │
                              │         ▼           │                     │
                              │ Step 2: Familiarity │                     │
                              │   - Single select   │                     │
                              │     3 options       │                     │
                              │         │           │                     │
                              └─────────┼───────────┘                     │
                                        │                                 │
                                        ▼                                 │
                              ┌─────────────────────┐                     │
                              │ POST /onboarding    │                     │
                              │     /complete       │                     │
                              └─────────┬───────────┘                     │
                                        │                                 │
                                        ▼                                 │
                              ┌─────────────────────┐                     │
                              │    Dashboard (/)    │◄────────────────────┘
                              │   (Landing Page)    │
                              └─────────────────────┘
```

### Returning User Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RETURNING USER FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

[Landing Page]
      │
      ▼
[Click "Log In"]
      │
      ▼
┌─────────────────────┐
│    /login Page      │
├─────────────────────┤
│                     │
│ Email + Password    │───────► POST /api/auth/login
│        OR           │                 │
│ OAuth Button        │                 ▼
│                     │         ┌───────────────┐
└─────────────────────┘         │  Validate     │
                                │  Credentials  │
                                └───────┬───────┘
                                        │
                        ┌───────────────┼───────────────┐
                        ▼               │               ▼
                   [Success]            │          [Failure]
                        │               │               │
                        ▼               │               ▼
               ┌────────────────┐       │      ┌────────────────┐
               │ Check if       │       │      │ Show Error     │
               │ onboarding     │       │      │ Message        │
               │ completed      │       │      └────────────────┘
               └───────┬────────┘       │
                       │                │
           ┌───────────┴───────────┐    │
           ▼                       ▼    │
    [Not Complete]           [Complete] │
           │                       │    │
           ▼                       ▼    │
    /onboarding             Dashboard   │
                                        │
```

---

## Component Styling Reference

### Color Palette

| Usage                 | HSL Value                | Hex (approx) |
| --------------------- | ------------------------ | ------------ |
| Primary Green         | `hsl(90 73% 48%)`       | #7ED321      |
| Primary Teal          | `hsl(176 58% 55%)`      | #4ECDC4      |
| Primary Blue          | -                        | #0B5394      |
| Background Light      | `hsl(210 33% 96%)`      | #F1F5F9      |
| Onboarding BG (dark)  | `hsl(220 40% 13%)` → `hsl(180 40% 18%)` | Dark gradient |
| Logo Circle BG        | `hsl(40 20% 95%)`       | Off-white    |
| Dark Panel            | -                        | #0A1128      |
| Text Dark             | `hsl(0 0% 10%)`         | ~#1A1A1A     |
| Text Muted            | `hsl(215 16% 47%)`      | ~#6B7280     |
| Border Light          | `hsl(214 32% 91%)`      | ~#E2E8F0     |

### Gradient

```css
background: linear-gradient(135deg, #7ED321 0%, #4ECDC4 50%, #0B5394 100%);
```

### Glassmorphism Card

```css
.glass-card {
  background: hsla(0 0% 100% / 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid hsla(0 0% 100% / 0.3);
  border-radius: 24px;
}
```

### Logo Circle

```css
.logo-circle {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: hsl(40 20% 95%);  /* Off-white */
  border: 1px solid hsla(0 0% 100% / 0.3);
  animation: logo-pulse 3s ease-in-out infinite;  /* Pulsing ring animation */
}
```

---

## Notes for Backend Implementation

1. **Session Management**: The "Keep me signed in" checkbox on login should extend token lifetime.

2. **Language Preference**: Currently stored in React state only. Should be persisted to user profile.

3. **OAuth Providers**:
   - Google OAuth
   - Microsoft OAuth
   - Apple Sign In
4. **Email Verification**: After signup, users should verify their email before full access.

5. **Onboarding State**: Track whether user has completed onboarding. Redirect incomplete users back to `/onboarding`.

6. **Translation Keys**: All UI text uses translation keys. Backend responses should include localized messages or error codes that frontend can translate.

7. **Analytics**: Mouseflow session recording is active on the landing page.

---

## File Structure Reference

```
src/
├── App.tsx                          # Root component, routing
├── pages/
│   ├── Index.tsx                    # Landing page (iframe)
│   ├── Login.tsx                    # Login page
│   ├── SignUp.tsx                   # Sign up page
│   ├── Onboarding.tsx               # Onboarding flow
│   └── NotFound.tsx                 # 404 page
├── components/
│   ├── LanguageSwitcher.tsx         # Language dropdown
│   ├── NavLink.tsx                  # Navigation link
│   └── onboarding/
│       ├── SelectField.tsx          # Dropdown component
│       ├── StepIndicator.tsx        # Progress dots
│       ├── StepGoals.tsx            # Step 1: Goals
│       ├── StepFamiliarity.tsx      # Step 2: Familiarity
│       └── StepUseCases.tsx         # (Unused currently)
├── i18n/
│   ├── LanguageContext.tsx          # Language provider
│   └── translations.ts              # All translations
└── assets/
    └── forskale-logo.png            # Logo
```

---

_Document generated: March 2024_
_Version: 1.2 — Updated: March 2026 (dark onboarding background, logo top-left with pulse animation, bold form fields, reordered Step 0 fields)_
