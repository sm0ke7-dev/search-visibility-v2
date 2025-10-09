# Search Visibility v2 - Daily Ranking Monitor

A Google Sheets-integrated ranking tracker that monitors keyword positions daily using DataForSEO's SERP API. Built for wildlife removal service ranking monitoring with support for multiple office locations and flexible column structures.

## 🚀 Features

- **Google Sheets Integration**: Custom menu with one-click ranking checks
- **Current Rankings**: Always shows latest rankings in fixed columns (overwrites previous data)
- **Automated Daily Checks**: Set up time-driven triggers for hands-free daily monitoring
- **Two-Phase Workflow**: Submit jobs → Wait 2-5 minutes → Get results (manual or automated)
- **Secure API Storage**: Uses Google Apps Script Properties for API credentials
- **Mobile-First**: Targets mobile rankings (Android device simulation)
- **Domain-Wide Tracking**: Tracks rankings for any aaacwildliferemoval.com subdomain
- **Multi-Office Support**: Separate scripts for different office locations with custom column structures
- **Complete Audit Trail**: Automatic logging of all API requests and responses for transparency

## 📊 Workflow

### Manual Workflow
**Phase 1: Submit Ranking Jobs**
1. Click **🎯 Ranking Tracker** → **📤 Submit Ranking Jobs**
2. Script reads Office, Targets, service, lat, long from "rankmonitor" sheet
3. Submits jobs to DataForSEO API
4. Stores task IDs temporarily in Script Properties

**Phase 2: Get Results (2-5 minutes later)**
1. Click **🎯 Ranking Tracker** → **📥 Get Results**
2. Fetches results using stored task IDs
3. Writes current rankings to fixed columns G and H (overwrites previous data)

### Automated Workflow
**Set Once, Run Daily:**
1. Click **🎯 Ranking Tracker** → **🤖 Setup Daily Automation**
2. Follow guided setup to choose your preferred time (e.g., 9:00 AM)
3. System automatically runs both phases daily with 5-minute wait between them
4. Same ranking data appears in columns G and H, completely hands-free!

## 🛠️ Setup

### 1. Google Apps Script Setup
1. Open [Google Apps Script](https://script.google.com)
2. Create new project
3. Replace `Code.gs` content with `google-apps-script.js`
4. Save project

### 2. API Credentials
1. In Apps Script: Project Settings → Script Properties
2. Add property: `basic` = `your_base64_encoded_dataforseo_key`
3. Save

### 3. Google Sheet Structure
Create "rankmonitor" tab with columns:
```
A: Office    (Dallas, Phoenix, Milwaukee)
B: Targets   (Garland, Irving, etc.)
C: service   (wildlife removal, raccoon removal)
D: lat       (32.91292795)
E: long      (-96.63675497)
F: prime_url (https://dallas.aaacwildliferemoval.com/service-area/garland/)
```

Results will auto-populate in columns G (Rank) and H (URL).

## 🏢 Multi-Office Setup

The system supports multiple office locations with different column structures:

### Main Office (`rankmonitor` tab)
```
A: Office | B: Targets | C: service | D: lat | E: long | F: prime_url | G: Rank | H: URL
```
**Script:** `google-apps-script.js`
**Menu:** 🎯 Ranking Tracker

### Palm Beaches Office (`palm-beaches` tab)
```
A: Office | B: Targets | C: service | D: lat | E: long | F: prime_url | G: Population | H: Income | I: Rank | J: URL
```
**Script:** `google-apps-script-palm-beaches.js`
**Menu:** 🌴 Palm Beaches Ranking Tracker

### San Antonio Office (`san-antonio` tab)
```
A: Office | B: Targets | C: service | D: lat | E: long | F: prime_url | G: Rank | H: URL
```
**Script:** `google-apps-script-san-antonio.js`
**Menu:** 🌵 San Antonio Ranking Tracker

### Adding New Offices
1. Copy the most appropriate existing script (palm-beaches for extra columns, or main for standard structure)
2. Update `SHEET_NAMES.RANK_MONITOR` to your tab name
3. Adjust `BASE_COLUMNS` for your column structure
4. Update `FIRST_DATA_COL` to where ranking data should start
5. Customize menu branding and messages
6. Update all property keys to use office-specific prefixes (e.g., `sanAntonioTaskIds`)

## 📈 Current Rankings

Each ranking check overwrites the fixed columns:
```
Column G: Rank (best position found for any aaacwildliferemoval.com subdomain)
Column H: URL (the specific URL that achieved that ranking)
```

Results are always current - previous data is overwritten for simplicity! 📊

## 📋 Two-Tab Audit System

Every API interaction is automatically logged to separate audit tabs for clean organization:

### Submit Requests Tab (`submit_requests`)
Logs all requests sent to DataForSEO when you click "Submit Ranking Jobs":
- **Prime URL**: The specific URL being tracked
- **Request Data**: Complete JSON payload sent to DataForSEO API

### Results Dump Tab (`results_dump`)
Logs all raw responses from DataForSEO when you click "Get Results":
- **Prime URL**: The specific URL being tracked
- **Raw DataForSEO Response**: Complete unfiltered response including all SERP data

### Benefits:
- 🔍 **Debug rankings**: See exactly what DataForSEO returned in raw format
- 🎯 **Domain verification**: Confirm rankings are for aaacwildliferemoval.com subdomains
- 🧹 **Clean separation**: Request data and response data in separate tabs
- 📊 **Complete transparency**: Full audit trail of all API interactions

## 🎯 Custom Menu

Once installed, you'll see this menu in Google Sheets:
```
🎯 Ranking Tracker
├── 📤 Submit Ranking Jobs
├── 📥 Get Results
├── ────────────────
├── 📊 View Job Status
├── 📋 View Submit Requests
├── 📋 View Results Dump
├── 🧹 Clear Task Data
├── ────────────────
├── 🤖 Setup Daily Automation
├── 🔕 Disable Automation
├── 🧪 Test Daily Check
├── ────────────────
└── ⚙️ Test Connection
```

## 🔧 Local Development

The repo also contains the original Node.js pipeline for local development:

```bash
git clone https://github.com/sm0ke7-dev/search-visibility-v2.git
cd search-visibility-v2
npm install
```

Core files:
- `buildPreflight.js` - Data preparation (adapted for Google Sheets)
- `buildTakeOff.js` - API job submission
- `landThePlane.js` - Results retrieval
- `google-apps-script.js` - Main office Google Sheets integration (rankmonitor tab)
- `google-apps-script-palm-beaches.js` - Palm Beaches office integration (palm-beaches tab)
- `google-apps-script-san-antonio.js` - San Antonio office integration (san-antonio tab)

## 🏗️ Architecture

**Original (v1)**: Complex 3-phase Node.js pipeline with JSON files
**v2 Upgrade**: Google Sheets integration with current ranking display

- **Read**: Google Sheets data (Office/Targets/service/coordinates)
- **Process**: DataForSEO API integration with 2-phase workflow
- **Write**: Current rankings to fixed columns G and H

## 🎉 Status

✅ **Production Ready** - Successfully tested with Google Sheets integration
✅ **Current Rankings** - Always displays latest rankings in fixed columns
✅ **Automated Daily Checks** - Time-driven triggers for hands-free monitoring
✅ **Secure** - API credentials stored in Script Properties
✅ **User Friendly** - Custom menu with clear workflow
✅ **Two-Tab Audit System** - Implemented and working perfectly
✅ **Domain-Wide Tracking** - Finds best ranking for any aaacwildliferemoval.com subdomain
✅ **Multi-Office Support** - Separate scripts for different office locations and column structures
✅ **Row Indexing** - Fixed alignment issue, rankings appear in correct rows
✅ **San Antonio Office** - Added third office with standard column structure

## 📝 Recent Development Progress

### Latest Session Summary (2025-10-09)
**Added San Antonio Office Support:**

1. **New San Antonio Script**
   - Created `google-apps-script-san-antonio.js` for San Antonio office
   - Standard column structure (no additional data columns like Palm Beaches)
   - Desert cactus themed branding (🌵 San Antonio Ranking Tracker)
   - Orange/pink color scheme reflecting San Antonio landscape

2. **Independent Office Management**
   - Unique property keys: `sanAntonioTaskIds`, `sanAntonioTaskIds_timestamp`, `sanAntonioAutomation_enabled`
   - Separate audit tabs: `sa_submit_requests` (orange), `sa_results_dump` (pink)
   - Independent task storage and automation to prevent conflicts

3. **Enhanced Multi-Office Framework**
   - Updated README with comprehensive office documentation
   - Improved instructions for adding new offices
   - Clarified property key naming conventions for office isolation

4. **Ready for Deployment**
   - Standard structure matches main office layout
   - All functionality tested and ready for Google Apps Script deployment
   - Complete audit system and automation support

### Previous Session Summary (2025-10-01)
**Reverted to simplified approach for daily monitoring:**

1. **Domain-Wide Matching**
   - Reverted from exact prime_url matching back to domain-wide matching
   - Now searches for any URL containing `aaacwildliferemoval.com`
   - Returns best ranking found across all subdomains for each keyword

2. **Fixed Column Approach**
   - Changed from historical tracking (new columns each run) to fixed columns G and H
   - Always overwrites previous data for simplicity
   - Column G: Best rank found, Column H: URL that achieved that rank

3. **Temporary Task Storage**
   - Task IDs now stored in Script Properties instead of sheet columns
   - Automatic cleanup after 30 minutes to prevent stale data
   - Cleaner sheet layout without task ID columns

4. **Streamlined for Daily Use**
   - Optimized for daily ranking checks where current data is more important than history
   - Simplified workflow: submit jobs → wait → get current rankings
   - Audit tabs still maintain complete transparency of API interactions

5. **Added Daily Automation (2025-10-01)**
   - Implemented time-driven triggers for automated daily ranking checks
   - `dailyRankingCheck()` function runs complete workflow (submit → wait 5 min → get results)
   - New menu options: Setup Daily Automation, Disable Automation, Test Daily Check
   - Manual control remains fully functional alongside automation
   - Smart error handling and console logging for unattended operation

6. **Multi-Office Support (2025-10-01)**
   - Created `google-apps-script-palm-beaches.js` for Palm Beaches office
   - Supports flexible column structures (added Population/Income columns G & H)
   - Ranking data moves to columns I & J to accommodate additional data
   - Separate audit tabs and task storage to prevent conflicts between offices
   - Palm Beaches specific branding and menu (🌴 Palm Beaches Ranking Tracker)

### System Architecture Details

**Main Office (rankmonitor tab):**
```
rankmonitor tab: A: Office | B: Targets | C: service | D: lat | E: long | F: prime_url | G: Rank | H: URL
submit_requests tab: A: Prime URL | B: Request Data (JSON)
results_dump tab: A: Prime URL | B: Raw DataForSEO Response (JSON)
```

**Palm Beaches Office (palm-beaches tab):**
```
palm-beaches tab: A: Office | B: Targets | C: service | D: lat | E: long | F: prime_url | G: Population | H: Income | I: Rank | J: URL
pb_submit_requests tab: A: Prime URL | B: Request Data (JSON)
pb_results_dump tab: A: Prime URL | B: Raw DataForSEO Response (JSON)
```

**San Antonio Office (san-antonio tab):**
```
san-antonio tab: A: Office | B: Targets | C: service | D: lat | E: long | F: prime_url | G: Rank | H: URL
sa_submit_requests tab: A: Prime URL | B: Request Data (JSON)
sa_results_dump tab: A: Prime URL | B: Raw DataForSEO Response (JSON)
```

### Testing Status
- ✅ Submit jobs works correctly with prime_url logging
- ✅ Get results works correctly with domain-wide matching
- ✅ Rankings appear in correct rows (fixed indexing bug)
- ✅ Fixed columns G and H overwrite correctly
- ✅ Audit tabs populate with proper request/response data
- ✅ Custom menu functions work as expected
- ✅ Task ID temporary storage working with 30-minute cleanup
- ✅ Daily automation setup and management working correctly
- ✅ Manual and automated workflows operate independently
- ✅ Error handling and logging optimized for unattended operation
- ✅ Palm Beaches multi-office setup working with Population/Income columns
- ✅ Separate audit tabs and task storage prevent office conflicts
- ✅ Flexible column structure supports different office data requirements

### Next Potential Features
- Consider adding bulk operations for multiple keyword/location combinations
- Potential integration with more SERP data points (featured snippets, local pack, etc.)
- Export functionality for historical data analysis

**Repository**: Last updated with multi-office support, automated daily ranking checks, and flexible column structures

## 🔄 Migration from v1

This is a complete rewrite optimized for Google Sheets. The original aviation-themed pipeline (Preflight → Takeoff → Landing) has been adapted into a user-friendly two-button workflow perfect for daily ranking monitoring.

---

**Repository**: [search-visibility-v2](https://github.com/sm0ke7-dev/search-visibility-v2)
**Original**: Forked from wildlife removal ranking pipeline
**Target Domain**: aaacwildliferemoval.com 