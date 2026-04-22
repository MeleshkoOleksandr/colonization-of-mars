# 🚀 Survival Simulation Platform (NASA Exercise)

[![Next.js](https://img.shields.io/badge/Framework-Next.js%2015-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

An interactive, web-based platform for survival logic training, inspired by the classic **NASA Moon Survival Task**. While the default settings include Mars and Moon scenarios, the platform is designed to be **fully customizable** with unlimited XML-driven scenarios.

The game features a **Retro-Futuristic CRT aesthetic** (inspired by 70s-80s sci-fi) and is fully optimized for both Desktop and Mobile devices.

---

## 🎮 Gameplay Flow & Features

The platform is designed for team-based training sessions and follows a specific "Blind Debrief" methodology:

1.  **Identity Check**: Players enter their name and select a pre-created Team.
2.  **Individual Test**: Each player ranks 15 items via **Drag & Drop** based on survival priority. Once submitted, results are stored in the database, but the scores remain **hidden** from the player.
3.  **Mission Debrief (Discussion Room)**: After submitting, players enter a waiting area. They can see who else has finished and can view other players' item orders to start a verbal discussion.
4.  **Assuring Command (The Commander)**: The team must choose a **Commander**. The Commander re-takes the test on behalf of the whole team, incorporating the group's discussion into the final decision. Only one player per team can become the Commander.
5.  **Unlocking Results**: Once the discussion is complete, either the **Admin** or the **Commander** can "Unlock Results". Only then can the team see their scores, the official NASA rankings, and professional survival logic.

---

## 🔐 Administrator Access

To access the Command Center:
*   **Username**: `admin`
*   **Authorization Code**: `adm` (default, can be changed in `page.tsx`)

**Admin Capabilities**:
*   Manage Units (Teams): Create teams and assign them to specific scenarios (Mars, Moon, etc.).
*   Access Control: Manually unlock results or reset Commander status for any team.
*   Results Registry: View all historical data with real-time refresh and filtering.
*   Discussion Management: A dedicated view for project-screen discussions without revealing scores prematurely.

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
