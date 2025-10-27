# 💬 RouteMe: Easy GroupMe Auto-Add from Google Voice Texts

RouteMe is a simple Google Apps Script (GAS) that makes adding people to your GroupMe groups automatic.

**The idea is simple:** Someone texts a **keyword** (like "join") to your Google Voice number, and the script instantly adds them to the correct GroupMe chat.

---

## ✨ What This Script Does

* **Auto-Add by Text:** If a text has a keyword you set (e.g., `info`), the script finds the user's phone number and adds them to the linked GroupMe group.
* **Settings Website:** You get a simple website to change all the settings, link keywords to groups, and set your token.
* **Anonymous Nicknames:** The script gives new members sequential nicknames (like "**User1** ," "**User2** ") using a prefix you choose. This helps **anonymize** users while making sure everyone has a different name.
* **Logging:** Every add or error is written to a special **Google Sheet log file** so you can see exactly what happened.

---

## ⚙️ How to Set It Up (The Quick Way)

### Step 1: Create the Project

1. Go to [Google Apps Script](https://script.google.com/home/start) and click **"New project."**
2. You have a file named `Code.gs`.
3. Click the `+` icon next to **Files** to add two more:
   * One **Script file (.gs)** named **`WebApp.gs`** .
   * One **HTML file (.html)** named **`Index`** .

### Step 2: Copy the Code

Copy the full contents of your three files (`code.gs`, `WebApp.gs`, `index.html`) into the matching files in your new GAS project.

### Step 3: Deploy the Web App

You must deploy the script to get the URL for your settings website.

1. Click the **"Deploy"** button (top right) and choose **"New deployment."**
2. In the "Select type" gear icon, choose **"Web app."**
3. Set **"Execute as"** to **"Me."**
4. Set **"Who has access"** to **"Only myself"** .
5. Click **"Deploy."**
6. A **"Web app URL"** will appear. **Save this URL!** This is where you will configure your bot.

### Step 4: Configure on the Website

Open the **Web app URL** you saved from Step 3.

1.  **First-Time Setup:** The first time you open the web app, you will see a "One-Time Setup" card. Click the **"Run Automated Setup"** button. This will:
    *   Create the logging spreadsheet.
    *   Set up a timer to automatically check for new messages every 5 minutes.
    *   You will be asked to authorize the script. Please grant the necessary permissions.
2.  **Access Token:** After the setup is complete, the main settings will appear. Paste your personal **GroupMe Access Token** into the top field and click **"Save Token"**.
3.  **Global Settings:** Set a **Fallback User Prefix** (e.g., `Guest`) and **Fallback User Count** (e.g., `1`).
4.  **Group Management:** Click **"Add New Group."**
5.  **Keywords:** Type the word(s) users will text (e.g., `daily, tech, join`), separated by commas.
6.  **Group:** Pick the GroupMe chat you want to link to those keywords.
7.  **Add Method:** Review the differences below for the **"Use Batch Add API"** option:

<details>

<summary><strong>GroupMe Batch Add API vs. One-by-One Explained (Important!)</strong></summary>

This option controls the method the script uses to talk to GroupMe's servers.

| **Option**                   | **How It Works**                                                                                                     | **Experience for the Group/User**                                                                                                                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Checked (ON)** - *Recommended* | Uses the GroupMe **Batch Add API** . This sends all add requests to GroupMe at once to process quietly in the background. | **No system messages** ("User was added") are posted in the chat, keeping the chat feed clean. The new user will **not** get a notification they were added, and won't know until someone in the group posts a message. |
| **Unchecked (OFF)**               | Adds each person **one at a time** using a slower method. The script pauses for half a second between each add.           | A **system message** is posted in the chat for every new member, which can clutter the chat. The new user **will** receive the standard GroupMe notification that they were added to the group.         |

</details>

8. Click **"Save Group."**

**The bot is now live!** It will run on the schedule you set to process new text messages.
