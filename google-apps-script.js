/**
 * Google Apps Script for Search Visibility Ranking Tracker
 *
 * Instructions:
 * 1. Open Google Apps Script (script.google.com)
 * 2. Create new project
 * 3. Replace Code.gs content with this file
 * 4. Set up DataForSEO credentials in getDataForSEOConfig()
 * 5. Save and refresh your Google Sheet
 */

// =============================================================================
// CONFIGURATION
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
 * Sheet configuration
 */
const SHEET_NAMES = {
  RANK_MONITOR: 'rankmonitor',
  SUBMIT_REQUESTS: 'submit_requests',
  RESULTS_DUMP: 'results_dump'
};

/**
 * Base column configuration for rankmonitor sheet
 */
const BASE_COLUMNS = {
  OFFICE: 0,       // Column A
  TARGETS: 1,      // Column B
  SERVICE: 2,      // Column C
  LAT: 3,          // Column D
  LONG: 4,         // Column E
  PRIME_URL: 5,    // Column F (manual entry - specific page to track)
  FIRST_DATA_COL: 6 // Column G - where data columns start
};

/**
 * Finds the next set of empty columns for new ranking check
 * Returns the column indices for Task ID, Rank, and Date
 */
function findNextEmptyColumns() {
  const sheet = getRankMonitorSheet();
  const lastColumn = sheet.getLastColumn();

  // Start looking after the base columns (A-E)
  let nextCol = Math.max(BASE_COLUMNS.FIRST_DATA_COL, lastColumn);

  return {
    TASK_ID: nextCol,
    RANK: nextCol + 1,
    DATE: nextCol + 2
  };
}

// =============================================================================
// CUSTOM MENU
// =============================================================================

/**
 * Creates custom menu when sheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🎯 Ranking Tracker')
    .addItem('📤 Submit Ranking Jobs', 'submitRankingJobs')
    .addItem('📥 Get Results', 'getRankingResults')
    .addSeparator()
    .addItem('📊 View Job Status', 'checkJobStatus')
    .addItem('📋 View Submit Requests', 'viewSubmitRequests')
    .addItem('📋 View Results Dump', 'viewResultsDump')
    .addItem('🧹 Clear Task Data', 'clearTaskData')
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
      'Submit Ranking Jobs',
      'This will submit ranking check jobs to DataForSEO. Continue?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) return;

    ui.alert('⏳ Processing...', 'Reading sheet data and submitting jobs. Please wait.', ui.ButtonSet.OK);

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
      `${jobCount} ranking jobs submitted to DataForSEO.\\n\\nWait 2-5 minutes, then click "Get Results".`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', `Failed to submit jobs: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
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
      'Get Ranking Results',
      'This will fetch results from DataForSEO and update the sheet. Continue?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) return;

    ui.alert('⏳ Processing...', 'Fetching results from DataForSEO. This may take a moment.', ui.ButtonSet.OK);

    // Phase 1: Read task IDs from sheet
    const taskIds = getTaskIdsFromSheet();

    if (taskIds.length === 0) {
      ui.alert('⚠️ No Jobs Found', 'No task IDs found. Please run "Submit Ranking Jobs" first.', ui.ButtonSet.OK);
      return;
    }

    // Phase 2: Fetch results from DataForSEO
    const results = fetchResultsFromDataForSEO(taskIds);

    // Phase 3: Write results back to sheet
    writeResultsToSheet(results);

    // Show success message
    ui.alert(
      '✅ Results Updated Successfully!',
      `Ranking data has been updated in the sheet.\\n\\nCheck columns T, U, V for new rankings.`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', `Failed to get results: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
    console.error('Get results error:', error);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Gets all data from the rankmonitor sheet
 */
function getSheetData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.RANK_MONITOR);
  return sheet.getDataRange().getValues();
}

/**
 * Gets the rankmonitor sheet
 */
function getRankMonitorSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.RANK_MONITOR);
}

/**
 * Gets or creates the submit requests sheet
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
    headerRange.setBackground('#e8f4fd');

    // Set column widths
    sheet.setColumnWidth(1, 300); // Prime URL
    sheet.setColumnWidth(2, 500); // Request Data

    console.log('✅ Created submit_requests sheet');
  }

  return sheet;
}

/**
 * Gets or creates the results dump sheet
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
    headerRange.setBackground('#f3e8ff');

    // Set column widths
    sheet.setColumnWidth(1, 300); // Prime URL
    sheet.setColumnWidth(2, 600); // Raw DataForSEO Response

    console.log('✅ Created results_dump sheet');
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
    console.log(`📤 Submit request logged for: ${primeUrl}`);

  } catch (error) {
    console.error('Failed to log submit request:', error);
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
    console.log(`📥 Results dump logged for: ${primeUrl}`);

  } catch (error) {
    console.error('Failed to log results dump:', error);
  }
}

/**
 * Converts Google Sheets data to preflight structure
 * (Adapted from buildPreflight.js)
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

    // Generate intended URL
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
          console.log(`✅ Job submitted successfully for ${prime_url}: ${taskId}`);

          results[office].push({
            ...item,
            keyword: keyword,
            task_id: taskId,
            status: 'submitted'
          });

        } catch (error) {
          console.error(`Error submitting job for keyword "${keyword}":`, error);

          // Log error to audit
          console.error(`❌ Failed to submit job for ${prime_url}: ${error.message}`);

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
 * Writes task IDs back to the rankmonitor sheet
 */
function writeTaskIdsToSheet(taskResults) {
  const sheet = getRankMonitorSheet();
  const columns = findNextEmptyColumns();

  // Add header for this check if needed
  const headerRow = 1;
  const timestamp = new Date().toLocaleDateString();

  sheet.getRange(headerRow, columns.TASK_ID + 1).setValue(`Task ID ${timestamp}`);
  sheet.getRange(headerRow, columns.RANK + 1).setValue(`Rank ${timestamp}`);
  sheet.getRange(headerRow, columns.DATE + 1).setValue(`Date ${timestamp}`);

  for (const [office, items] of Object.entries(taskResults)) {
    for (const item of items) {
      if (item.task_id && item.rowIndex) {
        // Write task ID to the next empty column
        sheet.getRange(item.rowIndex + 1, columns.TASK_ID + 1).setValue(item.task_id);
      }
    }
  }
}

/**
 * Reads task IDs from the most recent column in the rankmonitor sheet
 */
function getTaskIdsFromSheet() {
  const sheet = getRankMonitorSheet();
  const data = sheet.getDataRange().getValues();
  const taskIds = [];

  // Find the most recent Task ID column (rightmost one)
  let mostRecentTaskCol = -1;

  // Look through all columns starting from F to find Task ID columns
  for (let col = BASE_COLUMNS.FIRST_DATA_COL; col < data[0].length; col++) {
    // Check if this column has task IDs in header row (row 0) or row 1
    const headerCell = data[0] && data[0][col] ? data[0][col].toString() : '';
    const row1Cell = data[1] && data[1][col] ? data[1][col].toString() : '';

    if (headerCell.includes('Task ID') || row1Cell.includes('Task ID')) {
      mostRecentTaskCol = col;
    }
  }

  console.log('Most recent task column:', mostRecentTaskCol);
  console.log('Total columns:', data[0].length);
  console.log('Headers:', data[0]);

  if (mostRecentTaskCol === -1) {
    console.log('No Task ID columns found');
    return taskIds; // No task IDs found
  }

  // Read task IDs from the found column
  for (let i = 2; i < data.length; i++) { // Start from row 2 (skip header rows)
    const taskId = data[i][mostRecentTaskCol];
    if (taskId && taskId.toString().trim() !== '') {
      taskIds.push({
        taskId: taskId,
        rowIndex: i,
        keyword: data[i][BASE_COLUMNS.SERVICE],
        office: data[i][BASE_COLUMNS.OFFICE],
        target: data[i][BASE_COLUMNS.TARGETS],
        prime_url: data[i][BASE_COLUMNS.PRIME_URL], // Include prime_url for ranking check
        taskColumn: mostRecentTaskCol
      });
    }
  }

  console.log('Found task IDs:', taskIds.length);
  return taskIds;
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
      console.log(`📥 Fetching results for ${task.prime_url}: ${task.taskId}`);

      // Fetch results for this task
      const response = UrlFetchApp.fetch(
        `${config.baseUrl}/task_get/regular/${task.taskId}`,
        {
          headers: { 'Authorization': config.Authorization }
        }
      );

      const responseData = JSON.parse(response.getContentText());
      const taskResult = responseData.tasks[0];

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

        console.log(`✅ Results fetched for ${task.prime_url}: Found ${rawSerpItems.length} items, Prime URL rank: ${rankings.length > 0 ? rankings[0].rank : 'Not found'}`);

        results.push({
          ...task,
          rankings: rankings,
          status: 'completed'
        });
      } else {
        // Log no results to audit
        console.log(`⚠️ No results found for ${task.prime_url}: ${task.taskId}`);

        results.push({
          ...task,
          rankings: [],
          status: 'no_results'
        });
      }

    } catch (error) {
      console.error(`Error fetching results for task ${task.taskId}:`, error);

      // Log error to audit
      console.error(`❌ Failed to fetch results for ${task.prime_url}: ${error.message}`);

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
 * Extracts ranking data from SERP results, looking for specific prime_url
 * @param {Array} serpResults - Raw SERP results from DataForSEO
 * @param {string} primeUrl - The specific URL we want to find in rankings
 * @returns {Array} Array of ranking objects with rank and URL (only for the prime_url)
 */
function extractRankingData(serpResults, primeUrl) {
  const rankings = [];

  for (const result of serpResults) {
    if (result.items && Array.isArray(result.items)) {
      for (const item of result.items) {
        if (item.type === "organic" && item.rank_group && item.url) {
          // Look for exact match of prime_url
          if (item.url === primeUrl) {
            rankings.push({
              rank: item.rank_group,
              url: item.url
            });
          }
        }
      }
    }
  }

  return rankings;
}

/**
 * Writes results back to the rankmonitor sheet
 */
function writeResultsToSheet(results) {
  const sheet = getRankMonitorSheet();
  const timestamp = new Date();

  if (results.length === 0) return;

  // Use the task column from the first result to determine where to write
  const taskColumn = results[0].taskColumn;
  const rankColumn = taskColumn + 1;
  const dateColumn = taskColumn + 2;

  for (const result of results) {
    const row = result.rowIndex + 1;

    // Get best ranking (lowest rank number)
    let newRank = null;
    if (result.rankings.length > 0) {
      newRank = Math.min(...result.rankings.map(r => r.rank));
    }

    // Write to the corresponding rank and date columns
    sheet.getRange(row, rankColumn + 1).setValue(newRank || 'Not Found');
    sheet.getRange(row, dateColumn + 1).setValue(timestamp);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Checks status of submitted jobs
 */
function checkJobStatus() {
  const taskIds = getTaskIdsFromSheet();

  if (taskIds.length === 0) {
    SpreadsheetApp.getUi().alert('No Jobs Found', 'No active jobs to check.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  SpreadsheetApp.getUi().alert(
    'Job Status',
    `Found ${taskIds.length} active jobs.\\n\\nIf you submitted jobs 2-5 minutes ago, they should be ready.\\n\\nClick "Get Results" to fetch them.`,
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
      `Submit requests log opened! This sheet shows all requests sent to DataForSEO.\\n\\nColumns:\\n- Prime URL: The specific URL being tracked\\n- Request Data: The complete request payload`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', `Failed to open submit requests: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
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
      `Results dump opened! This sheet shows all raw responses from DataForSEO.\\n\\nColumns:\\n- Prime URL: The specific URL being tracked\\n- Raw DataForSEO Response: Complete response including all SERP data`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', `Failed to open results dump: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Clears task data from rankmonitor sheet
 */
function clearTaskData() {
  const response = SpreadsheetApp.getUi().alert(
    'Clear Task Data',
    'This will clear all task IDs from the rankmonitor sheet. Continue?',
    SpreadsheetApp.getUi().ButtonSet.YES_NO
  );

  if (response !== SpreadsheetApp.getUi().Button.YES) return;

  const sheet = getRankMonitorSheet();
  const lastRow = sheet.getLastRow();

  // Clear all task data columns (starting from column F)
  const startCol = BASE_COLUMNS.FIRST_DATA_COL + 1; // +1 for 1-based indexing
  const numCols = sheet.getLastColumn() - BASE_COLUMNS.FIRST_DATA_COL;
  if (numCols > 0) {
    sheet.getRange(2, startCol, lastRow - 1, numCols).clearContent();
  }

  SpreadsheetApp.getUi().alert('✅ Cleared', 'Task data has been cleared from rankmonitor sheet.', SpreadsheetApp.getUi().ButtonSet.OK);
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
      SpreadsheetApp.getUi().alert('✅ Connection Successful', 'DataForSEO API connection is working!', SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      SpreadsheetApp.getUi().alert('❌ Connection Failed', `API returned status: ${response.getResponseCode()}`, SpreadsheetApp.getUi().ButtonSet.OK);
    }

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Connection Error', `Failed to connect: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}