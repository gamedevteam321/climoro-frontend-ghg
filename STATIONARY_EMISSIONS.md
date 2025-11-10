# Stationary Emissions - Auto-Fetching & Auto-Calculation

## Overview

The Stationary Emissions page now features **automatic emission factor fetching** from the Frappe backend and **real-time emission calculations** based on user input.

## Key Features

### 🎯 1. Auto-Fetching Emission Factors

The system automatically retrieves emission factors from the **Emission Factor Master** doctype in Frappe when:
- User selects a **Fuel Type** (e.g., "Liquid fossil")
- User selects a **Fuel Selection** (e.g., "Diesel")
- User selects a **Unit** (e.g., "Litre")

**How it works:**
```typescript
// On component mount, fetch all emission factors
loadEmissionFactors() → Fetches from "Emission Factor Master"
  ↓
Organizes by fuel_type and fuel_name
  ↓
Stored in state for instant access
```

**Data Structure:**
```typescript
emissionFactors = {
  "Liquid fossil": {
    "Diesel": {
      efco2_mass: 3.17,
      efch4_mass: 0.000003,
      efn2o_mass: 0.00006,
      efco2_liquid: 2.68,
      efch4_liquid: 0.0000028,
      efn2o_liquid: 0.00005,
      // ... other factors
    }
  }
}
```

### 📊 2. Auto-Calculation of Emissions

When the user enters:
1. **Activity Data** (quantity consumed)
2. **Unit Selection** (kg, Tonnes, Litre, m³)
3. **Fuel Selection** (with auto-fetched factors)

The system automatically calculates:
- **ECO2** (CO2 emissions)
- **ECH4** (CH4 emissions)
- **EN2O** (N2O emissions)
- **ETCO2eq** (Total CO2 equivalent)

**Calculation Logic:**

```typescript
// Based on unit type:
if (unit === 'kg' || unit === 'Tonnes') {
  // Mass-based calculation
  const multiplier = unit === 'kg' ? 0.001 : 1; // Convert kg to tonnes
  eco2 = activityData * efco2 * multiplier;
  ech4 = activityData * efch4 * multiplier;
  en2o = activityData * efn2o * multiplier;
}
else if (unit === 'Litre') {
  // Liquid-based calculation (kg CO2/litre)
  eco2 = activityData * efco2;
  ech4 = activityData * efch4;
  en2o = activityData * efn2o;
}
else if (unit === 'm³') {
  // Gas-based calculation (kg CO2/m³)
  eco2 = activityData * efco2;
  ech4 = activityData * efch4;
  en2o = activityData * efn2o;
}

// Calculate total CO2 equivalent using GWP values
// GWP: CO2 = 1, CH4 = 25, N2O = 298 (IPCC AR4)
etco2eq = eco2 + (ech4 * 25) + (en2o * 298);
```

### 📝 3. Complete Form Fields

The form includes all fields from the Stationary Emissions doctype:

#### Required Fields:
- **Serial No** - Auto-incremented
- **Date** - Date of emission
- **Fuel Type** - Select from: Solid fossil, Liquid fossil, Gaseous fossil, Biomass
- **Fuel Selection** - Dynamic dropdown based on fuel type
- **Activity Types** - Boilers, Burners, Gen Sets, Furnace
- **Activity Data** - Quantity consumed
- **Unit Selection** - kg, Tonnes, Litre, m³ (dynamic based on fuel)

#### Optional Fields:
- **Invoice Number** - Reference invoice
- **Upload Invoice** - Attach invoice file (PDF/image)
- **Company** - Company name
- **Company Unit** - Unit within company

#### Auto-Calculated (Read-Only):
- **EFCO2** - CO2 emission factor
- **EFCH4** - CH4 emission factor
- **EFN2O** - N2O emission factor
- **ECO2** - CO2 emissions
- **ECH4** - CH4 emissions
- **EN2O** - N2O emissions
- **ETCO2eq** - Total CO2 equivalent ⭐

### 📂 4. File Upload

Users can upload invoice documents:
- Accepts: PDF, images (PNG, JPG, etc.)
- Files are uploaded to Frappe
- URL is saved with the emission entry

### 📈 5. Data Visualization

**Table View:**
- Displays all emission entries
- Sorted by date (newest first)
- Shows key fields: Date, Source, Fuel Type, Quantity, Unit, Emissions
- Delete functionality for each entry

**Chart View:**
- Bar chart showing monthly emission trends
- Automatically groups data by month
- Uses Recharts for visualization

## User Workflow

### Adding a New Entry:

1. **Click "Add entry"** button
2. **Fill Basic Information:**
   - Date (defaults to today)
   - Invoice number (optional)
   - Upload invoice (optional)

3. **Select Fuel:**
   - Choose **Fuel Type** → Dropdown populates with available fuels
   - Choose **Fuel Selection** → System fetches emission factors
   - Choose **Activity Type** (equipment type)

4. **Enter Activity Data:**
   - Enter **Activity Data** (quantity)
   - Select **Unit** → System auto-calculates emissions

5. **Review Auto-Calculated Values:**
   - See emission factors (EFCO2, EFCH4, EFN2O)
   - See calculated emissions (ECO2, ECH4, EN2O)
   - See **Total CO2eq** (highlighted in cyan)

6. **Click "Save Entry"** → Data saved to Frappe

### Example:

**Input:**
- Fuel Type: "Liquid fossil"
- Fuel Selection: "Diesel"
- Activity Data: 1000
- Unit: "Litre"

**Auto-Fetched:**
- EFCO2: 2.68 kg CO2/litre
- EFCH4: 0.0000028 kg CH4/litre
- EFN2O: 0.00005 kg N2O/litre

**Auto-Calculated:**
- ECO2: 2,680 kg = 2.68 tonnes
- ECH4: 0.0028 kg
- EN2O: 0.05 kg
- **ETCO2eq: 2.75 tonnes CO2e**

## Dynamic Unit Options

Units change based on fuel selection:

| Fuel Type | Available Units |
|-----------|----------------|
| Solid fossil | kg, Tonnes |
| Liquid fossil | kg, Tonnes, Litre |
| Gaseous fossil | kg, Tonnes |
| Natural gas (special) | kg, Tonnes, m³ |
| Biomass | kg, Tonnes |

## Fuel Type Mappings

### Solid fossil:
- Anthracite, Bitumen, Brown coal, Briquettes, Coal tar, Coke oven coke, Coking coal, Gas coke, Lignite

### Liquid fossil:
- Aviation gasoline, Crude oil, Ethane, Gas/Diesel oil, Jet gasoline, Jet kerosene, Liquefied Petroleum Gases, Lubricants

### Gaseous fossil:
- Blast furnace gas, Coke oven gas, Gas works gas, Natural gas, Oxygen steel furnace gas

### Biomass:
- Biodiesels, Biogasoline, Charcoal, Landfill gas, Municipal waste, Other liquid biofuels, Other primary solid biofuels

## Technical Implementation

### Data Fetching Strategy

**Emission Factors:**
- Fetched using pagination (20 records per page)
- Avoids server limits
- Loads all factors on component mount
- Cached in component state for instant access

```typescript
// Fetch in chunks of 20
while (hasMore) {
  fetch 20 records starting at position 'start'
  add to allFactors array
  increment start by 20
  hasMore = (received 20 records)
}
```

### State Management

```typescript
// Form state
const [formData, setFormData] = useState({...});

// Emission factors (cached)
const [emissionFactors, setEmissionFactors] = useState({});

// Calculated values
const [efco2, setEfco2] = useState(0);
const [eco2, setEco2] = useState(0);
const [etco2eq, setEtco2eq] = useState(0);
```

### Real-Time Calculation

Uses React's `useEffect` to recalculate when inputs change:

```typescript
useEffect(() => {
  calculateEmissions();
}, [formData.activity_data, formData.unit_selection, efco2, efch4, efn2o]);
```

## API Integration

### Fetching Emission Factors:
```
POST /api/method/frappe.client.get_list
Body: {
  doctype: "Emission Factor Master",
  fields: [...all emission factor fields],
  limit_start: 0,
  limit_page_length: 20
}
```

### Saving Entry:
```
POST /api/resource/Stationary Emissions
Body: {
  s_no, date, fuel_type, fuel_selection,
  activity_data, unit_selection,
  efco2, efch4, ef_n2o,
  eco2, ech4, en2o, etco2eq,
  ...
}
```

### Fetching Entries:
```
POST /api/method/frappe.client.get_list
Body: {
  doctype: "Stationary Emissions",
  fields: [...],
  order_by: "date desc"
}
```

## Error Handling

- **Validation:** Checks for required fields before save
- **Network Errors:** Shows user-friendly error messages
- **Missing Factors:** Gracefully handles missing emission factors
- **File Upload:** Validates file type and size

## Future Enhancements

- [ ] Company/Unit filtering based on user role
- [ ] Edit existing entries
- [ ] Bulk import from Excel
- [ ] Export to PDF report
- [ ] Additional chart types
- [ ] Custom emission factors

## Dependencies

- **frappe-react-sdk** - For Frappe API integration
- **@mui/material** - UI components
- **recharts** - Data visualization
- **React** - Component framework

## Testing

To test the page:
1. Navigate to **GHG Calculator** → **Scope 1** → **Stationary Emissions**
2. Click **Add entry**
3. Select a fuel type and watch the dropdown populate
4. Select a fuel and watch the emission factors auto-fill
5. Enter activity data and watch emissions calculate in real-time
6. Save and verify the entry appears in the table

---

**The Stationary Emissions page is now fully functional with auto-fetching, auto-calculation, and data persistence!** 🎉

