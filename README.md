# 🚀 Survival Simulation Platform (NASA Exercise)

[![Next.js](https://img.shields.io/badge/Framework-Next.js%2015-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

An interactive, web-based platform for survival logic training, inspired by the classic **NASA Moon Survival Task**. While the default settings include Mars and Moon scenarios, the platform is designed to be **fully customizable** with unlimited XML-driven scenarios.

The platform is designed for classroom environments and team-based training sessions and follows a specific "Blind Debrief" methodology.

The game features a **Retro-Futuristic CRT aesthetic** (inspired by 70s-80s sci-fi) and is fully optimized for both Desktop and Mobile devices.

---

## 🎮 Gameplay Flow & Features

The platform follows a specific "Team Synchronization" methodology designed for educational environments:
### 1. Identity Verification:
*   Admin pre-registers players for each team.
*   Players select their name from an authorized list (or access the game via a direct personal link).
### 2. Individual Phase:
*   Each player ranks 15 items via Drag & Drop.
*   Once submitted, data is archived. Scores and NASA's correct order remain locked and hidden.
### 3. Collaborative Debrief (Discussion Room):
*   Players enter a live list where they see who has finished.
*   They can "Analyze" each other's choices to discuss survival logic without being biased by scores.
### 4. Assuming Command:
*   The team elects a Commander.
*   The Commander re-takes the simulation on behalf of the whole unit, incorporating the group's collective insights.
### 5. Data Synchronization:
*   Once the Commander submits the "Final Order", they (or the Admin) can Unlock Results.
*   The entire team is then granted access to the final NASA report, penalty scores, and survival logic.

---

## 🔐 Administrator Access

The Command Center provides full control over the training session.

#### Security: Access requires an Authorization Code (Default: `adm` can be changed in `page.tsx`).
### 🛠 Management Features:
*   **Unit Deployment**: Select a scenario (Mars, Moon, etc.) and mass-enroll players by pasting names (one per line).
*   **Access Control**: Generate **Unit QR Codes** (for the whole team) or **Individual QR Codes** (for specific players). Links automatically set the correct language and pre-select names.
*   **Live Monitoring**: A real-time dashboard with **Audio Cues** (soft beep) and **Auto-Sync** alerts you when players finish their tasks.
*   **Data Export**: Download professional **CSV Mission Reports** compatible with Excel for post-training analysis.
*   **Access Overrides**: Manually toggle "Unlock Results" or "Commander Status" for any team.
*   **System Wipe**: Quickly reset the entire database or specific team records for new training sessions.

---

## 🚀 Quick Start for VS Code Users

If you have just cloned or downloaded this repository, follow these steps to launch the game:

### 1. Project Setup
Open **Visual Studio Code**, go to `File > Open Folder...` and select the project directory.

### 2. Install Dependencies
Change to the project derectory if you are not in it
```bash
cd colonization-of-mars
```
In the terminal window, type the following command and press **Enter**:
```bash
npm install
npm install framer-motion lucide-react.
npm install qrcode.react
npm install bcryptjs
npm install -D @types/bcryptjs
```
### 3. Connect Database (Postgres)
The project is optimized for Vercel Postgres (or any Postgres instance).
* Create a .env.local file in the root directory.
* Add your connection string:
```env
POSTGRES_URL="your_postgres_connection_string_here"
```
* Initialize the database schema using the script found in /db/init.sql.

### 4. Run locally
In the terminal window, type the following command
```bash
npm run dev.
```
Navigate to: http://localhost:3000

---

## 🛠 Creating Custom Scenarios
You can add unlimited missions without changing the source code.
### 1. Create the XML File
Create a new file in public/data/my_mission.xml:
```xml
<Mission>
    <Story>
        <Language>en</Language>
        <Logo>logo.png</Logo> 
        <Title>Mission Name</Title>
        <Plot>The survival story text here...</Plot>
    </Story>
    <Evaluations>
        <Rank threshold="20">Excellent result message...</Rank>
        <Rank threshold="50">Average result message...</Rank>
        <Rank threshold="999">Failure message...</Rank>
    </Evaluations>
    <Items>
        <Item id="id">
            <Name>Item Name</Name>
            <Photo>item_photo.jpg</Photo> <!-- Must exist in public/img/ -->
            <Position>1</Position> <!-- NASA priority rank -->
            <Description>Professional survival logic explanation...</Description>
        </Item>
    </Items>
</Mission>
```
### 2. Update the Manifest
Add your new mission to public/data/scenarios.json:
```JSON
[
  {
    "id": "mission_01",
    "file": "my_mission.xml",
    "name": "Custom Survival Challenge",
    "language": "en"
  }
]
```
---

## 🌍 Localization System (Multi-Language)
The platform features a dynamic localization engine that separates the interface from the mission content.

### 1. Interface Strings (JSON)
Located in public/languages/, these files contain all UI labels (buttons, titles, alerts).
* The system uses a localization.json to detect available languages.
* The Admin can switch languages on the fly, while players are automatically assigned a language based on their mission scenario.
###  2. Mission Content (XML)
Each survival scenario defines its own language within the XML tag <Language>.

---

## 📂 Project Structure

### 🏗 Core Architecture
*   **`src/app/page.tsx`** — **The Router**: The main entry point. It handles high-level navigation and determines which "View" to display.
*   **`src/app/actions.ts`** — **The Bridge**: Next.js Server Actions that securely connect the UI with the private database.
*   **`src/logic/useMarsMission.ts`** — **The Brain**: A custom React hook containing all the global state, mission logic, database synchronization, and automated timers.
*   **`src/logic/db.ts`** — **The Vault**: Core logic for Postgres database queries and relational data management.
*   **`src/logic/index.ts`** — **Schemas**: Global TypeScript interfaces and Enums (`ModalMode`, `GameResult`, `Story`) ensuring data consistency across the entire project.

### 🖼 UI Layers
*   **`src/views/`** — **Screens**: Full-screen components for each game state:
    *   `LoginView`, `StoryView`, `GameView`, `AdminView`, `LeaderboardView`, `DiscussionListView`, `UserDetailView`.
*   **`src/components/`** — **Modules**: Reusable UI elements styled with the retro-CRT aesthetic:
    *   `RetroModal`: Universal dialog system for alerts, confirms, and prompts.
    *   `QRModal`: Dynamic generator for player access codes and high-res PNG downloads.
    *   `AnalysisSequence`: Immersive data-processing animation.
    *   `CRTWrapper`: The primary visual frame with scanlines and glowing effects.

### 🛠 Tools
*   **`src/utils/`** — **Helpers**: Pure JavaScript utilities:
    *   `xmlParser.ts`: Converts mission XML files into structured game data.
    *   `exportUtils.ts`: Handles CSV generation for Excel and canvas-to-PNG logic for QR codes.

### 📦 Static Assets (`/public`)
*   **`/data/`** — XML mission scenarios and the `scenarios.json` manifest.
*   **`/languages/`** — JSON translation dictionaries for the multi-language engine.
*   **`/img/`** — Item photos and mission-specific logos.
*   **`/sounds/`** — Audio files.

---

## 🛠 Tech Stack & Libraries

This project leverages modern web technologies to ensure a smooth and reactive experience:

*   **[React](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/)**: Core UI logic and type safety.
*   **[Tailwind CSS v4](https://tailwindcss.com/)**: Custom CRT scanline effects and responsive layout.
*   **[Framer Motion](https://www.framer.com/motion/)**: Smooth, touch-friendly **Drag & Drop** sorting.
*   **[Lucide React](https://lucide.dev/)**: Lightweight retro-style UI icons.
*   **[QR Engine](https://github.com/zpao/qrcode.react)**: Canvas implementation for easy downloads.

---

## 🏁 Prerequisites

Before you begin, ensure you have the following installed on your machine:
*   **[Node.js (LTS)](https://nodejs.org/)** (Version 20 or higher).
*   **[Visual Studio Code](https://code.visualstudio.com/)** (Recommended editor).
*   **Database:** [Vercel](https://vercel.com/) Postgres / Neon Serverless

---

### 📜 Credits
*Logic based on official NASA survival training protocols. Developed for educational and team-building purposes with a focus on UX and atmospheric immersion.*
