# RouteMe: Auto-Add People to GroupMe via Google Voice Text 📲

RouteMe is a Google Apps Script (GAS) that automates adding new users to your GroupMe groups. It works by monitoring your Google Voice-linked email inbox. When someone texts a **keyword** (like "join" or "news") to your Google Voice number, the script detects it and automatically adds that person's phone number to the correct GroupMe chat.

---

## ✨ What It Can Do (The Basics)

* **SMS-to-Group Linking:** Users text a pre-set keyword to your Google Voice number, and they are automatically added to the GroupMe chat you linked to that keyword.
* **Settings Website (Web UI):** You get a dedicated website (a Google Apps Web App) to set up and manage all your keywords, groups, and options.
* **Auto-Nicknames:** To **anonymize** new members while still giving each one a unique name, the script assigns sequential nicknames (e.g., "**User1** ," "**User2** ") using a prefix you choose.
* **Simple Logging:** All activities—successes, failures, and errors—are automatically recorded in a Google Sheet for easy checking and troubleshooting.

---

## ⚙️ How to Set It Up (Step-by-Step Guide)

### Step 1: Create the Project Files

1. Go to [Google Apps Script](https://script.google.com/home/start) and click **"New project."**
2. In the GAS editor, you will see a file named `Code.gs`.
3. Click the `+` icon next to **Files** to add two new files:
   * One **Script file (.gs)** named **`WebApp.gs`** .
   * One **HTML file (.html)** named **`Index`** .

### Step 2: Copy the Code

Copy the full contents of the files you have into the matching files in your new GAS project:

1. Copy the content of your `code.gs` into the `Code.gs` file.
2. Copy the content of your `WebApp.gs` into the **`WebApp.gs`** file.
3. Copy the content of your `index.html` into the **`Index.html`** file.

### Step 3: Run the One-Time Setup Function

This step sets up your logging spreadsheet.

1. In the GAS editor, find the function dropdown menu (it's next to the "Run" button). Change it to **`setup`** .
2. Click the **"Run"** button.
3. When asked for permissions, click **"Review permissions,"** select your account, and click **"Allow."**
4. Check the **Execution log** for a message confirming the log sheet was created.

### Step 4: Deploy the Web App

You must deploy the script to get the URL for your settings website.

1. Click the **"Deploy"** button (top right) and choose **"New deployment."**
2. In the "Select type" gear icon, choose **"Web app."**
3. Set **"Execute as"** to **"Me."**
4. Set **"Who has access"** to **"Only myself"** .
5. Click **"Deploy."**
6. A **"Web app URL"** will appear. **Save this URL!** This is where you will configure your bot.

### Step 5: Set the Timer (Trigger)

The script needs a timer to regularly check your email for new text messages from Google Voice.

1. On the left-hand menu, click the **"Triggers"** icon (it looks like a clock).
2. Click **"Add Trigger"** (bottom right).
3. Configure the trigger:
   * **Function:** `processGoogleVoiceEmails`
   * **Event source:** `Time-driven`
   * **Type:** Choose `Minutes timer` (e.g., `Every 5 minutes`).
4. Click **"Save."**

### Step 6: Configure on the Website

Open the **Web app URL** you saved from Step 4.

1. **Access Token:** Paste your personal **GroupMe Access Token** into the top field and click **"Save Token"** .
2. **Global Settings:** Set a **Fallback User Prefix** (e.g., `Guest`) and **Fallback User Count** (e.g., `1`).
3. **Group Management:** Click **"Add New Group."**
4. **Keywords:** Type the word(s) users will text (e.g., `daily, tech, join`), separated by commas.
5. **Group:** Pick the GroupMe chat you want to link to those keywords.
6. **Add Method:** Review the differences below for the **"Use Batch Add API"** option:

<details>

<summary><strong>GroupMe Batch Add API vs. One-by-One Explained (Important!)</strong></summary>

This option controls the method the script uses to talk to GroupMe's servers.

| **Option**                   | **How It Works**                                                                                                     | **Experience for the Group/User**                                                                                                                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Checked (ON)** - *Recommended* | Uses the GroupMe **Batch Add API** . This sends all add requests to GroupMe at once to process quietly in the background. | **No system messages** ("User was added") are posted in the chat, keeping the chat feed clean. The new user will **not** get a notification they were added, and won't know until someone in the group posts a message. |
| **Unchecked (OFF)**               | Adds each person **one at a time** using a slower method. The script pauses for half a second between each add.           | A **system message** is posted in the chat for every new member, which can clutter the chat. The new user **will** receive the standard GroupMe notification that they were added to the group.         |

</details>

7. Click **"Save Group."**

**The bot is now live!** It will run on the schedule you set to process new text messages.

