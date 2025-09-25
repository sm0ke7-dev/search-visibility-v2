const fs = require('fs');
const path = require('path');

/**
 * Converts Google Sheets data to preflight structure
 * @param {Array} sheetData - Array of row arrays from Google Sheets
 * Expected columns: [Office, Targets, service, lat, long, rank, ranking url, ...]
 * @returns {Object} Preflight data structure grouped by office
 */
const buildPreflightFromSheet = (sheetData) => {
  const output = {};

  // Skip header row, process data rows
  for (let i = 1; i < sheetData.length; i++) {
    const row = sheetData[i];

    // Extract data from columns
    const office = row[0]?.toString().trim(); // Office
    const target = row[1]?.toString().trim(); // Targets
    const service = row[2]?.toString().trim(); // service
    const lat = parseFloat(row[3]); // lat
    const long = parseFloat(row[4]); // long

    // Skip incomplete rows
    if (!office || !target || !service || isNaN(lat) || isNaN(long)) {
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
      geo_coordinate: geo_coordinate,
      keywords: [service] // Simple: just use the service as the keyword
    });
  }

  return output;
};

// Original function for backwards compatibility with local JSON files
const buildPreflight = ({ rankingPages, serviceLocationData, placeholders }) => {
  const output = {};

  for (const city in rankingPages) {
    if (!serviceLocationData[city]) continue;
    const cityData = serviceLocationData[city];
    output[city] = rankingPages[city].map(item => {
      // Find geo_coordinate for location
      const locationObj = cityData.locations.find(loc => loc.name === item.location);
      const geo_coordinate = locationObj ? locationObj.geo_coordinate : null;
      // Find service for keywords
      const serviceObj = cityData.services.find(svc => svc.name === item.service);
      const brand = cityData.brand;
      let keywords = [];
      if (serviceObj && serviceObj.keyword_list) {
        // Iterate through each keyword in the service's keyword_list
        serviceObj.keyword_list.forEach(keyword => {
          // Apply placeholder templates to each keyword
          placeholders.forEach(template => {
            const locationKeyword = template
              .replace(/\{keyword\}/gi, keyword)
              .replace(/\{location\}/gi, item.location.toLowerCase())
              .replace(/\{brand\}/gi, brand);
            keywords.push(locationKeyword);
          });
        });
      }
      return {
        ...item,
        geo_coordinate,
        keywords
      };
    });
  }
  return output;
};

// Run preflight if this file is executed directly
if (require.main === module) {
  // Load data files
  const rankingPages = JSON.parse(fs.readFileSync(path.join(__dirname, 'ranking_pages.json'), 'utf-8'));
  const serviceLocationData = JSON.parse(fs.readFileSync(path.join(__dirname, 'service_location_data.json'), 'utf-8'));
  const placeholders = JSON.parse(fs.readFileSync(path.join(__dirname, 'placeholder.json'), 'utf-8'));
  
  // Preflight phase execution
  async function preflight() {
    try {
      console.log('📋 Starting PREFLIGHT phase...');
      
      // Build PreFlight data
      const preFlight = buildPreflight({ rankingPages, serviceLocationData, placeholders });
      
      // Write PreFlight output
      fs.writeFileSync(path.join(__dirname, 'pre-flight-output.json'), JSON.stringify(preFlight, null, 2));
      console.log('✅ PREFLIGHT COMPLETE! PreFlight output written to pre-flight-output.json');
      console.log('🚀 Ready for takeoff phase.');
      
    } catch (error) {
      console.error('Error in preflight phase:', error);
    }
  }
  
  // Run preflight
  preflight();
}

module.exports = buildPreflight;
module.exports.buildPreflightFromSheet = buildPreflightFromSheet; 