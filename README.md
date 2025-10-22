# Search Visibility Ranking Tracker v2

## 📋 Project Overview

This project provides an integrated solution for tracking search engine rankings with geocoding and demographic data. It combines Google Geocoding API, Census ACS API, and DataForSEO API to provide comprehensive location-based ranking analysis.

## 🗂️ Current File Structure

### **Active Files (Current Version)**

#### 1. `rank-check-geocode-pop-income-v1.js` ⭐ **MAIN FILE**
- **Purpose**: Complete integrated solution with geocoding, census data, and ranking tracking
- **Features**: 
  - Google Geocoding API integration
  - Census ACS population/income data
  - DataForSEO ranking tracking
  - Enhanced menu system
- **Status**: ✅ **CURRENT VERSION** - Use this file for new implementations

#### 2. `geocoding-script-v3.gs` 
- **Purpose**: Standalone geocoding and census data script
- **Features**: Google Geocoding + Census ACS integration
- **Status**: ✅ **REFERENCE** - Used as source for geocoding functions

### **Legacy Files (Reference Only)**

#### 3. `google-apps-script-active-tab-v3.js` 
- **Purpose**: Ranking tracker without geocoding
- **Status**: ❌ **DELETED** - Functionality integrated into main file

#### 4. `google-apps-script-analysis-tab.js`
- **Purpose**: Analysis-specific ranking tracker
- **Status**: ❌ **DELETED** - Functionality integrated into main file

#### 5. `google-apps-script-specific-url.js`
- **Purpose**: Specific URL tracking version
- **Status**: ❌ **DELETED** - Functionality integrated into main file

## 📊 Column Structure

The integrated solution uses this exact column structure:

| Column | Header | Purpose | Data Source |
|--------|--------|---------|-------------|
| **A** | Office | Office name | Manual input |
| **B** | State | State abbreviation | Manual input |
| **C** | Targets | City name | Manual input |
| **D** | service | Service type | Manual input |
| **E** | lat | Latitude | Google Geocoding API |
| **F** | long | Longitude | Google Geocoding API |
| **G** | prime_url | Prime URL | Auto-generated |
| **H** | population | Population | Census ACS API |
| **I** | income | Income | Census ACS API |
| **J+** | Ranking data | Ranking results | DataForSEO API |

## 🚀 Enhanced Menu System

```
📊 Enhanced Ranking Tracker
├── 📍 Geocoding & Census
│   ├── 🌍 Geocode Cities & Get Census Data
│   └── 🔄 Update Coordinates Only
├── 📤 Ranking Jobs
│   ├── 📤 Submit Ranking Jobs
│   └── 📥 Get Results
├── 📊 Analysis
│   ├── 📊 View Job Status
│   ├── 📋 View Submit Requests
│   └── 📋 View Results Dump
├── 🧹 Maintenance
│   ├── 🧹 Clear Task Data
│   └── ⚙️ Test Connection
└── 🤖 Automation
    ├── 🤖 Setup Daily Automation
    ├── 🔕 Disable Automation
    └── 🧪 Test Daily Check
```

## 🔧 API Requirements

### **Required API Keys (Script Properties)**

1. **Google API Key**
   - Property: `GOOGLE_API_KEY`
   - Purpose: Google Geocoding API
   - Setup: [Google Cloud Console](https://console.cloud.google.com/)

2. **DataForSEO API Key**
   - Property: `basic`
   - Purpose: Search ranking data
   - Setup: [DataForSEO Dashboard](https://app.dataforseo.com/)

### **Free APIs (No Key Required)**

3. **Census ACS API**
   - Purpose: Population and income data
   - Rate Limit: Built-in delays (120ms between requests)

## 📋 Workflow

### **Step 1: Setup Data**
1. Fill columns A-D with:
   - **A**: Office name
   - **B**: State abbreviation (e.g., "TX", "CA")
   - **C**: City name
   - **D**: Service type

### **Step 2: Geocoding & Census Data**
1. Run **"🌍 Geocode Cities & Get Census Data"**
2. Script will populate columns E-I:
   - **E**: Latitude (from Google)
   - **F**: Longitude (from Google)
   - **G**: Prime URL (auto-generated)
   - **H**: Population (from Census)
   - **I**: Income (from Census)

### **Step 3: Ranking Analysis**
1. Run **"📤 Submit Ranking Jobs"** to start ranking checks
2. Wait 2-5 minutes for DataForSEO processing
3. Run **"📥 Get Results"** to get ranking data
4. Results appear in columns J & K (always overwrites same columns)

## 🔄 Recent Changes (Integration Update)

### **What Was Integrated**
- ✅ Google Geocoding API (replaces Census Geocoding)
- ✅ Census ACS population/income data
- ✅ Enhanced column structure matching user's spreadsheet
- ✅ Unified menu system
- ✅ Smart URL generation
- ✅ Error handling and validation
- ✅ **Fixed ranking data columns (J & K always overwrite)**

### **What Was Removed**
- ❌ Standalone geocoding scripts
- ❌ Separate analysis tab scripts
- ❌ Specific URL tracking scripts
- ❌ Hardcoded tab references
- ❌ **Dynamic column creation (no more L, M, N, O columns)**

### **Key Improvements**
1. **Better Accuracy**: Google Geocoding vs Census Geocoding
2. **Unified Workflow**: Single script for all functionality
3. **Enhanced Data**: Population and income demographics
4. **Flexible Structure**: Works with any active tab
5. **Smart Validation**: Handles missing data gracefully
6. **Clean Data Management**: Ranking data always overwrites same columns

## 🛠️ Technical Details

### **Google Geocoding Integration**
- Uses `https://maps.googleapis.com/maps/api/geocode/json`
- Extracts coordinates and address components
- Maps state abbreviations to FIPS codes
- Handles API errors gracefully

### **Census ACS Integration**
- Uses `https://api.census.gov/data/2023/acs/acs5`
- Fetches population (B01003_001E) and income (B19013_001E)
- Requires place codes from Census geocoding
- Handles missing data with clear indicators

### **DataForSEO Integration**
- Uses existing ranking tracking functionality
- Searches for `aaacwildliferemoval.com` domain
- Writes results to new columns with timestamps
- Maintains task ID storage for automation

## 🚨 Important Notes

### **File Usage Guidelines**
- **Use**: `rank-check-geocode-pop-income-v1.js` for all new implementations
- **Reference**: `geocoding-script-v3.gs` for geocoding function examples
- **Avoid**: Legacy files (deleted or deprecated)

### **Column Requirements**
- Columns A-D must be filled before geocoding
- Coordinates (E-F) are required before ranking jobs
- Prime URLs (G) are auto-generated but can be customized

### **API Rate Limits**
- Google Geocoding: 120ms delay between requests
- Census ACS: No rate limit (free service)
- DataForSEO: Existing rate limiting

## 🔮 Future Enhancements

### **Potential Improvements**
1. **Batch Processing**: Process multiple cities simultaneously
2. **Data Validation**: Enhanced error checking and reporting
3. **Custom URLs**: Allow manual prime URL specification
4. **Export Features**: CSV export of results
5. **Visualization**: Charts and graphs for ranking trends

### **Maintenance Notes**
- Monitor API usage and costs
- Update Census year as new data becomes available
- Consider caching for frequently accessed locations
- Add email notifications for automation failures

## 📞 Support

For questions about this integration:
1. Check the column structure matches your spreadsheet
2. Verify API keys are set in Script Properties
3. Review the workflow steps above
4. Check Google Apps Script logs for detailed error messages

---

**Last Updated**: December 2024  
**Version**: v2.0 (Integrated)  
**Main File**: `rank-check-geocode-pop-income-v1.js`