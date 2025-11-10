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
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  LocalGasStation as FuelIcon,
  DirectionsCar as TransportIcon,
  CalendarMonth as CalendarIcon,
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

interface FuelMethodEmission {
  name: string;
  s_no?: number;
  date: string;
  vehicle_no: string;
  fuel_selection: string;
  fuel_used: number;
  unit_selection: string;
  company?: string;
  company_unit?: string;
  efco2?: number;
  efch4?: number;
  efn20?: number;
  eco2?: number;
  ech4?: number;
  en20?: number;
  etco2eq: number;
}

interface TransportMethodEmission {
  name: string;
  s_no?: number;
  date: string;
  vehicle_no: string;
  transportation_type: string;
  distance_traveled: number;
  unit_selection: string;
  company?: string;
  company_unit?: string;
  efco2?: number;
  efch4?: number;
  efn20?: number;
  eco2?: number;
  ech4?: number;
  en20?: number;
  etco2eq: number;
}

interface FuelFormData {
  s_no: number;
  date: string;
  vehicle_no: string;
  fuel_selection: string;
  fuel_used: string;
  unit_selection: string;
  company: string;
  company_unit: string;
}

interface TransportFormData {
  s_no: number;
  date: string;
  vehicle_no: string;
  transportation_type: string;
  distance_traveled: string;
  unit_selection: string;
  company: string;
  company_unit: string;
}

interface MobileEmissionFactor {
  name: string;
  calculation_method: string;
  region: string;
  vehicle_category: string;
  vehicle_sub_category_1?: string;
  vehicle_sub_category_2?: string;
  fuel_type: string;
  ef_co2: number;
  ef_ch4: number;
  ef_n2o: number;
  ef_unit: string;
}

export default function MobileCombustion() {
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedFuelEntry, setSelectedFuelEntry] = useState<FuelMethodEmission | null>(null);
  const [selectedTransportEntry, setSelectedTransportEntry] = useState<TransportMethodEmission | null>(null);
  const [nextFuelSerialNo, setNextFuelSerialNo] = useState(1);
  const [nextTransportSerialNo, setNextTransportSerialNo] = useState(1);
  
  // Pagination state for Fuel Method
  const [fuelCurrentPage, setFuelCurrentPage] = useState(1);
  const [fuelItemsPerPage, setFuelItemsPerPage] = useState(10);
  
  // Pagination state for Transport Method
  const [transportCurrentPage, setTransportCurrentPage] = useState(1);
  const [transportItemsPerPage, setTransportItemsPerPage] = useState(10);
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    recordName: '',
    doctype: '' as 'fuel' | 'transport' | '',
  });
  
  // Chart filter states
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'stacked'>('line');
  
  // Emission factors organized by calculation method and fuel type
  const [fuelEmissionFactors, setFuelEmissionFactors] = useState<{ [key: string]: MobileEmissionFactor[] }>({});
  const [transportEmissionFactors, setTransportEmissionFactors] = useState<{ [key: string]: MobileEmissionFactor[] }>({});
  
  // Dynamic lists from emission factors
  const [availableFuelTypes, setAvailableFuelTypes] = useState<string[]>([]);
  const [availableTransportTypes, setAvailableTransportTypes] = useState<string[]>([]);

  // Fuel Method Form Data
  const [fuelFormData, setFuelFormData] = useState<FuelFormData>({
    s_no: 1,
    date: new Date().toISOString().split('T')[0],
    vehicle_no: '',
    fuel_selection: '',
    fuel_used: '',
    unit_selection: '',
    company: '',
    company_unit: '',
  });

  // Transport Method Form Data
  const [transportFormData, setTransportFormData] = useState<TransportFormData>({
    s_no: 1,
    date: new Date().toISOString().split('T')[0],
    vehicle_no: '',
    transportation_type: '',
    distance_traveled: '',
    unit_selection: '',
    company: '',
    company_unit: '',
  });

  // Calculated fields for Fuel Method
  const [fuelEfco2, setFuelEfco2] = useState<number>(0);
  const [fuelEfch4, setFuelEfch4] = useState<number>(0);
  const [fuelEfn2o, setFuelEfn2o] = useState<number>(0);
  const [fuelEco2, setFuelEco2] = useState<number>(0);
  const [fuelEch4, setFuelEch4] = useState<number>(0);
  const [fuelEn2o, setFuelEn2o] = useState<number>(0);
  const [fuelEtco2eq, setFuelEtco2eq] = useState<number>(0);

  // Calculated fields for Transport Method
  const [transportEfco2, setTransportEfco2] = useState<number>(0);
  const [transportEfch4, setTransportEfch4] = useState<number>(0);
  const [transportEfn2o, setTransportEfn2o] = useState<number>(0);
  const [transportEco2, setTransportEco2] = useState<number>(0);
  const [transportEch4, setTransportEch4] = useState<number>(0);
  const [transportEn2o, setTransportEn2o] = useState<number>(0);
  const [transportEtco2eq, setTransportEtco2eq] = useState<number>(0);

  const { createDoc } = useFrappeCreateDoc();
  const { deleteDoc } = useFrappeDeleteDoc();
  const { currentUser } = useFrappeAuth();

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
      setFuelFormData(prev => ({ ...prev, company: userCompany }));
      setTransportFormData(prev => ({ ...prev, company: userCompany }));
    }
  }, [userCompany]);

  // Fetch units based on user's company from Units doctype
  const { data: unitsData } = useFrappeGetCall<{ message: Array<{ name: string; unit_name?: string; [key: string]: any }> }>(
    userCompany ? 'frappe.client.get_list' : '',
    userCompany ? {
      doctype: 'Units',
      fields: ['*'],
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

  // Fetch Fuel Method data
  const { data: fuelMethodData, isLoading: fuelLoading, error: fuelError, mutate: mutateFuel } = useFrappeGetCall<{
    message: FuelMethodEmission[];
  }>(
    'frappe.client.get_list',
    {
      doctype: 'Mobile Combustion Fuel Method',
      fields: ['*'],
      order_by: 'date desc',
      limit_page_length: 100,
    },
    'fuel-method-emissions-list',
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const fuelEmissions = fuelMethodData?.message || [];

  // Fetch Transportation Method data
  const { data: transportMethodData, isLoading: transportLoading, error: transportError, mutate: mutateTransport } = useFrappeGetCall<{
    message: TransportMethodEmission[];
  }>(
    'frappe.client.get_list',
    {
      doctype: 'Mobile Combustion Transportation Method',
      fields: ['*'],
      order_by: 'date desc',
      limit_page_length: 100,
    },
    'transport-method-emissions-list',
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const transportEmissions = transportMethodData?.message || [];

  // Fetch Mobile Combustion Emission Factors
  const { data: emissionFactorData } = useFrappeGetCall<{ message: MobileEmissionFactor[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Mobile Combustion EF Master',
      fields: ['*'],
      limit_page_length: 500,
    },
    'mobile-emission-factors',
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Organize emission factors by calculation method and fuel type
  useEffect(() => {
    if (emissionFactorData?.message && emissionFactorData.message.length > 0) {
      console.log('📥 Mobile Emission Factor Data loaded:', emissionFactorData.message.length, 'records');
      
      // Separate fuel-based and distance-based factors
      const fuelBased: { [key: string]: MobileEmissionFactor[] } = {};
      const distanceBased: { [key: string]: MobileEmissionFactor[] } = {};
      
      emissionFactorData.message.forEach((factor) => {
        if (factor.calculation_method === 'Fuel-Based') {
          if (!fuelBased[factor.fuel_type]) {
            fuelBased[factor.fuel_type] = [];
          }
          fuelBased[factor.fuel_type].push(factor);
        } else if (factor.calculation_method === 'Distance-Based') {
          if (!distanceBased[factor.vehicle_category]) {
            distanceBased[factor.vehicle_category] = [];
          }
          distanceBased[factor.vehicle_category].push(factor);
        }
      });
      
      console.log('📦 Organized fuel-based factors:', Object.keys(fuelBased));
      console.log('📦 Organized distance-based factors:', Object.keys(distanceBased));
      setFuelEmissionFactors(fuelBased);
      setTransportEmissionFactors(distanceBased);
      
      // Extract unique fuel types and transport types
      const fuelTypes = Object.keys(fuelBased).sort();
      const transportTypes = Object.keys(distanceBased).sort();
      
      console.log('🔥 Available fuel types:', fuelTypes);
      console.log('🚗 Available transport types:', transportTypes);
      setAvailableFuelTypes(fuelTypes);
      setAvailableTransportTypes(transportTypes);
    } else {
      console.warn('⚠️ No mobile emission factor data received');
      setFuelEmissionFactors({});
      setTransportEmissionFactors({});
      setAvailableFuelTypes([]);
      setAvailableTransportTypes([]);
    }
  }, [emissionFactorData]);

  // Update serial numbers when emissions change
  useEffect(() => {
    if (fuelEmissions.length > 0) {
      const maxSerialNo = Math.max(...fuelEmissions.map(e => e.s_no || 0));
      setNextFuelSerialNo(maxSerialNo + 1);
      setFuelFormData(prev => ({ ...prev, s_no: maxSerialNo + 1 }));
    }
  }, [fuelEmissions]);

  useEffect(() => {
    if (transportEmissions.length > 0) {
      const maxSerialNo = Math.max(...transportEmissions.map(e => e.s_no || 0));
      setNextTransportSerialNo(maxSerialNo + 1);
      setTransportFormData(prev => ({ ...prev, s_no: maxSerialNo + 1 }));
    }
  }, [transportEmissions]);

  // Auto-populate emission factors for Fuel Method when fuel is selected
  useEffect(() => {
    if (fuelFormData.fuel_selection && Object.keys(fuelEmissionFactors).length > 0) {
      const factors = fuelEmissionFactors[fuelFormData.fuel_selection];
      if (factors && factors.length > 0) {
        // Use the first matching factor (you can add more sophisticated matching logic)
        const factor = factors[0];
        console.log('🔥 Auto-populating fuel emission factors:', factor);
        setFuelEfco2(factor.ef_co2 || 0);
        setFuelEfch4(factor.ef_ch4 || 0);
        setFuelEfn2o(factor.ef_n2o || 0);
      } else {
        console.warn('⚠️ No emission factors found for fuel:', fuelFormData.fuel_selection);
        setFuelEfco2(0);
        setFuelEfch4(0);
        setFuelEfn2o(0);
      }
    }
  }, [fuelFormData.fuel_selection, fuelEmissionFactors]);

  // Auto-populate emission factors for Transport Method when transportation type is selected
  useEffect(() => {
    if (transportFormData.transportation_type && Object.keys(transportEmissionFactors).length > 0) {
      const factors = transportEmissionFactors[transportFormData.transportation_type];
      if (factors && factors.length > 0) {
        // Use the first matching factor (you can add more sophisticated matching logic)
        const factor = factors[0];
        console.log('🚗 Auto-populating transport emission factors:', factor);
        setTransportEfco2(factor.ef_co2 || 0);
        setTransportEfch4(factor.ef_ch4 || 0);
        setTransportEfn2o(factor.ef_n2o || 0);
      } else {
        console.warn('⚠️ No emission factors found for transport type:', transportFormData.transportation_type);
        setTransportEfco2(0);
        setTransportEfch4(0);
        setTransportEfn2o(0);
      }
    }
  }, [transportFormData.transportation_type, transportEmissionFactors]);

  // Calculate Fuel Method emissions
  useEffect(() => {
    const fuelUsed = parseFloat(fuelFormData.fuel_used) || 0;

    if (fuelUsed > 0 && fuelEfco2 > 0) {
      const calculatedEco2 = fuelUsed * fuelEfco2;
      const calculatedEch4 = fuelUsed * fuelEfch4;
      const calculatedEn2o = fuelUsed * fuelEfn2o;
      
      // GWP: CO2 = 1, CH4 = 25, N2O = 298
      const calculatedEtco2eq = calculatedEco2 + calculatedEch4 * 25 + calculatedEn2o * 298;

      setFuelEco2(calculatedEco2);
      setFuelEch4(calculatedEch4);
      setFuelEn2o(calculatedEn2o);
      setFuelEtco2eq(calculatedEtco2eq);
    } else {
      setFuelEco2(0);
      setFuelEch4(0);
      setFuelEn2o(0);
      setFuelEtco2eq(0);
    }
  }, [fuelFormData.fuel_used, fuelEfco2, fuelEfch4, fuelEfn2o]);

  // Calculate Transport Method emissions (using average transport constant = 10)
  useEffect(() => {
    const distance = parseFloat(transportFormData.distance_traveled) || 0;
    const AVG_TRANSPORT_CONSTANT = 10;

    if (distance > 0 && transportEfco2 > 0) {
      const calculatedEco2 = (distance / AVG_TRANSPORT_CONSTANT) * transportEfco2;
      const calculatedEch4 = (distance / AVG_TRANSPORT_CONSTANT) * transportEfch4;
      const calculatedEn2o = (distance / AVG_TRANSPORT_CONSTANT) * transportEfn2o;
      
      // GWP: CO2 = 1, CH4 = 25, N2O = 298
      const calculatedEtco2eq = calculatedEco2 + calculatedEch4 * 25 + calculatedEn2o * 298;

      setTransportEco2(calculatedEco2);
      setTransportEch4(calculatedEch4);
      setTransportEn2o(calculatedEn2o);
      setTransportEtco2eq(calculatedEtco2eq);
    } else {
      setTransportEco2(0);
      setTransportEch4(0);
      setTransportEn2o(0);
      setTransportEtco2eq(0);
    }
  }, [transportFormData.distance_traveled, transportEfco2, transportEfch4, transportEfn2o]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const resetForm = () => {
    if (activeTab === 0) {
      setFuelFormData({
        s_no: nextFuelSerialNo,
        date: new Date().toISOString().split('T')[0],
        vehicle_no: '',
        fuel_selection: '',
        fuel_used: '',
        unit_selection: '',
        company: userCompany,
        company_unit: '',
      });
      setFuelEfco2(0);
      setFuelEfch4(0);
      setFuelEfn2o(0);
      setFuelEco2(0);
      setFuelEch4(0);
      setFuelEn2o(0);
      setFuelEtco2eq(0);
    } else {
      setTransportFormData({
        s_no: nextTransportSerialNo,
        date: new Date().toISOString().split('T')[0],
        vehicle_no: '',
        transportation_type: '',
        distance_traveled: '',
        unit_selection: '',
        company: userCompany,
        company_unit: '',
      });
      setTransportEfco2(0);
      setTransportEfch4(0);
      setTransportEfn2o(0);
      setTransportEco2(0);
      setTransportEch4(0);
      setTransportEn2o(0);
      setTransportEtco2eq(0);
    }
  };

  const handleSaveFuelMethod = async () => {
    try {
      if (!fuelFormData.date || !fuelFormData.vehicle_no || !fuelFormData.fuel_selection || 
          !fuelFormData.fuel_used || !fuelFormData.unit_selection ||
          (companyUnits.length > 0 && !fuelFormData.company_unit)) {
        showAlert({
          
          message: 'Please fill all required fields',
          type: 'error',
        });
        return;
      }

      await createDoc('Mobile Combustion Fuel Method', {
        s_no: fuelFormData.s_no,
        date: fuelFormData.date,
        vehicle_no: fuelFormData.vehicle_no,
        fuel_selection: fuelFormData.fuel_selection,
        fuel_used: parseFloat(fuelFormData.fuel_used),
        unit_selection: fuelFormData.unit_selection,
        company: fuelFormData.company,
        company_unit: fuelFormData.company_unit || 'Default Unit',
        efco2: fuelEfco2,
        efch4: fuelEfch4,
        efn20: fuelEfn2o,
        eco2: fuelEco2,
        ech4: fuelEch4,
        en20: fuelEn2o,
        etco2eq: fuelEtco2eq,
      });

      showAlert({
        
        message: 'Fuel Method entry saved successfully!',
        type: 'success',
      });

      handleCloseDialog();
      mutateFuel();
      setNextFuelSerialNo(nextFuelSerialNo + 1);
    } catch (error: any) {
      console.error('Error saving fuel method entry:', error);
      showAlert({
        
        message: error?.message || 'Failed to save entry',
        type: 'error',
      });
    }
  };

  const handleSaveTransportMethod = async () => {
    try {
      if (!transportFormData.date || !transportFormData.vehicle_no || !transportFormData.transportation_type || 
          !transportFormData.distance_traveled || !transportFormData.unit_selection ||
          (companyUnits.length > 0 && !transportFormData.company_unit)) {
        showAlert({
          
          message: 'Please fill all required fields',
          type: 'error',
        });
        return;
      }

      await createDoc('Mobile Combustion Transportation Method', {
        s_no: transportFormData.s_no,
        date: transportFormData.date,
        vehicle_no: transportFormData.vehicle_no,
        transportation_type: transportFormData.transportation_type,
        distance_traveled: parseFloat(transportFormData.distance_traveled),
        unit_selection: transportFormData.unit_selection,
        company: transportFormData.company,
        company_unit: transportFormData.company_unit || 'Default Unit',
        efco2: transportEfco2,
        efch4: transportEfch4,
        efn20: transportEfn2o,
        eco2: transportEco2,
        ech4: transportEch4,
        en20: transportEn2o,
        etco2eq: transportEtco2eq,
      });

      showAlert({
        
        message: 'Transportation Method entry saved successfully!',
        type: 'success',
      });

      handleCloseDialog();
      mutateTransport();
      setNextTransportSerialNo(nextTransportSerialNo + 1);
    } catch (error: any) {
      console.error('Error saving transport method entry:', error);
      showAlert({
        
        message: error?.message || 'Failed to save entry',
        type: 'error',
      });
    }
  };

  const handleDeleteFuelClick = (name: string) => {
    setConfirmDialog({
      open: true,
      recordName: name,
      doctype: 'fuel',
    });
  };

  const handleDeleteTransportClick = (name: string) => {
    setConfirmDialog({
      open: true,
      recordName: name,
      doctype: 'transport',
    });
  };

  const handleConfirmDelete = async () => {
    const { recordName, doctype } = confirmDialog;
    setConfirmDialog({ open: false, recordName: '', doctype: '' });
    
    try {
      if (doctype === 'fuel') {
        await deleteDoc('Mobile Combustion Fuel Method', recordName);
        showAlert({
          
          message: 'Fuel method entry deleted successfully!',
          type: 'success',
        });
        mutateFuel();
      } else if (doctype === 'transport') {
        await deleteDoc('Mobile Combustion Transportation Method', recordName);
        showAlert({
          
          message: 'Transportation method entry deleted successfully!',
          type: 'success',
        });
        mutateTransport();
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      showAlert({
        
        message: error?.message || 'Failed to delete entry',
        type: 'error',
      });
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ open: false, recordName: '', doctype: '' });
  };

  const handleViewFuelEntry = (emission: FuelMethodEmission) => {
    setSelectedFuelEntry(emission);
    setOpenViewDialog(true);
  };

  const handleViewTransportEntry = (emission: TransportMethodEmission) => {
    setSelectedTransportEntry(emission);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedFuelEntry(null);
    setSelectedTransportEntry(null);
  };

  // Prepare chart data with time range filtering (combine both methods)
  const chartData = React.useMemo(() => {
    // Determine date range
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

    // Combine both emission types
    const allEmissions = [
      ...fuelEmissions.map(e => ({ ...e, type: 'fuel' })),
      ...transportEmissions.map(e => ({ ...e, type: 'transport' }))
    ];

    // Filter emissions by date range
    const filteredEmissions = allEmissions.filter((emission) => {
      if (!emission.date) return false;
      const emissionDate = new Date(emission.date);
      return emissionDate >= startDate && emissionDate <= endDate;
    });

    // Group emissions by time period
    const groupedData = new Map<string, number>();
    
    // Generate all time periods in range
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

    return allPeriods.map((period) => ({
      month: period,
      emissions: Number((groupedData.get(period) || 0).toFixed(2)),
    }));
  }, [fuelEmissions, transportEmissions, timeRange, customStartDate, customEndDate]);

  // Calculate statistics for cards - combine both methods
  const allEmissions = [...fuelEmissions, ...transportEmissions];
  const totalEmissions = allEmissions.reduce((sum, item) => sum + (item.etco2eq || 0), 0);
  
  const currentMonthEmissions = allEmissions
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
          <h1 className="text-2xl font-semibold text-gray-900">Mobile Combustion</h1>
          <p className="text-sm text-gray-600 mt-1">
            Scope 1: Direct GHG emissions from fuel combustion in company-owned or controlled mobile sources
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
                <TransportIcon sx={{ fontSize: 40, color: '#00BCD4', opacity: 0.8 }} />
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
                    {allEmissions.length}
                  </Typography>
                </Box>
                <EntryIcon sx={{ fontSize: 40, color: '#FF9800', opacity: 0.8 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 4, borderRadius: '12px', overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
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
          <Tab 
            icon={<FuelIcon />} 
            iconPosition="start" 
            label="Fuel Method"
            sx={{ flex: 1 }}
          />
          <Tab 
            icon={<TransportIcon />} 
            iconPosition="start" 
            label="Transportation Method"
            sx={{ flex: 1 }}
          />
        </Tabs>

        {/* Fuel Method Tab */}
        {activeTab === 0 && (
          <>
            {fuelLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: '#00BCD4' }} />
              </Box>
            ) : fuelError ? (
              <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>
                Error loading data. Please try again.
              </Box>
            ) : fuelEmissions.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                No fuel method data found. Click "Add entry" to create your first entry.
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#F5F7FA' }}>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>S.No</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Vehicle No</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Fuel Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Fuel Used</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Unit</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Company Unit</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>
                          Emissions (tCO2e)
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fuelEmissions
                        .slice((fuelCurrentPage - 1) * fuelItemsPerPage, fuelCurrentPage * fuelItemsPerPage)
                        .map((emission) => (
                      <TableRow
                        key={emission.name}
                        onClick={() => handleViewFuelEntry(emission)}
                        sx={{
                          '&:hover': { backgroundColor: '#F9FAFB' },
                          cursor: 'pointer',
                        }}
                      >
                        <TableCell>{emission.s_no || '-'}</TableCell>
                        <TableCell sx={{ color: '#00BCD4', fontWeight: 500 }}>
                          {emission.date
                            ? new Date(emission.date).toLocaleDateString('en-CA')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{emission.vehicle_no || 'N/A'}</TableCell>
                        <TableCell>{emission.fuel_selection || 'N/A'}</TableCell>
                        <TableCell>{emission.fuel_used || 0}</TableCell>
                        <TableCell>{emission.unit_selection || 'N/A'}</TableCell>
                        <TableCell>{emission.company_unit || 'N/A'}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {emission.etco2eq?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFuelClick(emission.name);
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
                
                {/* Pagination Component for Fuel Method */}
                <Pagination
                  currentPage={fuelCurrentPage}
                  totalPages={Math.ceil(fuelEmissions.length / fuelItemsPerPage)}
                  totalItems={fuelEmissions.length}
                  itemsPerPage={fuelItemsPerPage}
                  onPageChange={(page) => setFuelCurrentPage(page)}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setFuelItemsPerPage(newItemsPerPage);
                    setFuelCurrentPage(1);
                  }}
                />
              </>
            )}
          </>
        )}

        {/* Transportation Method Tab */}
        {activeTab === 1 && (
          <>
            {transportLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: '#00BCD4' }} />
              </Box>
            ) : transportError ? (
              <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>
                Error loading data. Please try again.
              </Box>
            ) : transportEmissions.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                No transportation method data found. Click "Add entry" to create your first entry.
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#F5F7FA' }}>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>S.No</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Vehicle No</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Transport Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Distance</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Unit</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Company Unit</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>
                          Emissions (tCO2e)
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transportEmissions
                        .slice((transportCurrentPage - 1) * transportItemsPerPage, transportCurrentPage * transportItemsPerPage)
                        .map((emission) => (
                      <TableRow
                        key={emission.name}
                        onClick={() => handleViewTransportEntry(emission)}
                        sx={{
                          '&:hover': { backgroundColor: '#F9FAFB' },
                          cursor: 'pointer',
                        }}
                      >
                        <TableCell>{emission.s_no || '-'}</TableCell>
                        <TableCell sx={{ color: '#00BCD4', fontWeight: 500 }}>
                          {emission.date
                            ? new Date(emission.date).toLocaleDateString('en-CA')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{emission.vehicle_no || 'N/A'}</TableCell>
                        <TableCell>{emission.transportation_type || 'N/A'}</TableCell>
                        <TableCell>{emission.distance_traveled || 0}</TableCell>
                        <TableCell>{emission.unit_selection || 'N/A'}</TableCell>
                        <TableCell>{emission.company_unit || 'N/A'}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {emission.etco2eq?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTransportClick(emission.name);
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
                
                {/* Pagination Component for Transport Method */}
                <Pagination
                  currentPage={transportCurrentPage}
                  totalPages={Math.ceil(transportEmissions.length / transportItemsPerPage)}
                  totalItems={transportEmissions.length}
                  itemsPerPage={transportItemsPerPage}
                  onPageChange={(page) => setTransportCurrentPage(page)}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setTransportItemsPerPage(newItemsPerPage);
                    setTransportCurrentPage(1);
                  }}
                />
              </>
            )}
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
              Mobile Combustion Emission Trend
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Combined emissions from fuel and transportation methods
            </Typography>
          </Box>

          {/* Right: Filter Dropdowns */}
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Time Range Selector */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="time-range-label">Period</InputLabel>
              <Select
                labelId="time-range-label"
                value={timeRange}
                label="Period"
                onChange={(e) => setTimeRange(e.target.value as any)}
                sx={{
                  borderRadius: '10px',
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
              <InputLabel id="chart-type-label">Chart Type</InputLabel>
              <Select
                labelId="chart-type-label"
                value={chartType}
                label="Chart Type"
                onChange={(e) => setChartType(e.target.value as any)}
                sx={{
                  borderRadius: '10px',
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

        {/* Custom Date Range Pickers */}
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
                      sx: { width: 200 },
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
                      sx: { width: 200 },
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
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 70 }}>
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
                    angle={chartData.length > 12 ? -45 : 0}
                    textAnchor={chartData.length > 12 ? "end" : "middle"}
                    height={chartData.length > 12 ? 80 : 50}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    label={{ 
                      value: 'Emissions (tCO2e)', 
                      angle: -90, 
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip />
                  <Bar dataKey="emissions" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                </BarChart>
              )}

              {chartType === 'line' && (
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis 
                    dataKey="month"
                    angle={chartData.length > 12 ? -45 : 0}
                    textAnchor={chartData.length > 12 ? "end" : "middle"}
                    height={chartData.length > 12 ? 80 : 50}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Emissions (tCO2e)', 
                      angle: -90, 
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip />
                  <Line type="monotone" dataKey="emissions" stroke="#00BCD4" strokeWidth={3} />
                </LineChart>
              )}

              {chartType === 'area' && (
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 70 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00BCD4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00BCD4" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis 
                    dataKey="month"
                    angle={chartData.length > 12 ? -45 : 0}
                    textAnchor={chartData.length > 12 ? "end" : "middle"}
                    height={chartData.length > 12 ? 80 : 50}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Emissions (tCO2e)', 
                      angle: -90, 
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip />
                  <Area type="monotone" dataKey="emissions" stroke="#00BCD4" fill="url(#areaGradient)" />
                </AreaChart>
              )}

              {chartType === 'stacked' && (
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 70 }}>
                  <defs>
                    <linearGradient id="stackedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis 
                    dataKey="month"
                    angle={chartData.length > 12 ? -45 : 0}
                    textAnchor={chartData.length > 12 ? "end" : "middle"}
                    height={chartData.length > 12 ? 80 : 50}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Emissions (tCO2e)', 
                      angle: -90, 
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="emissions" 
                    stackId="1"
                    stroke="#10B981" 
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
          Add {activeTab === 0 ? 'Fuel Method' : 'Transportation Method'} Entry
        </DialogTitle>
        <DialogContent>
          {activeTab === 0 ? (
            /* Fuel Method Form */
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Serial No"
                  value={fuelFormData.s_no}
                  fullWidth
                  disabled
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date *"
                  type="date"
                  value={fuelFormData.date}
                  onChange={(e) => setFuelFormData({ ...fuelFormData, date: e.target.value })}
                  fullWidth
                  required
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Vehicle Number *"
                  value={fuelFormData.vehicle_no}
                  onChange={(e) => setFuelFormData({ ...fuelFormData, vehicle_no: e.target.value })}
                  fullWidth
                  required
                  size="small"
                  placeholder="e.g., ABC1234"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
              <TextField
                label="Fuel Selection *"
                select
                value={fuelFormData.fuel_selection}
                onChange={(e) => setFuelFormData({ ...fuelFormData, fuel_selection: e.target.value })}
                fullWidth
                required
                size="small"
                helperText={availableFuelTypes.length === 0 ? "Loading fuel types..." : ""}
              >
                <MenuItem value="">Select Fuel</MenuItem>
                {availableFuelTypes.map((fuelType) => (
                  <MenuItem key={fuelType} value={fuelType}>
                    {fuelType}
                  </MenuItem>
                ))}
              </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fuel Used *"
                  type="number"
                  value={fuelFormData.fuel_used}
                  onChange={(e) => setFuelFormData({ ...fuelFormData, fuel_used: e.target.value })}
                  fullWidth
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Unit *"
                  select
                  value={fuelFormData.unit_selection}
                  onChange={(e) => setFuelFormData({ ...fuelFormData, unit_selection: e.target.value })}
                  fullWidth
                  required
                  size="small"
                >
                  <MenuItem value="">Select Unit</MenuItem>
                  <MenuItem value="KG">KG</MenuItem>
                  <MenuItem value="Tonnes">Tonnes</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Company"
                  value={fuelFormData.company}
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
                  value={fuelFormData.company_unit}
                  onChange={(e) => setFuelFormData({ ...fuelFormData, company_unit: e.target.value })}
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
                    Auto-Populated Emission Factors
                  </p>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField
                        label="EFCO2"
                        value={fuelEfco2.toFixed(8)}
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="EFCH4"
                        value={fuelEfch4.toFixed(8)}
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="EFN2O"
                        value={fuelEfn2o.toFixed(8)}
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Auto-Calculated Results */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    backgroundColor: '#F0F9FF',
                    p: 2,
                    borderRadius: '8px',
                    border: '1px solid #00BCD4',
                  }}
                >
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Auto-Calculated Emissions
                  </p>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField
                        label="ECO2"
                        value={fuelEco2.toFixed(4)}
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="ECH4"
                        value={fuelEch4.toFixed(8)}
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="EN2O"
                        value={fuelEn2o.toFixed(8)}
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Total CO2eq (tCO2e)"
                        value={fuelEtco2eq.toFixed(2)}
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
          ) : (
            /* Transportation Method Form */
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Serial No"
                  value={transportFormData.s_no}
                  fullWidth
                  disabled
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date *"
                  type="date"
                  value={transportFormData.date}
                  onChange={(e) => setTransportFormData({ ...transportFormData, date: e.target.value })}
                  fullWidth
                  required
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Vehicle Number *"
                  value={transportFormData.vehicle_no}
                  onChange={(e) => setTransportFormData({ ...transportFormData, vehicle_no: e.target.value })}
                  fullWidth
                  required
                  size="small"
                  placeholder="e.g., XYZ789"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
              <TextField
                label="Transportation Type *"
                select
                value={transportFormData.transportation_type}
                onChange={(e) => setTransportFormData({ ...transportFormData, transportation_type: e.target.value })}
                fullWidth
                required
                size="small"
                helperText={availableTransportTypes.length === 0 ? "Loading transportation types..." : ""}
              >
                <MenuItem value="">Select Type</MenuItem>
                {availableTransportTypes.map((transportType) => (
                  <MenuItem key={transportType} value={transportType}>
                    {transportType}
                  </MenuItem>
                ))}
              </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Distance Traveled *"
                  type="number"
                  value={transportFormData.distance_traveled}
                  onChange={(e) => setTransportFormData({ ...transportFormData, distance_traveled: e.target.value })}
                  fullWidth
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Unit *"
                  select
                  value={transportFormData.unit_selection}
                  onChange={(e) => setTransportFormData({ ...transportFormData, unit_selection: e.target.value })}
                  fullWidth
                  required
                  size="small"
                >
                  <MenuItem value="">Select Unit</MenuItem>
                  <MenuItem value="KM">KM</MenuItem>
                  <MenuItem value="Miles">Miles</MenuItem>
                  <MenuItem value="Nautical Miles">Nautical Miles</MenuItem>
                  <MenuItem value="ETC">ETC</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Company"
                  value={transportFormData.company}
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
                  value={transportFormData.company_unit}
                  onChange={(e) => setTransportFormData({ ...transportFormData, company_unit: e.target.value })}
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
                    Auto-Populated Emission Factors
                  </p>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField
                        label="EFCO2"
                        value={transportEfco2.toFixed(8)}
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="EFCH4"
                        value={transportEfch4.toFixed(8)}
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="EFN2O"
                        value={transportEfn2o.toFixed(8)}
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Auto-Calculated Results */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    backgroundColor: '#F0F9FF',
                    p: 2,
                    borderRadius: '8px',
                    border: '1px solid #00BCD4',
                  }}
                >
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Auto-Calculated Emissions (Distance / 10 × EF)
                  </p>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField
                        label="ECO2"
                        value={transportEco2.toFixed(4)}
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="ECH4"
                        value={transportEch4.toFixed(8)}
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="EN2O"
                        value={transportEn2o.toFixed(8)}
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Total CO2eq (tCO2e)"
                        value={transportEtco2eq.toFixed(2)}
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
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: 'none', color: '#6B7280' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={activeTab === 0 ? handleSaveFuelMethod : handleSaveTransportMethod}
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
          {activeTab === 0 ? 'Fuel Method' : 'Transportation Method'} Entry Details
        </DialogTitle>
        <DialogContent>
          {activeTab === 0 && selectedFuelEntry && (
            <Box sx={{ pt: 2 }}>
              <Card sx={{ mb: 2, boxShadow: 'none', border: '1px solid #E5E7EB' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#00BCD4' }}>
                    Basic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Date</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedFuelEntry.date ? new Date(selectedFuelEntry.date).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Vehicle Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedFuelEntry.vehicle_no || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Fuel Type</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedFuelEntry.fuel_selection || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Fuel Used</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedFuelEntry.fuel_used || 0} {selectedFuelEntry.unit_selection}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mb: 2, boxShadow: 'none', border: '1px solid #E5E7EB' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#00BCD4' }}>
                    Emission Factors
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">EFCO2</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedFuelEntry.efco2?.toFixed(6) || '0.000000'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">EFCH4</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedFuelEntry.efch4?.toFixed(6) || '0.000000'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">EFN2O</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedFuelEntry.efn20?.toFixed(6) || '0.000000'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ boxShadow: 'none', border: '1px solid #E5E7EB' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#00BCD4' }}>
                    Calculated Emissions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">ECO2</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedFuelEntry.eco2?.toFixed(4) || '0.0000'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">ECH4</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedFuelEntry.ech4?.toFixed(4) || '0.0000'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">EN2O</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedFuelEntry.en20?.toFixed(4) || '0.0000'}
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
                          {selectedFuelEntry.etco2eq?.toFixed(4) || '0.0000'} tCO2e
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}

          {activeTab === 1 && selectedTransportEntry && (
            <Box sx={{ pt: 2 }}>
              <Card sx={{ mb: 2, boxShadow: 'none', border: '1px solid #E5E7EB' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#00BCD4' }}>
                    Basic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Date</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedTransportEntry.date ? new Date(selectedTransportEntry.date).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Vehicle Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedTransportEntry.vehicle_no || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Transportation Type</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedTransportEntry.transportation_type || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Distance Traveled</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedTransportEntry.distance_traveled || 0} {selectedTransportEntry.unit_selection}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mb: 2, boxShadow: 'none', border: '1px solid #E5E7EB' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#00BCD4' }}>
                    Emission Factors
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">EFCO2</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedTransportEntry.efco2?.toFixed(6) || '0.000000'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">EFCH4</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedTransportEntry.efch4?.toFixed(6) || '0.000000'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">EFN2O</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedTransportEntry.efn20?.toFixed(6) || '0.000000'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ boxShadow: 'none', border: '1px solid #E5E7EB' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#00BCD4' }}>
                    Calculated Emissions (Distance / 10 × EF)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">ECO2</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedTransportEntry.eco2?.toFixed(4) || '0.0000'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">ECH4</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedTransportEntry.ech4?.toFixed(4) || '0.0000'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">EN2O</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedTransportEntry.en20?.toFixed(4) || '0.0000'}
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
                          {selectedTransportEntry.etco2eq?.toFixed(4) || '0.0000'} tCO2e
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
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

