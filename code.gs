// -----------------------------------------------------------------------------
// --- MAIN ROUTER - Processes emails and dispatches tasks to modules ---
// -----------------------------------------------------------------------------

/**
 * Main function with added verbose logging for debugging.
 */
function processGoogleVoiceEmails() {
  const properties = PropertiesService.getScriptProperties();
  const emailAlerts = [];
  // --- 1. Load Configuration from Script Properties ---
  const config = {
    token: properties.getProperty('GROUPME_TOKEN'),
    sheetId: properties.getProperty('LOG_SHEET_ID'),
    userPrefix: properties.getProperty('USER_PREFIX') || 'User',
    userCount: parseInt(properties.getProperty('USER_COUNT')) || 1,
    shmuzTechCount: parseInt(properties.getProperty('SHMUZTECH_COUNT')) || 1,
    routingRules: JSON.parse(properties.getProperty('MODULE_ROUTING_RULES') || '{}'),
    groupMeConfig: JSON.parse(properties.getProperty('GROUPME_ADDER_CONFIG') || '[]'),
    sampleConfig: JSON.parse(properties.getProperty('SAMPLE_MODULE_CONFIG') || '{}')
  };
  
  debugLog('Script starting. Debug mode is ON.');

  if (!config.token || !config.sheetId) {
    Logger.log('FATAL ERROR: GROUPME_TOKEN or LOG_SHEET_ID is not set. Run setup().');
    return;
  }

  const spreadsheet = SpreadsheetApp.openById(config.sheetId);
  const logSheet = getSheetByName(spreadsheet, 'Logs');
  const idSheet = getSheetByName(spreadsheet, 'ProcessedIDs');
  const processedIds = getProcessedIds(idSheet);

  const allKeywords = Object.keys(config.routingRules);
  debugLog(`Loaded ${processedIds.size} processed IDs. Watching for keywords: [${allKeywords.join(', ')}]`);

  // --- 2. Fetch and Process Emails ---
  const query = 'from:txt.voice.google.com is:unread';
  const threads = GmailApp.search(query, 0, 50);
  Logger.log(`Found ${threads.length} unread threads.`);
  debugLog(`------------- Start Email Processing Loop -------------`);

  threads.forEach(thread => {
    thread.getMessages().forEach(message => {
      const subject = message.getSubject();
      debugLog(`Inspecting message: "${subject}" (ID: ${message.getId()})`);

      // This is the critical gate. We now log WHY we skip a message.
      if (message.isUnread() && !processedIds.has(message.getId())) {
        debugLog('-> Condition MET. Message is unread and not processed. Proceeding...');
        
        const body = message.getPlainBody();
        const phoneE164 = extractPhoneNumber(subject);
        if (!phoneE164) {
          logEntry(logSheet, 'N/A', 'N/A', `Error: Could not extract phone number from subject - "${subject}"`);
          markMessageProcessed(message, idSheet, processedIds);
          return;
        }
        debugLog(`--> Extracted Phone Number: ${phoneE164}`);

        const messageText = body.split('Google Voice')[0].trim().toLowerCase();
        const detectedKeyword = detectKeyword(messageText, allKeywords);

        if (!detectedKeyword) {
          debugLog(`--> No keyword found in message body. Marking as processed.`);
          logEntry(logSheet, phoneE164, 'None', 'No keyword found in message.');
          markMessageProcessed(message, idSheet, processedIds);
          return;
        }
        debugLog(`--> Detected Keyword: "${detectedKeyword}"`);

        // --- 3. Dispatch to the Correct Module ---
        const moduleName = config.routingRules[detectedKeyword];
        const data = { phone: phoneE164, keyword: detectedKeyword, message: messageText };
        
        try {
          dispatchModule(moduleName, data, config, logSheet);
        } catch (e) {
          const errorMessage = `Error dispatching module '${moduleName}': ${e.message}`;
          logEntry(logSheet, phoneE164, detectedKeyword, errorMessage);
          emailAlerts.push(errorMessage);
        }

        markMessageProcessed(message, idSheet, processedIds);

      } else {
        // This ELSE block is new and will tell us why messages were skipped.
        if (!message.isUnread()) {
          debugLog('-> SKIPPING: Message was already marked as read.');
        }
        if (processedIds.has(message.getId())) {
          debugLog('-> SKIPPING: Message ID was already in the processed list.');
        }
      }
    });
  });
  debugLog(`------------- Finished Email Processing Loop -------------`);

  // --- 4. Send Error Summary Email ---
  if (emailAlerts.length > 0) {
    const alertBody = 'Errors encountered in Google Voice Script:\n' + emailAlerts.join('\n');
    // MailApp.sendEmail('your-email@example.com', 'Google Voice Script Errors', alertBody);
  }
}

/**
 * Acts as a switchboard, calling the correct module function based on the module name.
 * @param {string} moduleName - The name of the module to run (e.g., 'groupMeAdder').
 * @param {object} data - The data object containing phone, keyword, and message.
 * @param {object} config - The master configuration object.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The logging sheet object.
 */
function dispatchModule(moduleName, data, config, sheet) {
  Logger.log(`Dispatching to module: ${moduleName} for keyword: ${data.keyword}`);
  switch (moduleName) {
    case 'groupMeAdder':
      runGroupMeAdderModule(data, config, sheet);
      break;
    case 'shmuzTechOnboarding':
      runShmuzTechOnboardingModule(data, config, sheet);
      break;
    case 'sampleModule':
      runSampleModule(data, config, sheet);
      break;
    default:
      throw new Error(`Module '${moduleName}' not found.`);
  }
}


// ---------------------------------------------------------------------------
// --- MODULES - Each function handles a specific type of task ---
// ---------------------------------------------------------------------------

/**
 * MODULE: Creates a new GroupMe group, adds the sender, and posts welcome messages.
 * @param {object} data - The data object from the dispatcher.
 * @param {object} config - The master configuration object.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The logging sheet.
 */
function runShmuzTechOnboardingModule(data, config, sheet) {
  const groupName = `Join ShmuzTech ${config.shmuzTechCount}`;
  const newGroup = createGroupMeGroup(config.token, groupName);
  if (!newGroup) {
    logEntry(sheet, data.phone, data.keyword, `Error: Failed to create new GroupMe group "${groupName}".`);
    return;
  }
  logEntry(sheet, data.phone, data.keyword, `Successfully created group "${groupName}" (ID: ${newGroup.id}).`);
  const addResult = addToGroupMe(config.token, newGroup.id, data.phone, "New Member", "");
  if (!addResult.success) {
    logEntry(sheet, data.phone, data.keyword, `Error: Failed to add user to new group ${newGroup.id}.`);
    return;
  }
  logEntry(sheet, data.phone, data.keyword, `Successfully added user to new group.`);
  const welcomeMessages = [
    "Hi 👋, and welcome to ShmuzTech, a chat for anything tech and kosher tech related.\n\nAsk and shmuz about tech, filtering, kosher devices, deals, modding apps and ROMs, and more.",
    "All members must keep to the following rules:\n\n • No posting anything related to hacking filters, or filters or kosher devices being hacked.\n• No foul or inappropriate language or topics.\n• No spamming.\n• No posting anything that's off-topic or unrelated to tech.\n• No posting about accessing AI image generators via text.\n\nAny violation of these rules will cause immediate removal.",
    "To be added to the chat, please provide the following information:\n\n• What's your name?\n• Where did you hear about this chat from?\n• Age\n• If you're a user on JTech Forums, what's your username?\n• Do you have any experience or skills related to tech (for example, filtering, troubleshooting, programming, device repair, app modding, etc.)?\n• What do you want your name to show up as on the chat?\n\nThis information will not be given out and will be kept private."
  ];
  for (let i = 0; i < welcomeMessages.length; i++) {
    Utilities.sleep(1500);
    const postSuccess = postGroupMeMessage(config.token, newGroup.id, welcomeMessages[i]);
    if (!postSuccess) {
      logEntry(sheet, data.phone, data.keyword, `Error: Failed to post welcome message #${i+1}.`);
    }
  }
  logEntry(sheet, data.phone, data.keyword, `Posted welcome messages.`);
  PropertiesService.getScriptProperties().setProperty('SHMUZTECH_COUNT', (config.shmuzTechCount + 1).toString());
  Logger.log(`SHMUZTECH_COUNT incremented to ${config.shmuzTechCount + 1}`);
  logEntry(sheet, data.phone, data.keyword, `Onboarding process complete.`);
}

/**
 * =================================================================================
 * === UPDATED FUNCTION ============================================================
 * =================================================================================
 * MODULE: Adds a user to a specific GroupMe group.
 * Now updates the in-memory count to ensure correct naming within a single run.
 * @param {object} data - The data object from the dispatcher.
 * @param {object} config - The master configuration object.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The logging sheet.
 */
function runGroupMeAdderModule(data, config, sheet) {
  // The config is now an array. We must search it.
  const groupConfig = config.groupMeConfig.find(g => g.keywords && g.keywords.includes(data.keyword));

  if (!groupConfig) {
    logEntry(sheet, data.phone, data.keyword, `Error: No Group config found for this keyword.`);
    return;
  }
  
  // Use the settings from the found group object
  const groupId = groupConfig.groupId;
  const prefix = groupConfig.prefix || config.userPrefix; // Fallback to global prefix
  const count = groupConfig.count !== undefined ? groupConfig.count : config.userCount; // Fallback to global count
  const useGroupSpecificCounter = groupConfig.count !== undefined;

  // --- Perform duplicate check and add user ---
  const isDuplicate = checkGroupMeDuplicate(config.token, groupId, data.phone);
  if (isDuplicate === null) {
    logEntry(sheet, data.phone, data.keyword, 'Error: GroupMe duplicate check failed.');
    return;
  }
  if (isDuplicate) {
    logEntry(sheet, data.phone, data.keyword, 'Duplicate - User already in group.');
    return;
  }

  // Add user to the group
  const addResult = addToGroupMe(config.token, groupId, data.phone, prefix, count);
  logEntry(sheet, data.phone, data.keyword, addResult.status);

  // --- Increment the correct counter on success ---
  if (addResult.success) {
    const properties = PropertiesService.getScriptProperties();
    if (useGroupSpecificCounter) {
      // Find the group in the original array, increment its count, and save the whole array back.
      const groupConfigs = JSON.parse(properties.getProperty('GROUPME_ADDER_CONFIG') || '[]');
      const groupIndex = groupConfigs.findIndex(g => g.groupId === groupId);
      
      if (groupIndex !== -1) {
        // The count to save is the one we just used, plus one.
        const newCount = (groupConfig.count || 0) + 1;
        groupConfigs[groupIndex].count = newCount;
        properties.setProperty('GROUPME_ADDER_CONFIG', JSON.stringify(groupConfigs, null, 2));
        
        // --- FIX --- Update the in-memory config object for the next loop iteration.
        config.groupMeConfig[groupIndex].count = newCount;
        
        Logger.log(`Group-specific count for group ${groupId} incremented to ${newCount}`);
      }
    } else {
      // Increment the global counter
      const newCount = config.userCount + 1;
      properties.setProperty('USER_COUNT', newCount.toString());
      
      // --- FIX --- Update the in-memory global count for the next loop iteration.
      config.userCount = newCount;
      
      Logger.log(`Global USER_COUNT incremented to ${newCount}`);
    }
  }
}

/**
 * MODULE: A sample module to demonstrate extensibility.
 * @param {object} data - The data object from the dispatcher.
 * @param {object} config - The master configuration object.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The logging sheet.
 */
function runSampleModule(data, config, sheet) {
  const reply = config.sampleConfig.replyMessage || "No reply message configured.";
  const logMessage = `Sample module triggered. Would have replied: "${reply}"`;
  logEntry(sheet, data.phone, data.keyword, logMessage);
}


// ---------------------------------------------------------------------------
// --- HELPER FUNCTIONS - Reusable utility functions ---
// ---------------------------------------------------------------------------

/**
 * Creates a new GroupMe group.
 * @param {string} token - The GroupMe API token.
 * @param {string} name - The name for the new group.
 * @return {object|null} The new group object on success, or null on failure.
 */
function createGroupMeGroup(token, name) {
  try {
    const payload = { name: name, share: false };
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    const url = `https://api.groupme.com/v3/groups?token=${token}`;
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    if (code >= 200 && code < 300) {
      return JSON.parse(response.getContentText()).response;
    } else {
      Logger.log(`GroupMe create group failed: ${code} - ${response.getContentText()}`);
      return null;
    }
  } catch (e) {
    Logger.log(`GroupMe create group exception: ${e.message}`);
    return null;
  }
}

/**
 * Posts a message to a GroupMe group.
 * @param {string} token - The GroupMe API token.
 * @param {string} groupId - The ID of the group to post to.
 * @param {string} text - The message text to post.
 * @return {boolean} True on success, false on failure.
 */
function postGroupMeMessage(token, groupId, text) {
  try {
    const guid = Utilities.getUuid();
    const payload = { message: { source_guid: guid, text: text } };
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    const url = `https://api.groupme.com/v3/groups/${groupId}/messages?token=${token}`;
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    if (code >= 200 && code < 300) {
      return true;
    } else {
      Logger.log(`GroupMe post message failed: ${code} - ${response.getContentText()}`);
      return false;
    }
  } catch (e) {
    Logger.log(`GroupMe post message exception: ${e.message}`);
    return false;
  }
}

/**
 * Adds a phone number to a specific GroupMe group with a generated nickname.
 * @param {string} token - The GroupMe API token.
 * @param {string} groupId - The ID of the group to add the user to.
 * @param {string} phoneE164 - The user's phone number in E.164 format.
 * @param {string} prefix - The prefix for the user's nickname.
 * @param {number|string} count - The current user count for the nickname.
 * @return {object} An object with the status and success of the add operation.
 */
function addToGroupMe(token, groupId, phoneE164, prefix, count) {
  try {
    const nickname = prefix + count;
    const guid = `guid-${new Date().getTime()}-${Math.random()}`;
    const payload = {
      members: [{
        phone_number: phoneE164,
        nickname: nickname,
        guid: guid
      }]
    };
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    const url = `https://api.groupme.com/v3/groups/${groupId}/members/add?token=${token}`;
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    if (code >= 200 && code < 300) {
      return { success: true, status: `Success - Added as ${nickname}` };
    } else {
      const responseText = response.getContentText();
      Logger.log(`GroupMe add failed: ${code} - ${responseText}`);
      return { success: false, status: `Error: GroupMe API returned code ${code}` };
    }
  } catch (e) {
    Logger.log(`GroupMe add exception: ${e.message}`);
    return { success: false, status: `Exception during add: ${e.message}` };
  }
}

/**
 * Checks if a phone number is already a member of a GroupMe group.
 * @param {string} token - The GroupMe API token.
 * @param {string} groupId - The ID of the group to check.
 * @param {string} phoneE164 - The phone number to check.
 * @return {boolean|null} True if a duplicate, false if not, null on error.
 */
function checkGroupMeDuplicate(token, groupId, phoneE164) {
  try {
    const url = `https://api.groupme.com/v3/groups/${groupId}?token=${token}`;
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      Logger.log(`GroupMe check error: ${response.getContentText()}`);
      return null;
    }
    const groupData = JSON.parse(response.getContentText()).response;
    return groupData.members.some(member => member.phone_number === phoneE164);
  } catch (e) {
    Logger.log(`GroupMe check exception: ${e.message}`);
    return null;
  }
}

/**
 * Finds the first keyword from a list that exists in the message text.
 * @param {string} messageText - The body of the email/SMS.
 * @param {string[]} keywords - An array of keywords to search for.
 * @return {string|null} The first keyword found, or null if none are found.
 */
function detectKeyword(messageText, keywords) {
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(messageText)) {
      return keyword;
    }
  }
  return null;
}

/**
 * Extracts a phone number from a Google Voice email subject.
 * @param {string} subject - The email subject line.
 * @return {string|null} The phone number in E.164 format or null.
 */
function extractPhoneNumber(subject) {
  if (!subject.startsWith('New text message from')) return null;
  const phoneMatch = subject.match(/\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
  if (!phoneMatch) return null;
  return `+1${phoneMatch[0].replace(/\D/g, '')}`;
}

/**
 * Marks a message as read and logs its ID to prevent reprocessing.
 * @param {GoogleAppsScript.Gmail.GmailMessage} message The message to process.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} idSheet The sheet where processed IDs are stored.
 * @param {Set<string>} processedIdsSet The in-memory Set of processed IDs.
 */
function markMessageProcessed(message, idSheet, processedIdsSet) {
  const messageId = message.getId();
  message.markRead();
  idSheet.appendRow([messageId]);
  processedIdsSet.add(messageId);
  Logger.log(`Marked message as processed: ID ${messageId}`);
}

/**
 * Logs a message to both the Logger and a Google Sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The logging sheet object.
 * @param {string} phone - The phone number involved.
 * @param {string} keyword - The keyword detected.
 * @param {string} status - The result or status message.
 */
function logEntry(sheet, phone, keyword, status) {
  const timestamp = new Date().toISOString();
  Logger.log(`LOG | ${phone} | ${keyword} | ${status}`);
  if (sheet) {
    sheet.appendRow([timestamp, phone, keyword, status]);
  }
}

/**
 * Gets a sheet by name from a spreadsheet, creating it if it doesn't exist.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet The spreadsheet object.
 * @param {string} sheetName The name of the sheet to get or create.
 * @param {string[]} [headers] Optional array of headers to set if the sheet is created.
 * @return {GoogleAppsScript.Spreadsheet.Sheet} The sheet object.
 */
function getSheetByName(spreadsheet, sheetName, headers = []) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    if (headers.length > 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

/**
 * Reads all message IDs from the ProcessedIDs sheet into a Set for fast lookup.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} idSheet The sheet containing processed IDs.
 * @return {Set<string>} A Set containing all previously processed message IDs.
 */
function getProcessedIds(idSheet) {
  if (idSheet.getLastRow() < 2) {
    return new Set();
  }
  const ids = idSheet.getRange(2, 1, idSheet.getLastRow() - 1, 1).getValues();
  return new Set(ids.flat().filter(id => id));
}


// ---------------------------------------------------------------------------
// --- ONE-TIME SETUP FUNCTION ---
// ---------------------------------------------------------------------------

/**
 * Run this function MANUALLY to set up the script properties with new data structures.
 */
function setup() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('LOG_SHEET_ID')) {
    const spreadsheet = SpreadsheetApp.create('GroupMe Bot Logs');
    const sheetId = spreadsheet.getId();
    properties.setProperty('LOG_SHEET_ID', sheetId);
    getSheetByName(spreadsheet, 'Logs', ['Timestamp', 'Phone Number', 'Keyword', 'Status']);
    getSheetByName(spreadsheet, 'ProcessedIDs', ['MessageID']);
    const defaultSheet = spreadsheet.getSheetByName('Sheet1');
    if (defaultSheet) {
      spreadsheet.deleteSheet(defaultSheet);
    }
    Logger.log(`✅ Logging Sheet created. URL: ${spreadsheet.getUrl()}`);
    Logger.log(`-> Set LOG_SHEET_ID property to: ${sheetId}`);
  } else {
    Logger.log('ℹ️ LOG_SHEET_ID already exists. Skipping sheet creation.');
  }

  const defaultProperties = {
    'GROUPME_TOKEN': 'PASTE_YOUR_GROUPME_API_TOKEN_HERE',
    'USER_PREFIX': 'User',
    'USER_COUNT': '1',
    'SHMUZTECH_COUNT': '1',
    'DEBUG_MODE': 'false', // New property for verbose logging
    'MODULE_ROUTING_RULES': JSON.stringify({
      'shmuztech': 'shmuzTechOnboarding',
      'info': 'sampleModule'
    }, null, 2),
    'GROUPME_ADDER_CONFIG': JSON.stringify([], null, 2), // Now defaults to an empty array
    'SAMPLE_MODULE_CONFIG': JSON.stringify({
      'replyMessage': 'Thanks for your interest! We will be in touch.'
    }, null, 2)
  };

  for (const key in defaultProperties) {
    if (!properties.getProperty(key)) {
      properties.setProperty(key, defaultProperties[key]);
      Logger.log(`✅ Created property: ${key}. PLEASE EDIT ITS VALUE.`);
    } else {
      Logger.log(`ℹ️ Property '${key}' already exists. Skipping.`);
    }
  }
  Logger.log('\nSetup complete. Please go to Project Settings > Script Properties to edit the values, then deploy the web app to manage group mappings.');
}
