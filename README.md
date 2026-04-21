# 🚀 Mars Survival: Valle Marineris (NASA Exercise)

[![Next.js](https://img.shields.io/badge/Framework-Next.js%2015-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

An interactive web-based survival logic game based on the official **NASA Moon Survival Task**, set in the extreme environment of the **Marineris Valley on Mars**. 

The game is designed with a **Retro-Futuristic CRT aesthetic** (inspired by 70s-80s sci-fi) and is fully responsive for both Desktop and Mobile devices.

# Gameplay Instructions
Identity Check: Enter your name and select your team.
Secret Admin Mode: Use the username admin to access the Scenario Editor and Results Database.
Mission Briefing: Read the survival scenario carefully. You are 150km away from the Ares-1 base.
Inventory Management: Use Drag & Drop to rank 15 items.
Position 1: Life-critical items.
Position 15: Useless items for this specific mission.
Survival Analysis: Submit your list to see your score based on official NASA logic (lower score = higher survival chance).
Group Rankings: Compare your performance with other colons in the Team Leaderboard.

---

## 🚀 Quick Start for VS Code Users

If you have just cloned or downloaded this repository, follow these steps to launch the game:

### 1. Open Project
Open **Visual Studio Code**, go to `File > Open Folder...` and select the `ColonizationOfMars` directory.

### 2. Open Integrated Terminal
Press ``Ctrl + ` `` (backtick) or go to `Terminal > New Terminal` in the top menu.

### 3. Install Dependencies
Change to the project derectory if you are not in it
```bash
cd colonization-of-mars
```
In the terminal window, type the following command and press **Enter**:
```bash
npm install
npm install framer-motion lucide-react.
```
### 4. Connect data base
Create all the necessary tables in the database and copy the connection settings to .env.local. See below 

### 5. Run locally
In the terminal window, type the following command
```bash
npm run dev.
```
Click on the link http://localhost:3000 or simply enter this address into your browser.

---

## Database Setup:
Create a Postgres database on Vercel or locally.
Run the initialization script found in /db/init.sql.

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


