

# SafeHer 🛡️  
**Personal Safety Application (In Active Development)**
SafeHer (internally referred to as Shield Haven during early development) is a personal safety application currently under active development and learning-driven iteration.

SafeHer is a personal safety application currently under active development and learning-driven iteration.  
The project follows a **web-first approach**, focusing initially on frontend user experience and workflows, followed by progressive backend integration and native mobile capabilities using Capacitor.

This repository represents an **ongoing learning process** in full-stack and mobile application development.

---

## 🎯 Project Objective

The goal of SafeHer is to build a reliable and discreet personal safety system that enables users to:
- Trigger emergency alerts quickly
- Share live location during emergencies
- Manage trusted contacts
- Use sensor-based and pattern-based SOS mechanisms

---

## 🧩 Development Approach (Current Reality)

### Phase 1 — Web Application (Current Focus)
- Core UI and user flows implemented
- SOS triggers and safety settings designed at the frontend level
- Profile and trusted contacts interfaces built
- Supabase integration scaffolded

> ⚠️ At this stage , many features exist as **frontend implementations and workflows**,  
> while complete backend enforcement and real-world reliability are still in progress.

---

### Phase 2 — Backend & Logic Integration (In Progress)
- Connecting frontend actions to Supabase database operations
- Implementing secure SOS event storage
- Improving location accuracy and reliability
- Applying Row-Level Security (RLS)

---

### Phase 3 — Mobile & Native Capabilities (Planned)
- Wrapping the web application using **Capacitor**
- Enabling native features such as:
  - Shake detection
  - Background execution
  - Sensor-based triggers
- Android-first implementation

---

## 🚨 Planned & Partially Implemented Features

### SOS System
- Manual SOS trigger (UI implemented)
- Shake-based SOS (logic in progress)
- Pattern-based SOS (frontend flow implemented)

### Location Tracking
- Location access and display (frontend)
- Real-time tracking (backend logic in progress)

### Trusted Contacts
- Contact management UI
- Backend linking and notifications (in progress)

### Discreet Recording
- UI toggle for audio recording
- Native/background recording (planned via Capacitor)

---

## 🛠️ Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

**Backend (In Progress)**
- Supabase (Authentication, Database, Storage)
- Row-Level Security (RLS)

**Mobile (Planned / In Progress)**
- Capacitor (Android)

---

## 🔐 Environment Variables

Create a `.env` file in the project root:
https://krishnn24.github.io/PBL-Webpage/
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
