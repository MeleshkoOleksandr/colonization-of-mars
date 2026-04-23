# 🚀 Survival Simulation Platform (NASA Exercise)

[![Next.js](https://img.shields.io/badge/Framework-Next.js%2015-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

An interactive, web-based platform for survival logic training, inspired by the classic **NASA Moon Survival Task**. While the default settings include Mars and Moon scenarios, the platform is designed to be **fully customizable** with unlimited XML-driven scenarios.

The platform is designed for team-based training sessions and follows a specific "Blind Debrief" methodology.

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
#### Unit Deployment:
*   Create teams by selecting a Scenario and entering a Team Name.
*   **Bulk Enrollment:** Paste a list of player names (one per line) to pre-register the entire unit.
#### Access Management:
*   **QR Code Generator**: Generate a unique QR code or direct link for any player to ensure instant login.
*   **Status Toggles:** Manually unlock results or reset Commander status for any team via the dashboard.
#### Mission Control:
*   Real-time monitoring of player progress.
*   Ability to wipe team records or the entire database to reset for new groups.

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
        <Title>Mission Name</Title>
        <Plot>The survival story text here...</Plot>
    </Story>
    <Evaluations>
        <Rank threshold="20">Excellent result message...</Rank>
        <Rank threshold="50">Average result message...</Rank>
        <Rank threshold="999">Failure message...</Rank>
    </Evaluations>
    <Items>
        <Item id="o2">
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
    "name": "Custom Survival Challenge"
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

## 🛠 Tech Stack & Libraries

This project leverages modern web technologies to ensure a smooth and reactive experience:

*   **[React](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/)**: Core UI logic and type safety.
*   **[Tailwind CSS v4](https://tailwindcss.com/)**: Custom CRT scanline effects and responsive layout.
*   **[Framer Motion](https://www.framer.com/motion/)**: Smooth, touch-friendly **Drag & Drop** sorting.
*   **[Lucide React](https://lucide.dev/)**: Lightweight retro-style UI icons.

---

## 🏁 Prerequisites

Before you begin, ensure you have the following installed on your machine:
*   **[Node.js (LTS)](https://nodejs.org/)** (Version 20 or higher).
*   **[Visual Studio Code](https://code.visualstudio.com/)** (Recommended editor).
