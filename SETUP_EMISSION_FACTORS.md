# Setup Emission Factor Master - Get Real Data

## Quick Steps to Enable Real Emission Factors

### Step 1: Create the Doctype & Load Data

You already have the script! Just run it:

```bash
cd /Users/vnshkumar/Documents/Frappe-test-react/frappe-bench

# Run the emission factor master creation script
bench --site localhost execute frappe-bench/apps/climoro_onboarding/climoro_onboarding/climoro_onboarding/setup.py
```

**Or manually in Frappe console:**

```bash
cd /Users/vnshkumar/Documents/Frappe-test-react/frappe-bench
bench --site localhost console
```

Then paste the contents of:
`/Users/vnshkumar/Documents/Frappe-test-react/Scopes/Scope 1/Stationary Emissions/emission_factor_master/emission_factor_master.py`

### Step 2: Restart Frappe

```bash
cd /Users/vnshkumar/Documents/Frappe-test-react/frappe-bench
bench restart
```

### Step 3: Verify in Frappe

Visit: `http://localhost:8000/app/emission-factor-master`

You should see **73 emission factors** including:
- Liquid fossil fuels (Diesel, Petrol, Jet kerosene, etc.)
- Solid fossil fuels (Coal, Anthracite, Lignite, etc.)
- Gaseous fossil fuels (Natural gas, Refinery gas, etc.)
- Biomass fuels (Wood, Charcoal, Biodiesel, etc.)

### Step 4: Test the API

```bash
curl "http://localhost:8000/api/method/climoro_onboarding.climoro_onboarding.climoro_onboarding.api.get_emission_factors" \
  -H "Cookie: sid=YOUR_SESSION_ID"
```

### Step 5: Refresh React App

Hard refresh your browser:
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + F5`

---

## What You'll See

### Before (Fallback):
```
Console:
⚠️ Could not load emission factors from backend, using fallback values
📌 Loaded fallback emission factors (limited dataset)

Available fuels: Only 4 (Diesel, Petrol, Natural gas, Coal)
```

### After (Real Data):
```
Console:
✅ Loaded 73 emission factors from backend

Available fuels: ALL 73 fuels from IPCC database!
```

---

## Troubleshooting

### Issue: "DocType 'Emission Factor Master' does not exist"

**Solution:** Run step 1 again. The script creates the doctype.

### Issue: "Permission denied"

**Solution:** Make sure you're logged in as Administrator:
```bash
bench --site localhost set-admin-password admin
```
Then login at `http://localhost:8000` with:
- Username: `Administrator`
- Password: `admin` (or what you set)

### Issue: Still getting fallback data

**Check these:**

1. **Verify doctype exists:**
   ```bash
   cd /Users/vnshkumar/Documents/Frappe-test-react/frappe-bench
   bench --site localhost console
   ```
   ```python
   frappe.db.exists("DocType", "Emission Factor Master")
   # Should return: 'Emission Factor Master'
   ```

2. **Verify data exists:**
   ```python
   frappe.db.count("Emission Factor Master")
   # Should return: 73
   ```

3. **Check API method:**
   ```bash
   curl "http://localhost:8000/api/method/climoro_onboarding.climoro_onboarding.climoro_onboarding.api.get_emission_factors"
   ```
   Should return JSON with 73 emission factors.

4. **Check console errors:**
   Open browser developer console (F12) and look for any red errors.

---

## The Complete Fuel Database

Once loaded, you'll have access to:

### Liquid Fossil (22 fuels):
Crude oil, Orimulsion, Natural Gas Liquids, Motor gasoline, Aviation gasoline, Jet gasoline, Jet kerosene, Other kerosene, Shale oil, Gas/Diesel oil, Residual fuel oil, Liquified Petroleum Gases, Ethane, Naphtha, Bitumen, Lubricants, Petroleum coke, Refinery feedstocks, Paraffin waxes, White Spirit/SBP, Other petroleum products, Coal tar

### Solid Fossil (16 fuels):
Anthracite, Coking coal, Other bituminous coal, Sub bituminous coal, Lignite, Oil shale and tar sands, Brown coal briquettes, Patent fuel, Coke oven coke, Lignite coke, Gas coke, Peat

### Gaseous Fossil (6 fuels):
Refinery gas, Gas works gas, Coke oven gas, Blast furnace gas, Oxygen steel furnace gas, Natural gas

### Biomass (16 fuels):
Wood or Wood waste, Sulphite lyes (Black liquor), Other primary solid biomass fuels, Charcoal, Biogasoline, Biodiesels, Other liquid biofuels, Landfill gas, Sludge gas, Other biogas, Municipal wastes (Biomass fraction)

### Other/Waste (3 fuels):
Municipal waste (Non biomass fraction), Industrial wastes, Waste oils

---

## Next Steps

After setup:
1. Go to Stationary Emissions page
2. Click "Add entry"
3. Select any fuel type
4. See ALL available fuels (not just 4!)
5. Watch emission factors auto-populate
6. Save and see real calculations!

---

**Need help?** Check the Frappe error log:
```bash
cd /Users/vnshkumar/Documents/Frappe-test-react/frappe-bench
tail -f logs/frappe.log
```

