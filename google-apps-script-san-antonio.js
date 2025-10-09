/**
 * Google Apps Script for Search Visibility Ranking Tracker - San Antonio Office
 *
 * Instructions:
 * 1. Open Google Apps Script (script.google.com)
 * 2. Create new project
 * 3. Replace Code.gs content with this file
 * 4. Set up DataForSEO credentials in getDataForSEOConfig()
 * 5. Save and refresh your Google Sheet
 */

// =============================================================================
// CONFIGURATION - SAN ANTONIO
// =============================================================================

/**
 * DataForSEO API Configuration
 * Reads API key from Script Properties (Project Settings > Script Properties)
 */
function getDataForSEOConfig() {
  const basicAuth = PropertiesService.getScriptProperties().getProperty('basic');

  if (!basicAuth) {
    throw new Error('DataForSEO API key not found! Please add "basic" property in Project Settings > Script Properties');
  }

  return {
    Authorization: `Basic ${basicAuth}`,
    baseUrl: 'https://api.dataforseo.com/v3/serp/google/organic'
  };
}

/**
 * Sheet configuration - San Antonio specific
 */
const SHEET_NAMES = {
  RANK_MONITOR: 'san-antonio',  // San Antonio specific tab name
  SUBMIT_REQUESTS: 'sa_submit_requests',    // San Antonio specific audit tabs
  RESULTS_DUMP: 'sa_results_dump'
};

/**
 * Base column configuration for San Antonio sheet
 * Standard structure without additional data columns (like Palm Beaches)
 */
const BASE_COLUMNS = {
  OFFICE: 0,       // Column A
  TARGETS: 1,      // Column B
  SERVICE: 2,      // Column C
  LAT: 3,          // Column D
  LONG: 4,         // Column E
  PRIME_URL: 5,    // Column F (manual entry - specific page to track)
  FIRST_DATA_COL: 6 // Column G - where ranking data columns start
};

/**
 * Returns the fixed columns for ranking data (always overwrites same columns)
 * Returns the column indices for Rank and URL
 */
function findNextEmptyColumns() {
  // Always use the same columns - overwrite previous data
  // Columns G and H (standard structure)
  return {
    RANK: BASE_COLUMNS.FIRST_DATA_COL,     // Column G
    URL: BASE_COLUMNS.FIRST_DATA_COL + 1   // Column H
  };
}

// =============================================================================
// CUSTOM MENU - SAN ANTONIO
// =============================================================================

/**
 * Creates custom menu when sheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🌵 San Antonio Ranking Tracker')  // San Antonio themed menu
    .addItem('📤 Submit Ranking Jobs', 'submitRankingJobs')
    .addItem('📥 Get Results', 'getRankingResults')
    .addSeparator()
    .addItem('📊 View Job Status', 'checkJobStatus')
    .addItem('📋 View Submit Requests', 'viewSubmitRequests')
    .addItem('📋 View Results Dump', 'viewResultsDump')
    .addItem('🧹 Clear Task Data', 'clearTaskData')
    .addSeparator()
    .addItem('🤖 Setup Daily Automation', 'setupDailyAutomation')
    .addItem('🔕 Disable Automation', 'disableAutomation')
    .addItem('🧪 Test Daily Check', 'testDailyRankingCheck')
    .addSeparator()
    .addItem('⚙️ Test Connection', 'testDataForSEOConnection')
    .addToUi();
}

// =============================================================================
// MAIN FUNCTIONS (BUTTON ACTIONS)
// =============================================================================

/**
 * Button 1: Submit Ranking Jobs
 * Runs Preflight + Takeoff phases
 */
function submitRankingJobs() {
  try {
    const ui = SpreadsheetApp.getUi();

    // Show confirmation dialog
    const response = ui.alert(
      'Submit Ranking Jobs - San Antonio',
      'This will submit ranking check jobs to DataForSEO for San Antonio. Continue?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) return;

    ui.alert('⏳ Processing...', 'Reading San Antonio sheet data and submitting jobs. Please wait.', ui.ButtonSet.OK);

    // Phase 1: Get sheet data and run preflight
    const sheetData = getSheetData();
    const preflightData = buildPreflightFromSheet(sheetData);

    // Phase 2: Submit jobs to DataForSEO (Takeoff)
    const taskResults = submitJobsToDataForSEO(preflightData);

    // Phase 3: Store task IDs back in sheet
    writeTaskIdsToSheet(taskResults);

    // Show success message
    const jobCount = Object.values(taskResults).flat().length;
    ui.alert(
      '✅ Jobs Submitted Successfully!',
      `${jobCount} San Antonio ranking jobs submitted to DataForSEO.\n\nWait 2-5 minutes, then click "Get Results".`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', `Failed to submit San Antonio jobs: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
    console.error('Submit jobs error:', error);
  }
}

/**
 * Button 2: Get Results
 * Runs Landing phase and writes results to sheet
 */
function getRankingResults() {
  try {
    const ui = SpreadsheetApp.getUi();

    // Show confirmation dialog
    const response = ui.alert(
      'Get Ranking Results - San Antonio',
      'This will fetch results from DataForSEO and update the San Antonio sheet. Continue?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) return;

    ui.alert('⏳ Processing...', 'Fetching results from DataForSEO. This may take a moment.', ui.ButtonSet.OK);

    // Phase 1: Read task IDs from temporary storage
    const taskIds = getStoredTaskIds();

    if (taskIds.length === 0) {
      ui.alert('⚠️ No Jobs Found', 'No task IDs found. Please run "Submit Ranking Jobs" first.', ui.ButtonSet.OK);
      return;
    }

    // Phase 2: Fetch results from DataForSEO
    const results = fetchResultsFromDataForSEO(taskIds);

    // Phase 3: Write results back to sheet
    writeResultsToSheet(results);

    // Clear stored task IDs after successful retrieval
    clearStoredTaskIds();

    // Show success message
    ui.alert(
      '✅ Results Updated Successfully!',
      `San Antonio ranking data has been updated in the sheet.\n\nCheck the latest column for new rankings.`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', `Failed to get San Antonio results: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
    console.error('Get results error:', error);
  }
}

// =============================================================================
// AUTOMATED RANKING CHECK FUNCTIONS
// =============================================================================

/**
 * Daily automated ranking check - runs both submit and get results with delay
 * This function is designed to be called by time-driven triggers
 */
function dailyRankingCheck() {
  try {
    console.log('🤖 Starting automated San Antonio daily ranking check...');

    // Phase 1: Submit ranking jobs
    submitRankingJobsAutomated();

    // Phase 2: Wait 5 minutes for DataForSEO to process
    console.log('⏳ Waiting 5 minutes for DataForSEO to process jobs...');
    Utilities.sleep(5 * 60 * 1000); // 5 minutes

    // Phase 3: Get results
    getRankingResultsAutomated();

    console.log('✅ Automated San Antonio daily ranking check completed successfully!');

  } catch (error) {
    console.error('❌ Automated San Antonio daily ranking check failed:', error);

    // Optional: Send email notification about the failure
    // You can uncomment and customize this if you want email alerts
    /*
    try {
      MailApp.sendEmail({
        to: 'your-email@example.com',
        subject: '❌ San Antonio Daily Ranking Check Failed',
        body: `The automated San Antonio daily ranking check failed with error: ${error.message}\n\nPlease check the Google Apps Script logs for more details.`
      });
    } catch (emailError) {
      console.error('Failed to send error notification email:', emailError);
    }
    */
  }
}

/**
 * Automated version of submitRankingJobs (no UI dialogs)
 * Used by daily automation - same logic as manual version but without user prompts
 */
function submitRankingJobsAutomated() {
  console.log('📤 Starting automated San Antonio job submission...');

  // Phase 1: Get sheet data and run preflight
  const sheetData = getSheetData();
  const preflightData = buildPreflightFromSheet(sheetData);

  // Phase 2: Submit jobs to DataForSEO (Takeoff)
  const taskResults = submitJobsToDataForSEO(preflightData);

  // Phase 3: Store task IDs back in sheet
  writeTaskIdsToSheet(taskResults);

  // Log success
  const jobCount = Object.values(taskResults).flat().length;
  console.log(`✅ Automated San Antonio job submission completed: ${jobCount} jobs submitted`);

  return jobCount;
}

/**
 * Automated version of getRankingResults (no UI dialogs)
 * Used by daily automation - same logic as manual version but without user prompts
 */
function getRankingResultsAutomated() {
  console.log('📥 Starting automated San Antonio results retrieval...');

  // Phase 1: Read task IDs from temporary storage
  const taskIds = getStoredTaskIds();

  if (taskIds.length === 0) {
    console.log('⚠️ No task IDs found for automated San Antonio results retrieval');
    return;
  }

  // Phase 2: Fetch results from DataForSEO
  const results = fetchResultsFromDataForSEO(taskIds);

  // Phase 3: Write results back to sheet
  writeResultsToSheet(results);

  // Clear stored task IDs after successful retrieval
  clearStoredTaskIds();

  console.log('✅ Automated San Antonio results retrieval completed successfully!');

  return results.length;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Gets all data from the San Antonio sheet
 */
function getSheetData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.RANK_MONITOR);
  return sheet.getDataRange().getValues();
}

/**
 * Gets the San Antonio sheet
 */
function getRankMonitorSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.RANK_MONITOR);
}

/**
 * Gets or creates the submit requests sheet for San Antonio
 */
function getSubmitRequestsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAMES.SUBMIT_REQUESTS);

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAMES.SUBMIT_REQUESTS);

    // Set up headers
    const headers = ['Prime URL', 'Request Data'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#fff3e0'); // Orange theme for San Antonio

    // Set column widths
    sheet.setColumnWidth(1, 300); // Prime URL
    sheet.setColumnWidth(2, 500); // Request Data

    console.log(`✅ Created ${SHEET_NAMES.SUBMIT_REQUESTS} sheet`);
  }

  return sheet;
}

/**
 * Gets or creates the results dump sheet for San Antonio
 */
function getResultsDumpSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAMES.RESULTS_DUMP);

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAMES.RESULTS_DUMP);

    // Set up headers
    const headers = ['Prime URL', 'Raw DataForSEO Response'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#fce4ec'); // Pink theme complement

    // Set column widths
    sheet.setColumnWidth(1, 300); // Prime URL
    sheet.setColumnWidth(2, 600); // Raw DataForSEO Response

    console.log(`✅ Created ${SHEET_NAMES.RESULTS_DUMP} sheet`);
  }

  return sheet;
}

/**
 * Logs submit request to submit_requests sheet
 * @param {string} primeUrl - The prime URL being tracked
 * @param {Object} requestData - The request data sent to DataForSEO
 */
function logSubmitRequest(primeUrl, requestData) {
  try {
    const sheet = getSubmitRequestsSheet();

    const rowData = [
      primeUrl || '',
      JSON.stringify(requestData, null, 2)
    ];

    sheet.appendRow(rowData);
    console.log(`📤 San Antonio submit request logged for: ${primeUrl}`);

  } catch (error) {
    console.error('Failed to log San Antonio submit request:', error);
  }
}

/**
 * Logs raw DataForSEO response to results_dump sheet
 * @param {string} primeUrl - The prime URL being tracked
 * @param {Object} rawResponse - Raw response from DataForSEO
 */
function logResultsDump(primeUrl, rawResponse) {
  try {
    const sheet = getResultsDumpSheet();

    const rowData = [
      primeUrl || '',
      JSON.stringify(rawResponse, null, 2)
    ];

    sheet.appendRow(rowData);
    console.log(`📥 San Antonio results dump logged for: ${primeUrl}`);

  } catch (error) {
    console.error('Failed to log San Antonio results dump:', error);
  }
}

/**
 * Converts Google Sheets data to preflight structure
 * (Adapted from buildPreflight.js for San Antonio)
 */
function buildPreflightFromSheet(sheetData) {
  const output = {};

  // Skip header row, process data rows
  for (let i = 1; i < sheetData.length; i++) {
    const row = sheetData[i];

    // Extract data from columns
    const office = row[BASE_COLUMNS.OFFICE]?.toString().trim();
    const target = row[BASE_COLUMNS.TARGETS]?.toString().trim();
    const service = row[BASE_COLUMNS.SERVICE]?.toString().trim();
    const lat = parseFloat(row[BASE_COLUMNS.LAT]);
    const long = parseFloat(row[BASE_COLUMNS.LONG]);
    const primeUrl = row[BASE_COLUMNS.PRIME_URL]?.toString().trim();

    // Skip incomplete rows
    if (!office || !target || !service || isNaN(lat) || isNaN(long) || !primeUrl) {
      continue;
    }

    // Create geo coordinate string
    const geo_coordinate = `${lat},${long}`;

    // Generate intended URL (adjust domain for San Antonio if different)
    const intended_url = `https://${office.toLowerCase()}.aaacwildliferemoval.com/service-area/${target.toLowerCase().replace(/\s+/g, '-')}/`;

    // Initialize office group if not exists
    if (!output[office]) {
      output[office] = [];
    }

    // Create entry for this keyword/location combination
    output[office].push({
      location: target,
      service: service,
      intended_url: intended_url,
      prime_url: primeUrl, // Store the specific URL to track
      geo_coordinate: geo_coordinate,
      keywords: [service],
      rowIndex: i // Store row index for writing task IDs back
    });
  }

  return output;
}

/**
 * Submits jobs to DataForSEO API
 * (Adapted from buildTakeOff.js)
 */
function submitJobsToDataForSEO(preflightData) {
  const config = getDataForSEOConfig();
  const results = {};

  for (const [office, items] of Object.entries(preflightData)) {
    results[office] = [];

    for (const item of items) {
      const { geo_coordinate, keywords, rowIndex, location, service, prime_url } = item;

      for (const keyword of keywords) {
        try {
          // Prepare POST data
          const postData = [{
            "keyword": keyword,
            "location_coordinate": geo_coordinate,
            "language_code": "en",
            "device": "mobile",
            "os": "android"
          }];

          // Log request to submit_requests tab
          logSubmitRequest(prime_url, postData[0]);

          // Make API call
          const response = UrlFetchApp.fetch(`${config.baseUrl}/task_post`, {
            method: 'POST',
            headers: {
              'Authorization': config.Authorization,
              'Content-Type': 'application/json'
            },
            payload: JSON.stringify(postData)
          });

          const responseData = JSON.parse(response.getContentText());
          const taskId = responseData.tasks[0].id;

          // Log successful response to audit
          console.log(`✅ San Antonio job submitted successfully for ${prime_url}: ${taskId}`);

          results[office].push({
            ...item,
            keyword: keyword,
            task_id: taskId,
            status: 'submitted'
          });

        } catch (error) {
          console.error(`Error submitting San Antonio job for keyword "${keyword}":`, error);

          // Log error to audit
          console.error(`❌ Failed to submit San Antonio job for ${prime_url}: ${error.message}`);

          results[office].push({
            ...item,
            keyword: keyword,
            task_id: null,
            status: 'error',
            error: error.message
          });
        }
      }
    }
  }

  return results;
}

/**
 * Writes headers and stores task IDs temporarily
 */
function writeTaskIdsToSheet(taskResults) {
  const sheet = getRankMonitorSheet();
  const columns = findNextEmptyColumns();

  // Add headers for this check
  const headerRow = 1;
  const timestamp = new Date().toLocaleDateString();

  sheet.getRange(headerRow, columns.RANK + 1).setValue(`Rank ${timestamp}`);
  sheet.getRange(headerRow, columns.URL + 1).setValue(`URL ${timestamp}`);

  // Store column info and store task IDs temporarily
  for (const [office, items] of Object.entries(taskResults)) {
    for (const item of items) {
      if (item.task_id && item.rowIndex) {
        item.rankColumn = columns.RANK;
        item.urlColumn = columns.URL;
      }
    }
  }

  // Store task IDs temporarily for later retrieval
  storeTaskIds(taskResults);
}

/**
 * Gets task IDs from temporary storage (since we no longer store them in the sheet)
 * This will need to be called immediately after job submission
 */
function getTaskIdsFromSheet() {
  // Since we no longer store task IDs in the sheet, we need to get them from
  // the temporary storage created during job submission
  // For now, return empty array - this function needs to be refactored
  // to work with the new approach where task IDs are managed differently
  console.log('Task IDs are no longer stored in sheet - using temporary storage');
  return [];
}

/**
 * Fetches results from DataForSEO
 * (Adapted from landThePlane.js)
 */
function fetchResultsFromDataForSEO(taskIds) {
  const config = getDataForSEOConfig();
  const results = [];

  for (const task of taskIds) {
    try {
      // Log request to audit
      console.log(`📥 Fetching San Antonio results for ${task.prime_url}: ${task.taskId}`);

      // Fetch results for this task
      const response = UrlFetchApp.fetch(
        `${config.baseUrl}/task_get/regular/${task.taskId}`,
        {
          headers: { 'Authorization': config.Authorization }
        }
      );

      const responseData = JSON.parse(response.getContentText());
      const taskResult = responseData.tasks[0];

      // Debug: Log the complete response from DataForSEO
      console.log(`🔍 DataForSEO API Response for ${task.taskId}:`, JSON.stringify(responseData, null, 2));
      console.log(`📊 Task Result:`, JSON.stringify(taskResult, null, 2));
      console.log(`🎯 Task Status: ${taskResult.status_message}`);
      console.log(`📈 Results Length: ${taskResult.result ? taskResult.result.length : 'null'}`);

      if (taskResult.result && taskResult.result.length > 0) {
        // Extract ranking data for the specific prime_url
        const rankings = extractRankingData(taskResult.result, task.prime_url);

        // Get raw SERP results (all organic items)
        const rawSerpItems = taskResult.result[0]?.items || [];

        // Debug: log the structure to understand what we're getting
        console.log('TaskResult structure:', JSON.stringify(taskResult, null, 2));

        // Log successful response to audit
        // Log raw DataForSEO response to results_dump tab
        logResultsDump(task.prime_url, taskResult);

        console.log(`✅ San Antonio results fetched for ${task.prime_url}: Found ${rawSerpItems.length} items, Prime URL rank: ${rankings.length > 0 ? rankings[0].rank : 'Not found'}`);

        results.push({
          ...task,
          rankings: rankings,
          status: 'completed'
        });
      } else {
        // Log no results to audit
        console.log(`⚠️ No San Antonio results found for ${task.prime_url}: ${task.taskId}`);

        results.push({
          ...task,
          rankings: [],
          status: 'no_results'
        });
      }

    } catch (error) {
      console.error(`Error fetching San Antonio results for task ${task.taskId}:`, error);

      // Log error to audit
      console.error(`❌ Failed to fetch San Antonio results for ${task.prime_url}: ${error.message}`);

      results.push({
        ...task,
        rankings: [],
        status: 'error',
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Extracts ranking data from SERP results, looking for any aaacwildliferemoval.com domain
 * @param {Array} serpResults - Raw SERP results from DataForSEO
 * @param {string} primeUrl - The specific URL context (used for logging)
 * @returns {Array} Array of ranking objects with rank and URL (for any aaacwildliferemoval.com domain)
 */
function extractRankingData(serpResults, primeUrl) {
  const rankings = [];
  const targetDomain = 'aaacwildliferemoval.com';

  console.log(`🔍 Searching for ${targetDomain} in SERP results for ${primeUrl}`);
  console.log(`📊 SERP results structure:`, JSON.stringify(serpResults, null, 2));

  for (const result of serpResults) {
    if (result.items && Array.isArray(result.items)) {
      console.log(`📋 Found ${result.items.length} items in SERP results`);

      for (let i = 0; i < result.items.length; i++) {
        const item = result.items[i];
        console.log(`🔗 Item ${i+1}: type=${item.type}, rank=${item.rank_group}, url=${item.url}`);

        if (item.type === "organic" && item.rank_group && item.url) {
          // Look for any URL containing the target domain
          if (item.url.includes(targetDomain)) {
            console.log(`✅ MATCH FOUND! Rank ${item.rank_group}: ${item.url}`);
            rankings.push({
              rank: item.rank_group,
              url: item.url
            });
          }
        }
      }
    }
  }

  console.log(`📈 Total matches found: ${rankings.length}`);
  return rankings;
}

/**
 * Writes results back to the San Antonio sheet
 */
function writeResultsToSheet(results) {
  const sheet = getRankMonitorSheet();

  if (results.length === 0) return;

  // Use the columns from the first result to determine where to write
  const rankColumn = results[0].rankColumn || findNextEmptyColumns().RANK;
  const urlColumn = results[0].urlColumn || findNextEmptyColumns().URL;

  for (const result of results) {
    const row = result.rowIndex + 1;

    // Get best ranking (lowest rank number) and corresponding URL
    let newRank = null;
    let rankingUrl = null;

    if (result.rankings.length > 0) {
      // Find the ranking with the lowest rank number (best position)
      const bestRanking = result.rankings.reduce((best, current) =>
        current.rank < best.rank ? current : best
      );

      newRank = bestRanking.rank;
      rankingUrl = bestRanking.url;
    }

    // Write to both ranking and URL columns
    sheet.getRange(row, rankColumn + 1).setValue(newRank || 'Not Found');
    sheet.getRange(row, urlColumn + 1).setValue(rankingUrl || 'Not Found');
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Checks status of submitted jobs
 */
function checkJobStatus() {
  const taskIds = getStoredTaskIds();

  if (taskIds.length === 0) {
    SpreadsheetApp.getUi().alert('No Jobs Found', 'No active San Antonio jobs to check.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  SpreadsheetApp.getUi().alert(
    'Job Status',
    `Found ${taskIds.length} active San Antonio jobs.\n\nIf you submitted jobs 2-5 minutes ago, they should be ready.\n\nClick "Get Results" to fetch them.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Opens the submit requests sheet for viewing
 */
function viewSubmitRequests() {
  try {
    const sheet = getSubmitRequestsSheet();
    sheet.activate();

    SpreadsheetApp.getUi().alert(
      '📤 Submit Requests Log',
      `San Antonio submit requests log opened! This sheet shows all requests sent to DataForSEO.\n\nColumns:\n- Prime URL: The specific URL being tracked\n- Request Data: The complete request payload`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', `Failed to open San Antonio submit requests: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Opens the results dump sheet for viewing
 */
function viewResultsDump() {
  try {
    const sheet = getResultsDumpSheet();
    sheet.activate();

    SpreadsheetApp.getUi().alert(
      '📥 Results Dump',
      `San Antonio results dump opened! This sheet shows all raw responses from DataForSEO.\n\nColumns:\n- Prime URL: The specific URL being tracked\n- Raw DataForSEO Response: Complete response including all SERP data`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', `Failed to open San Antonio results dump: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Clears task data from San Antonio sheet and temporary storage
 */
function clearTaskData() {
  const response = SpreadsheetApp.getUi().alert(
    'Clear Task Data',
    'This will clear all ranking data from the San Antonio sheet and stored task IDs. Continue?',
    SpreadsheetApp.getUi().ButtonSet.YES_NO
  );

  if (response !== SpreadsheetApp.getUi().ButtonSet.YES) return;

  const sheet = getRankMonitorSheet();
  const lastRow = sheet.getLastRow();

  // Clear all ranking data columns (starting from column G)
  const startCol = BASE_COLUMNS.FIRST_DATA_COL + 1; // +1 for 1-based indexing
  const numCols = sheet.getLastColumn() - BASE_COLUMNS.FIRST_DATA_COL;
  if (numCols > 0) {
    sheet.getRange(1, startCol, lastRow, numCols).clearContent(); // Clear headers too
  }

  // Clear stored task IDs
  clearStoredTaskIds();

  SpreadsheetApp.getUi().alert('✅ Cleared', 'San Antonio task data and stored task IDs have been cleared.', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Tests DataForSEO API connection
 */
function testDataForSEOConnection() {
  try {
    const config = getDataForSEOConfig();

    // Make a simple test call
    const response = UrlFetchApp.fetch(`${config.baseUrl}/task_get`, {
      headers: { 'Authorization': config.Authorization }
    });

    if (response.getResponseCode() === 200) {
      SpreadsheetApp.getUi().alert('✅ Connection Successful', 'DataForSEO API connection is working for San Antonio!', SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      SpreadsheetApp.getUi().alert('❌ Connection Failed', `API returned status: ${response.getResponseCode()}`, SpreadsheetApp.getUi().ButtonSet.OK);
    }

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Connection Error', `Failed to connect: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// =============================================================================
// TASK ID STORAGE FUNCTIONS (for temporary storage since we don't store in sheet)
// =============================================================================

/**
 * Stores task IDs temporarily in Script Properties
 */
function storeTaskIds(taskResults) {
  const taskData = [];

  for (const [office, items] of Object.entries(taskResults)) {
    for (const item of items) {
      if (item.task_id && item.rowIndex) {
        taskData.push({
          taskId: item.task_id,
          rowIndex: item.rowIndex,
          keyword: item.service,
          office: office,
          target: item.location,
          prime_url: item.prime_url,
          rankColumn: item.rankColumn,
          urlColumn: item.urlColumn
        });
      }
    }
  }

  // Store in Script Properties with timestamp (use unique key for San Antonio)
  const timestamp = new Date().getTime();
  PropertiesService.getScriptProperties().setProperty('sanAntonioTaskIds', JSON.stringify(taskData));
  PropertiesService.getScriptProperties().setProperty('sanAntonioTaskIds_timestamp', timestamp.toString());

  console.log(`Stored ${taskData.length} San Antonio task IDs temporarily`);
}

/**
 * Retrieves stored task IDs from Script Properties
 */
function getStoredTaskIds() {
  try {
    const taskData = PropertiesService.getScriptProperties().getProperty('sanAntonioTaskIds');
    const timestamp = PropertiesService.getScriptProperties().getProperty('sanAntonioTaskIds_timestamp');

    if (!taskData) {
      console.log('No stored San Antonio task IDs found');
      return [];
    }

    // Check if data is too old (more than 30 minutes)
    const currentTime = new Date().getTime();
    const storedTime = parseInt(timestamp || '0');
    const maxAge = 30 * 60 * 1000; // 30 minutes

    if (currentTime - storedTime > maxAge) {
      console.log('Stored San Antonio task IDs are too old, clearing them');
      clearStoredTaskIds();
      return [];
    }

    const parsed = JSON.parse(taskData);
    console.log(`Retrieved ${parsed.length} stored San Antonio task IDs`);
    return parsed;

  } catch (error) {
    console.error('Error retrieving stored San Antonio task IDs:', error);
    return [];
  }
}

/**
 * Clears stored task IDs from Script Properties
 */
function clearStoredTaskIds() {
  PropertiesService.getScriptProperties().deleteProperty('sanAntonioTaskIds');
  PropertiesService.getScriptProperties().deleteProperty('sanAntonioTaskIds_timestamp');
  console.log('Cleared stored San Antonio task IDs');
}

// =============================================================================
// AUTOMATION SETUP AND MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Sets up daily automation trigger - user chooses the time
 */
function setupDailyAutomation() {
  try {
    const ui = SpreadsheetApp.getUi();

    // Show information about automation
    const setupResponse = ui.alert(
      '🤖 Setup San Antonio Daily Automation',
      'This will create a daily trigger to automatically check San Antonio rankings.\n\nAfter clicking OK, you will be shown instructions to set up the time trigger manually in the Apps Script interface.',
      ui.ButtonSet.OK_CANCEL
    );

    if (setupResponse !== ui.Button.OK) return;

    // Check if automation is already set up
    const existingTriggers = ScriptApp.getProjectTriggers();
    const dailyTrigger = existingTriggers.find(trigger =>
      trigger.getHandlerFunction() === 'dailyRankingCheck'
    );

    if (dailyTrigger) {
      ui.alert(
        '⚠️ Automation Already Active',
        'San Antonio daily automation is already set up!\n\nIf you want to change the time, first click "Disable Automation", then set it up again.',
        ui.ButtonSet.OK
      );
      return;
    }

    // Show setup instructions
    ui.alert(
      '📋 Setup Instructions',
      'To complete the San Antonio setup:\n\n1. Go to Apps Script (script.google.com)\n2. Open your project\n3. Click "Triggers" (clock icon on left)\n4. Click "+ Add Trigger"\n5. Choose:\n   - Function: dailyRankingCheck\n   - Event source: Time-driven\n   - Type: Day timer\n   - Time: Pick your preferred time\n6. Click "Save"\n\nRecommended time: 9:00 AM (after business hours start)',
      ui.ButtonSet.OK
    );

    // Store automation preference
    PropertiesService.getScriptProperties().setProperty('sanAntonioAutomation_enabled', 'true');

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', `Failed to setup San Antonio automation: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
    console.error('Setup San Antonio automation error:', error);
  }
}

/**
 * Disables daily automation by removing triggers
 */
function disableAutomation() {
  try {
    const ui = SpreadsheetApp.getUi();

    const response = ui.alert(
      '🔕 Disable San Antonio Automation',
      'This will remove the San Antonio daily automation trigger. You can still run rankings manually.\n\nContinue?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) return;

    // Remove all triggers for dailyRankingCheck function
    const triggers = ScriptApp.getProjectTriggers();
    let removedCount = 0;

    for (const trigger of triggers) {
      if (trigger.getHandlerFunction() === 'dailyRankingCheck') {
        ScriptApp.deleteTrigger(trigger);
        removedCount++;
      }
    }

    // Remove automation preference
    PropertiesService.getScriptProperties().deleteProperty('sanAntonioAutomation_enabled');

    if (removedCount > 0) {
      ui.alert(
        '✅ Automation Disabled',
        `Removed ${removedCount} San Antonio automation trigger(s).\n\nDaily automation is now disabled. You can still run rankings manually using the menu.`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        'ℹ️ No Automation Found',
        'No active San Antonio automation triggers were found to remove.',
        ui.ButtonSet.OK
      );
    }

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', `Failed to disable San Antonio automation: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
    console.error('Disable San Antonio automation error:', error);
  }
}

/**
 * Tests the daily ranking check function manually
 */
function testDailyRankingCheck() {
  try {
    const ui = SpreadsheetApp.getUi();

    const response = ui.alert(
      '🧪 Test San Antonio Daily Check',
      'This will run the complete automated San Antonio daily ranking check process.\n\nThis includes:\n- Submit jobs\n- Wait 5 minutes\n- Get results\n\nThis may take 6-7 minutes total. Continue?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) return;

    ui.alert('⏳ Starting Test...', 'Running automated San Antonio daily check. This will take about 6-7 minutes.\n\nYou can monitor progress in the Apps Script logs.', ui.ButtonSet.OK);

    // Run the daily check
    dailyRankingCheck();

    ui.alert(
      '✅ Test Completed!',
      'San Antonio daily ranking check test completed successfully!\n\nCheck your sheet for updated rankings.',
      ui.ButtonSet.OK
    );

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Test Failed', `San Antonio daily check test failed: ${error.message}\n\nCheck the Apps Script logs for more details.`, SpreadsheetApp.getUi().ButtonSet.OK);
    console.error('Test San Antonio daily check error:', error);
  }
}