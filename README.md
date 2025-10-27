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

### Step 3: Run the Setup

This step creates the log spreadsheet.

1. In the GAS editor, change the function dropdown to **`setup`** .
2. Click the **"Run"** button.
3. Click **"Review permissions,"** select your account, and click **"Allow."** The script is now allowed to run.

### Step 4: Get the Settings Website Link

You must deploy the script to create the link for your settings page.

1. Click the **"Deploy"** button (top right) and choose **"New deployment."**
2. Choose **"Web app"** as the type.
3. Set **"Execute as"** to **"Me"** and **"Who has access"** to **"Only myself"** .
4. Click **"Deploy."**
5. **SAVE the "Web app URL" that appears.** This is your settings website.

### Step 5: Set the Timer (The Trigger)

The script needs a timer to regularly check your email.

1. On the left-hand menu, click the **"Triggers"** icon (the clock).
2. Click **"Add Trigger."**
3. Set the options:
   * **Function:** `processGoogleVoiceEmails`
   * **Event source:** `Time-driven`
   * **Interval:** `Minutes timer` (e.g., `Every 5 minutes`).
4. Click **"Save."**

### Step 6: Configure on the Website

Open the **Web app URL** you saved from Step 4.

1. **Access Token:** Paste your personal **GroupMe Access Token** and click **"Save Token"** .
2. **Global Settings:** Set a default prefix (like `Guest`) and starting number (like `1`).
3. **Group Management (Most Important):**
   * Click **"Add New Group."**
   * Type the **Keywords** people will text (e.g., `daily, news`), separated by commas.
   * Select the **GroupMe chat** you want to link.
   * Review the Batch Add option below:

<details>

<summary><strong>Batch Add API vs. One-by-One Explained</strong></summary>

This option changes how the script adds the user to GroupMe.

| **Option**                   | **How It Works**                                               | **Experience for the Group/User**                                                                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Checked (ON)** - *Recommended* | Adds all people at once, quietly in the background.                  | **No "User was added" system messages** in the chat. New user **won't get a notification** until someone posts a message in the group.                                      |
| **Unchecked (OFF)**               | Adds each person one at a time, with a small pause between each one. | A **system message** is posted for every new member, which can clutter the chat. New user **will** get the standard GroupMe notification that they were added to the group. |

</details>

4. Click **"Save Group."**

**The bot is now ready!**

