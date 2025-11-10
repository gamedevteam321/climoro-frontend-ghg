# Troubleshooting 417 Errors - Emission Factor Master

## Issue

You're seeing this error in the console:
```
GET http://localhost:8000/api/method/frappe.client.get_list?doctype=Emission+Factor+Master... 417 (EXPECTATION FAILED)
```

## What This Means

A **417 EXPECTATION FAILED** error means one of these issues:

1. **Doctype doesn't exist** - "Emission Factor Master" doctype hasn't been created in Frappe
2. **Field doesn't exist** - The fields we're requesting don't exist in the doctype
3. **Permission issue** - The current user doesn't have permission to read the doctype or specific fields
4. **Doctype not accessible via API** - The doctype isn't exposed to the REST API

## Current Workaround

The app now uses **fallback emission factors** so it works even without the backend doctype:
- ✅ Page loads and works
- ✅ You can add emissions
- ✅ Calculations work
- ⚠️ Limited to hardcoded fuels (Diesel, Petrol, Natural gas, Coal)

## Solution: Create Emission Factor Master Doctype

### Option 1: Using Frappe Desk (UI)

1. **Go to Frappe Desk**: `http://localhost:8000/app`
2. **Navigate to**: Doctype List → New Doctype
3. **Create "Emission Factor Master"** with these fields:

```
DocType Name: Emission Factor Master
Module: Climoro Onboarding

Fields:
├── fuel_type (Select)
│   Options: Solid fossil, Liquid fossil, Gaseous fossil, Biomass
├── fuel_name (Data)
├── efco2_energy (Float)
├── efch4_energy (Float)
├── efn2o_energy (Float)
├── efco2_mass (Float)
├── efch4_mass (Float)
├── efn2o_mass (Float)
├── efco2_liquid (Float)
├── efch4_liquid (Float)
├── efn2o_liquid (Float)
├── efco2_gas (Float)
├── efch4_gas (Float)
└── efn2o_gas (Float)

Permissions:
├── System Manager: Read, Write, Create, Delete
├── All: Read
└── Is REST API Exposed: ✅ YES
```

### Option 2: Using Python Script

Create a file: `frappe-bench/apps/climoro_onboarding/climoro_onboarding/setup/create_emission_factor_master.py`

```python
import frappe

def create_emission_factor_master():
    """Create Emission Factor Master doctype"""
    
    if frappe.db.exists("DocType", "Emission Factor Master"):
        print("✅ Emission Factor Master already exists")
        return
    
    doc = frappe.new_doc("DocType")
    doc.name = "Emission Factor Master"
    doc.module = "Climoro Onboarding"
    doc.custom = 0
    doc.istable = 0
    doc.issingle = 0
    doc.is_tree = 0
    doc.editable_grid = 1
    
    # Fields
    fields = [
        {"fieldname": "fuel_type", "label": "Fuel Type", "fieldtype": "Select", 
         "options": "Solid fossil\\nLiquid fossil\\nGaseous fossil\\nBiomass", "reqd": 1},
        {"fieldname": "fuel_name", "label": "Fuel Name", "fieldtype": "Data", "reqd": 1},
        {"fieldname": "efco2_energy", "label": "EFCO2 Energy", "fieldtype": "Float"},
        {"fieldname": "efch4_energy", "label": "EFCH4 Energy", "fieldtype": "Float"},
        {"fieldname": "efn2o_energy", "label": "EFN2O Energy", "fieldtype": "Float"},
        {"fieldname": "efco2_mass", "label": "EFCO2 Mass", "fieldtype": "Float"},
        {"fieldname": "efch4_mass", "label": "EFCH4 Mass", "fieldtype": "Float"},
        {"fieldname": "efn2o_mass", "label": "EFN2O Mass", "fieldtype": "Float"},
        {"fieldname": "efco2_liquid", "label": "EFCO2 Liquid", "fieldtype": "Float"},
        {"fieldname": "efch4_liquid", "label": "EFCH4 Liquid", "fieldtype": "Float"},
        {"fieldname": "efn2o_liquid", "label": "EFN2O Liquid", "fieldtype": "Float"},
        {"fieldname": "efco2_gas", "label": "EFCO2 Gas", "fieldtype": "Float"},
        {"fieldname": "efch4_gas", "label": "EFCH4 Gas", "fieldtype": "Float"},
        {"fieldname": "efn2o_gas", "label": "EFN2O Gas", "fieldtype": "Float"},
    ]
    
    for field in fields:
        doc.append("fields", field)
    
    # Permissions
    doc.append("permissions", {
        "role": "System Manager",
        "read": 1, "write": 1, "create": 1, "delete": 1
    })
    doc.append("permissions", {
        "role": "All",
        "read": 1
    })
    
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    print("✅ Emission Factor Master created successfully!")

if __name__ == "__main__":
    create_emission_factor_master()
```

**Run it:**
```bash
cd frappe-bench
bench --site localhost execute climoro_onboarding.setup.create_emission_factor_master.create_emission_factor_master
```

### Option 3: Sample Data Import

Once the doctype exists, add sample data:

```python
import frappe

def add_sample_emission_factors():
    """Add sample emission factors"""
    
    factors = [
        {
            "fuel_type": "Liquid fossil",
            "fuel_name": "Diesel",
            "efco2_mass": 3.17,
            "efch4_mass": 0.000003,
            "efn2o_mass": 0.00006,
            "efco2_liquid": 2.68,
            "efch4_liquid": 0.0000028,
            "efn2o_liquid": 0.00005,
        },
        {
            "fuel_type": "Liquid fossil",
            "fuel_name": "Petrol",
            "efco2_mass": 3.15,
            "efch4_mass": 0.000003,
            "efn2o_mass": 0.00006,
            "efco2_liquid": 2.31,
            "efch4_liquid": 0.0000025,
            "efn2o_liquid": 0.00005,
        },
        {
            "fuel_type": "Gaseous fossil",
            "fuel_name": "Natural gas",
            "efco2_mass": 2.75,
            "efch4_mass": 0.000001,
            "efn2o_mass": 0.0001,
            "efco2_gas": 1.9,
            "efch4_gas": 0.000001,
            "efn2o_gas": 0.00001,
        },
        {
            "fuel_type": "Solid fossil",
            "fuel_name": "Coal",
            "efco2_mass": 2.86,
            "efch4_mass": 0.00001,
            "efn2o_mass": 0.000015,
        },
    ]
    
    for factor_data in factors:
        if not frappe.db.exists("Emission Factor Master", {"fuel_name": factor_data["fuel_name"]}):
            doc = frappe.new_doc("Emission Factor Master")
            doc.update(factor_data)
            doc.insert(ignore_permissions=True)
            print(f"✅ Added {factor_data['fuel_name']}")
    
    frappe.db.commit()
    print("✅ Sample emission factors added!")
```

## Verify It Works

After creating the doctype:

1. **Check in Frappe**:
   ```
   http://localhost:8000/app/emission-factor-master
   ```

2. **Test API access**:
   ```bash
   curl -X GET "http://localhost:8000/api/method/frappe.client.get_list?doctype=Emission+Factor+Master&fields=%5B%22name%22,%22fuel_type%22,%22fuel_name%22%5D&limit_page_length=10" \
     -H "Cookie: sid=YOUR_SESSION_ID"
   ```

3. **Refresh your React app**:
   - Hard refresh: `Cmd+Shift+R` or `Ctrl+Shift+F5`
   - Check console: Should see `✅ Loaded X emission factors from backend`

## Alternative: Create a Whitelisted API Method

If you want more control, create a custom API:

```python
# frappe-bench/apps/climoro_onboarding/climoro_onboarding/api.py

import frappe

@frappe.whitelist()
def get_emission_factors():
    """Get all emission factors - custom API"""
    
    try:
        factors = frappe.get_all(
            "Emission Factor Master",
            fields=[
                "name",
                "fuel_type",
                "fuel_name",
                "efco2_energy",
                "efch4_energy",
                "efn2o_energy",
                "efco2_mass",
                "efch4_mass",
                "efn2o_mass",
                "efco2_liquid",
                "efch4_liquid",
                "efn2o_liquid",
                "efco2_gas",
                "efch4_gas",
                "efn2o_gas",
            ],
            limit_page_length=500
        )
        return factors
    except Exception as e:
        frappe.log_error(f"Error fetching emission factors: {str(e)}")
        return []
```

Then update the frontend to call:
```typescript
useFrappeGetCall('climoro_onboarding.api.get_emission_factors', {})
```

## Current Status

✅ **App works with fallback data**
⚠️ **Need to create Emission Factor Master doctype for full functionality**
⚠️ **417 error is expected until doctype is created**

## Questions?

The 417 error won't prevent the app from working - it just means we're using the limited fallback dataset. Once you create the Emission Factor Master doctype with real data, the full functionality will be available!

