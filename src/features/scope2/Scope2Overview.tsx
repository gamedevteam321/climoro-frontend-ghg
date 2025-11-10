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
  Bolt as ElectricityIcon,
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

export default function Scope2Overview() {
  const { currentUser } = useFrappeAuth();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('area');

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

  // Fetch Electricity Purchased
  const { data: electricityData, isLoading } = useFrappeGetCall<{ message: EmissionData[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Electricity Purchased',
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

  const electricityEmissions = electricityData?.message || [];

  // Calculate totals
  const totalEmissions = electricityEmissions.reduce((sum, item) => sum + (item.etco2eq || 0), 0);

  // Calculate current month total
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthEmissions = electricityEmissions
    .filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
    })
    .reduce((sum, item) => sum + (item.etco2eq || 0), 0);

  const totalEntries = electricityEmissions.length;

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Prepare chart data
  const prepareChartData = (emissions: EmissionData[], label: string) => {
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
      [label]: Number((groupedData.get(period) || 0).toFixed(2)),
    }));
  };

  const electricityChartData = useMemo(() => prepareChartData(electricityEmissions, 'Electricity'), 
    [electricityEmissions, timeRange, customStartDate, customEndDate]);

  // Render chart based on selected type
  const renderChart = (
    data: any[], 
    dataKey: string, 
    chartTypeVal: 'bar' | 'line' | 'area', 
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

    if (chartTypeVal === 'bar') {
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

    if (chartTypeVal === 'line') {
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
            Scope 2 Emissions Overview
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            Indirect GHG emissions from purchased electricity, heat, or steam
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

        {/* Electricity Purchased Chart */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ElectricityIcon sx={{ color: '#FFB020' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Electricity Purchased
                  </Typography>
                </Stack>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as any)}
                    sx={{ borderRadius: '8px', fontSize: '0.875rem' }}
                  >
                    <MenuItem value="bar">📊 Bar</MenuItem>
                    <MenuItem value="line">📈 Line</MenuItem>
                    <MenuItem value="area">📉 Area</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Total: {formatNumber(totalEmissions)} tCO₂e ({totalEntries} entries)
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                {renderChart(electricityChartData, 'Electricity', chartType, '#FFB020', 'electricityGradient')}
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
}

