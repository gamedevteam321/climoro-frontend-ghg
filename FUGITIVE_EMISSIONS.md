# Fugitive Emissions Page - Implementation Summary

## Overview
Created a complete Fugitive Emissions page for Scope 1 emissions tracking, focusing on refrigerant leaks and other fugitive sources.

## Features Implemented

### 1. **Data Management**
- Add new fugitive emission entries
- Delete existing entries
- Real-time data fetching from Frappe backend
- Automatic calculations of CO2 equivalent emissions

### 2. **Form Fields** (Updated to match backend)
- **S.No**: Auto-incremented serial number
- **Date**: Date picker for emission entry
- **Invoice No**: Optional invoice number field
- **Refrigerant Type**: Dropdown with options:
  - R134a
  - R404A
  - R410A
  - R407C
  - R22
  - R507
  - R717 (Ammonia)
  - R744 (CO2)
  - Other
- **GWP**: Global Warming Potential (default: 10)
- **Amount Purchased**: Quantity purchased
- **Unit Selection**: Dropdown (kg or Tonnes)
- **No. of Units**: Number of units/equipment

### 3. **Calculations**
- Formula: `ETCO2eq = Amount Purchased (A) × GWP (B) / conversion factor`
- If unit is "kg": divides by 1000 to convert to tonnes
- If unit is "Tonnes": no conversion needed
- Real-time emission preview in the form
- Automatic conversion to tCO2e

### 4. **Statistics Dashboard**
Three main KPI cards:
- **Total Emissions**: Cumulative fugitive emissions (tCO₂e)
- **This Month**: Current month emissions (tCO₂e)
- **Total Entries**: Number of recorded entries

### 5. **Data Visualization**
- Monthly emissions trend bar chart
- Shows last 6 months of data
- Interactive tooltips with formatted values

### 6. **Data Table**
Columns displayed:
- S.No
- Date
- Equipment Type
- Refrigerant (as chip)
- GWP
- Amount (kg)
- Emissions (tCO₂e) - highlighted in cyan
- Actions (delete button)

### 7. **UI/UX Features**
- Pagination (10 items per page)
- Loading states with circular progress
- Empty state messages
- Hover effects on table rows
- Confirmation dialog for deletions
- Success/error alerts using the global alert system
- Responsive design with Material-UI Grid
- Modern cyan color scheme matching the app theme

### 8. **Integration**
- Connected to Frappe backend via `Fugitive Simple` doctype
- Uses Frappe React SDK hooks for CRUD operations
- Integrated with the routing system
- Added to Scope 1 submenu in sidebar navigation

## Files Created/Modified

### Created:
1. `/src/features/fugitive/FugitiveEmissions.tsx` - Main component (650+ lines)

### Modified:
1. `/src/config/routes.config.tsx` - Added FugitiveEmissions import and route
2. `/src/layouts/MainLayout.tsx` - Scope 1 set to open by default to show fugitive option

## Backend Doctype
**Doctype Name**: `Fugitive Simple`

**Fields**:
- s_no (Int) - Serial number
- date (Date) - Entry date
- invoice_no (Data) - Optional invoice number
- upload_invoice (Attach) - Optional invoice file
- type_refrigeration (Select) - Refrigerant type
- approach_type (Data) - Default "Simple Method"
- amount_purchased (Float) - Amount purchased (A)
- no_of_units (Float) - Number of units (D)
- unit_selection (Select) - Unit (Tonnes/kg)
- gwp (Float) - Global Warming Potential (B), default 10
- etco2eq (Float) - Calculated emissions
- company (Link) - Company reference
- company_unit (Data) - Company unit

## Navigation Path
Dashboard → GHG Calculator → Scope 1 → Fugitive Emissions

## Usage
1. **Create the backend doctype** (see CREATE_FUGITIVE_DOCTYPE.md or run setup_fugitive_simple.py)
2. Click "Add entry" button
3. Fill in the form fields:
   - Optional: Enter invoice number
   - Select refrigerant type
   - Enter GWP value (default: 10)
   - Enter amount purchased
   - Select unit (kg or Tonnes)
   - Enter number of units
4. Preview the calculated emissions
5. Click "Add Entry" to save
6. View the entry in the table and charts

## Setup Instructions

### Quick Setup
Run this from your frappe-bench directory:

```bash
cd frappe-bench
bench --site localhost console
>>> exec(open('frappe-ghg-frontend/setup_fugitive_simple.py').read())
```

Or use the bench execute method:

```bash
cd frappe-bench  
bench --site localhost execute setup_fugitive_simple.create_fugitive_simple_doctype
```

### What the setup script does:
1. Creates the "Fugitive Simple" doctype with all required fields
2. Sets up proper permissions
3. Creates the database table
4. Optionally adds sample data for testing

## Technical Details
- **Framework**: React with TypeScript
- **UI Library**: Material-UI (MUI)
- **Charts**: Recharts
- **Date Handling**: date-fns with MUI DatePicker
- **State Management**: React hooks
- **API Integration**: Frappe React SDK
- **Styling**: MUI sx prop with custom theme colors

## Color Scheme
- Primary: `#00BCD4` (Cyan)
- Hover: `#008BA3` (Dark Cyan)
- Background: `#F5F7FA` (Light Gray)
- Text Primary: `#202124` (Dark Gray)
- Text Secondary: `#5F6368` (Medium Gray)
- Error: `#F44336` (Red)
- Success: `#4CAF50` (Green)
- Warning: `#FF9800` (Orange)

## Future Enhancements
- Edit functionality for existing entries
- Advanced filtering by date range, equipment type, refrigerant type
- Export to CSV/Excel
- Bulk upload via file import
- Integration with GWP Chemical doctype for auto-fetching GWP values
- Support for other fugitive emission methods (Scale Base, Screening)
- Comparison charts (year-over-year)
- Emission reduction targets and tracking

