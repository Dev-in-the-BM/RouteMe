![RouteMe Logo](https://github.com/Dev-in-the-BM/RouteMe/blob/main/RouteMe.png?raw=true)

# <img src="https://github.com/Dev-in-the-BM/RouteMe/blob/main/RouteMe.png?raw=true" alt="Rocket" width="25" height="25" /> RouteMe: Automate GroupMe Invites via Google Voice

RouteMe is a Google Apps Script that automatically adds people to your GroupMe groups when they text a keyword to your Google Voice number.

**The concept is simple:** Someone texts "join" to your Google Voice number, and the script instantly adds them to your designated GroupMe chat.

---

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Microsoft-Teams-Animated-Emojis/master/Emojis/Objects/Light%20Bulb.png" alt="Light Bulb" width="25" height="25" /> Core Features

* **Keyword-Based Invites:** Link keywords (e.g., `news`, `updates`) to specific GroupMe groups.
* **Web-Based Settings:** A user-friendly website to manage your settings, keywords, and groups.
* **Anonymous Nicknames:** Automatically assign sequential nicknames (e.g., "User1", "User2") to new members.
* **Detailed Logging:** Every action is recorded in a Google Sheet for easy monitoring and troubleshooting.

---

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Memo.png" alt="Memo" width="25" height="25" /> Before You Begin

Make sure you have the following:

* A GroupMe Account.
* A Google Account.
* A Google Voice number associated with your Google Account.
* Your [GroupMe Access Token](https://dev.groupme.com/applications).
* **Email forwarding for Google Voice messages enabled.** You can check this in your Google Voice settings under "Messages" and ensure "Forward messages to email" is turned on.

---

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Microsoft-Teams-Animated-Emojis/master/Emojis/Objects/Gear.png" alt="Gear" width="25" height="25" /> Step-by-Step Setup Guide

### Step 1: Create the Google Apps Script Project

First, we need to create a new project in Google Apps Script and add the necessary files.

1. Go to [script.google.com](https://script.google.com/home/start) and click **New project**.
2. You will see a file named `Code.gs`.
3. Click the **+** icon next to **Files** and add two more files:
    * A **Script** file named `WebApp.gs`.
    * An **HTML** file named `index.html`.

*You should now have three files in your project: `Code.gs`, `WebApp.gs`, and `index.html`.*

### Step 2: Copy the Code

Copy the contents of the files from this project into the corresponding files in your new Google Apps Script project.

1. Copy the content of `code.gs` into your `Code.gs` file.
2. Copy the content of `WebApp.gs` into your `WebApp.gs` file.
3. Copy the content of `index.html` into your `index.html` file.

### Step 3: Deploy the Web App

Next, we need to "deploy" the script. This makes the settings website accessible via a private URL.

1. At the top right, click **Deploy** and select **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure the web app settings:
    * **Execute as:** `Me`
    * **Who has access:** `Only myself`
4. Click **Deploy**.
5. **Important:** A "Web app URL" will be displayed. **Copy and save this URL.** This is the link to your private settings page.

### Step 4: Configure the Script via the Web App

Now we'll use the web app you just deployed to complete the setup.

1. **Open the Web App URL** you saved in the previous step.
2. **Run the Automated Setup:**
    * You will see a "One-Time Setup" card. Click the **Run Automated Setup** button.
    * This will automatically:
      * Create a Google Sheet to log all activity.
      * Create a trigger to check for new text messages every 5 minutes.
    * A pop-up will ask for permissions. **You must click "Review permissions" and "Allow"** for the script to work.
3. **Enter Your GroupMe Access Token:**
    * Once the setup is complete, the main settings will appear.
    * Paste your **GroupMe Access Token** into the "GroupMe Access Token" field and click **Save Token**.
4. **Add Your First Group:**
    * Click **Add New Group**.
    * **Keywords:** Enter the keywords you want to trigger the invite, separated by commas (e.g., `join, news, updates`).
    * **Group:** Select the GroupMe group you want to link to these keywords.
    * Click **Save Group**.

---

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Microsoft-Teams-Animated-Emojis/master/Emojis/Activities/Party%20Popper.png" alt="Party Popper" width="25" height="25" /> That's It!

Your bot is now live! When someone texts one of your keywords to your Google Voice number, they will be automatically added to the corresponding GroupMe group.

---

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Warning.png" alt="Warning" width="25" height="25" /> Troubleshooting

* **"Authorization is required" error:** If you see this, it means you need to grant permissions to the script. Follow the on-screen instructions to authorize it.
* **Changes not appearing:** If you make changes to the code, you will need to create a new deployment to see the changes reflected in the web app. Go to **Deploy > Manage deployments**, select your deployment, and click the pencil icon to create a new version.
* **Check the logs:** If you encounter any issues, the first place to look is the "Logs" sheet in your "GroupMe Bot Logs" Google Sheet. It will tell you what the script is doing and if there are any errors.

![Visitor Count](https://komarev.com/ghpvc/?username=Dev-in-the-BM&label=Repo%20Visitors&color=blueviolet&style=flat-square)

