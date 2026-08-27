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
1.  **Terminal Standby**: The public domain opens to a **Standby Screen**. Direct access is forbidden. Users must arrive via a secure **Access Link** or **QR Code**.
2.  **Identity Verification**: Players select their name from a pre-authorized manifest created by the Admin. Personal links automatically pre-select the player.
3.  **Individual Phase**: Each colono ranks 15 inventory items via **Drag & Drop**. Upon submission, data is archived. NASA standard ranks and individual scores remain **Classified (Hidden)**.
4.  **Collective Debrief**: Players enter a live **Discussion List**. They can "Analyze" each other's lists to argue their logic verbally, without the bias of scores.
5.  **Assuming Command**: The team elects a **Commander**. The Commander re-takes the simulation, incorporating the group's collective wisdom. The Commander's UI highlights changes from their original individual order in **Amber**.
6.  **Mission Report**: The Admin unlocks the data. The system calculates **Team Synergy** (Collective IQ vs. Individual Average) and generates a **Correlation Matrix Chart** to visualize decision-making accuracy.

---

## 🔐 Administrator Access

The Command Center provides full control over the training session.

#### Security: Access requires an Authorization Code (Default: `adm` can be changed later in UI).
*   **Secure Entry**: Access via a hidden terminal icon in the top-right corner of the **Standby** and **Login** screens.
*   **Authentication**: Uses secure **hashed password** verification with a retro "Eye" toggle for visibility.
*    **The password** can be changed on the administrator page, and its hash is stored in the database in the table settings

### 🛠 Management Features:
*   **Access Control**: Generate **Unit QR Codes** (for the whole team) or **Individual QR Codes** (for specific players). Links automatically set the correct language and pre-select names.
*   **Unit Management**: 
    *   **Bulk Enrollment**: Register whole teams by pasting names (one per line).
    *   **Archive System**: Move old teams to an **Archive View**.
*   **Live Monitoring**: A real-time dashboard with **Audio Cues** (soft beep) and **Auto-Sync** alerts you when players finish their tasks.
*   **Access Overrides**: Manually toggle "Unlock Results" or "Commander Status" for any team.
*   **System Wipe**: Quickly reset all active teams or specific team records for new training sessions.
*   **Data Export**: Download **CSV Mission Reports** compatible with Excel for post-training analysis.

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
npm install framer-motion lucide-react
npm install qrcode.react
npm install bcryptjs
npm install -D @types/bcryptjs
npm install pg
npm install -D @types/pg
```
### 3. Connect Database (Postgres)

The platform is optimized for **Vercel Postgres (Neon)** and local Postgres use. To ensure data isolation, it uses a dedicated **Database Schema**.

*  **Initialize Tables**: Run the script in `/db/init.sql`. This creates the `mars_mission` schema and all required tables (`teams`, `results`, `settings`).
* Create or copy a .env.local file in the root directory for Vercel environment variables.
* Add your connection string:
```env
POSTGRES_URL="your_postgres_connection_string_here"
```

### 4. Run locally
In the terminal window, type the following command
```bash
npm run dev.
```
Navigate to: http://localhost:3000

---

## 📦 Containerization (Docker)

The platform is fully containerized for easy deployment on any server or private network.

### 🛠 Building the Container
To build the image locally:
```bash
docker compose build
```
### 🚀 Running the Local Stack
To start the app and a local Postgres instance simultaneously:
```bash
docker compose up -d
```

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
    *   `StandBy`,`LoginView`, `StoryView`, `GameView`, `AdminView`, `LeaderboardView`, `DiscussionListView`, `UserDetailView`.
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

*   **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
*   **Database**: [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) / Neon (Serverless SQL)
*   **Security**: [bcryptjs](https://www.npmjs.com/package/bcryptjs) (Password hashing)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/) (CRT effects & transitions)
*   **Icons**: [Lucide React](https://lucide.dev/) (Retro UI iconography)
*   **QR Engine**: [qrcode.react](https://www.npmjs.com/package/qrcode.react) (Canvas-based high-res generation)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)

---

### 📜 Credits
*Logic based on official NASA survival training protocols. Developed for educational and team-building purposes with a focus on UX and atmospheric immersion.*
