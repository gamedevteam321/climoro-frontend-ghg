import React, { useState, useEffect, useMemo } from 'react';
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
  Stack,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  BarChart as BarChartIcon,
  ElectricBolt as ElectricityIcon,
  Assignment as EntryIcon,
  AttachFile as AttachIcon,
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

interface ElectricityEmission {
  name: string;
  s_no?: number;
  date: string;
  invoice_no?: string;
  upload_invoice?: string;
  activity_types: string;
  activity_data: number;
  no_of_units: number;
  unit_selection: string;
  ef: number;
  etco2eq: number;
  company?: string;
  company_unit?: string;
}

interface ElectricityFormData {
  s_no: number;
  date: Date | null;
  invoice_no: string;
  upload_invoice: File | null;
  activity_types: string;
  activity_data: number;
  no_of_units: number;
  unit_selection: string;
  ef: number;
  etco2eq: number;
  company: string;
  company_unit: string;
}

const activityTypes = [
  'Office Buildings',
  'Manufacturing Facilities',
  'Warehouses',
  'Data Centers',
  'Retail Stores',
  'Healthcare Facilities',
  'Educational Institutions',
  'Residential Buildings',
  'Other'
];

const EMISSION_FACTOR = 0.757; // tCO2e per kWh

export default function ElectricityPurchased() {
  const { currentUser } = useFrappeAuth();
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

  const [formData, setFormData] = useState<ElectricityFormData>({
    s_no: 1,
    date: new Date(),
    invoice_no: '',
    upload_invoice: null,
    activity_types: '',
    activity_data: 0,
    no_of_units: 0,
    unit_selection: 'kWh',
    ef: EMISSION_FACTOR,
    etco2eq: 0,
    company: '',
    company_unit: '',
  });

  // Fetch current user's company
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

  const userCompany = currentUserData?.message?.company;

  // Fetch Electricity Purchased data
  const { data: electricityData, isLoading, error, mutate } = useFrappeGetCall<{ message: ElectricityEmission[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Electricity Purchased',
      fields: ['name', 's_no', 'date', 'invoice_no', 'upload_invoice', 'activity_types', 'activity_data', 'no_of_units', 'unit_selection', 'ef', 'etco2eq', 'company', 'company_unit'],
      filters: userCompany ? [['company', '=', userCompany]] : undefined,
      order_by: 'date desc',
      limit_page_length: 1000,
    },
    userCompany ? `electricity-purchased-list-${userCompany}` : null,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Fetch Company Units - use helper with fallback to client.get_list if needed
  const { data: unitsHelper } = useFrappeGetCall<{ message?: { company?: string; units?: string[] } }>(
    userCompany ? 'climoro_onboarding.climoro_onboarding.api.get_current_user_company_units' : '',
    undefined,
    userCompany ? `user-company-units-helper-${userCompany}` : null,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );
  const helperUnits: Array<{ name: string; unit_name?: string }> =
    (unitsHelper?.message?.units || []).map((u) => ({ name: u })) as any;
  const shouldFetchAlt = userCompany && helperUnits.length === 0;
  const { data: unitsAlt } = useFrappeGetCall<{ message: Array<{ name: string; unit_name?: string }> }>(
    shouldFetchAlt ? 'frappe.client.get_list' : '',
    shouldFetchAlt
      ? {
          doctype: 'Units',
          fields: ['name', 'unit_name'],
          filters: [['company', '=', userCompany]],
          limit_page_length: 100,
        }
      : undefined,
    shouldFetchAlt ? `company-units-alt-${userCompany}` : null,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );
  const companyUnits = helperUnits.length ? helperUnits : (unitsAlt?.message || []);
  const emissions = electricityData?.message || [];

  const { createDoc, loading: createLoading, error: createError } = useFrappeCreateDoc();
  const { deleteDoc, loading: deleteLoading, error: deleteError } = useFrappeDeleteDoc();

  // Set company when userCompany is available
  useEffect(() => {
    if (userCompany) {
      setFormData(prev => ({ ...prev, company: userCompany }));
    }
  }, [userCompany]);

  // Update s_no when emissions change
  useEffect(() => {
    if (emissions.length > 0) {
      const maxSNo = Math.max(...emissions.map(e => e.s_no || 0));
      setFormData(prev => ({ ...prev, s_no: maxSNo + 1 }));
    } else {
      setFormData(prev => ({ ...prev, s_no: 1 }));
    }
  }, [emissions.length]);

  // Auto-calculate etco2eq when activity_data changes
  useEffect(() => {
    const calculatedEtCO2eq = (formData.activity_data || 0) * EMISSION_FACTOR;
    setFormData(prev => ({ ...prev, etco2eq: Number(calculatedEtCO2eq.toFixed(2)) }));
  }, [formData.activity_data]);

  const handleOpenDialog = () => setOpenDialog(true);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      s_no: emissions.length > 0 ? Math.max(...emissions.map(e => e.s_no || 0)) + 1 : 1,
      date: new Date(),
      invoice_no: '',
      upload_invoice: null,
      activity_types: '',
      activity_data: 0,
      no_of_units: 0,
      unit_selection: 'kWh',
      ef: EMISSION_FACTOR,
      etco2eq: 0,
      company: userCompany || '',
      company_unit: '',
    });
  };

  const handleChange = (field: keyof ElectricityFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFormData(prev => ({ ...prev, upload_invoice: event.target.files![0] }));
    }
  };

  const handleSubmit = async () => {
    // Validation - invoice_no is required in backend
    if (!formData.date || !formData.invoice_no || !formData.activity_types || !formData.activity_data || !formData.no_of_units || !formData.company || !formData.company_unit) {
      showAlert({ type: 'error', message: 'Please fill in all required fields (Date, Invoice No, Activity Type, Activity Data, No of Units, Company, Company Unit)' });
      return;
    }

    // Additional validation for numeric fields
    if (formData.activity_data <= 0) {
      showAlert({ type: 'error', message: 'Activity Data must be greater than 0' });
      return;
    }

    if (formData.no_of_units <= 0) {
      showAlert({ type: 'error', message: 'No of Units must be greater than 0' });
      return;
    }

    try {
      const docData: any = {
        s_no: formData.s_no,
        date: formData.date.toISOString().split('T')[0],
        invoice_no: formData.invoice_no.trim(), // Required field - ensure it's not empty
        activity_types: formData.activity_types,
        activity_data: formData.activity_data,
        no_of_units: formData.no_of_units,
        unit_selection: formData.unit_selection,
        ef: formData.ef,
        etco2eq: formData.etco2eq,
        company: formData.company,
        company_unit: formData.company_unit,
      };

      // TODO: Handle file upload if needed (requires separate upload API)
      // For now, we'll skip the file upload field

      console.log('Submitting Electricity Purchased document:', docData);
      console.log('Company:', formData.company);
      console.log('Company Unit:', formData.company_unit);

      // Use createDoc hook which handles CSRF tokens automatically (same as Stationary and Fugitive forms)
      // The SDK manages CSRF tokens internally, so we don't need to handle them manually
      const result = await createDoc('Electricity Purchased', docData);
      
      console.log('✅ Document created successfully:', result);
      showAlert({ type: 'success', message: 'Entry added successfully!' });
      mutate(); // Refresh the data list
      handleCloseDialog(); // Close the dialog
    } catch (err: any) {
      console.error('❌ Error creating entry:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      // Better error message for CSRF errors (same as FugitiveEmissions)
      if (err.exception && err.exception.includes('CSRFTokenError')) {
        showAlert({ type: 'error', message: 'Session expired. Please refresh the page and try again.' });
      } else {
        showAlert({ type: 'error', message: err.message || err._server_messages || 'Failed to add entry. Please try again.' });
      }
    }
  };

  const handleDeleteClick = (name: string, doctype: string) => {
    setItemToDelete({ name, doctype });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      try {
        await deleteDoc(itemToDelete.doctype, itemToDelete.name);
        showAlert({ type: 'success', message: 'Entry deleted successfully!' });
        mutate(); // Revalidate data
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      } catch (err: any) {
        console.error('Failed to delete document:', err);
        showAlert({ type: 'error', message: `Failed to delete entry: ${err.message || 'Unknown error'}` });
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = emissions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(emissions.length / itemsPerPage);

  // Prepare chart data with time range filtering
  const chartData = useMemo(() => {
    let startDate: Date;
    let endDate: Date = new Date();
    
    if (timeRange === 'custom' && customStartDate && customEndDate) {
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      startDate = new Date();
      switch (timeRange) {
        case 'day':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 84);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 12);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 5);
          break;
      }
    }

    const filteredEmissions = emissions.filter((emission) => {
      if (!emission.date) return false;
      const emissionDate = new Date(emission.date);
      return emissionDate >= startDate && emissionDate <= endDate;
    });

    const groupedData = new Map<string, number>();
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
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
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
          periodKey = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          periodKey = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      allPeriods.push(periodKey);
      groupedData.set(periodKey, 0);
    }

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

    return allPeriods.map((period) => ({
      month: period,
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

  const hasError = !!error;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Electricity Purchased</h1>
            <p className="text-sm text-gray-600 mt-1">
              Scope 2: Indirect GHG emissions from the generation of purchased electricity
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
                  <ElectricityIcon sx={{ fontSize: 40, color: '#00BCD4', opacity: 0.8 }} />
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
          ) : hasError ? (
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" color="error" gutterBottom>
                ⚠️ Backend Doctype Not Found
              </Typography>
              <Typography color="text.secondary">
                The "Electricity Purchased" doctype doesn't exist in your Frappe backend yet.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Please create the doctype using Frappe Desk.
              </Typography>
            </Box>
          ) : emissions.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              No electricity purchased data found. Click "Add entry" to create your first entry.
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#F5F7FA' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Invoice No</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Activity Type</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Activity Data (kWh)</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>No of Units</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Unit</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>EF</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>tCO₂e</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentItems.map((item) => (
                      <TableRow key={item.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>{item.s_no}</TableCell>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell>{item.invoice_no || '-'}</TableCell>
                        <TableCell>{item.activity_types}</TableCell>
                        <TableCell>{formatNumber(item.activity_data)}</TableCell>
                        <TableCell>{item.no_of_units}</TableCell>
                        <TableCell>{item.unit_selection}</TableCell>
                        <TableCell>{formatNumber(item.ef)}</TableCell>
                        <TableCell>{formatNumber(item.etco2eq)}</TableCell>
                        <TableCell>
                          <IconButton 
                            color="error" 
                            size="small"
                            onClick={() => handleDeleteClick(item.name, 'Electricity Purchased')}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={emissions.length}
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
                Electricity Emission Trend over Time
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                Visualize emission patterns from purchased electricity
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
          PaperProps={{
            sx: {
              borderRadius: '16px',
              maxHeight: '90vh',
            }
          }}
        >
          <DialogTitle sx={{ 
            fontSize: '1.5rem', 
            fontWeight: 600, 
            pb: 1,
            borderBottom: '1px solid #E5E7EB'
          }}>
            Add Electricity Purchased Entry
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              {/* S.No - Auto-populated */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="S.No"
                  value={formData.s_no}
                  disabled
                  helperText="Auto-populated"
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      backgroundColor: '#F9FAFB',
                    }
                  }}
                />
              </Grid>

              {/* Date - User Input (Required) */}
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date *"
                  value={formData.date}
                  onChange={(newValue: Date | null) => handleChange('date', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </Grid>

              {/* Invoice No - User Input (Required) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Invoice No *"
                  value={formData.invoice_no}
                  onChange={(e) => handleChange('invoice_no', e.target.value)}
                  placeholder="Enter invoice number"
                />
              </Grid>

              {/* Upload Invoice - User Input (Optional) */}
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AttachIcon />}
                  fullWidth
                  sx={{ 
                    height: '56px',
                    textTransform: 'none',
                    borderColor: '#E5E7EB',
                    color: '#6B7280',
                    '&:hover': {
                      borderColor: '#00BCD4',
                      backgroundColor: 'rgba(0, 188, 212, 0.04)',
                    }
                  }}
                >
                  {formData.upload_invoice ? formData.upload_invoice.name : 'Upload Invoice (Optional)'}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                </Button>
              </Grid>

              {/* Activity Types - User Input (Required) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  required
                  label="Activity Type *"
                  value={formData.activity_types}
                  onChange={(e) => handleChange('activity_types', e.target.value)}
                >
                  <MenuItem value="">Select Activity...</MenuItem>
                  {activityTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Activity Data - User Input (Required) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Activity Data (kWh) *"
                  value={formData.activity_data || ''}
                  onChange={(e) => handleChange('activity_data', parseFloat(e.target.value) || 0)}
                  placeholder="Enter kWh consumed"
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>

              {/* No of Units - User Input (Required) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="No of Units *"
                  value={formData.no_of_units || ''}
                  onChange={(e) => handleChange('no_of_units', parseFloat(e.target.value) || 0)}
                  placeholder="Enter numeric value"
                  inputProps={{ step: '1', min: '0' }}
                />
              </Grid>

              {/* Unit Selection - Fixed to kWh */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Unit"
                  value={formData.unit_selection}
                  disabled
                  helperText="Fixed to kWh"
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      backgroundColor: '#F9FAFB',
                    }
                  }}
                />
              </Grid>

              {/* Company Unit - User Input (Required) */}
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

              {/* Emission Factor - Fixed */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emission Factor (EF)"
                  value={formData.ef}
                  disabled
                  helperText="Fixed emission factor (tCO₂e per kWh)"
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      backgroundColor: '#F9FAFB',
                    }
                  }}
                />
              </Grid>

              {/* tCO2eq - Auto-calculated */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Total Emissions (tCO₂e)"
                  value={formatNumber(formData.etco2eq)}
                  disabled
                  helperText="Auto-calculated (Activity Data × EF)"
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      backgroundColor: '#F9FAFB',
                    }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid #E5E7EB' }}>
            <Button 
              onClick={handleCloseDialog}
              sx={{ 
                textTransform: 'none',
                color: '#6B7280',
                '&:hover': {
                  backgroundColor: '#F3F4F6',
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              variant="contained"
              disabled={createLoading}
              sx={{
                backgroundColor: '#00BCD4',
                '&:hover': { backgroundColor: '#008BA3' },
                textTransform: 'none',
                px: 3,
              }}
            >
              {createLoading ? 'Adding...' : 'Add Entry'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete Entry"
          message="Are you sure you want to delete this electricity purchased entry? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          confirmText="Delete"
          cancelText="Cancel"
        />
      </Box>
    </LocalizationProvider>
  );
}
