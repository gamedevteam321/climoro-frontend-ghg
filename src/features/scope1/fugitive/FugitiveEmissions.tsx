import React, { useState, useEffect } from 'react';
import { useFrappeGetCall, useFrappeCreateDoc, useFrappeDeleteDoc, useFrappeAuth } from 'frappe-react-sdk';
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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  BarChart as BarChartIcon,
  AcUnit as RefrigerantIcon,
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

// Scale Base Interface
interface ScaleBaseEmission {
  name: string;
  s_no?: number;
  date: string;
  gas_type: string;
  unit_selection: string;
  inventory_start: number;
  inventory_close: number;
  purchase: number;
  returned_user: number;
  returned_recycling: number;
  charged_equipment: number;
  delivered_user: number;
  returned_producer: number;
  sent_offsite: number;
  sent_destruction: number;
  etco2eq?: number;
}

// Screening Interface
interface ScreeningEmission {
  name: string;
  s_no?: number;
  date: string;
  equipment_selection: string;
  type_refrigeration: string;
  gwp_refrigeration: number;
  no_of_units: number;
  unit_selection: string;
  original_charge: number;
  assembly_ef: number;
  etco2eq?: number;
}

// Simple Interface
interface SimpleEmission {
  name: string;
  s_no?: number;
  date: string;
  invoice_no?: string;
  type_refrigeration: string;
  amount_purchased: number;
  no_of_units: number;
  unit_selection: string;
  gwp: number;
  etco2eq?: number;
}

const REFRIGERANT_TYPES = [
  'R134a',
  'R404A',
  'R410A',
  'R407C',
  'R22',
  'R507',
  'R717 (Ammonia)',
  'R744 (CO2)',
  'Other',
];

const EQUIPMENT_TYPES = [
  'Commercial Refrigeration',
  'Industrial Refrigeration',
  'Air Conditioning Systems',
  'Heat Pumps',
  'Transport Refrigeration',
  'Marine Refrigeration',
  'Other',
];

const UNIT_OPTIONS = ['kg', 'Tonnes'];

// Form Data Interfaces
interface ScaleBaseFormData {
  s_no: number;
  date: Date | null;
  gas_type: string;
  unit_selection: string;
  company: string;
  company_unit: string;
  inventory_start: number;
  inventory_close: number;
  purchase: number;
  returned_user: number;
  returned_recycling: number;
  charged_equipment: number;
  delivered_user: number;
  returned_producer: number;
  sent_offsite: number;
  sent_destruction: number;
}

interface ScreeningFormData {
  s_no: number;
  date: Date | null;
  equipment_selection: string;
  type_refrigeration: string;
  company: string;
  company_unit: string;
  gwp_refrigeration: number;
  no_of_units: number;
  unit_selection: string;
  original_charge: number;
  assembly_ef: number;
}

interface SimpleFormData {
  s_no: number;
  date: Date | null;
  invoice_no: string;
  type_refrigeration: string;
  company: string;
  company_unit: string;
  amount_purchased: number;
  no_of_units: number;
  unit_selection: string;
  gwp: number;
}

export default function FugitiveEmissions() {
  const { currentUser } = useFrappeAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ name: string; doctype: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Chart filter states
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'stacked'>('line');

  // Form states for each method
  const [scaleBaseForm, setScaleBaseForm] = useState<ScaleBaseFormData>({
    s_no: 1,
    date: new Date(),
    gas_type: '',
    unit_selection: 'kg',
    company: '',
    company_unit: '',
    inventory_start: 0,
    inventory_close: 0,
    purchase: 0,
    returned_user: 0,
    returned_recycling: 0,
    charged_equipment: 0,
    delivered_user: 0,
    returned_producer: 0,
    sent_offsite: 0,
    sent_destruction: 0,
  });

  const [screeningForm, setScreeningForm] = useState<ScreeningFormData>({
    s_no: 1,
    date: new Date(),
    equipment_selection: '',
    type_refrigeration: '',
    company: '',
    company_unit: '',
    gwp_refrigeration: 10,
    no_of_units: 1,
    unit_selection: 'kg',
    original_charge: 0,
    assembly_ef: 0.01,
  });

  const [simpleForm, setSimpleForm] = useState<SimpleFormData>({
    s_no: 1,
    date: new Date(),
    invoice_no: '',
    type_refrigeration: '',
    company: '',
    company_unit: '',
    amount_purchased: 0,
    no_of_units: 1,
    unit_selection: 'kg',
    gwp: 10,
  });

  // Fetch Scale Base emissions
  const { data: scaleBaseData, isLoading: scaleBaseLoading, error: scaleBaseError, mutate: mutateScaleBase } = useFrappeGetCall<{ message: ScaleBaseEmission[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Fugitive Scale Base',
      fields: ['*'],
      limit_page_length: 1000,
      order_by: 'date desc',
    },
    'fugitive-scale-base-list',
    {
      revalidateOnFocus: false,
      onError: (err) => console.warn('⚠️ Fugitive Scale Base doctype not found'),
    }
  );

  // Fetch Screening emissions
  const { data: screeningData, isLoading: screeningLoading, error: screeningError, mutate: mutateScreening } = useFrappeGetCall<{ message: ScreeningEmission[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Fugitive Screening',
      fields: ['*'],
      limit_page_length: 1000,
      order_by: 'date desc',
    },
    'fugitive-screening-list',
    {
      revalidateOnFocus: false,
      onError: (err) => console.warn('⚠️ Fugitive Screening doctype not found'),
    }
  );

  // Fetch Simple emissions
  const { data: simpleData, isLoading: simpleLoading, error: simpleError, mutate: mutateSimple } = useFrappeGetCall<{ message: SimpleEmission[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Fugitive Simple',
      fields: ['*'],
      limit_page_length: 1000,
      order_by: 'date desc',
    },
    'fugitive-simple-list',
    {
      revalidateOnFocus: false,
      onError: (err) => console.warn('⚠️ Fugitive Simple doctype not found'),
    }
  );

  const { createDoc } = useFrappeCreateDoc();
  const { deleteDoc } = useFrappeDeleteDoc();

  // Fetch current user's company from User doctype using frappe.client.get
  console.log('👤 Current User from Auth:', currentUser);
  
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
  
  console.log('🔍 User Company from Backend:', {
    currentUser,
    fullResponse: currentUserData,
    extractedCompany: userCompany,
  });

  // Update form company when userCompany changes
  useEffect(() => {
    console.log('🏢 Setting company to forms. userCompany:', userCompany);
    if (userCompany) {
      setScaleBaseForm(prev => ({ ...prev, company: userCompany }));
      setScreeningForm(prev => ({ ...prev, company: userCompany }));
      setSimpleForm(prev => ({ ...prev, company: userCompany }));
      console.log('✅ Company set to all forms');
    } else {
      console.warn('⚠️ userCompany is empty or undefined');
    }
  }, [userCompany]);

  // Fetch units based on user's company (aligned with StationaryEmissions)
  const { data: unitsData } = useFrappeGetCall<{ message: Array<{ name: string; unit_name?: string; [key: string]: any }> }>(
    userCompany ? 'frappe.client.get_list' : '',
    userCompany
      ? {
          doctype: 'Units',
          fields: ['*'],
          filters: userCompany !== 'Default Company' ? [['company', '=', userCompany]] : [],
          limit_page_length: 100,
        }
      : undefined,
    userCompany ? `company-units-${userCompany}` : null,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  const companyUnits: Array<{ name: string; unit_name?: string }> = unitsData?.message || [];

  const scaleBaseEmissions = scaleBaseData?.message || [];
  const screeningEmissions = screeningData?.message || [];
  const simpleEmissions = simpleData?.message || [];

  // Get current emissions based on active tab
  const getCurrentEmissions = () => {
    switch (activeTab) {
      case 0: return scaleBaseEmissions;
      case 1: return screeningEmissions;
      case 2: return simpleEmissions;
      default: return [];
    }
  };

  const getCurrentDoctype = () => {
    switch (activeTab) {
      case 0: return 'Fugitive Scale Base';
      case 1: return 'Fugitive Screening';
      case 2: return 'Fugitive Simple';
      default: return 'Fugitive Simple';
    }
  };

  // Prepare chart data with time range filtering - combine all emission types
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

    // Combine all emission types
    const allEmissions = [
      ...scaleBaseEmissions.map(e => ({ date: e.date, etco2eq: e.etco2eq || 0 })),
      ...screeningEmissions.map(e => ({ date: e.date, etco2eq: e.etco2eq || 0 })),
      ...simpleEmissions.map(e => ({ date: e.date, etco2eq: e.etco2eq || 0 })),
    ];

    // Filter emissions by date range
    const filteredEmissions = allEmissions.filter((emission) => {
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
  }, [scaleBaseEmissions, screeningEmissions, simpleEmissions, timeRange, customStartDate, customEndDate]);

  const currentEmissions = getCurrentEmissions();
  const totalEmissions = currentEmissions.reduce((sum, item) => sum + (item.etco2eq || 0), 0);
  
  const currentMonthEmissions = currentEmissions
    .filter(item => {
      const itemDate = new Date(item.date);
      const now = new Date();
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, item) => sum + (item.etco2eq || 0), 0);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = currentEmissions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(currentEmissions.length / itemsPerPage);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const handleDeleteClick = (name: string, doctype: string) => {
    setItemToDelete({ name, doctype });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await deleteDoc(itemToDelete.doctype, itemToDelete.name);
      showAlert({ type: 'success', message: 'Entry deleted successfully!' });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      
      // Refresh the appropriate list
      if (itemToDelete.doctype === 'Fugitive Scale Base') mutateScaleBase();
      else if (itemToDelete.doctype === 'Fugitive Screening') mutateScreening();
      else mutateSimple();
    } catch (err: any) {
      console.error('Error deleting entry:', err);
      showAlert({ type: 'error', message: err.message || 'Failed to delete entry' });
    }
  };

  const isLoading = scaleBaseLoading || screeningLoading || simpleLoading;
  const hasError = (activeTab === 0 && scaleBaseError) || (activeTab === 1 && screeningError) || (activeTab === 2 && simpleError);

  const handleOpenDialog = () => {
    console.log('📂 Opening dialog. Current form states:');
    console.log('Scale Base Form:', scaleBaseForm);
    console.log('Screening Form:', screeningForm);
    console.log('Simple Form:', simpleForm);
    console.log('Company Units:', companyUnits);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    console.log('🚀 Submit clicked! Active Tab:', activeTab);
    try {
      let docData: any;
      let doctype: string;

      switch (activeTab) {
        case 0: // Scale Base
          console.log('🔍 Scale Base Form Validation:', {
            date: scaleBaseForm.date,
            gas_type: scaleBaseForm.gas_type,
            company: scaleBaseForm.company,
            company_unit: scaleBaseForm.company_unit,
            companyUnits_length: companyUnits.length,
          });
          
          if (!scaleBaseForm.date || !scaleBaseForm.gas_type || !scaleBaseForm.company || !scaleBaseForm.company_unit) {
            showAlert({ type: 'error', message: 'Please fill in all required fields (Date, Gas Type, Company, Company Unit)' });
            return;
          }
          
          // Calculate derived fields
          const decreased = scaleBaseForm.inventory_start - scaleBaseForm.inventory_close;
          const totalReturned = scaleBaseForm.purchase + scaleBaseForm.returned_user + scaleBaseForm.returned_recycling;
          const totalDistributed = scaleBaseForm.charged_equipment + scaleBaseForm.delivered_user + 
                                   scaleBaseForm.returned_producer + scaleBaseForm.sent_offsite + scaleBaseForm.sent_destruction;
          const refrigerantEmission = decreased + totalReturned - totalDistributed;
          const x5 = scaleBaseForm.unit_selection === 'kg' ? refrigerantEmission / 1000 : refrigerantEmission;
          const etco2eq = x5 * 10; // Using default GWP of 10
          
          docData = {
            s_no: scaleBaseForm.s_no,
            date: scaleBaseForm.date.toISOString().split('T')[0],
            gas_type: scaleBaseForm.gas_type,
            unit_selection: scaleBaseForm.unit_selection,
            company: scaleBaseForm.company,
            company_unit: scaleBaseForm.company_unit,
            approach_type: 'Scale Base Approach',
            inventory_start: scaleBaseForm.inventory_start,
            inventory_close: scaleBaseForm.inventory_close,
            decreased_inventory: decreased,
            purchase: scaleBaseForm.purchase,
            returned_user: scaleBaseForm.returned_user,
            returned_recycling: scaleBaseForm.returned_recycling,
            total_returned: totalReturned,
            charged_equipment: scaleBaseForm.charged_equipment,
            delivered_user: scaleBaseForm.delivered_user,
            returned_producer: scaleBaseForm.returned_producer,
            sent_offsite: scaleBaseForm.sent_offsite,
            sent_destruction: scaleBaseForm.sent_destruction,
            total_distributed: totalDistributed,
            refrigerant_emission: refrigerantEmission,
            x5_conversion: x5,
            etco2eq: etco2eq,
          };
          doctype = 'Fugitive Scale Base';
          break;

        case 1: // Screening
          console.log('🔍 Screening Form Validation:', {
            date: screeningForm.date,
            equipment: screeningForm.equipment_selection,
            type_ref: screeningForm.type_refrigeration,
            company: screeningForm.company,
            company_unit: screeningForm.company_unit,
            companyUnits_length: companyUnits.length,
          });
          
          if (!screeningForm.date || !screeningForm.equipment_selection || !screeningForm.type_refrigeration || !screeningForm.company || !screeningForm.company_unit) {
            showAlert({ type: 'error', message: 'Please fill in all required fields (Date, Equipment, Refrigeration Type, Company, Company Unit)' });
            return;
          }
          
          // Formula: C * D * E * F
          const screeningEtco2eq = screeningForm.gwp_refrigeration * screeningForm.no_of_units * 
                                   screeningForm.original_charge * screeningForm.assembly_ef;
          const finalScreening = screeningForm.unit_selection === 'kg' ? screeningEtco2eq / 1000 : screeningEtco2eq;
          
          docData = {
            s_no: screeningForm.s_no,
            date: screeningForm.date.toISOString().split('T')[0],
            equipment_selection: screeningForm.equipment_selection,
            type_refrigeration: screeningForm.type_refrigeration,
            company: screeningForm.company,
            company_unit: screeningForm.company_unit,
            approach_type: 'Screening Method',
            gwp_refrigeration: screeningForm.gwp_refrigeration,
            no_of_units: screeningForm.no_of_units,
            unit_selection: screeningForm.unit_selection,
            original_charge: screeningForm.original_charge,
            assembly_ef: screeningForm.assembly_ef,
            etco2eq: finalScreening,
          };
          doctype = 'Fugitive Screening';
          break;

        case 2: // Simple
          console.log('🔍 Simple Form Validation:', {
            date: simpleForm.date,
            type_ref: simpleForm.type_refrigeration,
            amount: simpleForm.amount_purchased,
            company: simpleForm.company,
            company_unit: simpleForm.company_unit,
            companyUnits_length: companyUnits.length,
          });
          
          if (!simpleForm.date || !simpleForm.type_refrigeration || simpleForm.amount_purchased <= 0 || !simpleForm.company || !simpleForm.company_unit) {
            showAlert({ type: 'error', message: 'Please fill in all required fields (Date, Refrigeration Type, Amount > 0, Company, Company Unit)' });
            return;
          }
          
          // Formula: A * B / conversion
          const conversionFactor = simpleForm.unit_selection === 'kg' ? 1000 : 1;
          const simpleEtco2eq = (simpleForm.amount_purchased * simpleForm.gwp) / conversionFactor;
          
          docData = {
            s_no: simpleForm.s_no,
            date: simpleForm.date.toISOString().split('T')[0],
            invoice_no: simpleForm.invoice_no,
            type_refrigeration: simpleForm.type_refrigeration,
            company: simpleForm.company,
            company_unit: simpleForm.company_unit,
            approach_type: 'Simple Method',
            amount_purchased: simpleForm.amount_purchased,
            no_of_units: simpleForm.no_of_units,
            unit_selection: simpleForm.unit_selection,
            gwp: simpleForm.gwp,
            etco2eq: simpleEtco2eq,
          };
          doctype = 'Fugitive Simple';
          break;

        default:
          return;
      }

      console.log('📝 Creating document:', doctype);
      console.log('📦 Document data:', docData);
      
      // Use createDoc hook which handles CSRF tokens properly
      const result = await createDoc(doctype, docData);
      console.log('✅ Document created successfully:', result);
      
      showAlert({ type: 'success', message: 'Entry added successfully!' });
      handleCloseDialog();
      
      // Refresh appropriate list
      if (activeTab === 0) mutateScaleBase();
      else if (activeTab === 1) mutateScreening();
      else mutateSimple();
      
    } catch (err: any) {
      console.error('❌ Error creating entry:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      // Better error message for CSRF errors
      if (err.exception && err.exception.includes('CSRFTokenError')) {
        showAlert({ type: 'error', message: 'Session expired. Please refresh the page and try again.' });
      } else {
        showAlert({ type: 'error', message: err.message || err._server_messages || 'Failed to add entry. Please try again.' });
      }
    }
  };

  // Update form s_no when emissions change
  useEffect(() => {
    setScaleBaseForm(prev => ({ ...prev, s_no: scaleBaseEmissions.length + 1 }));
  }, [scaleBaseEmissions.length]);

  useEffect(() => {
    setScreeningForm(prev => ({ ...prev, s_no: screeningEmissions.length + 1 }));
  }, [screeningEmissions.length]);

  useEffect(() => {
    setSimpleForm(prev => ({ ...prev, s_no: simpleEmissions.length + 1 }));
  }, [simpleEmissions.length]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Fugitive Emissions</h1>
            <p className="text-sm text-gray-600 mt-1">
              Scope 1: Direct GHG emissions from refrigerants and other fugitive sources
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
                  <RefrigerantIcon sx={{ fontSize: 40, color: '#00BCD4', opacity: 0.8 }} />
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
                      {currentEmissions.length}
                    </Typography>
                  </Box>
                  <BarChartIcon sx={{ fontSize: 40, color: '#FF9800', opacity: 0.8 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 4, borderRadius: '12px', overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => {
              setActiveTab(newValue);
              setCurrentPage(1);
            }}
            variant="fullWidth"
            sx={{
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                color: '#64748b',
                flex: 1,
                maxWidth: 'none',
                '&.Mui-selected': {
                  color: '#00BCD4',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#00BCD4',
                height: 3,
              },
            }}
          >
            <Tab label="Scale Base Approach" />
            <Tab label="Screening Method" />
            <Tab label="Simple Method" />
          </Tabs>

          {/* Data Table */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: '#00BCD4' }} />
            </Box>
          ) : hasError ? (
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" color="error" gutterBottom>
                ⚠️ Backend Doctype Not Found
              </Typography>
              <Typography color="text.secondary">
                The "{getCurrentDoctype()}" doctype doesn't exist in your Frappe backend yet.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Please create the doctype using the setup script or Frappe Desk.
              </Typography>
            </Box>
          ) : currentEmissions.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No data found for {activeTab === 0 ? 'Scale Base' : activeTab === 1 ? 'Screening' : 'Simple'} method. Click "Add entry" to create your first entry.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                {activeTab === 0 && <ScaleBaseTable items={currentItems as ScaleBaseEmission[]} onDelete={handleDeleteClick} formatNumber={formatNumber} />}
                {activeTab === 1 && <ScreeningTable items={currentItems as ScreeningEmission[]} onDelete={handleDeleteClick} formatNumber={formatNumber} />}
                {activeTab === 2 && <SimpleTable items={currentItems as SimpleEmission[]} onDelete={handleDeleteClick} formatNumber={formatNumber} />}
              </TableContainer>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={currentEmissions.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(n) => {
                  setCurrentPage(1);
                  setItemsPerPage(n);
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
            mb: 4
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
                Fugitive Emission Trend over Time
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                Visualize emission patterns across all calculation methods
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
          PaperProps={{ sx: { borderRadius: '12px' } }}
        >
          <DialogTitle sx={{ pb: 1, fontSize: '1.25rem', fontWeight: 600 }}>
            Add Entry - {activeTab === 0 ? 'Scale Base' : activeTab === 1 ? 'Screening' : 'Simple'} Method
          </DialogTitle>
          <DialogContent>
            {activeTab === 0 && (
              <ScaleBaseForm formData={scaleBaseForm} setFormData={setScaleBaseForm} companyUnits={companyUnits} />
            )}
            {activeTab === 1 && (
              <ScreeningForm formData={screeningForm} setFormData={setScreeningForm} companyUnits={companyUnits} />
            )}
            {activeTab === 2 && (
              <SimpleForm formData={simpleForm} setFormData={setSimpleForm} companyUnits={companyUnits} />
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={handleCloseDialog}
              sx={{ textTransform: 'none', color: '#5F6368' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                backgroundColor: '#00BCD4',
                '&:hover': { backgroundColor: '#008BA3' },
                textTransform: 'none',
                px: 3,
              }}
            >
              Add Entry
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete Entry"
          message="Are you sure you want to delete this entry? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
          }}
          confirmText="Delete"
          cancelText="Cancel"
        />
      </Box>
    </LocalizationProvider>
  );
}

// Scale Base Form Component
function ScaleBaseForm({ 
  formData, 
  setFormData, 
  companyUnits 
}: { 
  formData: ScaleBaseFormData, 
  setFormData: React.Dispatch<React.SetStateAction<ScaleBaseFormData>>,
  companyUnits: Array<{ name: string; unit_name?: string; [key: string]: any }>
}) {
  const handleChange = (field: keyof ScaleBaseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Fetch GWP Chemical types using custom API (shorter path through api.py)
  const { data: gwpChemicalsData, isLoading: gwpLoading } = useFrappeGetCall<{ message: Array<{ name: string; chemical_name: string; gwp?: number; gwp_ar6?: number }> }>(
    'frappe.client.get_list',
    {
      doctype: 'GWP Chemical',
      fields: ['name', 'chemical_name', 'gwp_ar6'],
      order_by: 'chemical_name',
      limit_page_length: 500,
    },
    'gwp-chemicals-list',
    {
      revalidateOnFocus: false,
      onError: (err) => console.warn('⚠️ GWP Chemical doctype not found'),
    }
  );

  const gwpChemicals = (gwpChemicalsData?.message || []).map(chem => ({
    ...chem,
    gwp: (chem.gwp_ar6 ?? chem.gwp ?? 10),
  }));

  // Calculate intermediate values
  const decreased = formData.inventory_start - formData.inventory_close;
  const totalReturned = formData.purchase + formData.returned_user + formData.returned_recycling;
  const totalDistributed = formData.charged_equipment + formData.delivered_user + 
                           formData.returned_producer + formData.sent_offsite + formData.sent_destruction;
  const refrigerantEmission = decreased + totalReturned - totalDistributed;
  const x5 = formData.unit_selection === 'kg' ? refrigerantEmission / 1000 : refrigerantEmission;
  const etco2eq = x5 * 10; // Using default GWP of 10

  return (
    <Grid container spacing={3} sx={{ mt: 0.5 }}>
      {/* Basic Info */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="S.No"
          type="number"
          value={formData.s_no}
          disabled
          sx={{ backgroundColor: '#F5F5F5' }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <DatePicker
          label="Date *"
          value={formData.date}
          onChange={(newValue) => handleChange('date', newValue)}
          slotProps={{ textField: { fullWidth: true, required: true } }}
        />
      </Grid>

      {/* FETCHED FROM DOCTYPE: Gas Type */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Type of Gas *</InputLabel>
          <Select
            value={formData.gas_type}
            onChange={(e) => handleChange('gas_type', e.target.value)}
            label="Type of Gas *"
            disabled={gwpLoading}
          >
            {gwpLoading ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : gwpChemicals.length === 0 ? (
              <MenuItem disabled>No GWP Chemicals found</MenuItem>
            ) : (
              gwpChemicals.map((chemical) => (
                <MenuItem key={chemical.name} value={chemical.chemical_name || chemical.name}>
                  {chemical.chemical_name || chemical.name}
                </MenuItem>
              ))
            )}
          </Select>
          <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary', ml: 1.5 }}>
            Fetched from GWP Chemical doctype
          </Typography>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Unit Selection *</InputLabel>
          <Select
            value={formData.unit_selection}
            onChange={(e) => handleChange('unit_selection', e.target.value)}
            label="Unit Selection *"
          >
            {UNIT_OPTIONS.map((unit) => (
              <MenuItem key={unit} value={unit}>{unit}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* USER INPUT: Company Unit */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required={companyUnits.length > 0}>
          <InputLabel>Company Unit {companyUnits.length > 0 ? '*' : ''}</InputLabel>
          <Select
            value={formData.company_unit}
            onChange={(e) => handleChange('company_unit', e.target.value)}
            label={`Company Unit ${companyUnits.length > 0 ? '*' : ''}`}
            disabled={companyUnits.length === 0}
          >
            <MenuItem value="">Select Unit</MenuItem>
            {companyUnits.map((unit) => (
              <MenuItem key={unit.name} value={unit.name}>
                {unit.unit_name || unit.name}
              </MenuItem>
            ))}
          </Select>
          {companyUnits.length === 0 && (
            <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary', ml: 1.5 }}>
              No units found for your company
            </Typography>
          )}
        </FormControl>
      </Grid>

      {/* USER INPUT: Unit Selection */}
      
      {/* USER INPUT: Inventory Data */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ mt: 2 }}>
          📦 Inventory Data (USER INPUT)
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Inventory START (A) *"
          type="number"
          value={formData.inventory_start}
          onChange={(e) => handleChange('inventory_start', parseFloat(e.target.value) || 0)}
          required
          inputProps={{ step: '0.01' }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Inventory CLOSE (B) *"
          type="number"
          value={formData.inventory_close}
          onChange={(e) => handleChange('inventory_close', parseFloat(e.target.value) || 0)}
          required
          inputProps={{ step: '0.01' }}
        />
      </Grid>

      {/* AUTO-CALCULATED: Decreased Inventory */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Decreased Inventory (A - B)"
          type="number"
          value={decreased.toFixed(2)}
          disabled
          sx={{ 
            '& .MuiInputBase-input': { fontWeight: 500, color: '#00796B' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#80CBC4', borderWidth: 2 }
            }
          }}
          helperText="Auto-calculated: Inventory START - Inventory CLOSE"
        />
      </Grid>

      {/* USER INPUT: Returned Refrigeration */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ mt: 2 }}>
          ↩️ Returned Refrigeration (USER INPUT)
        </Typography>
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Purchase (C)"
          type="number"
          value={formData.purchase}
          onChange={(e) => handleChange('purchase', parseFloat(e.target.value) || 0)}
          inputProps={{ step: '0.01' }}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Returned by User (D)"
          type="number"
          value={formData.returned_user}
          onChange={(e) => handleChange('returned_user', parseFloat(e.target.value) || 0)}
          inputProps={{ step: '0.01' }}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Returned after Recycling (E)"
          type="number"
          value={formData.returned_recycling}
          onChange={(e) => handleChange('returned_recycling', parseFloat(e.target.value) || 0)}
          inputProps={{ step: '0.01' }}
        />
      </Grid>

      {/* AUTO-CALCULATED: Total Returned */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Total Returned (C + D + E)"
          type="number"
          value={totalReturned.toFixed(2)}
          disabled
          sx={{ 
            '& .MuiInputBase-input': { fontWeight: 500, color: '#00796B' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#80CBC4', borderWidth: 2 }
            }
          }}
          helperText="Auto-calculated: Purchase + Returned by User + Returned after Recycling"
        />
      </Grid>

      {/* USER INPUT: Distributed Refrigeration */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ mt: 2 }}>
          📤 Distributed Refrigeration (USER INPUT)
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Charged into Equipment (F)"
          type="number"
          value={formData.charged_equipment}
          onChange={(e) => handleChange('charged_equipment', parseFloat(e.target.value) || 0)}
          inputProps={{ step: '0.01' }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Delivered to User (G)"
          type="number"
          value={formData.delivered_user}
          onChange={(e) => handleChange('delivered_user', parseFloat(e.target.value) || 0)}
          inputProps={{ step: '0.01' }}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Returned to Producer (H)"
          type="number"
          value={formData.returned_producer}
          onChange={(e) => handleChange('returned_producer', parseFloat(e.target.value) || 0)}
          inputProps={{ step: '0.01' }}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Sent Off-site (I)"
          type="number"
          value={formData.sent_offsite}
          onChange={(e) => handleChange('sent_offsite', parseFloat(e.target.value) || 0)}
          inputProps={{ step: '0.01' }}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Sent for Destruction (J)"
          type="number"
          value={formData.sent_destruction}
          onChange={(e) => handleChange('sent_destruction', parseFloat(e.target.value) || 0)}
          inputProps={{ step: '0.01' }}
        />
      </Grid>

      {/* AUTO-CALCULATED: Total Distributed */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Total Distributed (F + G + H + I + J)"
          type="number"
          value={totalDistributed.toFixed(2)}
          disabled
          sx={{ 
            '& .MuiInputBase-input': { fontWeight: 500, color: '#00796B' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#80CBC4', borderWidth: 2 }
            }
          }}
          helperText="Auto-calculated: Sum of all distributed refrigeration"
        />
      </Grid>

      {/* AUTO-CALCULATED: Final Calculations */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="success.main" fontWeight={600} sx={{ mt: 2 }}>
          🧮 Calculated Results (AUTO-CALCULATED)
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Refrigerant Emission (X1 + X2 - X3)"
          type="number"
          value={refrigerantEmission.toFixed(4)}
          disabled
          sx={{ 
            '& .MuiInputBase-input': { fontWeight: 600, color: '#00796B' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#4DB6AC', borderWidth: 2 }
            }
          }}
          helperText="Auto-calculated"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="X5 Conversion (kg to tonnes)"
          type="number"
          value={x5.toFixed(4)}
          disabled
          sx={{ 
            '& .MuiInputBase-input': { fontWeight: 600, color: '#00796B' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#4DB6AC', borderWidth: 2 }
            }
          }}
          helperText="Auto-calculated"
        />
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, backgroundColor: '#00BCD4', borderRadius: '8px' }}>
          <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }} gutterBottom>
            Final Emissions (X5 × GWP)
          </Typography>
          <Typography variant="h5" fontWeight="600" sx={{ color: 'white' }}>
            {etco2eq.toFixed(4)} tCO₂e
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}

// Screening Form Component
function ScreeningForm({ 
  formData, 
  setFormData,
  companyUnits
}: { 
  formData: ScreeningFormData, 
  setFormData: React.Dispatch<React.SetStateAction<ScreeningFormData>>,
  companyUnits: Array<{ name: string; unit_name?: string; [key: string]: any }>
}) {
  const handleChange = (field: keyof ScreeningFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const estimatedEmissions = formData.gwp_refrigeration * formData.no_of_units * 
                             formData.original_charge * formData.assembly_ef;
  const finalEmissions = formData.unit_selection === 'kg' ? estimatedEmissions / 1000 : estimatedEmissions;

  return (
    <Grid container spacing={3} sx={{ mt: 0.5 }}>
      {/* Basic Info - AUTO */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="S.No"
          type="number"
          value={formData.s_no}
          disabled
          sx={{ backgroundColor: '#F5F5F5' }}
          helperText="Auto-incremented"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <DatePicker
          label="Date *"
          value={formData.date}
          onChange={(newValue) => handleChange('date', newValue)}
          slotProps={{ textField: { fullWidth: true, required: true } }}
        />
      </Grid>

      {/* USER INPUT: Equipment & Refrigerant */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ mt: 1 }}>
          🏭 Equipment & Refrigerant (USER INPUT)
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Equipment Selection (A) *</InputLabel>
          <Select
            value={formData.equipment_selection}
            onChange={(e) => handleChange('equipment_selection', e.target.value)}
            label="Equipment Selection (A) *"
          >
            {EQUIPMENT_TYPES.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Refrigerant Type (B) *</InputLabel>
          <Select
            value={formData.type_refrigeration}
            onChange={(e) => handleChange('type_refrigeration', e.target.value)}
            label="Refrigerant Type (B) *"
          >
            {REFRIGERANT_TYPES.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* USER INPUT: Company Unit */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required={companyUnits.length > 0}>
          <InputLabel>Company Unit {companyUnits.length > 0 ? '*' : ''}</InputLabel>
          <Select
            value={formData.company_unit}
            onChange={(e) => handleChange('company_unit', e.target.value)}
            label={`Company Unit ${companyUnits.length > 0 ? '*' : ''}`}
            disabled={companyUnits.length === 0}
          >
            <MenuItem value="">Select Unit</MenuItem>
            {companyUnits.map((unit) => (
              <MenuItem key={unit.name} value={unit.name}>
                {unit.unit_name || unit.name}
              </MenuItem>
            ))}
          </Select>
          {companyUnits.length === 0 && (
            <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary', ml: 1.5 }}>
              No units found for your company
            </Typography>
          )}
        </FormControl>
      </Grid>

      {/* USER INPUT / CAN BE FETCHED: GWP */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ mt: 2 }}>
          🔢 Emission Factor & Units (USER INPUT or FETCHED)
        </Typography>
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="GWP Refrigeration (C) *"
          type="number"
          value={formData.gwp_refrigeration}
          onChange={(e) => handleChange('gwp_refrigeration', parseFloat(e.target.value) || 0)}
          required
          inputProps={{ step: '0.01', min: '0' }}
          helperText="Default: 10 (can be fetched)"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="No. of Units (D) *"
          type="number"
          value={formData.no_of_units}
          onChange={(e) => handleChange('no_of_units', parseFloat(e.target.value) || 0)}
          required
          inputProps={{ step: '1', min: '1' }}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth required>
          <InputLabel>Unit Selection *</InputLabel>
          <Select
            value={formData.unit_selection}
            onChange={(e) => handleChange('unit_selection', e.target.value)}
            label="Unit Selection *"
          >
            {UNIT_OPTIONS.map((unit) => (
              <MenuItem key={unit} value={unit}>{unit}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* USER INPUT: Charge & EF */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ mt: 2 }}>
          ⚡ Charge & Emission Factor (USER INPUT)
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Original Refrigeration Charge (E) *"
          type="number"
          value={formData.original_charge}
          onChange={(e) => handleChange('original_charge', parseFloat(e.target.value) || 0)}
          required
          inputProps={{ step: '0.01', min: '0' }}
          helperText="Original charge in equipment"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Assembly EF (F) *"
          type="number"
          value={formData.assembly_ef}
          onChange={(e) => handleChange('assembly_ef', parseFloat(e.target.value) || 0)}
          required
          inputProps={{ step: '0.001', min: '0', max: '1' }}
          helperText="Default: 0.01 (1% annual leak rate)"
        />
      </Grid>

      {/* AUTO-CALCULATED: Final Result */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="success.main" fontWeight={600} sx={{ mt: 2 }}>
          🧮 Calculated Result (AUTO-CALCULATED)
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, backgroundColor: '#00BCD4', borderRadius: '8px' }}>
          <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }} gutterBottom>
            Final Emissions Formula: C × D × E × F / {formData.unit_selection === 'kg' ? '1000' : '1'}
          </Typography>
          <Typography variant="h5" fontWeight="600" sx={{ color: 'white' }}>
            {finalEmissions.toFixed(4)} tCO₂e
          </Typography>
          <Typography variant="caption" sx={{ color: 'white', opacity: 0.8 }}>
            = {formData.gwp_refrigeration} × {formData.no_of_units} × {formData.original_charge} × {formData.assembly_ef} / {formData.unit_selection === 'kg' ? '1000' : '1'}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}

// Simple Form Component
function SimpleForm({ 
  formData, 
  setFormData,
  companyUnits
}: { 
  formData: SimpleFormData, 
  setFormData: React.Dispatch<React.SetStateAction<SimpleFormData>>,
  companyUnits: Array<{ name: string; unit_name?: string; [key: string]: any }>
}) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleChange = (field: keyof SimpleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const estimatedEmissions = (formData.amount_purchased * formData.gwp) / 
                             (formData.unit_selection === 'kg' ? 1000 : 1);

  return (
    <Grid container spacing={3} sx={{ mt: 0.5 }}>
      {/* Basic Info - AUTO */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="S.No"
          type="number"
          value={formData.s_no}
          disabled
          sx={{ backgroundColor: '#F5F5F5' }}
          helperText="Auto-incremented"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <DatePicker
          label="Date *"
          value={formData.date}
          onChange={(newValue) => handleChange('date', newValue)}
          slotProps={{ textField: { fullWidth: true, required: true } }}
        />
      </Grid>

      {/* USER INPUT: Invoice Info (Optional) */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
          📄 Invoice Information (Optional)
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Invoice No"
          value={formData.invoice_no}
          onChange={(e) => handleChange('invoice_no', e.target.value)}
          helperText="Optional: Invoice reference number"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Button
          variant="outlined"
          component="label"
          fullWidth
          sx={{ 
            height: '56px',
            textTransform: 'none',
            borderColor: '#00BCD4',
            color: '#00BCD4',
            '&:hover': { borderColor: '#008BA3', backgroundColor: 'rgba(0, 188, 212, 0.04)' }
          }}
        >
          {uploadedFile ? `📎 ${uploadedFile.name}` : 'Upload Invoice (Optional)'}
          <input
            type="file"
            hidden
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
          />
        </Button>
      </Grid>

      {/* USER INPUT: Refrigerant Details */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ mt: 2 }}>
          ❄️ Refrigerant Details (USER INPUT)
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Refrigerant Type *</InputLabel>
          <Select
            value={formData.type_refrigeration}
            onChange={(e) => handleChange('type_refrigeration', e.target.value)}
            label="Refrigerant Type *"
          >
            {REFRIGERANT_TYPES.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="GWP - Global Warming Potential (B) *"
          type="number"
          value={formData.gwp}
          onChange={(e) => handleChange('gwp', parseFloat(e.target.value) || 0)}
          required
          inputProps={{ step: '0.01', min: '0' }}
          helperText="Default: 10 (can be fetched from GWP Chemical)"
        />
      </Grid>
      
      {/* USER INPUT: Company Unit */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required={companyUnits.length > 0}>
          <InputLabel>Company Unit {companyUnits.length > 0 ? '*' : ''}</InputLabel>
          <Select
            value={formData.company_unit}
            onChange={(e) => handleChange('company_unit', e.target.value)}
            label={`Company Unit ${companyUnits.length > 0 ? '*' : ''}`}
            disabled={companyUnits.length === 0}
          >
            <MenuItem value="">Select Unit</MenuItem>
            {companyUnits.map((unit) => (
              <MenuItem key={unit.name} value={unit.name}>
                {unit.unit_name || unit.name}
              </MenuItem>
            ))}
          </Select>
          {companyUnits.length === 0 && (
            <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary', ml: 1.5 }}>
              No units found for your company
            </Typography>
          )}
        </FormControl>
      </Grid>

      {/* USER INPUT: Purchase Details */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ mt: 2 }}>
          🛒 Purchase Details (USER INPUT)
        </Typography>
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Amount Purchased (A) *"
          type="number"
          value={formData.amount_purchased}
          onChange={(e) => handleChange('amount_purchased', parseFloat(e.target.value) || 0)}
          required
          inputProps={{ step: '0.01', min: '0' }}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth required>
          <InputLabel>Unit *</InputLabel>
          <Select
            value={formData.unit_selection}
            onChange={(e) => handleChange('unit_selection', e.target.value)}
            label="Unit *"
          >
            {UNIT_OPTIONS.map((unit) => (
              <MenuItem key={unit} value={unit}>{unit}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="No. of Units *"
          type="number"
          value={formData.no_of_units}
          onChange={(e) => handleChange('no_of_units', parseFloat(e.target.value) || 0)}
          required
          inputProps={{ step: '1', min: '1' }}
          helperText="Number of equipment units"
        />
      </Grid>

      {/* AUTO-CALCULATED: Final Result */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="success.main" fontWeight={600} sx={{ mt: 2 }}>
          🧮 Calculated Result (AUTO-CALCULATED)
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, backgroundColor: '#00BCD4', borderRadius: '8px' }}>
          <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }} gutterBottom>
            Final Emissions Formula: A × B / {formData.unit_selection === 'kg' ? '1000' : '1'}
          </Typography>
          <Typography variant="h5" fontWeight="600" sx={{ color: 'white' }}>
            {estimatedEmissions.toFixed(4)} tCO₂e
          </Typography>
          <Typography variant="caption" sx={{ color: 'white', opacity: 0.8 }}>
            = {formData.amount_purchased} × {formData.gwp} / {formData.unit_selection === 'kg' ? '1000' : '1'}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}

// Scale Base Table Component
function ScaleBaseTable({ items, onDelete, formatNumber }: { items: ScaleBaseEmission[], onDelete: (name: string, doctype: string) => void, formatNumber: (num: number) => string }) {
  return (
    <Table>
      <TableHead>
        <TableRow sx={{ backgroundColor: '#F5F7FA' }}>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>S.No</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Date</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Gas Type</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Unit</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Inventory Start</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Inventory Close</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Emissions (tCO₂e)</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.name}
            sx={{ '&:hover': { backgroundColor: '#F9FAFB' }, transition: 'background-color 0.2s' }}
          >
            <TableCell>{item.s_no}</TableCell>
            <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
            <TableCell>
              <Chip label={item.gas_type} size="small" sx={{ backgroundColor: '#E3F2FD' }} />
            </TableCell>
            <TableCell>
              <Chip label={item.unit_selection} size="small" sx={{ backgroundColor: '#FFF3E0' }} />
            </TableCell>
            <TableCell>{formatNumber(item.inventory_start)}</TableCell>
            <TableCell>{formatNumber(item.inventory_close)}</TableCell>
            <TableCell>
              <Typography fontWeight="600" color="#00BCD4">
                {formatNumber(item.etco2eq || 0)}
              </Typography>
            </TableCell>
            <TableCell>
              <IconButton
                size="small"
                onClick={() => onDelete(item.name, 'Fugitive Scale Base')}
                sx={{ color: '#F44336', '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.08)' } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Screening Table Component
function ScreeningTable({ items, onDelete, formatNumber }: { items: ScreeningEmission[], onDelete: (name: string, doctype: string) => void, formatNumber: (num: number) => string }) {
  return (
    <Table>
      <TableHead>
        <TableRow sx={{ backgroundColor: '#F5F7FA' }}>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>S.No</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Date</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Equipment</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Refrigerant</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>GWP</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>No. Units</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Emissions (tCO₂e)</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.name}
            sx={{ '&:hover': { backgroundColor: '#F9FAFB' }, transition: 'background-color 0.2s' }}
          >
            <TableCell>{item.s_no}</TableCell>
            <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
            <TableCell>{item.equipment_selection}</TableCell>
            <TableCell>
              <Chip label={item.type_refrigeration} size="small" sx={{ backgroundColor: '#E3F2FD' }} />
            </TableCell>
            <TableCell>{formatNumber(item.gwp_refrigeration)}</TableCell>
            <TableCell>{item.no_of_units}</TableCell>
            <TableCell>
              <Typography fontWeight="600" color="#00BCD4">
                {formatNumber(item.etco2eq || 0)}
              </Typography>
            </TableCell>
            <TableCell>
              <IconButton
                size="small"
                onClick={() => onDelete(item.name, 'Fugitive Screening')}
                sx={{ color: '#F44336', '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.08)' } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Simple Table Component
function SimpleTable({ items, onDelete, formatNumber }: { items: SimpleEmission[], onDelete: (name: string, doctype: string) => void, formatNumber: (num: number) => string }) {
  return (
    <Table>
      <TableHead>
        <TableRow sx={{ backgroundColor: '#F5F7FA' }}>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>S.No</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Date</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Invoice No</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Refrigerant</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Amount</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Unit</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>GWP</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Emissions (tCO₂e)</TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.name}
            sx={{ '&:hover': { backgroundColor: '#F9FAFB' }, transition: 'background-color 0.2s' }}
          >
            <TableCell>{item.s_no}</TableCell>
            <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
            <TableCell>{item.invoice_no || '-'}</TableCell>
            <TableCell>
              <Chip label={item.type_refrigeration} size="small" sx={{ backgroundColor: '#E3F2FD' }} />
            </TableCell>
            <TableCell>{formatNumber(item.amount_purchased)}</TableCell>
            <TableCell>
              <Chip label={item.unit_selection} size="small" sx={{ backgroundColor: '#FFF3E0' }} />
            </TableCell>
            <TableCell>{formatNumber(item.gwp)}</TableCell>
            <TableCell>
              <Typography fontWeight="600" color="#00BCD4">
                {formatNumber(item.etco2eq || 0)}
              </Typography>
            </TableCell>
            <TableCell>
              <IconButton
                size="small"
                onClick={() => onDelete(item.name, 'Fugitive Simple')}
                sx={{ color: '#F44336', '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.08)' } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
