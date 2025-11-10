# Mobile Combustion Component

## Overview

The Mobile Combustion component is a comprehensive React-based interface for tracking and managing greenhouse gas (GHG) emissions from mobile combustion sources in Scope 1. This component supports two calculation methods:

1. **Fuel Method** - Tracks emissions based on fuel consumption
2. **Transportation Method** - Tracks emissions based on distance traveled

## Features

### Two Calculation Methods

#### 1. Fuel Method
- Track fuel consumption by vehicle
- Support for multiple fuel types:
  - Petrol
  - Diesel
  - CNG / LNG
  - LPG
  - Aviation fuel (Jet A, Jet A-1)
  - Marine fuel oil
  - Biodiesel or ethanol blends
- Units: KG, Tonnes
- Formula: `E = Fuel Used × Emission Factor`

#### 2. Transportation Method
- Track emissions based on distance traveled
- Support for multiple transportation types:
  - On-Road Transport
  - Off-Road Transport & Equipment
  - Rail Transport
  - Marine Transport
  - Aviation (Owned Aircraft)
  - Mobile Generators / Temporary Engines
- Units: KM, Miles, Nautical Miles, ETC
- Formula: `E = (Distance / 10) × Emission Factor`
- Uses average transport constant of 10

### Core Functionality

✅ **Tab Navigation** - Switch between Fuel Method and Transportation Method
✅ **CRUD Operations** - Create, Read, Update, Delete entries for both methods
✅ **Auto-calculations** - Automatic emission calculations using GWP values:
  - CO2: GWP = 1
  - CH4: GWP = 25
  - N2O: GWP = 298
✅ **Vehicle Tracking** - Track emissions by vehicle number
✅ **Company Integration** - Automatic company detection from user profile
✅ **Company Unit Management** - Associate emissions with specific company units
✅ **Data Visualization** - Interactive charts showing emission trends over time
✅ **Date Filtering** - Filter emissions by day, week, month, year, or custom range
✅ **Multiple Chart Types** - Bar, Line, Area, and Stacked Area charts
✅ **Responsive Design** - Works on desktop, tablet, and mobile devices
✅ **Error Handling** - Comprehensive error messages and validation

## Data Structure

### Fuel Method DocType: `Mobile Combustion Fuel Method`

```javascript
{
  name: string;           // Auto-generated
  s_no: number;          // Serial number
  date: string;          // Date of entry
  vehicle_no: string;    // Vehicle number (e.g., ABC1234)
  fuel_selection: string; // Type of fuel used
  fuel_used: number;     // Amount of fuel consumed
  unit_selection: string; // Unit (KG/Tonnes)
  company: string;       // Company name
  company_unit: string;  // Company unit
  efco2: number;         // Emission factor for CO2
  efch4: number;         // Emission factor for CH4
  efn20: number;         // Emission factor for N2O
  eco2: number;          // Calculated CO2 emission
  ech4: number;          // Calculated CH4 emission
  en20: number;          // Calculated N2O emission
  etco2eq: number;       // Total CO2 equivalent
}
```

### Transportation Method DocType: `Mobile Combustion Transportation Method`

```javascript
{
  name: string;              // Auto-generated
  s_no: number;             // Serial number
  date: string;             // Date of entry
  vehicle_no: string;       // Vehicle number (e.g., XYZ789)
  transportation_type: string; // Type of transportation
  distance_traveled: number; // Distance traveled
  unit_selection: string;    // Unit (KM/Miles/etc)
  company: string;          // Company name
  company_unit: string;     // Company unit
  efco2: number;            // Emission factor for CO2
  efch4: number;            // Emission factor for CH4
  efn20: number;            // Emission factor for N2O
  eco2: number;             // Calculated CO2 emission
  ech4: number;             // Calculated CH4 emission
  en20: number;             // Calculated N2O emission
  etco2eq: number;          // Total CO2 equivalent
}
```

## Emission Calculations

### Fuel Method
```
ECO2 = Fuel Used × EFCO2
ECH4 = Fuel Used × EFCH4
EN2O = Fuel Used × EFN2O
ETCO2eq = ECO2 + (ECH4 × 25) + (EN2O × 298)
```

### Transportation Method
```
AVG_TRANSPORT_CONSTANT = 10

ECO2 = (Distance Traveled / 10) × EFCO2
ECH4 = (Distance Traveled / 10) × EFCH4
EN2O = (Distance Traveled / 10) × EFN2O
ETCO2eq = ECO2 + (ECH4 × 25) + (EN2O × 298)
```

## Component Architecture

```
MobileCombustion.tsx
├── State Management
│   ├── activeTab (Fuel/Transport method)
│   ├── fuelFormData (Fuel method form state)
│   ├── transportFormData (Transport method form state)
│   ├── Calculated emissions (auto-computed)
│   └── Chart filters (time range, chart type)
│
├── Data Fetching (via Frappe SDK)
│   ├── Fuel Method emissions
│   ├── Transportation Method emissions
│   ├── User company data
│   └── Company units
│
├── UI Components
│   ├── Tab Navigation (Fuel/Transport)
│   ├── Data Tables (separate for each method)
│   ├── Add Entry Dialog (dynamic based on active tab)
│   ├── View Entry Dialog (shows detailed information)
│   ├── Emission Trend Chart (combined data)
│   └── Snackbar notifications
│
└── Operations
    ├── Create (separate for each method)
    ├── Read (list and detail view)
    ├── Delete (with confirmation)
    └── Calculate (auto-compute emissions)
```

## Usage

### Adding a Fuel Method Entry

1. Click "Add entry" button
2. Ensure "Fuel Method" tab is active
3. Fill in the form:
   - Date (required)
   - Vehicle Number (required, e.g., ABC1234)
   - Fuel Selection (required, dropdown)
   - Fuel Used (required, numeric)
   - Unit (required, KG/Tonnes)
   - Company Unit (required if units available)
4. Enter Emission Factors manually:
   - EFCO2
   - EFCH4
   - EFN2O
5. View auto-calculated emissions
6. Click "Save Entry"

### Adding a Transportation Method Entry

1. Click "Add entry" button
2. Switch to "Transportation Method" tab
3. Fill in the form:
   - Date (required)
   - Vehicle Number (required, e.g., XYZ789)
   - Transportation Type (required, dropdown)
   - Distance Traveled (required, numeric)
   - Unit (required, KM/Miles/etc)
   - Company Unit (required if units available)
4. Enter Emission Factors manually:
   - EFCO2
   - EFCH4
   - EFN2O
5. View auto-calculated emissions (using distance/10 formula)
6. Click "Save Entry"

### Viewing Entry Details

1. Click on any row in the table
2. View detailed information including:
   - Basic information (date, vehicle, fuel/transport type)
   - Emission factors used
   - Calculated emissions
   - Total CO2 equivalent

### Analyzing Emission Trends

1. Scroll to the "Mobile Combustion Emission Trend" chart
2. Select time range:
   - Last 30 Days
   - Last 12 Weeks
   - Last 12 Months
   - Last 5 Years
   - Custom Range (with date pickers)
3. Choose chart type:
   - 📊 Bar Chart
   - 📈 Line Chart
   - 📉 Area Chart
   - 📊 Stacked Area
4. Chart combines data from both fuel and transportation methods

### Deleting Entries

1. Click the delete icon (🗑️) on any row
2. Confirm deletion in the popup dialog
3. Entry is permanently removed

## Integration Points

### Frappe Backend Requirements

The component requires the following Frappe DocTypes to be created:

1. **Mobile Combustion Fuel Method**
   - Fields: s_no, date, vehicle_no, fuel_selection, fuel_used, unit_selection, company, company_unit, efco2, efch4, efn20, eco2, ech4, en20, etco2eq
   - Permissions: System Manager and All roles

2. **Mobile Combustion Transportation Method**
   - Fields: s_no, date, vehicle_no, transportation_type, distance_traveled, unit_selection, company, company_unit, efco2, efch4, efn20, eco2, ech4, en20, etco2eq
   - Permissions: System Manager and All roles

3. **Units** (existing)
   - Used for company unit selection
   - Filtered by user's company

### API Calls

The component makes the following API calls:

```javascript
// Get current user's company
frappe.client.get('User', currentUser)

// Get company units
frappe.client.get_list('Units', { filters: [['company', '=', userCompany]] })

// Get fuel method emissions
frappe.client.get_list('Mobile Combustion Fuel Method', { fields: ['*'] })

// Get transportation method emissions
frappe.client.get_list('Mobile Combustion Transportation Method', { fields: ['*'] })

// Create fuel method entry
frappe.client.insert('Mobile Combustion Fuel Method', {...})

// Create transportation method entry
frappe.client.insert('Mobile Combustion Transportation Method', {...})

// Delete entries
frappe.client.delete('Mobile Combustion Fuel Method', name)
frappe.client.delete('Mobile Combustion Transportation Method', name)
```

## Styling & Theme

- **Primary Color**: `#3b82f6` (Blue)
- **Hover Color**: `#1d4ed8` (Dark Blue)
- **Background**: White with subtle gradients
- **Table Header**: `#F5F7FA`
- **Border Radius**: 8-16px for modern look
- **Font**: System fonts with -apple-system, BlinkMacSystemFont
- **Shadows**: Subtle box shadows for depth

## Routing

The component is accessible at:
```
/scope1/mobile
```

Navigation path:
```
GHG Calculator → Scope 1 → Mobile Combustion
```

## Dependencies

```json
{
  "frappe-react-sdk": "^3.x.x",
  "@mui/material": "^6.x.x",
  "@mui/icons-material": "^6.x.x",
  "@mui/x-date-pickers": "^7.x.x",
  "recharts": "^2.x.x",
  "date-fns": "^3.x.x",
  "react": "^18.x.x"
}
```

## Key Differences from Stationary Emissions

1. **Two Methods vs One**: Mobile Combustion has both Fuel and Transportation methods
2. **Tab Navigation**: Uses Material-UI Tabs for method switching
3. **Transportation Formula**: Uses distance/10 × EF instead of direct multiplication
4. **Vehicle Tracking**: Focuses on vehicle numbers instead of activity types
5. **No Invoice Upload**: Mobile Combustion doesn't require invoice attachments
6. **Combined Chart**: Chart combines data from both calculation methods

## Best Practices

1. **Vehicle Numbers**: Use consistent format (e.g., ABC1234, XYZ789)
2. **Emission Factors**: Obtain accurate emission factors from:
   - IPCC guidelines
   - EPA emission factor databases
   - Regional emission standards
3. **Units**: Use consistent units across entries
4. **Date Tracking**: Record emissions on the date they occurred
5. **Company Units**: Always associate emissions with correct company unit
6. **Regular Updates**: Update emission factors when standards change

## Troubleshooting

### Emissions not calculating
- Ensure all emission factors (EFCO2, EFCH4, EFN2O) are entered
- Check that fuel used/distance traveled is greater than 0
- Verify unit selection is made

### Chart not showing data
- Add at least one entry for either method
- Check time range filter settings
- Try custom date range if default ranges show no data

### Cannot save entry
- Fill all required fields (marked with *)
- Ensure numeric fields contain valid numbers
- Check company unit is selected if units are available

### Entries not appearing in table
- Refresh the page
- Check Frappe backend DocTypes are created correctly
- Verify user has read permissions

## Future Enhancements

- [ ] Emission factor auto-population from master data
- [ ] Bulk import via CSV/Excel
- [ ] Export data to PDF/Excel reports
- [ ] Vehicle fleet management integration
- [ ] Fuel efficiency analysis
- [ ] Comparison charts between vehicles
- [ ] Monthly emission summaries
- [ ] Target setting and progress tracking
- [ ] Integration with vehicle maintenance records
- [ ] Real-time emission monitoring

## Version History

### v1.0.0 (Current)
- Initial release
- Fuel Method implementation
- Transportation Method implementation
- Tab navigation
- CRUD operations
- Auto-calculations with GWP
- Data visualization with charts
- Time range filtering
- Responsive design
- Company integration

## Related Documentation

- [Stationary Emissions](./STATIONARY_EMISSIONS.md)
- [Routing Configuration](./ROUTING.md)
- [Setup & Installation](./README.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_417.md)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the Frappe logs for API errors
3. Verify DocType configurations in Frappe backend
4. Contact the development team

---

**Component**: MobileCombustion.tsx  
**Location**: `/src/features/mobile/MobileCombustion.tsx`  
**Route**: `/scope1/mobile`  
**Scope**: Scope 1 - Direct Emissions  
**Created**: 2025  
**Last Updated**: 2025

