# Search Visibility v2 - Daily Ranking Monitor

A Google Sheets-integrated ranking tracker that monitors keyword positions daily using DataForSEO's SERP API. Built for wildlife removal service ranking monitoring with historical tracking capabilities.

## 🚀 Features

- **Google Sheets Integration**: Custom menu with one-click ranking checks
- **Historical Tracking**: Automatically adds new columns for each check (never overwrites data)
- **Two-Phase Workflow**: Submit jobs → Wait 2-5 minutes → Get results
- **Secure API Storage**: Uses Google Apps Script Properties for API credentials
- **Mobile-First**: Targets mobile rankings (Android device simulation)
- **Domain Filtering**: Only shows rankings for aaacwildliferemoval.com domain

## 📊 Workflow

### Phase 1: Submit Ranking Jobs
1. Click **🎯 Ranking Tracker** → **📤 Submit Ranking Jobs**
2. Script reads Office, Targets, service, lat, long from "rankmonitor" sheet
3. Submits jobs to DataForSEO API
4. Stores task IDs in next available column

### Phase 2: Get Results (2-5 minutes later)
1. Click **🎯 Ranking Tracker** → **📥 Get Results**
2. Fetches results using stored task IDs
3. Writes rankings and timestamps to sheet
4. Creates historical columns for tracking over time

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
```

Results will auto-populate in columns F, G, H, I, J, K, etc.

## 📈 Historical Tracking

Each ranking check creates 3 new columns:
```
Check 1: F (Task ID) | G (Rank) | H (Date)
Check 2: I (Task ID) | J (Rank) | K (Date)
Check 3: L (Task ID) | M (Rank) | N (Date)
```

Perfect for tracking ranking improvements over time! 📊

## 🎯 Custom Menu

Once installed, you'll see this menu in Google Sheets:
```
🎯 Ranking Tracker
├── 📤 Submit Ranking Jobs
├── 📥 Get Results
├── ────────────────
├── 📊 View Job Status
├── 🧹 Clear Task Data
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
- `google-apps-script.js` - Complete Google Sheets integration

## 🏗️ Architecture

**Original (v1)**: Complex 3-phase Node.js pipeline with JSON files
**v2 Upgrade**: Google Sheets integration with historical tracking

- **Read**: Google Sheets data (Office/Targets/service/coordinates)
- **Process**: DataForSEO API integration with 2-phase workflow
- **Write**: Historical columns with timestamps

## 🎉 Status

✅ **Production Ready** - Successfully tested with Google Sheets integration
✅ **Historical Tracking** - Multiple ranking checks create new columns automatically
✅ **Secure** - API credentials stored in Script Properties
✅ **User Friendly** - Custom menu with clear workflow

## 🔄 Migration from v1

This is a complete rewrite optimized for Google Sheets. The original aviation-themed pipeline (Preflight → Takeoff → Landing) has been adapted into a user-friendly two-button workflow perfect for daily ranking monitoring.

---

**Repository**: [search-visibility-v2](https://github.com/sm0ke7-dev/search-visibility-v2)
**Original**: Forked from wildlife removal ranking pipeline
**Target Domain**: aaacwildliferemoval.com 