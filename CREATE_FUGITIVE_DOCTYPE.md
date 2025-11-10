# Create Fugitive Simple Doctype

## Issue
You're seeing this error:
```
GET http://localhost:5174/api/method/frappe.client.get_list?doctype=Fugitive+Simple... 417 (EXPECTATION FAILED)
```

This means the **Fugitive Simple** doctype doesn't exist in your Frappe backend yet.

## Solution: Create the Doctype

### Option 1: Python Script (Recommended)

Create this file in your Frappe bench:
`frappe-bench/apps/climoro_onboarding/climoro_onboarding/setup/create_fugitive_simple.py`

```python
import frappe

def create_fugitive_simple_doctype():
    """Create Fugitive Simple doctype for refrigerant emissions tracking"""
    
    if frappe.db.exists("DocType", "Fugitive Simple"):
        print("✅ Fugitive Simple doctype already exists")
        return
    
    doc = frappe.new_doc("DocType")
    doc.name = "Fugitive Simple"
    doc.module = "Climoro Onboarding"
    doc.custom = 0
    doc.istable = 0
    doc.issingle = 0
    doc.is_tree = 0
    doc.editable_grid = 1
    doc.track_changes = 1
    doc.autoname = "autoincrement"
    
    # Add fields
    fields = [
        {
            "fieldname": "s_no",
            "label": "S.No",
            "fieldtype": "Int",
            "in_list_view": 1,
            "reqd": 1,
            "idx": 1
        },
        {
            "fieldname": "date",
            "label": "Date",
            "fieldtype": "Date",
            "in_list_view": 1,
            "reqd": 1,
            "idx": 2
        },
        {
            "fieldname": "equipment_selection",
            "label": "Refrigeration Equipment Selection",
            "fieldtype": "Select",
            "options": "Commercial Refrigeration\\nIndustrial Refrigeration\\nAir Conditioning Systems\\nHeat Pumps\\nTransport Refrigeration\\nMarine Refrigeration\\nOther",
            "in_list_view": 1,
            "reqd": 1,
            "idx": 3
        },
        {
            "fieldname": "type_refrigeration",
            "label": "Type of Refrigerant",
            "fieldtype": "Select",
            "options": "R134a\\nR404A\\nR410A\\nR407C\\nR22\\nR507\\nR717 (Ammonia)\\nR744 (CO2)\\nOther",
            "in_list_view": 1,
            "reqd": 1,
            "idx": 4
        },
        {
            "fieldname": "gwp_refrigeration",
            "label": "GWP (Global Warming Potential)",
            "fieldtype": "Float",
            "in_list_view": 1,
            "reqd": 1,
            "precision": 2,
            "idx": 5
        },
        {
            "fieldname": "amount_purchased",
            "label": "Amount Purchased (kg)",
            "fieldtype": "Float",
            "in_list_view": 1,
            "reqd": 1,
            "precision": 2,
            "idx": 6
        },
        {
            "fieldname": "etco2eq",
            "label": "Total CO2 Equivalent (tCO2e)",
            "fieldtype": "Float",
            "in_list_view": 1,
            "read_only": 1,
            "precision": 4,
            "description": "Calculated as: Amount Purchased × GWP",
            "idx": 7
        },
        {
            "fieldname": "section_break_company",
            "label": "Company Details",
            "fieldtype": "Section Break",
            "idx": 8
        },
        {
            "fieldname": "company",
            "label": "Company",
            "fieldtype": "Link",
            "options": "Company",
            "idx": 9
        },
        {
            "fieldname": "company_unit",
            "label": "Company Unit",
            "fieldtype": "Data",
            "idx": 10
        },
    ]
    
    for field in fields:
        doc.append("fields", field)
    
    # Add permissions
    doc.append("permissions", {
        "role": "System Manager",
        "read": 1,
        "write": 1,
        "create": 1,
        "delete": 1,
        "submit": 0,
        "cancel": 0,
        "amend": 0
    })
    
    doc.append("permissions", {
        "role": "All",
        "read": 1,
        "write": 0,
        "create": 0,
        "delete": 0
    })
    
    try:
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
        print("✅ Fugitive Simple doctype created successfully!")
        print("\n📋 FIELDS CREATED:")
        print("  • s_no (Int) - Serial number")
        print("  • date (Date) - Entry date")
        print("  • equipment_selection (Select) - Equipment type")
        print("  • type_refrigeration (Select) - Refrigerant type")
        print("  • gwp_refrigeration (Float) - Global Warming Potential")
        print("  • amount_purchased (Float) - Amount in kg")
        print("  • etco2eq (Float) - Calculated emissions")
        print("  • company (Link) - Company reference")
        print("  • company_unit (Data) - Company unit")
        
    except Exception as e:
        print(f"❌ Error creating doctype: {str(e)}")
        frappe.db.rollback()

def add_sample_data():
    """Add sample fugitive emission data"""
    
    if not frappe.db.exists("DocType", "Fugitive Simple"):
        print("❌ Fugitive Simple doctype doesn't exist. Create it first.")
        return
    
    # Sample data
    samples = [
        {
            "s_no": 1,
            "date": "2024-01-15",
            "equipment_selection": "Commercial Refrigeration",
            "type_refrigeration": "R134a",
            "gwp_refrigeration": 1430,
            "amount_purchased": 5.5,
            "etco2eq": 5.5 * 1430 / 1000,  # Convert to tCO2e
        },
        {
            "s_no": 2,
            "date": "2024-02-20",
            "equipment_selection": "Air Conditioning Systems",
            "type_refrigeration": "R410A",
            "gwp_refrigeration": 2088,
            "amount_purchased": 12.0,
            "etco2eq": 12.0 * 2088 / 1000,
        },
        {
            "s_no": 3,
            "date": "2024-03-10",
            "equipment_selection": "Industrial Refrigeration",
            "type_refrigeration": "R717 (Ammonia)",
            "gwp_refrigeration": 0,
            "amount_purchased": 25.0,
            "etco2eq": 0,
        },
    ]
    
    for sample in samples:
        if not frappe.db.exists("Fugitive Simple", {"s_no": sample["s_no"]}):
            doc = frappe.new_doc("Fugitive Simple")
            doc.update(sample)
            doc.insert(ignore_permissions=True)
            print(f"✅ Added sample entry: {sample['equipment_selection']} - {sample['type_refrigeration']}")
    
    frappe.db.commit()
    print("\n✅ Sample data added successfully!")

if __name__ == "__main__":
    create_fugitive_simple_doctype()
    # Uncomment to add sample data:
    # add_sample_data()
```

**Run it:**
```bash
cd frappe-bench
bench --site localhost execute climoro_onboarding.setup.create_fugitive_simple.create_fugitive_simple_doctype

# Optionally add sample data:
bench --site localhost execute climoro_onboarding.setup.create_fugitive_simple.add_sample_data
```

### Option 2: Manual Creation in Frappe Desk

1. Go to: `http://localhost:8000/app`
2. Search for "DocType List"
3. Click "New"
4. Fill in:
   - **Name**: `Fugitive Simple`
   - **Module**: `Climoro Onboarding`

5. Add these fields:

| Field Name | Label | Type | Options | Required |
|------------|-------|------|---------|----------|
| s_no | S.No | Int | - | Yes |
| date | Date | Date | - | Yes |
| equipment_selection | Equipment Type | Select | See below | Yes |
| type_refrigeration | Refrigerant Type | Select | See below | Yes |
| gwp_refrigeration | GWP | Float | - | Yes |
| amount_purchased | Amount (kg) | Float | - | Yes |
| etco2eq | Emissions (tCO2e) | Float | - | No (calculated) |
| company | Company | Link | Company | No |
| company_unit | Unit | Data | - | No |

**Equipment Selection Options:**
```
Commercial Refrigeration
Industrial Refrigeration
Air Conditioning Systems
Heat Pumps
Transport Refrigeration
Marine Refrigeration
Other
```

**Refrigerant Type Options:**
```
R134a
R404A
R410A
R407C
R22
R507
R717 (Ammonia)
R744 (CO2)
Other
```

6. **Add Permissions**:
   - System Manager: All permissions
   - All: Read

7. Click **Save**

### Option 3: Quick JSON Import

Save this as `fugitive_simple.json`:

```json
{
  "doctype": "DocType",
  "name": "Fugitive Simple",
  "module": "Climoro Onboarding",
  "autoname": "autoincrement",
  "fields": [
    {"fieldname": "s_no", "label": "S.No", "fieldtype": "Int", "reqd": 1},
    {"fieldname": "date", "label": "Date", "fieldtype": "Date", "reqd": 1},
    {"fieldname": "equipment_selection", "label": "Equipment Type", "fieldtype": "Select", 
     "options": "Commercial Refrigeration\\nIndustrial Refrigeration\\nAir Conditioning Systems\\nHeat Pumps\\nTransport Refrigeration\\nMarine Refrigeration\\nOther", "reqd": 1},
    {"fieldname": "type_refrigeration", "label": "Refrigerant Type", "fieldtype": "Select",
     "options": "R134a\\nR404A\\nR410A\\nR407C\\nR22\\nR507\\nR717 (Ammonia)\\nR744 (CO2)\\nOther", "reqd": 1},
    {"fieldname": "gwp_refrigeration", "label": "GWP", "fieldtype": "Float", "reqd": 1},
    {"fieldname": "amount_purchased", "label": "Amount (kg)", "fieldtype": "Float", "reqd": 1},
    {"fieldname": "etco2eq", "label": "Emissions (tCO2e)", "fieldtype": "Float", "read_only": 1}
  ]
}
```

Then import:
```bash
cd frappe-bench
bench --site localhost import-doc fugitive_simple.json
```

## Refrigerant GWP Reference Values

Common refrigerants and their Global Warming Potentials:

| Refrigerant | GWP (AR6) | Common Use |
|-------------|-----------|------------|
| R134a | 1,430 | Auto AC, Commercial refrigeration |
| R404A | 3,922 | Commercial refrigeration |
| R410A | 2,088 | Residential & commercial AC |
| R407C | 1,774 | Commercial AC |
| R22 | 1,810 | Legacy AC systems (being phased out) |
| R507 | 3,985 | Low-temperature refrigeration |
| R717 (Ammonia) | 0 | Industrial refrigeration |
| R744 (CO2) | 1 | Natural refrigerant |

## Verify It Works

After creating the doctype:

1. **Check in Frappe**:
   ```
   http://localhost:8000/app/fugitive-simple
   ```

2. **Test the frontend**:
   - Refresh your React app (Cmd+Shift+R)
   - Navigate to: GHG Calculator → Scope 1 → Fugitive Emissions
   - The 417 error should be gone
   - You should see "No emissions data found" instead

3. **Add a test entry**:
   - Click "Add entry"
   - Fill in the form
   - Click "Add Entry"
   - Entry should appear in the table

## Calculation Formula

The emissions are calculated as:
```
ETCO2eq (tCO2e) = Amount Purchased (kg) × GWP / 1000
```

Example:
- Amount: 10 kg of R134a
- GWP: 1,430
- Emissions: 10 × 1,430 / 1000 = 14.3 tCO2e

## Current Status

✅ **Frontend page created and ready**
⚠️ **Backend doctype needed** - Follow steps above
✅ **Error handling added** - Page shows helpful message instead of breaking

## Questions?

Once you create the doctype, the page will work perfectly! The frontend is ready to go.

