# Stars Law College — Management System

Welcome to the **Stars Law College Management System**. This is a premium, enterprise-grade application designed for the administration of students, staff, finances, and automated WhatsApp communications.

---

## 🚀 Minimum System Requirements

Before setting up the system, ensure your master computer has the following software installed. These only need to be installed **once**.

### Windows & macOS

- **[Node.js](https://nodejs.org/)** (v18 or v20 LTS) — Required to run the application engine.
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** — Required for the database and background job services. Ensure Docker Desktop is **running** in your system tray before starting the application.
- **[PostgreSQL CLI (`pg_dump`)](https://www.postgresql.org/download/)** — Recommended for the automated nightly SQL backup engine to function correctly.

---

## 🛠️ First-Time Setup Instructions

You only need to run the setup script the very first time you download the application to your machine.

### For Windows Users

1. Open the `slc` folder in your File Explorer.
2. Navigate to the `scripts/windows/` folder.
3. Double-click the file named **`setup.bat`**.
4. A terminal window will open and automatically download all necessary packages, synchronize the database, and prepare the engine. Allow it to finish completely.

### For Mac Users

1. Open the `slc` folder in Finder.
2. Navigate to the `scripts/mac/` folder.
3. Wait, make sure the script has execution permissions. Open your Terminal and run: `chmod +x scripts/mac/setup.command && chmod +x scripts/mac/start.command`.
4. Double-click the file named **`setup.command`**.
5. Allow the terminal to download all necessary packages and synchronize the database.

---

## 🖥️ Daily Usage & Launching the App

You do not need to use code editors or command lines to run your app daily. We have provided simple one-click launcher scripts.

### Creating a Desktop Icon (Windows)

1. Go to `scripts/windows/` inside your `slc` folder.
2. Right-click on **`start.bat`** and select **"Send to -> Desktop (create shortcut)"**.
3. Now, you have a shortcut on your desktop! You can rename it to **"Start SLC System"**.
4. _(Optional)_ Right-click the new shortcut on your desktop -> Properties -> Change Icon -> Select a nice icon.

### Creating a Desktop Icon (Mac)

Macs _do_ have a Desktop, but the main "homescreen" where all apps live is called the **Launchpad** (which shows the contents of your **Applications** folder), and the pinned bar at the bottom of the screen is called the **Dock**.

To create a proper Mac App icon:

1. Go to `scripts/mac/` inside your `slc` folder.
2. Ensure you have given it permissions: `chmod +x install-mac-app.command`
3. Double-click **`install-mac-app.command`**.
4. This will permanently generate a "Start SLC System" application directly into your Mac's **Applications** folder.
5. You can now press `Cmd + Space` (Spotlight) or open your **Launchpad** to find "Start SLC System" and drag it down to your **Dock** for 1-click access!

### Starting the System

1. **Ensure Docker Desktop is open and running in the background.**
2. Double-click your newly created Desktop Shortcut (`Start SLC System`).
3. A terminal will open to boot up the database, WhatsApp connection, and web server. **Do not close this black window while you are using the app.** You can minimize it.
4. Your default web browser will automatically open and navigate to the application (`http://localhost:3000`).

---

## 🛑 Shutting Down

When you are finished using the application for the day:

1. Open the black Terminal window that was running the application.
2. Press `Ctrl + C` on your keyboard. It will ask "Terminate batch job? (Y/N)". Type `Y` and hit enter to safely shut down the web server.

> **Note:** Unless you shut down your computer, the Docker database will remain running in the background seamlessly.
