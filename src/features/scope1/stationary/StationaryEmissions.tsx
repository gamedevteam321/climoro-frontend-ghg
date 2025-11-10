import React, { useState, useEffect } from 'react';
import { useFrappeGetCall, useFrappeCreateDoc, useFrappeDeleteDoc, useFrappeAuth, useFrappeFileUpload, useFrappeUpdateDoc } from 'frappe-react-sdk';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AttachFile as AttachIcon,
  OpenInNew as OpenIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  BarChart as BarChartIcon,
  LocalFireDepartment as FireIcon,
  Assignment as EntryIcon,
} from '@mui/icons-material';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { showAlert } from '../../../components/ui/AlertContainer';
import Pagination from '../../../components/ui/Pagination';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface StationaryEmission {
  name: string;
  s_no?: number;
  date: string;
  invoice_no?: string;
  upload_invoice?: string;
  fuel_type: string;
  fuel_selection: string;
  activity_types: string;
  activity_data: number;
  unit_selection: string;
  company?: string;
  company_unit?: string;
  efco2?: number;
  efch4?: number;
  efn20?: number;
  eco2?: number;
  ech4?: number;
  en2o?: number;
  etco2eq: number;
}

interface EmissionFactor {
  fuel_type: string;
  fuel_name: string;
  efco2_energy?: number;
  efch4_energy?: number;
  efn20_energy?: number;  // Backend uses efn20, not efn2o
  efco2_mass?: number;
  efch4_mass?: number;
  efn20_mass?: number;
  efco2_liquid?: number;
  efch4_liquid?: number;
  efn20_liquid?: number;
  efco2_gas?: number;
  efch4_gas?: number;
  efn20_gas?: number;
}

interface FormData {
  s_no: number;
  date: string;
  invoice_no: string;
  fuel_type: string;
  fuel_selection: string;
  activity_types: string;
  activity_data: string;
  unit_selection: string;
  company: string;
  company_unit: string;
}

// Fuel type mappings
// Removed hardcoded fuelTypeMappings - will use dynamic data from emissionFactors

export default function StationaryEmissions() {
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<StationaryEmission | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [emissionFactors, setEmissionFactors] = useState<{ [key: string]: { [key: string]: EmissionFactor } }>({});
  const [nextSerialNo, setNextSerialNo] = useState(1);
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    recordName: '',
  });
  
  // Chart filter states
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'stacked'>('line');

  const [formData, setFormData] = useState<FormData>({
    s_no: 1,
    date: new Date().toISOString().split('T')[0],
    invoice_no: '',
    fuel_type: '',
    fuel_selection: '',
    activity_types: '',
    activity_data: '',
    unit_selection: '',
    company: '',
    company_unit: '',
  });

  // Calculated fields
  const [efco2, setEfco2] = useState<number>(0);
  const [efch4, setEfch4] = useState<number>(0);
  const [efn2o, setEfn2o] = useState<number>(0);
  const [eco2, setEco2] = useState<number>(0);
  const [ech4, setEch4] = useState<number>(0);
  const [en2o, setEn2o] = useState<number>(0);
  const [etco2eq, setEtco2eq] = useState<number>(0);

  const { createDoc } = useFrappeCreateDoc();
  const { deleteDoc } = useFrappeDeleteDoc();
  const { updateDoc } = useFrappeUpdateDoc();
  const { currentUser } = useFrappeAuth();
  const { upload } = useFrappeFileUpload();

  // Fetch current user's company from User doctype
  const { data: currentUserData } = useFrappeGetCall<{ message: { company?: string; name: string } }>(
    currentUser ? 'frappe.client.get' : '',
    currentUser ? {
      doctype: 'User',
      name: currentUser,
    } : undefined,
    currentUser ? `current-user-company-${currentUser}` : null,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const userCompany = currentUserData?.message?.company || 'Default Company';

  // Update form company when userCompany changes
  useEffect(() => {
    if (userCompany) {
      console.log('Setting company to:', userCompany);
      setFormData(prev => ({ ...prev, company: userCompany }));
    }
  }, [userCompany]);

  // Fetch units based on user's company from Units doctype
  const { data: unitsData } = useFrappeGetCall<{ message: Array<{ name: string; unit_name?: string; [key: string]: any }> }>(
    userCompany ? 'frappe.client.get_list' : '',
    userCompany ? {
      doctype: 'Units',
      fields: ['*'], // Get all fields to see what's available
      filters: userCompany !== 'Default Company' ? [['company', '=', userCompany]] : [],
      limit_page_length: 100,
    } : undefined,
    userCompany ? `company-units-${userCompany}` : null,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const companyUnits = unitsData?.message || [];

  // Fetch stationary emissions data - start with minimal fields, then try to get emission factors
  const { data: stationaryData, isLoading, error, mutate } = useFrappeGetCall<{
    message: StationaryEmission[];
  }>(
    'frappe.client.get_list',
    {
      doctype: 'Stationary Emissions',
      fields: ['*'], // Request all fields to get whatever exists
      order_by: 'date desc',
      limit_page_length: 100,
    },
    'stationary-emissions-list',
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const emissions = stationaryData?.message || [];

  // Fetch emission factors using frappe.client.get_list (built-in API) to bypass module caching issues
  const { data: emissionFactorData } = useFrappeGetCall<{ message: EmissionFactor[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Emission Factor Master',
      fields: ['name', 'fuel_type', 'fuel_name', 'efco2', 'efch4', 'efn20', 'efco2_energy', 'efch4_energy', 'efn20_energy', 'efco2_mass', 'efch4_mass', 'efn20_mass', 'efco2_liquid', 'efch4_liquid', 'efn20_liquid', 'efco2_gas', 'efch4_gas', 'efn20_gas'],
      order_by: 'fuel_type, fuel_name',
      limit_page_length: 500,
    },
    'emission-factors',
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Organize emission factors when data changes
  useEffect(() => {
    if (emissionFactorData?.message && emissionFactorData.message.length > 0) {
      console.log('📥 Emission Factor Data loaded:', emissionFactorData.message.length, 'records');
      const organized: { [key: string]: { [key: string]: EmissionFactor } } = {};
      emissionFactorData.message.forEach((factor) => {
        if (!organized[factor.fuel_type]) {
          organized[factor.fuel_type] = {};
        }
        organized[factor.fuel_type][factor.fuel_name] = factor;
      });
      console.log('📦 Organized factors by fuel type:', Object.keys(organized));
      setEmissionFactors(organized);
    } else {
      console.warn('⚠️ No emission factor data received');
      setEmissionFactors({});
    }
  }, [emissionFactorData]);

  // Update serial number when emissions change
  useEffect(() => {
    if (emissions.length > 0) {
      const maxSerialNo = Math.max(...emissions.map(e => e.s_no || 0));
      setNextSerialNo(maxSerialNo + 1);
      setFormData(prev => ({ ...prev, s_no: maxSerialNo + 1 }));
    }
  }, [emissions]);

  // Get emission factors based on fuel selection and unit
  const getFactorsForFuel = (fuelType: string, fuelName: string, unit: string) => {
    console.log('🔍 getFactorsForFuel called:', { fuelType, fuelName, unit });
    console.log('📚 Available emission factors:', Object.keys(emissionFactors));
    
    const factors = emissionFactors[fuelType]?.[fuelName];
    if (!factors) {
      console.warn('❌ No factors found for:', { fuelType, fuelName });
      console.log('Available fuels for', fuelType, ':', emissionFactors[fuelType] ? Object.keys(emissionFactors[fuelType]) : 'none');
      return { efco2: 0, efch4: 0, efn2o: 0 };
    }

    console.log('✅ Found factors:', factors);

    // Select appropriate factors based on unit
    if (unit === 'kg' || unit === 'Tonnes') {
      const result = {
        efco2: factors.efco2_mass || 0,
        efch4: factors.efch4_mass || 0,
        efn2o: factors.efn20_mass || 0,
      };
      console.log('📊 Returning mass-based factors:', result);
      return result;
    } else if (unit === 'Litre') {
      const result = {
        efco2: factors.efco2_liquid || 0,
        efch4: factors.efch4_liquid || 0,
        efn2o: factors.efn20_liquid || 0,
      };
      console.log('📊 Returning liquid-based factors:', result);
      return result;
    } else if (unit === 'm³') {
      const result = {
        efco2: factors.efco2_gas || 0,
        efch4: factors.efch4_gas || 0,
        efn2o: factors.efn20_gas || 0,
      };
      console.log('📊 Returning gas-based factors:', result);
      return result;
    }

    // Default to energy-based
    const result = {
      efco2: factors.efco2_energy || 0,
      efch4: factors.efch4_energy || 0,
      efn2o: factors.efn20_energy || 0,
    };
    console.log('📊 Returning energy-based factors:', result);
    return result;
  };

  // Auto-populate emission factors when fuel type, selection, and unit are all set
  useEffect(() => {
    console.log('🔄 useEffect triggered - Form data:', {
      fuel_type: formData.fuel_type,
      fuel_selection: formData.fuel_selection,
      unit_selection: formData.unit_selection,
      hasEmissionFactors: Object.keys(emissionFactors).length > 0
    });
    
    if (formData.fuel_type && formData.fuel_selection && formData.unit_selection) {
      console.log('✅ All fields set, calling getFactorsForFuel...');
      const factors = getFactorsForFuel(
        formData.fuel_type,
        formData.fuel_selection,
        formData.unit_selection
      );
      
      console.log('🎯 Setting state with factors:', factors);
      setEfco2(factors.efco2);
      setEfch4(factors.efch4);
      setEfn2o(factors.efn2o);
    } else {
      console.log('⏸️ Not all fields set yet, skipping factor fetch');
    }
  }, [formData.fuel_type, formData.fuel_selection, formData.unit_selection, emissionFactors]);

  // Calculate emissions when activity data, unit, or factors change
  useEffect(() => {
    const activityData = parseFloat(formData.activity_data) || 0;
    const unit = formData.unit_selection;

    if (activityData > 0 && unit && efco2 > 0) {
      let calculatedEco2, calculatedEch4, calculatedEn2o;

      if (unit === 'kg' || unit === 'Tonnes') {
        const massMultiplier = unit === 'kg' ? 0.001 : 1;
        calculatedEco2 = activityData * efco2 * massMultiplier;
        calculatedEch4 = activityData * efch4 * massMultiplier;
        calculatedEn2o = activityData * efn2o * massMultiplier;
      } else if (unit === 'Litre' || unit === 'm³') {
        calculatedEco2 = activityData * efco2;
        calculatedEch4 = activityData * efch4;
        calculatedEn2o = activityData * efn2o;
      } else {
        calculatedEco2 = (activityData * efco2) / 1000;
        calculatedEch4 = (activityData * efch4) / 1000;
        calculatedEn2o = (activityData * efn2o) / 1000;
      }

      // GWP: CO2 = 1, CH4 = 25, N2O = 298
      const calculatedEtco2eq = calculatedEco2 + calculatedEch4 * 25 + calculatedEn2o * 298;

      setEco2(calculatedEco2);
      setEch4(calculatedEch4);
      setEn2o(calculatedEn2o);
      setEtco2eq(calculatedEtco2eq);
    } else {
      setEco2(0);
      setEch4(0);
      setEn2o(0);
      setEtco2eq(0);
    }
  }, [formData.activity_data, formData.unit_selection, efco2, efch4, efn2o]);

  // Handle fuel type change
  const handleFuelTypeChange = (value: string) => {
    console.log('🔥 Fuel type changed to:', value);
    setFormData({
      ...formData,
      fuel_type: value,
      fuel_selection: '',
      unit_selection: '',
    });
    // Reset emission factors when fuel type changes
    setEfco2(0);
    setEfch4(0);
    setEfn2o(0);
  };

  // Handle fuel selection change - auto-populate factors
  const handleFuelSelectionChange = (value: string) => {
    console.log('⛽ Fuel selection changed to:', value);
    setFormData({
      ...formData,
      fuel_selection: value,
    });
  };

  // Handle unit selection change - update factors
  const handleUnitChange = (value: string) => {
    console.log('📏 Unit changed to:', value);
    setFormData({
      ...formData,
      unit_selection: value,
    });
    // Emission factors will be auto-updated by useEffect
  };

  // Get available fuel types from emission factors (dynamic)
  const getAvailableFuelTypes = () => {
    return Object.keys(emissionFactors).sort();
  };

  // Get available fuels for selected fuel type from emission factors (dynamic)
  const getAvailableFuels = (fuelType: string) => {
    if (!fuelType || !emissionFactors[fuelType]) return [];
    return Object.keys(emissionFactors[fuelType]).sort();
  };

  // Get available units for selected fuel
  const getAvailableUnits = () => {
    if (formData.fuel_selection === 'Natural gas') {
      return ['kg', 'Tonnes', 'm³'];
    }
    if (formData.fuel_type === 'Solid fossil' || formData.fuel_type === 'Biomass') {
      return ['kg', 'Tonnes'];
    }
    if (formData.fuel_type === 'Liquid fossil') {
      return ['kg', 'Tonnes', 'Litre'];
    }
    if (formData.fuel_type === 'Gaseous fossil') {
      return ['kg', 'Tonnes'];
    }
    return ['kg', 'Tonnes', 'Litre', 'm³'];
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      s_no: nextSerialNo,
      date: new Date().toISOString().split('T')[0],
      invoice_no: '',
      fuel_type: '',
      fuel_selection: '',
      activity_types: '',
      activity_data: '',
      unit_selection: '',
      company: userCompany,
      company_unit: '',
    });
    setSelectedFile(null);
    setEfco2(0);
    setEfch4(0);
    setEfn2o(0);
    setEco2(0);
    setEch4(0);
    setEn2o(0);
    setEtco2eq(0);
  };

  const handleSave = async () => {
    try {
      // Validate required fields (company_unit is only required if units are available)
      if (!formData.date || !formData.fuel_type || !formData.fuel_selection || 
          !formData.activity_types || !formData.activity_data || !formData.unit_selection ||
          (companyUnits.length > 0 && !formData.company_unit)) {
        showAlert({
          type: 'error',
          message: 'Please fill all required fields',
        });
        return;
      }

      // First create the document without the file
      const newDoc = await createDoc('Stationary Emissions', {
        s_no: formData.s_no,
        date: formData.date,
        invoice_no: formData.invoice_no || 'N/A',
        fuel_type: formData.fuel_type,
        fuel_selection: formData.fuel_selection,
        activity_types: formData.activity_types,
        activity_data: parseFloat(formData.activity_data),
        unit_selection: formData.unit_selection,
        company: formData.company,
        company_unit: formData.company_unit || 'Default Unit',
        efco2: efco2,
        efch4: efch4,
        efn20: efn2o,
        eco2: eco2,
        ech4: ech4,
        en2o: en2o,
        etco2eq: etco2eq,
      });

      // If file is selected, upload it and attach to the document
      if (selectedFile && newDoc?.name) {
        try {
          const uploadResult = await upload(selectedFile, {
            isPrivate: false,
            folder: 'Home',
            doctype: 'Stationary Emissions',
            docname: newDoc.name,
            fieldname: 'upload_invoice',
          });
          
          // Update the document with the file URL
          if (uploadResult?.file_url) {
            await updateDoc('Stationary Emissions', newDoc.name, {
              upload_invoice: uploadResult.file_url,
            });
          }
        } catch (uploadError: any) {
          console.warn('File upload error:', uploadError);
          // Document is already created, just show warning about file
          showAlert({
            type: 'warning',
            message: 'Entry saved but invoice file upload failed',
          });
        }
      }

      showAlert({
        type: 'success',
        message: 'Entry saved successfully!',
      });

      handleCloseDialog();
      mutate(); // Refresh the list
      setNextSerialNo(nextSerialNo + 1);
    } catch (error: any) {
      console.error('Error saving entry:', error);
      showAlert({
        type: 'error',
        message: error?.message || 'Failed to save entry',
      });
    }
  };

  const handleDeleteClick = (name: string) => {
    setConfirmDialog({
      open: true,
      recordName: name,
    });
  };

  const handleConfirmDelete = async () => {
    const nameToDelete = confirmDialog.recordName;
    setConfirmDialog({ open: false, recordName: '' });
    
    try {
      console.log('🗑️ Deleting entry:', nameToDelete);
      await deleteDoc('Stationary Emissions', nameToDelete);
      console.log('✅ Entry deleted successfully');
      showAlert({
        type: 'success',
        message: 'Entry deleted successfully!',
      });
      mutate();
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      showAlert({
        type: 'error',
        message: error?.message || 'Failed to delete entry',
      });
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ open: false, recordName: '' });
  };

  // Handle invoice viewing - open in new tab with download fallback
  const handleViewInvoice = (fileUrl: string) => {
    try {
      // Open file in new tab - browser will handle the file appropriately
      // For images/PDFs it will display, for others it will download
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('❌ Error opening invoice:', error);
      showAlert({
        type: 'error',
        message: 'Failed to open invoice',
      });
    }
  };

  const handleViewEntry = (emission: StationaryEmission) => {
    setSelectedEntry(emission);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedEntry(null);
  };

  // Prepare chart data with time range filtering
  const chartData = React.useMemo(() => {
    // Determine date range
    let startDate: Date;
    let endDate: Date = new Date();
    
    if (timeRange === 'custom' && customStartDate && customEndDate) {
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      // Calculate start date based on time range
      startDate = new Date();
      switch (timeRange) {
        case 'day':
          startDate.setDate(startDate.getDate() - 30); // Last 30 days
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 84); // Last 12 weeks
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 12); // Last 12 months
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 5); // Last 5 years
          break;
      }
    }

    // Filter emissions by date range
    const filteredEmissions = emissions.filter((emission) => {
      if (!emission.date) return false;
      const emissionDate = new Date(emission.date);
      return emissionDate >= startDate && emissionDate <= endDate;
    });

    // Group emissions by time period
    const groupedData = new Map<string, number>();
    
    // Generate all time periods in range (even with no data)
    const allPeriods: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      let periodKey: string;
      
      switch (timeRange) {
        case 'day':
          periodKey = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'week':
          const weekStart = new Date(currentDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
          periodKey = `Week ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'month':
          periodKey = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'year':
          periodKey = currentDate.getFullYear().toString();
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
        case 'custom':
          // For custom, default to monthly grouping
          periodKey = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          periodKey = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      allPeriods.push(periodKey);
      groupedData.set(periodKey, 0); // Initialize with 0
    }

    // Add emission data
    filteredEmissions.forEach((emission) => {
      if (!emission.date) return;

      const date = new Date(emission.date);
      let periodKey: string;

      switch (timeRange) {
        case 'day':
          periodKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          periodKey = `Week ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          break;
        case 'month':
          periodKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          break;
        case 'year':
          periodKey = date.getFullYear().toString();
          break;
        case 'custom':
          periodKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          break;
        default:
          periodKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      }

      const existing = groupedData.get(periodKey) || 0;
      groupedData.set(periodKey, existing + (emission.etco2eq || 0));
    });

    // Convert to array, preserving order
    return allPeriods.map((period) => ({
      month: period, // Keep as 'month' for backward compatibility with XAxis
      emissions: Number((groupedData.get(period) || 0).toFixed(2)),
    }));
  }, [emissions, timeRange, customStartDate, customEndDate]);

  // Calculate statistics for cards
  const totalEmissions = emissions.reduce((sum, item) => sum + (item.etco2eq || 0), 0);
  
  const currentMonthEmissions = emissions
    .filter(item => {
      const itemDate = new Date(item.date);
      const now = new Date();
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, item) => sum + (item.etco2eq || 0), 0);

  // Format number for display
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
        <h1 className="text-2xl font-semibold text-gray-900">Stationary Emissions</h1>
          <p className="text-sm text-gray-600 mt-1">
            Scope 1: Direct GHG emissions from stationary fuel combustion sources
          </p>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          sx={{
            backgroundColor: '#00BCD4',
            '&:hover': { backgroundColor: '#008BA3' },
            textTransform: 'none',
            borderRadius: '8px',
            px: 3,
            color: 'white',
          }}
        >
          Add entry
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Total Emissions
                  </Typography>
                  <Typography variant="h5" fontWeight="600">
                    {formatNumber(totalEmissions)} tCO₂e
                  </Typography>
                </Box>
                <FireIcon sx={{ fontSize: 40, color: '#00BCD4', opacity: 0.8 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    This Month
                  </Typography>
                  <Typography variant="h5" fontWeight="600">
                    {formatNumber(currentMonthEmissions)} tCO₂e
                  </Typography>
                </Box>
                <CalendarIcon sx={{ fontSize: 40, color: '#4CAF50', opacity: 0.8 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Total Entries
                  </Typography>
                  <Typography variant="h5" fontWeight="600">
                    {emissions.length}
                  </Typography>
                </Box>
                <EntryIcon sx={{ fontSize: 40, color: '#FF9800', opacity: 0.8 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Data Table */}
      <Paper sx={{ mb: 4, borderRadius: '12px', overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#00BCD4' }} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>
            Error loading data. Please try again.
          </Box>
        ) : emissions.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            No emissions data found. Click "Add entry" to create your first entry.
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F5F7FA' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Source</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Fuel Type</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Unit</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Company Unit</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151' }}>
                      Emissions (tCO2e)
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Invoice</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {emissions
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((emission) => (
                  <TableRow
                    key={emission.name}
                    onClick={() => handleViewEntry(emission)}
                    sx={{
                      '&:hover': { backgroundColor: '#F9FAFB' },
                      cursor: 'pointer',
                    }}
                  >
                    <TableCell sx={{ color: '#00BCD4', fontWeight: 500 }}>
                      {emission.date
                        ? new Date(emission.date).toLocaleDateString('en-CA')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{emission.activity_types || 'N/A'}</TableCell>
                    <TableCell>{emission.fuel_selection || 'N/A'}</TableCell>
                    <TableCell>{emission.activity_data || 0}</TableCell>
                    <TableCell>{emission.unit_selection || 'N/A'}</TableCell>
                    <TableCell>{emission.company_unit || 'N/A'}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {emission.etco2eq?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>
                      {emission.upload_invoice ? (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewInvoice(emission.upload_invoice!);
                          }}
                          sx={{ color: '#00BCD4' }}
                        >
                          <OpenIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(emission.name);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </TableContainer>
            
            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(emissions.length / itemsPerPage)}
              totalItems={emissions.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1); // Reset to first page when changing items per page
              }}
            />
          </>
        )}
      </Paper>

      {/* Emission Trend Chart */}
      <Paper 
        sx={{ 
          p: 4, 
          borderRadius: '16px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
        }}
      >
        {/* Header with Filters */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          {/* Left: Title */}
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                color: '#111827',
                mb: 1,
                letterSpacing: '-0.025em'
              }}
            >
              Emission Trend over Time
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Visualize emission patterns across different time periods
            </Typography>
          </Box>

          {/* Right: Filter Dropdowns */}
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Time Range Selector */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel 
                id="time-range-label"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 0.5,
                  '& svg': { fontSize: '1rem' }
                }}
              >
                <TimeIcon sx={{ fontSize: '1rem' }} /> Period
              </InputLabel>
              <Select
                labelId="time-range-label"
                value={timeRange}
                label="Period"
                onChange={(e) => setTimeRange(e.target.value as any)}
                sx={{
                  borderRadius: '10px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E5E7EB',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00BCD4',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00BCD4',
                  },
                }}
              >
                <MenuItem value="day">Last 30 Days</MenuItem>
                <MenuItem value="week">Last 12 Weeks</MenuItem>
                <MenuItem value="month">Last 12 Months</MenuItem>
                <MenuItem value="year">Last 5 Years</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>

            {/* Chart Type Selector */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel 
                id="chart-type-label"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 0.5,
                  '& svg': { fontSize: '1rem' }
                }}
              >
                <BarChartIcon sx={{ fontSize: '1rem' }} /> Chart Type
              </InputLabel>
              <Select
                labelId="chart-type-label"
                value={chartType}
                label="Chart Type"
                onChange={(e) => setChartType(e.target.value as any)}
                sx={{
                  borderRadius: '10px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E5E7EB',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10B981',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10B981',
                  },
                }}
              >
                <MenuItem value="bar">📊 Bar Chart</MenuItem>
                <MenuItem value="line">📈 Line Chart</MenuItem>
                <MenuItem value="area">📉 Area Chart</MenuItem>
                <MenuItem value="stacked">📊 Stacked Area</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Custom Date Range Pickers (if custom selected) */}
        {timeRange === 'custom' && (
          <Box sx={{ mb: 3, pb: 3, borderBottom: '1px solid #E5E7EB' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Stack direction="row" spacing={2} alignItems="center">
                <DatePicker
                  label="Start Date"
                  value={customStartDate}
                  onChange={(newValue: Date | null) => setCustomStartDate(newValue)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { 
                        width: 200,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                        }
                      },
                    },
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={customEndDate}
                  onChange={(newValue: Date | null) => setCustomEndDate(newValue)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { 
                        width: 200,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                        }
                      },
                    },
                  }}
                />
              </Stack>
            </LocalizationProvider>
          </Box>
        )}

        {/* Chart */}
        {chartData.length > 0 ? (
          <Box sx={{ mt: 3 }}>
            <ResponsiveContainer width="100%" height={400}>
              {chartType === 'bar' && (
                <BarChart 
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
                  barCategoryGap="15%"
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00BCD4" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#00BCD4" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9CA3AF" 
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    angle={chartData.length > 12 ? -45 : 0}
                    textAnchor={chartData.length > 12 ? "end" : "middle"}
                    height={chartData.length > 12 ? 80 : 50}
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    tick={{ fill: '#6B7280' }}
                    label={{ 
                      value: 'Emissions (tCO2e)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: '#6B7280', fontWeight: 600, fontSize: '12px' }
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      padding: '12px 16px',
                    }}
                    labelStyle={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}
                    formatter={(value: any) => [`${value} tCO2e`, 'Emissions']}
                  />
                  <Bar 
                    dataKey="emissions" 
                    fill="url(#barGradient)" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              )}

              {chartType === 'line' && (
                <LineChart 
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
                >
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#00BCD4"/>
                      <stop offset="100%" stopColor="#00ACC1"/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9CA3AF" 
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    angle={chartData.length > 12 ? -45 : 0}
                    textAnchor={chartData.length > 12 ? "end" : "middle"}
                    height={chartData.length > 12 ? 80 : 50}
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    tick={{ fill: '#6B7280' }}
                    label={{ 
                      value: 'Emissions (tCO2e)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: '#6B7280', fontWeight: 600, fontSize: '12px' }
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      padding: '12px 16px',
                    }}
                    labelStyle={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}
                    formatter={(value: any) => [`${value} tCO2e`, 'Emissions']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="emissions" 
                    stroke="url(#lineGradient)" 
                    strokeWidth={3}
                    dot={{ fill: '#00BCD4', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, strokeWidth: 2 }}
                  />
                </LineChart>
              )}

              {chartType === 'area' && (
                <AreaChart 
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
                >
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00BCD4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00BCD4" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9CA3AF" 
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    angle={chartData.length > 12 ? -45 : 0}
                    textAnchor={chartData.length > 12 ? "end" : "middle"}
                    height={chartData.length > 12 ? 80 : 50}
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    tick={{ fill: '#6B7280' }}
                    label={{ 
                      value: 'Emissions (tCO2e)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: '#6B7280', fontWeight: 600, fontSize: '12px' }
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      padding: '12px 16px',
                    }}
                    labelStyle={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}
                    formatter={(value: any) => [`${value} tCO2e`, 'Emissions']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="emissions" 
                    stroke="#00BCD4" 
                    strokeWidth={2}
                    fill="url(#areaGradient)"
                  />
                </AreaChart>
              )}

              {chartType === 'stacked' && (
                <AreaChart 
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
                >
                  <defs>
                    <linearGradient id="stackedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9CA3AF" 
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    angle={chartData.length > 12 ? -45 : 0}
                    textAnchor={chartData.length > 12 ? "end" : "middle"}
                    height={chartData.length > 12 ? 80 : 50}
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    tick={{ fill: '#6B7280' }}
                    label={{ 
                      value: 'Emissions (tCO2e)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: '#6B7280', fontWeight: 600, fontSize: '12px' }
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      padding: '12px 16px',
                    }}
                    labelStyle={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}
                    formatter={(value: any) => [`${value} tCO2e`, 'Total Emissions']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="emissions" 
                    stackId="1"
                    stroke="#10B981" 
                    strokeWidth={2}
                    fill="url(#stackedGradient)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 10, 
              color: '#9CA3AF',
              backgroundColor: '#F9FAFB',
              borderRadius: '12px',
              border: '2px dashed #E5E7EB',
            }}
          >
            <CalendarIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#6B7280' }}>
              No emission data available
            </Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              Try adjusting the time range or add new entries to see the chart
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Add Entry Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' },
        }}
      >
        <DialogTitle sx={{ fontSize: '20px', fontWeight: 600 }}>
          Add Stationary Emission Entry
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Serial No"
                value={formData.s_no}
                fullWidth
                disabled
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date *"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                fullWidth
                required
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Invoice Number"
                value={formData.invoice_no}
                onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<AttachIcon />}
                sx={{ height: '40px' }}
              >
                {selectedFile ? selectedFile.name : 'Upload Invoice'}
                <input type="file" hidden onChange={handleFileChange} accept="image/*,application/pdf" />
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fuel Type *"
                select
                value={formData.fuel_type}
                onChange={(e) => handleFuelTypeChange(e.target.value)}
                fullWidth
                required
                size="small"
              >
                <MenuItem value="">Select Fuel Type</MenuItem>
                {getAvailableFuelTypes().map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fuel Selection *"
                select
                value={formData.fuel_selection}
                onChange={(e) => handleFuelSelectionChange(e.target.value)}
                fullWidth
                required
                disabled={!formData.fuel_type}
                size="small"
              >
                <MenuItem value="">Select Fuel</MenuItem>
                {formData.fuel_type &&
                  getAvailableFuels(formData.fuel_type).map((fuel) => (
                    <MenuItem key={fuel} value={fuel}>
                      {fuel}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Activity Type *"
                select
                value={formData.activity_types}
                onChange={(e) => setFormData({ ...formData, activity_types: e.target.value })}
                fullWidth
                required
                size="small"
              >
                <MenuItem value="">Select Activity Type</MenuItem>
                <MenuItem value="Boilers">Boilers</MenuItem>
                <MenuItem value="Burners">Burners</MenuItem>
                <MenuItem value="Gen Sets">Gen Sets</MenuItem>
                <MenuItem value="Furnace (Including Blast Furnace)">
                  Furnace (Including Blast Furnace)
                </MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Activity Data *"
                type="number"
                value={formData.activity_data}
                onChange={(e) => setFormData({ ...formData, activity_data: e.target.value })}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Unit *"
                select
                value={formData.unit_selection}
                onChange={(e) => handleUnitChange(e.target.value)}
                fullWidth
                required
                disabled={!formData.fuel_selection}
                size="small"
              >
                <MenuItem value="">Select Unit</MenuItem>
                {getAvailableUnits().map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Company"
                value={formData.company}
                fullWidth
                size="small"
                disabled
                helperText="Auto-filled from your user profile"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={companyUnits.length > 0 ? "Company Unit *" : "Company Unit"}
                select
                value={formData.company_unit}
                onChange={(e) => setFormData({ ...formData, company_unit: e.target.value })}
                fullWidth
                required={companyUnits.length > 0}
                size="small"
                helperText={companyUnits.length === 0 ? "No units found for your company" : ""}
              >
                <MenuItem value="">Select Unit</MenuItem>
                {companyUnits.map((unit) => (
                  <MenuItem key={unit.name} value={unit.name}>
                    {unit.unit_name || unit.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Auto-populated Emission Factors (Read-only) */}
            <Grid item xs={12}>
              <Box
                sx={{
                  backgroundColor: '#F9FAFB',
                  p: 2,
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                }}
              >
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Auto-Calculated Emission Factors
                </p>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField
                      label="EFCO2"
                      value={efco2.toFixed(8)}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="EFCH4"
                      value={efch4.toFixed(8)}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="EFN2O"
                      value={efn2o.toFixed(8)}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="ECO2"
                      value={eco2.toFixed(4)}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="ECH4"
                      value={ech4.toFixed(8)}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="EN2O"
                      value={en2o.toFixed(8)}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Total CO2eq (tCO2e)"
                      value={etco2eq.toFixed(2)}
                      fullWidth
                      size="small"
                      InputProps={{
                        readOnly: true,
                        style: { fontWeight: 600, fontSize: '16px' },
                      }}
                      sx={{
                        '& .MuiInputBase-input': {
                          color: '#00BCD4',
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: 'none', color: '#6B7280' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              backgroundColor: '#00BCD4',
              '&:hover': { backgroundColor: '#008BA3' },
              textTransform: 'none',
            }}
          >
            Save Entry
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Entry Details Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' },
        }}
      >
        <DialogTitle sx={{ fontSize: '20px', fontWeight: 600, pb: 1 }}>
          Emission Entry Details
        </DialogTitle>
        <DialogContent>
          {selectedEntry && (
            <Box sx={{ pt: 2 }}>
              {/* Basic Information Card */}
              <Card sx={{ mb: 2, boxShadow: 'none', border: '1px solid #E5E7EB' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#00BCD4' }}>
                    Basic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Date</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedEntry.date ? new Date(selectedEntry.date).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Invoice No</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedEntry.invoice_no || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Activity Type</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedEntry.activity_types || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Company</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedEntry.company || 'Default Company'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Company Unit</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedEntry.company_unit || 'Default Unit'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Fuel Information Card */}
              <Card sx={{ mb: 2, boxShadow: 'none', border: '1px solid #E5E7EB' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#00BCD4' }}>
                    Fuel & Activity Data
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Fuel Type</Typography>
                      <Chip 
                        label={selectedEntry.fuel_type || 'N/A'} 
                        size="small" 
                        sx={{ mt: 0.5, backgroundColor: '#E0F7FA', color: '#006064' }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Fuel Selection</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedEntry.fuel_selection || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Activity Data</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedEntry.activity_data || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Unit</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedEntry.unit_selection || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Emission Factors Used Card */}
              <Card sx={{ mb: 2, boxShadow: 'none', border: '1px solid #E5E7EB' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#00BCD4' }}>
                    Emission Factors Applied
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">EF CO2</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedEntry.efco2 ? selectedEntry.efco2.toFixed(6) : '0.000000'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">EF CH4</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedEntry.efch4 ? selectedEntry.efch4.toFixed(6) : '0.000000'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">EF N2O</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedEntry.efn20 ? selectedEntry.efn20.toFixed(6) : '0.000000'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Emissions Results Card */}
              <Card sx={{ mb: 2, boxShadow: 'none', border: '1px solid #E5E7EB' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#00BCD4' }}>
                    Calculated Emissions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">E CO2</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedEntry.eco2 ? selectedEntry.eco2.toFixed(4) : '0.0000'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">E CH4</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedEntry.ech4 ? selectedEntry.ech4.toFixed(4) : '0.0000'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">E N2O</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedEntry.en2o ? selectedEntry.en2o.toFixed(4) : '0.0000'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ 
                        backgroundColor: '#F0F9FF', 
                        p: 2, 
                        borderRadius: '8px',
                        border: '2px solid #00BCD4',
                        mt: 1
                      }}>
                        <Typography variant="body2" color="text.secondary">Total CO2 Equivalent</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#00BCD4', mt: 1 }}>
                          {selectedEntry.etco2eq ? selectedEntry.etco2eq.toFixed(4) : '0.0000'} tCO2e
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Uploaded Invoice Card */}
              {selectedEntry.upload_invoice && (
                <Card sx={{ mb: 2, boxShadow: 'none', border: '1px solid #E5E7EB' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#00BCD4' }}>
                      Uploaded Invoice
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<OpenIcon />}
                      onClick={() => handleViewInvoice(selectedEntry.upload_invoice!)}
                      sx={{
                        borderColor: '#00BCD4',
                        color: '#00BCD4',
                        '&:hover': {
                          borderColor: '#008BA3',
                          backgroundColor: '#E0F7FA',
                        },
                        textTransform: 'none',
                      }}
                    >
                      View Invoice
                    </Button>
                  </CardContent>
                </Card>
              )}

            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseViewDialog}
            variant="contained"
            sx={{
              backgroundColor: '#00BCD4',
              '&:hover': { backgroundColor: '#008BA3' },
              textTransform: 'none',
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title="Are you sure?"
        message="Take a moment to review the details provided to ensure you understand the implications. This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />
    </Box>
  );
}
