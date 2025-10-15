/**
 * Universal Google Apps Script for Search Visibility Ranking Tracker - Desktop
 * Works with any active sheet that has the standard column layout
 *
 * Instructions:
 * 1. Open Google Apps Script (script.google.com)
 * 2. Create new project
 * 3. Replace Code.gs content with this file
 * 4. Set up DataForSEO credentials in getDataForSEOConfig()
 * 5. Save and refresh your Google Sheet
 * 6. Make sure the active sheet has the expected column layout
 */

// =============================================================================
// CONFIGURATION - UNIVERSAL DESKTOP
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
 * Column configuration for universal desktop sheet
 * Updated based on user requirements: keyword=D, lat=E, long=F, output=J&K
 */
const BASE_COLUMNS = {
  OFFICE: 0,       // Column A
  TARGETS: 1,      // Column B  
  SERVICE: 2,      // Column C
  KEYWORD: 3,       // Column D - keyword to search for
  LAT: 4,          // Column E - latitude
  LONG: 5,         // Column F - longitude
  PRIME_URL: 6,    // Column G - specific page to track
  FIRST_DATA_COL: 9 // Column J - where ranking data goes (J=9, K=10)
};

/**
 * Returns the fixed columns for ranking data (always overwrites same columns)
 * Returns the column indices for Rank and URL
 */
function findNextEmptyColumns() {
  // Always use the same columns - overwrite previous data
  // Columns J and K
  return {
    RANK: BASE_COLUMNS.FIRST_DATA_COL,     // Column J
    URL: BASE_COLUMNS.FIRST_DATA_COL + 1   // Column K
  };
}

// =============================================================================
// CUSTOM MENU - UNIVERSAL DESKTOP
// =============================================================================

/**
 * Creates custom menu when sheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const activeSheetName = SpreadsheetApp.getActiveSheet().getName();
  
  ui.createMenu(`🖥️ Desktop Ranking Tracker (${activeSheetName})`)
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
    const activeSheetName = SpreadsheetApp.getActiveSheet().getName();

    // Show confirmation dialog
    const response = ui.alert(
      'Submit Ranking Jobs - Desktop',
      `This will submit ranking check jobs to DataForSEO for "${activeSheetName}" sheet. Continue?`,
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) return;

    ui.alert('⏳ Processing...', `Reading "${activeSheetName}" sheet data and submitting jobs. Please wait.`, ui.ButtonSet.OK);

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
      `${jobCount} Desktop ranking jobs submitted to DataForSEO for "${activeSheetName}".\\n\\nWait 2-5 minutes, then click "Get Results".`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', `Failed to submit Desktop jobs: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
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
    const activeSheetName = SpreadsheetApp.getActiveSheet().getName();

    // Show confirmation dialog
    const response = ui.alert(
      'Get Ranking Results - Desktop',
      `This will fetch results from DataForSEO and update the "${activeSheetName}" sheet. Continue?`,
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
      `Desktop ranking data has been updated in "${activeSheetName}" sheet.\\n\\nCheck columns J and K for new rankings.`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', `Failed to get Desktop results: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
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
    const activeSheetName = SpreadsheetApp.getActiveSheet().getName();
    console.log(`🤖 Starting automated Desktop daily ranking check for "${activeSheetName}"...`);

    // Phase 1: Submit ranking jobs
    submitRankingJobsAutomated();

    // Phase 2: Wait 5 minutes for DataForSEO to process
    console.log('⏳ Waiting 5 minutes for DataForSEO to process jobs...');
    Utilities.sleep(5 * 60 * 1000); // 5 minutes

    // Phase 3: Get results
    getRankingResultsAutomated();

    console.log(`✅ Automated Desktop daily ranking check completed successfully for "${activeSheetName}"!`);

  } catch (error) {
    const activeSheetName = SpreadsheetApp.getActiveSheet().getName();
    console.error(`❌ Automated Desktop daily ranking check failed for "${activeSheetName}":`, error);
  }
}

/**
 * Automated version of submitRankingJobs (no UI dialogs)
 * Used by daily automation - same logic as manual version but without user prompts
 */
function submitRankingJobsAutomated() {
  const activeSheetName = SpreadsheetApp.getActiveSheet().getName();
  console.log(`📤 Starting automated Desktop job submission for "${activeSheetName}"...`);

  // Phase 1: Get sheet data and run preflight
  const sheetData = getSheetData();
  const preflightData = buildPreflightFromSheet(sheetData);

  // Phase 2: Submit jobs to DataForSEO (Takeoff)
  const taskResults = submitJobsToDataForSEO(preflightData);

  // Phase 3: Store task IDs back in sheet
  writeTaskIdsToSheet(taskResults);

  // Log success
  const jobCount = Object.values(taskResults).flat().length;
  console.log(`✅ Automated Desktop job submission completed for "${activeSheetName}": ${jobCount} jobs submitted`);

  return jobCount;
}

/**
 * Automated version of getRankingResults (no UI dialogs)
 * Used by daily automation - same logic as manual version but without user prompts
 */
function getRankingResultsAutomated() {
  const activeSheetName = SpreadsheetApp.getActiveSheet().getName();
  console.log(`📥 Starting automated Desktop results retrieval for "${activeSheetName}"...`);

  // Phase 1: Read task IDs from temporary storage
  const taskIds = getStoredTaskIds();

  if (taskIds.length === 0) {
    console.log(`⚠️ No task IDs found for automated Desktop results retrieval for "${activeSheetName}"`);
    return;
  }

  // Phase 2: Fetch results from DataForSEO
  const results = fetchResultsFromDataForSEO(taskIds);

  // Phase 3: Write results back to sheet
  writeResultsToSheet(results);

  // Clear stored task IDs after successful retrieval
  clearStoredTaskIds();

  console.log(`✅ Automated Desktop results retrieval completed successfully for "${activeSheetName}"!`);

  return results.length;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Gets all data from the active sheet
 */
function getSheetData() {
  return SpreadsheetApp.getActiveSheet().getDataRange().getValues();
}

/**
 * Gets the active sheet
 */
function getActiveRankMonitorSheet() {
  return SpreadsheetApp.getActiveSheet();
}

/**
 * Gets the base name for the active sheet (for audit tabs and storage keys)
 */
function getSheetBaseName() {
  return SpreadsheetApp.getActiveSheet().getName();
}

/**
 * Gets or creates the submit requests sheet for the active sheet
 */
function getSubmitRequestsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const baseName = getSheetBaseName();
  const sheetName = `${baseName}_submit_requests`;
  
  let sheet = spreadsheet.getSheetByName(sheetName);

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);

    // Set up headers
    const headers = ['Prime URL', 'Request Data'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#e8f5e8'); // Light green theme

    // Set column widths
    sheet.setColumnWidth(1, 300); // Prime URL
    sheet.setColumnWidth(2, 500); // Request Data

    console.log(`✅ Created ${sheetName} sheet`);
  }

  return sheet;
}

/**
 * Gets or creates the results dump sheet for the active sheet
 */
function getResultsDumpSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const baseName = getSheetBaseName();
  const sheetName = `${baseName}_results_dump`;
  
  let sheet = spreadsheet.getSheetByName(sheetName);

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);

    // Set up headers
    const headers = ['Prime URL', 'Raw DataForSEO Response'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#fff8dc'); // Beige theme

    // Set column widths
    sheet.setColumnWidth(1, 300); // Prime URL
    sheet.setColumnWidth(2, 600); // Raw DataForSEO Response

    console.log(`✅ Created ${sheetName} sheet`);
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
    console.log(`📤 Desktop submit request logged for: ${primeUrl}`);

  } catch (error) {
    console.error('Failed to log Desktop submit request:', error);
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
    console.log(`📥 Desktop results dump logged for: ${primeUrl}`);

  } catch (error) {
    console.error('Failed to log Desktop results dump:', error);
  }
}

/**
 * Converts Google Sheets data to preflight structure
 * Updated for new column layout: keyword=D, lat=E, long=F
 */
function buildPreflightFromSheet(sheetData) {
  const output = {};

  // Skip header row, process data rows
  for (let i = 1; i < sheetData.length; i++) {
    const row = sheetData[i];

    // Extract data from columns (updated mapping)
    const office = row[BASE_COLUMNS.OFFICE]?.toString().trim();
    const target = row[BASE_COLUMNS.TARGETS]?.toString().trim();
    const service = row[BASE_COLUMNS.SERVICE]?.toString().trim();
    const keyword = row[BASE_COLUMNS.KEYWORD]?.toString().trim(); // Column D
    const lat = parseFloat(row[BASE_COLUMNS.LAT]); // Column E
    const long = parseFloat(row[BASE_COLUMNS.LONG]); // Column F
    const primeUrl = row[BASE_COLUMNS.PRIME_URL]?.toString().trim();

    // Skip incomplete rows
    if (!office || !target || !service || !keyword || isNaN(lat) || isNaN(long) || !primeUrl) {
      continue;
    }

    // Create geo coordinate string
    const geo_coordinate = `${lat},${long}`;

    // Generate intended URL (adjust domain as needed)
    const intended_url = `https://${office.toLowerCase()}.aaacwildliferemoval.com/service-area/${target.toLowerCase().replace(/\s+/g, '-')}/`;

    // Initialize office group if not exists
    if (!output[office]) {
      output[office] = [];
    }

    // Create entry for this keyword/location combination
    output[office].push({
      location: target,
      service: service,
      keyword: keyword, // Use the keyword from column D
      intended_url: intended_url,
      prime_url: primeUrl, // Store the specific URL to track
      geo_coordinate: geo_coordinate,
      keywords: [keyword], // Use the keyword from column D
      rowIndex: i // Store row index for writing task IDs back
    });
  }

  return output;
}

/**
 * Submits jobs to DataForSEO API
 * Updated for desktop version
 */
function submitJobsToDataForSEO(preflightData) {
  const config = getDataForSEOConfig();
  const results = {};

  for (const [office, items] of Object.entries(preflightData)) {
    results[office] = [];

    for (const item of items) {
      const { geo_coordinate, keywords, rowIndex, location, service, prime_url, keyword } = item;

      for (const keywordToSearch of keywords) {
        try {
          // Prepare POST data - DESKTOP VERSION
          const postData = [{
            "keyword": keywordToSearch,
            "location_coordinate": geo_coordinate,
            "language_code": "en",
            "device": "desktop",
            "os": "windows"
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
          console.log(`✅ Desktop job submitted successfully for ${prime_url}: ${taskId}`);

          results[office].push({
            ...item,
            keyword: keywordToSearch,
            task_id: taskId,
            status: 'submitted'
          });

        } catch (error) {
          console.error(`Error submitting Desktop job for keyword "${keywordToSearch}":`, error);

          // Log error to audit
          console.error(`❌ Failed to submit Desktop job for ${prime_url}: ${error.message}`);

          results[office].push({
            ...item,
            keyword: keywordToSearch,
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
  const sheet = getActiveRankMonitorSheet();
  const columns = findNextEmptyColumns();

  // Add headers for this check
  const headerRow = 1;
  const timestamp = new Date().toLocaleDateString();

  sheet.getRange(headerRow, columns.RANK + 1).setValue(`Desktop Ranking ${timestamp}`);
  sheet.getRange(headerRow, columns.URL + 1).setValue(`Desktop Ranking URL ${timestamp}`);

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
 * Fetches results from DataForSEO
 */
function fetchResultsFromDataForSEO(taskIds) {
  const config = getDataForSEOConfig();
  const results = [];

  for (const task of taskIds) {
    try {
      // Log request to audit
      console.log(`📥 Fetching Desktop results for ${task.prime_url}: ${task.taskId}`);

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

        console.log(`✅ Desktop results fetched for ${task.prime_url}: Found ${rawSerpItems.length} items, Prime URL rank: ${rankings.length > 0 ? rankings[0].rank : 'Not found'}`);

        results.push({
          ...task,
          rankings: rankings,
          status: 'completed'
        });
      } else {
        // Log no results to audit
        console.log(`⚠️ No Desktop results found for ${task.prime_url}: ${task.taskId}`);

        results.push({
          ...task,
          rankings: [],
          status: 'no_results'
        });
      }

    } catch (error) {
      console.error(`Error fetching Desktop results for task ${task.taskId}:`, error);

      // Log error to audit
      console.error(`❌ Failed to fetch Desktop results for ${task.prime_url}: ${error.message}`);

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
 * Writes results back to the active sheet
 */
function writeResultsToSheet(results) {
  const sheet = getActiveRankMonitorSheet();

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

    // Write to both ranking and URL columns (J and K)
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
  const activeSheetName = SpreadsheetApp.getActiveSheet().getName();

  if (taskIds.length === 0) {
    SpreadsheetApp.getUi().alert('No Jobs Found', `No active Desktop jobs to check for "${activeSheetName}".`, SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  SpreadsheetApp.getUi().alert(
    'Job Status',
    `Found ${taskIds.length} active Desktop jobs for "${activeSheetName}".\\n\\nIf you submitted jobs 2-5 minutes ago, they should be ready.\\n\\nClick "Get Results" to fetch them.`,
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

    const activeSheetName = SpreadsheetApp.getActiveSheet().getName();
    SpreadsheetApp.getUi().alert(
      '📤 Submit Requests Log',
      `Desktop submit requests log opened for "${activeSheetName}"! This sheet shows all requests sent to DataForSEO.\\n\\nColumns:\\n- Prime URL: The specific URL being tracked\\n- Request Data: The complete request payload`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', `Failed to open Desktop submit requests: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Opens the results dump sheet for viewing
 */
function viewResultsDump() {
  try {
    const sheet = getResultsDumpSheet();
    sheet.activate();

    const activeSheetName = SpreadsheetApp.getActiveSheet().getName();
    SpreadsheetApp.getUi().alert(
      '📥 Results Dump',
      `Desktop results dump opened for "${activeSheetName}"! This sheet shows all raw responses from DataForSEO.\\n\\nColumns:\\n- Prime URL: The specific URL being tracked\\n- Raw DataForSEO Response: Complete response including all SERP data`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', `Failed to open Desktop results dump: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Clears task data from active sheet and temporary storage
 */
function clearTaskData() {
  const activeSheetName = SpreadsheetApp.getActiveSheet().getName();
  const response = SpreadsheetApp.getUi().alert(
    'Clear Task Data',
    `This will clear all ranking data from "${activeSheetName}" sheet and stored task IDs. Continue?`,
    SpreadsheetApp.getUi().ButtonSet.YES_NO
  );

  if (response !== SpreadsheetApp.getUi().ButtonSet.YES) return;

  const sheet = getActiveRankMonitorSheet();
  const lastRow = sheet.getLastRow();

  // Clear all ranking data columns (starting from column J)
  const startCol = BASE_COLUMNS.FIRST_DATA_COL + 1; // +1 for 1-based indexing
  const numCols = sheet.getLastColumn() - BASE_COLUMNS.FIRST_DATA_COL;
  if (numCols > 0) {
    sheet.getRange(1, startCol, lastRow, numCols).clearContent(); // Clear headers too
  }

  // Clear stored task IDs
  clearStoredTaskIds();

  SpreadsheetApp.getUi().alert('✅ Cleared', `Desktop task data and stored task IDs have been cleared for "${activeSheetName}".`, SpreadsheetApp.getUi().ButtonSet.OK);
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
      SpreadsheetApp.getUi().alert('✅ Connection Successful', 'DataForSEO API connection is working for Desktop!', SpreadsheetApp.getUi().ButtonSet.OK);
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
  const baseName = getSheetBaseName();

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

  // Store in Script Properties with timestamp (use unique key for active sheet)
  const timestamp = new Date().getTime();
  PropertiesService.getScriptProperties().setProperty(`${baseName}TaskIds`, JSON.stringify(taskData));
  PropertiesService.getScriptProperties().setProperty(`${baseName}TaskIds_timestamp`, timestamp.toString());

  console.log(`Stored ${taskData.length} Desktop task IDs temporarily for "${baseName}"`);
}

/**
 * Retrieves stored task IDs from Script Properties
 */
function getStoredTaskIds() {
  try {
    const baseName = getSheetBaseName();
    const taskData = PropertiesService.getScriptProperties().getProperty(`${baseName}TaskIds`);
    const timestamp = PropertiesService.getScriptProperties().getProperty(`${baseName}TaskIds_timestamp`);

    if (!taskData) {
      console.log(`No stored Desktop task IDs found for "${baseName}"`);
      return [];
    }

    // Check if data is too old (more than 30 minutes)
    const currentTime = new Date().getTime();
    const storedTime = parseInt(timestamp || '0');
    const maxAge = 30 * 60 * 1000; // 30 minutes

    if (currentTime - storedTime > maxAge) {
      console.log(`Stored Desktop task IDs are too old for "${baseName}", clearing them`);
      clearStoredTaskIds();
      return [];
    }

    const parsed = JSON.parse(taskData);
    console.log(`Retrieved ${parsed.length} stored Desktop task IDs for "${baseName}"`);
    return parsed;

  } catch (error) {
    console.error('Error retrieving stored Desktop task IDs:', error);
    return [];
  }
}

/**
 * Clears stored task IDs from Script Properties
 */
function clearStoredTaskIds() {
  const baseName = getSheetBaseName();
  PropertiesService.getScriptProperties().deleteProperty(`${baseName}TaskIds`);
  PropertiesService.getScriptProperties().deleteProperty(`${baseName}TaskIds_timestamp`);
  console.log(`Cleared stored Desktop task IDs for "${baseName}"`);
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
    const activeSheetName = SpreadsheetApp.getActiveSheet().getName();

    // Show information about automation
    const setupResponse = ui.alert(
      '🤖 Setup Desktop Daily Automation',
      `This will create a daily trigger to automatically check Desktop rankings for "${activeSheetName}".\\n\\nAfter clicking OK, you will be shown instructions to set up the time trigger manually in the Apps Script interface.`,
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
        `Desktop daily automation is already set up for "${activeSheetName}"!\\n\\nIf you want to change the time, first click "Disable Automation", then set it up again.`,
        ui.ButtonSet.OK
      );
      return;
    }

    // Show setup instructions
    ui.alert(
      '📋 Setup Instructions',
      `To complete the Desktop setup for "${activeSheetName}":\\n\\n1. Go to Apps Script (script.google.com)\\n2. Open your project\\n3. Click "Triggers" (clock icon on left)\\n4. Click "+ Add Trigger"\\n5. Choose:\\n   - Function: dailyRankingCheck\\n   - Event source: Time-driven\\n   - Type: Day timer\\n   - Time: Pick your preferred time\\n6. Click "Save"\\n\\nRecommended time: 9:00 AM (after business hours start)`,
      ui.ButtonSet.OK
    );

    // Store automation preference
    PropertiesService.getScriptProperties().setProperty(`${activeSheetName}Automation_enabled`, 'true');

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', `Failed to setup Desktop automation: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
    console.error('Setup Desktop automation error:', error);
  }
}

/**
 * Disables daily automation by removing triggers
 */
function disableAutomation() {
  try {
    const ui = SpreadsheetApp.getUi();
    const activeSheetName = SpreadsheetApp.getActiveSheet().getName();

    const response = ui.alert(
      '🔕 Disable Desktop Automation',
      `This will remove the Desktop daily automation trigger for "${activeSheetName}". You can still run rankings manually.\\n\\nContinue?`,
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
    PropertiesService.getScriptProperties().deleteProperty(`${activeSheetName}Automation_enabled`);

    if (removedCount > 0) {
      ui.alert(
        '✅ Automation Disabled',
        `Removed ${removedCount} Desktop automation trigger(s) for "${activeSheetName}".\\n\\nDaily automation is now disabled. You can still run rankings manually using the menu.`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        'ℹ️ No Automation Found',
        `No active Desktop automation triggers were found to remove for "${activeSheetName}".`,
        ui.ButtonSet.OK
      );
    }

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', `Failed to disable Desktop automation: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
    console.error('Disable Desktop automation error:', error);
  }
}

/**
 * Tests the daily ranking check function manually
 */
function testDailyRankingCheck() {
  try {
    const ui = SpreadsheetApp.getUi();
    const activeSheetName = SpreadsheetApp.getActiveSheet().getName();

    const response = ui.alert(
      '🧪 Test Desktop Daily Check',
      `This will run the complete automated Desktop daily ranking check process for "${activeSheetName}".\\n\\nThis includes:\\n- Submit jobs\\n- Wait 5 minutes\\n- Get results\\n\\nThis may take 6-7 minutes total. Continue?`,
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) return;

    ui.alert('⏳ Starting Test...', `Running automated Desktop daily check for "${activeSheetName}". This will take about 6-7 minutes.\\n\\nYou can monitor progress in the Apps Script logs.`, ui.ButtonSet.OK);

    // Run the daily check
    dailyRankingCheck();

    ui.alert(
      '✅ Test Completed!',
      `Desktop daily ranking check test completed successfully for "${activeSheetName}"!\\n\\nCheck your sheet for updated rankings.`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    const activeSheetName = SpreadsheetApp.getActiveSheet().getName();
    SpreadsheetApp.getUi().alert('❌ Test Failed', `Desktop daily check test failed for "${activeSheetName}": ${error.message}\\n\\nCheck the Apps Script logs for more details.`, SpreadsheetApp.getUi().ButtonSet.OK);
    console.error('Test Desktop daily check error:', error);
  }
}
