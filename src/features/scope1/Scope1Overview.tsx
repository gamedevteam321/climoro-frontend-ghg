import React, { useState, useMemo } from 'react';
import { useFrappeGetCall, useFrappeAuth } from 'frappe-react-sdk';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import {
  Factory as FactoryIcon,
  LocalShipping as MobileIcon,
  AcUnit as FugitiveIcon,
  Science as ProcessIcon,
  CalendarMonth as CalendarIcon,
  Assignment as EntryIcon,
  TrendingUp as TrendingIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
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
  Legend,
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface EmissionData {
  name: string;
  date: string;
  etco2eq: number;
  [key: string]: any;
}

export default function Scope1Overview() {
  const { currentUser } = useFrappeAuth();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  
  // Chart type states for each emission category
  const [stationaryChartType, setStationaryChartType] = useState<'bar' | 'line' | 'area'>('area');
  const [mobileChartType, setMobileChartType] = useState<'bar' | 'line' | 'area'>('area');
  const [fugitiveChartType, setFugitiveChartType] = useState<'bar' | 'line' | 'area'>('area');
  const [processChartType, setProcessChartType] = useState<'bar' | 'line' | 'area'>('area');

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

  // Fetch Stationary Emissions
  const { data: stationaryData, isLoading: stationaryLoading } = useFrappeGetCall<{ message: EmissionData[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Stationary Emissions',
      fields: ['name', 'date', 'etco2eq', 'company'],
      filters: userCompany ? [['company', '=', userCompany]] : undefined,
      limit_page_length: 1000,
      order_by: 'date desc',
    },
    undefined,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Fetch Mobile Combustion - Fuel Method
  const { data: mobileFuelData, isLoading: mobileFuelLoading } = useFrappeGetCall<{ message: EmissionData[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Mobile Combustion Fuel Method',
      fields: ['name', 'date', 'etco2eq', 'company'],
      filters: userCompany ? [['company', '=', userCompany]] : undefined,
      limit_page_length: 1000,
      order_by: 'date desc',
    },
    undefined,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Fetch Mobile Combustion - Transportation Method
  const { data: mobileTransportData, isLoading: mobileTransportLoading } = useFrappeGetCall<{ message: EmissionData[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Mobile Combustion Transportation Method',
      fields: ['name', 'date', 'etco2eq', 'company'],
      filters: userCompany ? [['company', '=', userCompany]] : undefined,
      limit_page_length: 1000,
      order_by: 'date desc',
    },
    undefined,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Fetch Fugitive Emissions - Scale Base
  const { data: fugitiveScaleBaseData, isLoading: fugitiveScaleBaseLoading } = useFrappeGetCall<{ message: EmissionData[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Fugitive Scale Base',
      fields: ['name', 'date', 'etco2eq', 'company'],
      filters: userCompany ? [['company', '=', userCompany]] : undefined,
      limit_page_length: 1000,
      order_by: 'date desc',
    },
    undefined,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Fetch Fugitive Emissions - Screening
  const { data: fugitiveScreeningData, isLoading: fugitiveScreeningLoading } = useFrappeGetCall<{ message: EmissionData[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Fugitive Screening',
      fields: ['name', 'date', 'etco2eq', 'company'],
      filters: userCompany ? [['company', '=', userCompany]] : undefined,
      limit_page_length: 1000,
      order_by: 'date desc',
    },
    undefined,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Fetch Fugitive Emissions - Simple
  const { data: fugitiveSimpleData, isLoading: fugitiveSimpleLoading } = useFrappeGetCall<{ message: EmissionData[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Fugitive Simple',
      fields: ['name', 'date', 'etco2eq', 'company'],
      filters: userCompany ? [['company', '=', userCompany]] : undefined,
      limit_page_length: 1000,
      order_by: 'date desc',
    },
    undefined,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const isLoading = stationaryLoading || mobileFuelLoading || mobileTransportLoading || 
                    fugitiveScaleBaseLoading || fugitiveScreeningLoading || fugitiveSimpleLoading;

  // Aggregate data
  const stationaryEmissions = stationaryData?.message || [];
  const mobileFuelEmissions = mobileFuelData?.message || [];
  const mobileTransportEmissions = mobileTransportData?.message || [];
  const fugitiveScaleBaseEmissions = fugitiveScaleBaseData?.message || [];
  const fugitiveScreeningEmissions = fugitiveScreeningData?.message || [];
  const fugitiveSimpleEmissions = fugitiveSimpleData?.message || [];

  // Combine mobile and fugitive
  const mobileEmissions = [...mobileFuelEmissions, ...mobileTransportEmissions];
  const fugitiveEmissions = [...fugitiveScaleBaseEmissions, ...fugitiveScreeningEmissions, ...fugitiveSimpleEmissions];

  // Process emissions would go here (currently empty)
  const processEmissions: EmissionData[] = [];

  // Calculate totals
  const stationaryTotal = stationaryEmissions.reduce((sum, item) => sum + (item.etco2eq || 0), 0);
  const mobileTotal = mobileEmissions.reduce((sum, item) => sum + (item.etco2eq || 0), 0);
  const fugitiveTotal = fugitiveEmissions.reduce((sum, item) => sum + (item.etco2eq || 0), 0);
  const processTotal = processEmissions.reduce((sum, item) => sum + (item.etco2eq || 0), 0);
  const totalEmissions = stationaryTotal + mobileTotal + fugitiveTotal + processTotal;

  // Calculate current month totals
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const getCurrentMonthTotal = (emissions: EmissionData[]) => {
    return emissions
      .filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      })
      .reduce((sum, item) => sum + (item.etco2eq || 0), 0);
  };

  const currentMonthEmissions = getCurrentMonthTotal([...stationaryEmissions, ...mobileEmissions, ...fugitiveEmissions, ...processEmissions]);

  // Calculate total entries
  const totalEntries = stationaryEmissions.length + mobileEmissions.length + fugitiveEmissions.length + processEmissions.length;

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Prepare chart data for each emission type
  const prepareChartData = (emissions: EmissionData[], label: string) => {
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

    // Filter emissions by date range
    const filteredEmissions = emissions.filter((emission) => {
      if (!emission.date) return false;
      const emissionDate = new Date(emission.date);
      return emissionDate >= startDate && emissionDate <= endDate;
    });

    // Group emissions by time period
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
      [label]: Number((groupedData.get(period) || 0).toFixed(2)),
    }));
  };

  const stationaryChartData = useMemo(() => prepareChartData(stationaryEmissions, 'Stationary'), 
    [stationaryEmissions, timeRange, customStartDate, customEndDate]);
  const mobileChartData = useMemo(() => prepareChartData(mobileEmissions, 'Mobile'), 
    [mobileEmissions, timeRange, customStartDate, customEndDate]);
  const fugitiveChartData = useMemo(() => prepareChartData(fugitiveEmissions, 'Fugitive'), 
    [fugitiveEmissions, timeRange, customStartDate, customEndDate]);
  const processChartData = useMemo(() => prepareChartData(processEmissions, 'Process'), 
    [processEmissions, timeRange, customStartDate, customEndDate]);

  // Render chart based on selected type
  const renderChart = (
    data: any[], 
    dataKey: string, 
    chartType: 'bar' | 'line' | 'area', 
    color: string,
    gradientId: string
  ) => {
    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: 0, bottom: 0 },
    };

    const axisProps = {
      xAxis: {
        dataKey: 'month',
        style: { fontSize: '11px' },
        tick: { fill: '#6B7280' },
      },
      yAxis: {
        style: { fontSize: '11px' },
        tick: { fill: '#6B7280' },
      },
    };

    const tooltipProps = {
      contentStyle: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        border: 'none',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      },
    };

    if (chartType === 'bar') {
      return (
        <BarChart {...commonProps}>
          <defs>
            <linearGradient id={`${gradientId}Bar`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.9}/>
              <stop offset="100%" stopColor={color} stopOpacity={0.6}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis {...axisProps.xAxis} />
          <YAxis {...axisProps.yAxis} />
          <Tooltip {...tooltipProps} />
          <Bar dataKey={dataKey} fill={`url(#${gradientId}Bar)`} radius={[8, 8, 0, 0]} />
        </BarChart>
      );
    }

    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis {...axisProps.xAxis} />
          <YAxis {...axisProps.yAxis} />
          <Tooltip {...tooltipProps} />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={3}
            dot={{ fill: color, strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      );
    }

    // Default to area chart
    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis {...axisProps.xAxis} />
        <YAxis {...axisProps.yAxis} />
        <Tooltip {...tooltipProps} />
        <Area 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress sx={{ color: '#00BCD4' }} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
            Scope 1 Emissions Overview
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            Direct GHG emissions from sources owned or controlled by the company
          </Typography>
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
                  <TrendingIcon sx={{ fontSize: 40, color: '#00BCD4', opacity: 0.8 }} />
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
                      {totalEntries}
                    </Typography>
                  </Box>
                  <EntryIcon sx={{ fontSize: 40, color: '#FF9800', opacity: 0.8 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Time Range Filter */}
        <Box sx={{ mb: 4 }}>
          <Paper sx={{ p: 3, borderRadius: '12px' }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>
                  <TimeIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> Time Range
                </InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="day">Last 30 Days</MenuItem>
                  <MenuItem value="week">Last 12 Weeks</MenuItem>
                  <MenuItem value="month">Last 12 Months</MenuItem>
                  <MenuItem value="year">Last 5 Years</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>

              {timeRange === 'custom' && (
                <>
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
                </>
              )}
            </Stack>
          </Paper>
        </Box>

        {/* Charts Grid */}
        <Grid container spacing={3}>
          {/* Stationary Emissions Chart */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <FactoryIcon sx={{ color: '#00BCD4' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Stationary Emissions
                  </Typography>
                </Stack>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={stationaryChartType}
                    onChange={(e) => setStationaryChartType(e.target.value as any)}
                    sx={{ borderRadius: '8px', fontSize: '0.875rem' }}
                  >
                    <MenuItem value="bar">📊 Bar</MenuItem>
                    <MenuItem value="line">📈 Line</MenuItem>
                    <MenuItem value="area">📉 Area</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Total: {formatNumber(stationaryTotal)} tCO₂e ({stationaryEmissions.length} entries)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart(stationaryChartData, 'Stationary', stationaryChartType, '#00BCD4', 'stationaryGradient')}
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Mobile Combustion Chart */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <MobileIcon sx={{ color: '#10B981' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Mobile Combustion
                  </Typography>
                </Stack>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={mobileChartType}
                    onChange={(e) => setMobileChartType(e.target.value as any)}
                    sx={{ borderRadius: '8px', fontSize: '0.875rem' }}
                  >
                    <MenuItem value="bar">📊 Bar</MenuItem>
                    <MenuItem value="line">📈 Line</MenuItem>
                    <MenuItem value="area">📉 Area</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Total: {formatNumber(mobileTotal)} tCO₂e ({mobileEmissions.length} entries)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart(mobileChartData, 'Mobile', mobileChartType, '#10B981', 'mobileGradient')}
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Fugitive Emissions Chart */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <FugitiveIcon sx={{ color: '#8B5CF6' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Fugitive Emissions
                  </Typography>
                </Stack>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={fugitiveChartType}
                    onChange={(e) => setFugitiveChartType(e.target.value as any)}
                    sx={{ borderRadius: '8px', fontSize: '0.875rem' }}
                  >
                    <MenuItem value="bar">📊 Bar</MenuItem>
                    <MenuItem value="line">📈 Line</MenuItem>
                    <MenuItem value="area">📉 Area</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Total: {formatNumber(fugitiveTotal)} tCO₂e ({fugitiveEmissions.length} entries)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart(fugitiveChartData, 'Fugitive', fugitiveChartType, '#8B5CF6', 'fugitiveGradient')}
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Process Emissions Chart */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ProcessIcon sx={{ color: '#F59E0B' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Process Emissions
                  </Typography>
                </Stack>
                {processEmissions.length > 0 && (
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={processChartType}
                      onChange={(e) => setProcessChartType(e.target.value as any)}
                      sx={{ borderRadius: '8px', fontSize: '0.875rem' }}
                    >
                      <MenuItem value="bar">📊 Bar</MenuItem>
                      <MenuItem value="line">📈 Line</MenuItem>
                      <MenuItem value="area">📉 Area</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Total: {formatNumber(processTotal)} tCO₂e ({processEmissions.length} entries)
              </Typography>
              {processEmissions.length === 0 ? (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: 300,
                    backgroundColor: '#F9FAFB',
                    borderRadius: '12px',
                    border: '2px dashed #E5E7EB',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No process emission data available
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  {renderChart(processChartData, 'Process', processChartType, '#F59E0B', 'processGradient')}
                </ResponsiveContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
}

