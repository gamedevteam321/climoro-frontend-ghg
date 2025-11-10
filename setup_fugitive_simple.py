#!/usr/bin/env python3
"""
Script to create Fugitive Simple doctype in Frappe
Run this from your frappe-bench directory:
    
    cd frappe-bench
    bench --site your-site execute frappe-ghg-frontend.setup_fugitive_simple.create_fugitive_simple_doctype
    
Or if this file is standalone:
    bench --site your-site console
    >>> exec(open('/path/to/setup_fugitive_simple.py').read())
"""

import frappe

# Define the Simple Method doctype structure (from create_fugitives_doctype.py)
simple_doctype_data = {
    "name": "Fugitive Simple",
    "doctype": "DocType",
    "module": "Climoro Onboarding",
    "istable": 0,
    "issingle": 0,
    "istree": 0,
    "quick_entry": 1,
    "track_changes": 1,
    "allow_rename": 1,
    "allow_import": 1,
    "allow_export": 1,
    "allow_print": 1,
    "allow_email": 1,
    "allow_copy": 1,
    "editable_grid": 1,
    "engine": "InnoDB",
    "fields": [
        {
            "fieldname": "s_no",
            "label": "S.No",
            "fieldtype": "Int",
            "in_standard_filter": 1,
            "in_list_view": 1,
            "reqd": 1,
            "idx": 1
        },
        {
            "fieldname": "date",
            "label": "Date",
            "fieldtype": "Date",
            "in_standard_filter": 1,
            "in_list_view": 1,
            "reqd": 1,
            "idx": 2
        },
        {
            "fieldname": "invoice_no",
            "label": "Invoice No",
            "fieldtype": "Data",
            "in_standard_filter": 1,
            "description": "TEXT FIELD",
            "idx": 3
        },
        {
            "fieldname": "upload_invoice",
            "label": "Upload Invoice",
            "fieldtype": "Attach",
            "description": "Upload docs",
            "idx": 4
        },
        {
            "fieldname": "type_refrigeration",
            "label": "Type of Refrigeration",
            "fieldtype": "Select",
            "options": "R134a\nR404A\nR410A\nR407C\nR22\nR507\nR717 (Ammonia)\nR744 (CO2)\nOther",
            "in_standard_filter": 1,
            "in_list_view": 1,
            "reqd": 1,
            "description": "DATA to be provided (Drop DOWN)",
            "idx": 5
        },
        {
            "fieldname": "approach_type",
            "label": "Approach Type",
            "fieldtype": "Data",
            "default": "Simple Method",
            "read_only": 1,
            "idx": 6
        },
        {
            "fieldname": "amount_purchased",
            "label": "Amount Purchased (A)",
            "fieldtype": "Float",
            "in_standard_filter": 1,
            "reqd": 1,
            "idx": 7
        },
        {
            "fieldname": "no_of_units",
            "label": "No of Units (D)",
            "fieldtype": "Float",
            "in_standard_filter": 1,
            "reqd": 1,
            "idx": 8
        },
        {
            "fieldname": "unit_selection",
            "label": "Unit Selection",
            "fieldtype": "Select",
            "options": "Tonnes\nkg",
            "in_standard_filter": 1,
            "reqd": 1,
            "idx": 9
        },
        {
            "fieldname": "gwp",
            "label": "GWP (B)",
            "fieldtype": "Float",
            "in_standard_filter": 1,
            "reqd": 1,
            "default": 10,
            "description": "Data to be provided (Constant Assume 10)",
            "idx": 10
        },
        {
            "fieldname": "etco2eq",
            "label": "ETCO2eq",
            "fieldtype": "Float",
            "in_standard_filter": 1,
            "in_list_view": 1,
            "read_only": 1,
            "description": "Formula = A*B / (Only applicable to convert in to unit type form kg to Tonnes)",
            "idx": 11
        },
        {
            "fieldname": "section_break_company",
            "label": "Company Details",
            "fieldtype": "Section Break",
            "idx": 12
        },
        {
            "fieldname": "company",
            "label": "Company",
            "fieldtype": "Link",
            "options": "Company",
            "idx": 13
        },
        {
            "fieldname": "company_unit",
            "label": "Company Unit",
            "fieldtype": "Data",
            "idx": 14
        },
    ],
    "permissions": [
        {
            "role": "System Manager",
            "read": 1,
            "write": 1,
            "create": 1,
            "delete": 1,
            "submit": 0,
            "cancel": 0,
            "amend": 0,
            "report": 1,
            "export": 1,
            "share": 1,
            "print": 1,
            "email": 1
        },
        {
            "role": "All",
            "read": 1,
            "write": 1,
            "create": 1,
            "delete": 1,
            "submit": 0,
            "cancel": 0,
            "amend": 0,
            "report": 1,
            "export": 1,
            "share": 1,
            "print": 1,
            "email": 1
        }
    ]
}

def create_fugitive_simple_doctype():
    """Create Fugitive Simple doctype"""
    try:
        # Check if doctype already exists
        if frappe.db.exists("DocType", "Fugitive Simple"):
            print("✅ Fugitive Simple doctype already exists!")
            return True
        
        print("Creating Fugitive Simple doctype...")
        
        # Create new doctype
        doc = frappe.new_doc("DocType")
        
        # Set basic properties
        for key, value in simple_doctype_data.items():
            if key not in ["fields", "permissions"]:
                setattr(doc, key, value)
        
        # Add fields
        for field_data in simple_doctype_data["fields"]:
            doc.append("fields", field_data)
        
        # Add permissions
        for perm_data in simple_doctype_data["permissions"]:
            doc.append("permissions", perm_data)
        
        # Save the doctype
        doc.save(ignore_permissions=True)
        
        # Create the database table
        doc.create_table()
        
        # Commit the transaction
        frappe.db.commit()
        
        print("=" * 70)
        print("✅ Fugitive Simple doctype created successfully!")
        print("=" * 70)
        print("\n📋 DOCTYPE DETAILS:")
        print("Name: Fugitive Simple")
        print("Module: Climoro Onboarding")
        print("\n📝 FIELDS:")
        print("  1. s_no (Int) - Serial number")
        print("  2. date (Date) - Entry date")
        print("  3. invoice_no (Data) - Optional invoice number")
        print("  4. upload_invoice (Attach) - Optional invoice file")
        print("  5. type_refrigeration (Select) - Refrigerant type")
        print("     Options: R134a, R404A, R410A, R407C, R22, R507, R717 (Ammonia), R744 (CO2), Other")
        print("  6. approach_type (Data) - Default: 'Simple Method'")
        print("  7. amount_purchased (Float) - Amount purchased (A)")
        print("  8. no_of_units (Float) - Number of units (D)")
        print("  9. unit_selection (Select) - Unit (Tonnes/kg)")
        print(" 10. gwp (Float) - Global Warming Potential (B), Default: 10")
        print(" 11. etco2eq (Float) - Calculated emissions (A × B / conversion)")
        print(" 12. company (Link) - Company reference")
        print(" 13. company_unit (Data) - Company unit")
        
        print("\n🧮 CALCULATION FORMULA:")
        print("  ETCO2eq = Amount Purchased (A) × GWP (B) / conversion factor")
        print("  - If unit is 'kg': divide by 1000 to convert to tonnes")
        print("  - If unit is 'Tonnes': no conversion needed")
        
        print("\n✅ Next Steps:")
        print("  1. Refresh your React app (Cmd+Shift+R)")
        print("  2. Navigate to: GHG Calculator → Scope 1 → Fugitive Emissions")
        print("  3. The page should now work without 417 errors!")
        print("  4. You can view the doctype at: http://localhost:8000/app/fugitive-simple")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating Fugitive Simple doctype: {e}")
        frappe.db.rollback()
        import traceback
        traceback.print_exc()
        return False

def add_sample_data():
    """Add sample fugitive emission data"""
    try:
        if not frappe.db.exists("DocType", "Fugitive Simple"):
            print("❌ Fugitive Simple doctype doesn't exist. Create it first.")
            return False
        
        print("\nAdding sample data...")
        
        # Sample data with different refrigerants
        samples = [
            {
                "s_no": 1,
                "date": "2024-01-15",
                "invoice_no": "INV-001",
                "type_refrigeration": "R134a",
                "approach_type": "Simple Method",
                "amount_purchased": 10.5,
                "no_of_units": 1,
                "unit_selection": "kg",
                "gwp": 1430,
                "etco2eq": (10.5 * 1430) / 1000,  # kg to tonnes
            },
            {
                "s_no": 2,
                "date": "2024-02-20",
                "invoice_no": "INV-002",
                "type_refrigeration": "R410A",
                "approach_type": "Simple Method",
                "amount_purchased": 0.025,
                "no_of_units": 3,
                "unit_selection": "Tonnes",
                "gwp": 2088,
                "etco2eq": 0.025 * 2088,  # Already in tonnes
            },
            {
                "s_no": 3,
                "date": "2024-03-10",
                "invoice_no": "INV-003",
                "type_refrigeration": "R717 (Ammonia)",
                "approach_type": "Simple Method",
                "amount_purchased": 50.0,
                "no_of_units": 2,
                "unit_selection": "kg",
                "gwp": 0,  # Ammonia has no GWP
                "etco2eq": 0,
            },
        ]
        
        count = 0
        for sample in samples:
            if not frappe.db.exists("Fugitive Simple", {"s_no": sample["s_no"]}):
                doc = frappe.new_doc("Fugitive Simple")
                doc.update(sample)
                doc.insert(ignore_permissions=True)
                print(f"  ✅ Added: {sample['type_refrigeration']} - {sample['amount_purchased']} {sample['unit_selection']}")
                count += 1
        
        frappe.db.commit()
        
        if count > 0:
            print(f"\n✅ Added {count} sample entries!")
        else:
            print("\n⚠️ Sample data already exists.")
        
        return True
        
    except Exception as e:
        print(f"❌ Error adding sample data: {e}")
        frappe.db.rollback()
        return False

if __name__ == "__main__":
    print("=" * 70)
    print("FUGITIVE SIMPLE DOCTYPE SETUP")
    print("=" * 70)
    
    # Create doctype
    success = create_fugitive_simple_doctype()
    
    # Optionally add sample data
    if success:
        print("\n" + "=" * 70)
        add_choice = input("Do you want to add sample data? (y/n): ")
        if add_choice.lower() == 'y':
            add_sample_data()
    
    print("\n" + "=" * 70)
    print("SETUP COMPLETE!")
    print("=" * 70)

