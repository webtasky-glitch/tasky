# Tasky

Tasky is a modern, collaborative task, project, and habit management web and mobile application designed to help individuals, families, and organizations stay organized and productive.

---

## Features

### 📋 Task Management
- **Customizable Attributes**: Organize tasks with priorities (Low, Medium, High, Urgent), customizable categories/subjects, and tags.
- **Multi-Assignee Support**: Assign single tasks to one or more members within your plan or organization with intuitive avatar stacks.
- **Recurring Schedules**: Schedule tasks that repeat Daily, Weekly, Monthly, or Weekdays with automatic recurring series tracking.
- **Subtasks & Checklists**: Break down complex tasks into manageable subtasks with progress tracking.
- **Attachments & Comments**: Add file attachments and engage in threaded task-level discussions.

### 🏢 Workspaces & Organizations
- **Multi-Plan Support**: Switch seamlessly between Company, Family, and Personal/Single plans.
- **Role-Based Access**: Granular roles and ranks (Super Admin, Manager, Member/User) ensuring data privacy and secure isolation.
- **Invite Codes**: Join and invite collaborators using custom workspace join codes.

### 📊 Projects & Deadlines
- **Milestone Tracking**: Manage multi-stage projects with dedicated deadlines and progress bars.
- **Task Association**: Group tasks under specific projects to track overall completion rates.

### 📅 Calendar & Scheduling
- **Visual Scheduling**: View all upcoming tasks, deadlines, and events across month and day views.
- **Quick Actions**: Add or reschedule tasks directly from the calendar interface.

### ⚡ Habits & Productivity
- **Habit Tracking**: Build consistent daily routines with streak counters and completion logs.
- **Productivity Analytics**: Monitor daily, weekly, and monthly completion statistics.

### 💬 Collaboration & Support
- **Team Chat**: Real-time messaging within plans and organizations.
- **AI Assistant**: Built-in intelligent support powered by the Gemini API.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Animations**: Motion (`motion/react`)
- **Icons**: Lucide React
- **Backend & Database**: Firebase Firestore & Firebase Authentication
- **Mobile Support**: Capacitor (Android)

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tasky
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in the required credentials:
   ```bash
   cp .env.example .env
   ```

4. Start the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

- `npm run dev` — Starts the development server on port 3000.
- `npm run build` — Builds the application for production.
- `npm run preview` — Locally previews the production build.
- `npm run lint` — Runs TypeScript type-checking.
- `npm run cap:build` — Builds the app and syncs with the Android Capacitor project.
- `npm run cap:open` — Opens the native Android project in Android Studio.

---

## License

This project is licensed under the MIT License.
