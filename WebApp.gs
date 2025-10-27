/**
 * Serves the web app's HTML page. This is the entry point for the web app.
 * @return {HtmlOutput} The HTML page to be displayed.
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('RouteMe Settings')
    .setFaviconUrl('https://raw.githubusercontent.com/Dev-in-the-BM/RouteMe/main/Assets/RouteMe_favicon.png')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

// --- Helper functions to get and save properties ---
function _getProperties() { return PropertiesService.getScriptProperties(); }
function _getGroupConfigArray() { return JSON.parse(_getProperties().getProperty('GROUPME_ADDER_CONFIG') || '[]'); }
function _saveGroupConfigArray(arr) { _getProperties().setProperty('GROUPME_ADDER_CONFIG', JSON.stringify(arr, null, 2)); }
function _getRoutingRules() { return JSON.parse(_getProperties().getProperty('MODULE_ROUTING_RULES') || '{}'); }
function _saveRoutingRules(obj) { _getProperties().setProperty('MODULE_ROUTING_RULES', JSON.stringify(obj, null, 2)); }

/**
 * Gets the global (non-group) settings.
 * @return {object} An object with global settings.
 */
function getGlobalSettings() {
  const properties = _getProperties();
  return {
    USER_PREFIX: properties.getProperty('USER_PREFIX'),
    USER_COUNT: properties.getProperty('USER_COUNT'),
    SHMUZTECH_COUNT: properties.getProperty('SHMUZTECH_COUNT')
  };
}

/**
 * Saves the global settings.
 * @param {object} settings - An object containing the global settings.
 */
function saveGlobalSettings(settings) {
  const properties = _getProperties();
  properties.setProperty('USER_PREFIX', settings.USER_PREFIX);
  properties.setProperty('USER_COUNT', settings.USER_COUNT);
  properties.setProperty('SHMUZTECH_COUNT', settings.SHMUZTECH_COUNT);
}

/**
 * Gets the group configurations directly as an array.
 * @return {Array<object>} An array of group configuration objects.
 */
function getGroupConfigs() {
  return _getGroupConfigArray();
}

/**
 * Saves (adds or updates) a group configuration and syncs the routing rules.
 * @param {object} groupData - The group object from the frontend.
 */
function saveGroup(groupData) {
  const configs = _getGroupConfigArray();
  const routingRules = _getRoutingRules();

  // Clean up old keywords from routing rules if they have changed
  const oldKeywords = (groupData.originalKeywordsStr || '').split(',').map(k => k.trim()).filter(Boolean);
  const newKeywords = groupData.keywords.split(',').map(k => k.trim()).filter(Boolean);
  
  const removedKeywords = oldKeywords.filter(k => !newKeywords.includes(k));
  removedKeywords.forEach(k => delete routingRules[k]);
  
  // Add new keywords to routing rules
  newKeywords.forEach(k => {
    routingRules[k] = 'groupMeAdder';
  });

  // Prepare the group object for storage
  const newGroupObject = {
    keywords: newKeywords,
    groupId: groupData.groupId,
    prefix: groupData.prefix || '',
    count: groupData.count ? parseInt(groupData.count, 10) : undefined,
    useBatchAdd: groupData.useBatchAdd
  };

  // Find and update the existing group, or add it if it's new
  const groupIndex = configs.findIndex(g => g.groupId === groupData.originalGroupId);
  if (groupIndex !== -1) {
    configs[groupIndex] = newGroupObject;
  } else {
    configs.push(newGroupObject);
  }
  
  // Save both properties back
  _saveGroupConfigArray(configs);
  _saveRoutingRules(routingRules);

  return 'Group saved successfully.';
}

/**
 * Deletes a group configuration by its Group ID and cleans up routing rules.
 * @param {string} groupId - The Group ID of the group to delete.
 */
function deleteGroup(groupId) {
  const configs = _getGroupConfigArray();
  const routingRules = _getRoutingRules();

  const groupIndex = configs.findIndex(g => g.groupId === groupId);
  if (groupIndex !== -1) {
    const keywordsToDelete = configs[groupIndex].keywords;
    
    // Remove keywords from routing rules
    keywordsToDelete.forEach(k => delete routingRules[k]);
    
    // Remove the group from the config array
    configs.splice(groupIndex, 1);
    
    // Save both properties back
    _saveGroupConfigArray(configs);
    _saveRoutingRules(routingRules);
    
    return 'Group deleted.';
  }
  return 'Error: Group not found.';
}

/**
 * A one-time utility function to migrate the old object-based GROUPME_ADDER_CONFIG
 * to the new array-based structure. This is safe to run multiple times.
 */
function migrateConfigToV3() {
  const properties = PropertiesService.getScriptProperties();
  const configStr = properties.getProperty('GROUPME_ADDER_CONFIG');
  
  if (!configStr) {
    Logger.log('No configuration found to migrate. Skipping.');
    return;
  }

  const oldConfig = JSON.parse(configStr);

  // Check if the migration has already been done
  if (Array.isArray(oldConfig)) {
    Logger.log('Configuration is already in the new array format. No migration needed.');
    return;
  }

  Logger.log('Old object-based config found. Starting migration...');
  const newConfigArray = [];
  
  for (const keyword of Object.keys(oldConfig)) {
    const value = oldConfig[keyword];
    let newGroupObject;
    
    if (typeof value === 'object' && value !== null) {
      // Handles the old advanced format: "matzav": { "groupId": "...", "prefix": "..." }
      newGroupObject = { keywords: [keyword], ...value };
    } else {
      // Handles the old simple format: "news": "12345"
      newGroupObject = { keywords: [keyword], groupId: value, prefix: '', count: undefined };
    }
    newConfigArray.push(newGroupObject);
  }
  
  // Save the new array format
  properties.setProperty('GROUPME_ADDER_CONFIG', JSON.stringify(newConfigArray, null, 2));
  Logger.log('✅ Migration successful! Your groups should now appear in the web UI.');
}

/**
 * Logs a message to the Apps Script logger only if DEBUG_MODE is enabled.
 * @param {string} message - The message to log.
 */
function debugLog(message) {
  // Check the property once and store it for the duration of the script run
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty('DEBUG_MODE') === 'true') {
    Logger.log(`DEBUG | ${message}`);
  }
}

/**
 * Gets the GroupMe access token from script properties.
 * @return {string} The GroupMe access token.
 */
function getGroupMeToken() {
  return _getProperties().getProperty('GROUPME_TOKEN');
}

/**
 * Saves the GroupMe access token to script properties.
 * @param {string} token - The GroupMe access token.
 */
function saveGroupMeToken(token) {
  _getProperties().setProperty('GROUPME_TOKEN', token);
}

/**
 * Fetches the user's groups from the GroupMe API.
 * @return {Array<object>} An array of group objects.
 */
function getGroupMeGroups() {
  const token = getGroupMeToken();
  if (!token) {
    return [];
  }
  const url = `https://api.groupme.com/v3/groups?token=${token}&per_page=100`;
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const code = response.getResponseCode();
  if (code === 200) {
    return JSON.parse(response.getContentText()).response;
  }
  return [];
}

/**
 * Checks if the initial setup has been completed.
 * @return {boolean} True if setup is complete, false otherwise.
 */
function checkSetupStatus() {
  return _getProperties().getProperty('SETUP_COMPLETED') === 'true';
}

/**
 * Runs the one-time setup process.
 * @return {string} A success or error message.
 */
function runFirstTimeSetup() {
  try {
    // 1. Run the existing setup function from code.gs
    setup();

    // 2. Set up the time-based trigger
    const functionName = 'processGoogleVoiceEmails';
    
    // Delete any existing triggers for this function to avoid duplicates
    const existingTriggers = ScriptApp.getProjectTriggers();
    existingTriggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === functionName) {
        ScriptApp.deleteTrigger(trigger);
      }
    });

    // Create a new trigger to run every 5 minutes
    ScriptApp.newTrigger(functionName)
      .timeBased()
      .everyMinutes(5)
      .create();

    // 3. Mark setup as complete
    _getProperties().setProperty('SETUP_COMPLETED', 'true');
    
    return 'Setup completed successfully! The script is now running.';
  } catch (e) {
    Logger.log(`Error during first-time setup: ${e.message}`);
    return `An error occurred: ${e.message}`;
  }
}

/**
 * Gets the URL of the deployed web app.
 * @return {string} The web app URL.
 */
function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}
