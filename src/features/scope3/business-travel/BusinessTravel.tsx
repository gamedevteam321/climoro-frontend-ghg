import React, { useEffect, useMemo, useState } from 'react';
import { useFrappeAuth, useFrappeCreateDoc, useFrappeDeleteDoc, useFrappeGetCall } from 'frappe-react-sdk';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FlightTakeoff as FlightIcon,
  DirectionsCar as RoadIcon,
  LocalGasStation as FuelIcon,
  CalendarMonth as CalendarIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Pagination from '../../../components/ui/Pagination';
import { showAlert } from '../../../components/ui/AlertContainer';

type BTMethod = 'fuel' | 'distance' | 'spend';

// Doctype names (aligned with reference JS)
const DT_FUEL = 'Business Travel Fuel Based';
const DT_DISTANCE = 'Business Travel Distance Based';
const DT_SPEND = 'Business Travel Spend Based';

// ======= Back-end record shapes (list views) =======
interface FuelRecord {
  name: string;
  s_no?: number;
  date: string;
  description?: string;
  fuel_type?: string;
  fuel_consumed?: number;
  unit?: string;
  emission_factor?: number;
  ef_unit?: string;
  total_emissions?: number;
}

interface DistanceRecord {
  name: string;
  s_no?: number;
  date: string;
  description?: string;
  transport_mode?: string;
  distance_traveled?: number;
  unit?: string;
  emission_factor?: number;
  ef_unit?: string;
  total_emissions?: number;
}

interface SpendRecord {
  name: string;
  s_no?: number;
  date: string;
  description?: string;
  amount_spent?: number;
  currency?: string;
  eeio_ef?: number;
  ef_unit?: string;
  total_emissions?: number;
}

// ======= Form shapes (create dialog) =======
interface FuelForm {
  s_no: number;
  date: Date | null;
  description: string;
  fuel_type: string;
  fuel_consumed: number;
  unit: string;
  emission_factor: number;
  ef_unit: string;
  company: string;
  company_unit: string;
}

interface DistanceForm {
  s_no: number;
  date: Date | null;
  description: string;
  transport_mode: 'Air' | 'Rail' | 'Road';
  distance_traveled: number;
  unit: string;
  emission_factor: number;
  ef_unit: string;
  company: string;
  company_unit: string;
}

interface SpendForm {
  s_no: number;
  date: Date | null;
  description: string;
  amount_spent: number;
  currency: string;
  eeio_ef: number;
  ef_unit: string;
  company: string;
  company_unit: string;
}

const DEFAULT_FUEL: FuelForm = {
  s_no: 1,
  date: new Date(),
  description: '',
  fuel_type: '',
  fuel_consumed: 0,
  unit: 'litres',
  emission_factor: 0,
  ef_unit: 'kg CO2e/litre',
  company: '',
  company_unit: '',
};

const DEFAULT_DISTANCE: DistanceForm = {
  s_no: 1,
  date: new Date(),
  description: '',
  transport_mode: 'Air',
  distance_traveled: 0,
  unit: 'passenger-km',
  emission_factor: 0,
  ef_unit: 'kg CO2e/p-km',
  company: '',
  company_unit: '',
};

const DEFAULT_SPEND: SpendForm = {
  s_no: 1,
  date: new Date(),
  description: '',
  amount_spent: 0,
  currency: '$',
  eeio_ef: 0,
  ef_unit: 'kg CO2e/$',
  company: '',
  company_unit: '',
};

export default function BusinessTravel() {
  const { currentUser } = useFrappeAuth();
  const { createDoc } = useFrappeCreateDoc();
  const { deleteDoc } = useFrappeDeleteDoc();

  // Tabs
  const [activeTab, setActiveTab] = useState<BTMethod>('fuel');
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<{ name: string; doctype: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Company
  const { data: userDoc } = useFrappeGetCall<{ message: { company?: string; name: string } }>(
    currentUser ? 'frappe.client.get' : '',
    currentUser ? { doctype: 'User', name: currentUser } : undefined,
    currentUser ? `current-user-company-${currentUser}` : null,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  const userCompany = userDoc?.message?.company || 'Default Company';

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

  // Lists
  const fuelList = useFrappeGetCall<{ message: FuelRecord[] }>(
    'frappe.client.get_list',
    { doctype: DT_FUEL, fields: ['*'], limit_page_length: 1000, order_by: 'date desc' },
    'bt-fuel-list',
    { revalidateOnFocus: false, onError: () => console.warn('⚠️ Business Travel Fuel Based not found') }
  );

  const distanceList = useFrappeGetCall<{ message: DistanceRecord[] }>(
    'frappe.client.get_list',
    { doctype: DT_DISTANCE, fields: ['*'], limit_page_length: 1000, order_by: 'date desc' },
    'bt-distance-list',
    { revalidateOnFocus: false, onError: () => console.warn('⚠️ Business Travel Distance Based not found') }
  );

  const spendList = useFrappeGetCall<{ message: SpendRecord[] }>(
    'frappe.client.get_list',
    { doctype: DT_SPEND, fields: ['*'], limit_page_length: 1000, order_by: 'date desc' },
    'bt-spend-list',
    { revalidateOnFocus: false, onError: () => console.warn('⚠️ Business Travel Spend Based not found') }
  );

  const fuelRecords = fuelList.data?.message || [];
  const distanceRecords = distanceList.data?.message || [];
  const spendRecords = spendList.data?.message || [];

  // Forms
  const [fuelForm, setFuelForm] = useState<FuelForm>(DEFAULT_FUEL);
  const [distanceForm, setDistanceForm] = useState<DistanceForm>(DEFAULT_DISTANCE);
  const [spendForm, setSpendForm] = useState<SpendForm>(DEFAULT_SPEND);

  // Auto-populate company into forms
  useEffect(() => {
    if (userCompany) {
      setFuelForm(prev => ({ ...prev, company: userCompany }));
      setDistanceForm(prev => ({ ...prev, company: userCompany }));
      setSpendForm(prev => ({ ...prev, company: userCompany }));
    }
  }, [userCompany]);

  // Auto S.No based on records
  useEffect(() => setFuelForm(prev => ({ ...prev, s_no: fuelRecords.length + 1 })), [fuelRecords.length]);
  useEffect(() => setDistanceForm(prev => ({ ...prev, s_no: distanceRecords.length + 1 })), [distanceRecords.length]);
  useEffect(() => setSpendForm(prev => ({ ...prev, s_no: spendRecords.length + 1 })), [spendRecords.length]);

  // Totals for cards
  const totalEmissions = useMemo(() => {
    const totalFuel = fuelRecords.reduce((s, r) => s + (r.total_emissions || 0), 0);
    const totalDist = distanceRecords.reduce((s, r) => s + (r.total_emissions || 0), 0);
    const totalSpend = spendRecords.reduce((s, r) => s + (r.total_emissions || 0), 0);
    return totalFuel + totalDist + totalSpend;
  }, [fuelRecords, distanceRecords, spendRecords]);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);

  const isLoading = fuelList.isLoading || distanceList.isLoading || spendList.isLoading;
  const hasError =
    (activeTab === 'fuel' && fuelList.error) ||
    (activeTab === 'distance' && distanceList.error) ||
    (activeTab === 'spend' && spendList.error);

  // Dialog actions
  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  const handleSubmit = async () => {
    try {
      let doctype = '';
      let docData: any = {};

      if (activeTab === 'fuel') {
        if (!fuelForm.date || !fuelForm.fuel_type || !fuelForm.company || !fuelForm.company_unit) {
          showAlert({ type: 'error', message: 'Please fill Date, Fuel Type, Company, Company Unit' });
          return;
        }
        const total = (fuelForm.fuel_consumed || 0) * (fuelForm.emission_factor || 0);
        doctype = DT_FUEL;
        docData = {
          s_no: fuelForm.s_no,
          date: fuelForm.date.toISOString().split('T')[0],
          description: fuelForm.description,
          fuel_type: fuelForm.fuel_type,
          fuel_consumed: fuelForm.fuel_consumed,
          unit: fuelForm.unit,
          emission_factor: fuelForm.emission_factor,
          ef_unit: fuelForm.ef_unit,
          total_emissions: total,
          company: fuelForm.company,
          company_unit: fuelForm.company_unit,
        };
      } else if (activeTab === 'distance') {
        if (!distanceForm.date || !distanceForm.transport_mode || !distanceForm.company || !distanceForm.company_unit) {
          showAlert({ type: 'error', message: 'Please fill Date, Transport Mode, Company, Company Unit' });
          return;
        }
        const total = (distanceForm.distance_traveled || 0) * (distanceForm.emission_factor || 0);
        doctype = DT_DISTANCE;
        docData = {
          s_no: distanceForm.s_no,
          date: distanceForm.date.toISOString().split('T')[0],
          description: distanceForm.description,
          transport_mode: distanceForm.transport_mode,
          distance_traveled: distanceForm.distance_traveled,
          unit: distanceForm.unit,
          emission_factor: distanceForm.emission_factor,
          ef_unit: distanceForm.ef_unit,
          total_emissions: total,
          company: distanceForm.company,
          company_unit: distanceForm.company_unit,
        };
      } else {
        if (!spendForm.date || spendForm.amount_spent <= 0 || !spendForm.company || !spendForm.company_unit) {
          showAlert({ type: 'error', message: 'Please fill Date, Amount > 0, Company, Company Unit' });
          return;
        }
        const total = (spendForm.amount_spent || 0) * (spendForm.eeio_ef || 0);
        doctype = DT_SPEND;
        docData = {
          s_no: spendForm.s_no,
          date: spendForm.date.toISOString().split('T')[0],
          description: spendForm.description,
          amount_spent: spendForm.amount_spent,
          currency: spendForm.currency,
          eeio_ef: spendForm.eeio_ef,
          ef_unit: spendForm.ef_unit,
          total_emissions: total,
          company: spendForm.company,
          company_unit: spendForm.company_unit,
        };
      }

      const res = await createDoc(doctype, docData);
      console.log('✅ Business Travel entry created:', res);
      showAlert({ type: 'success', message: 'Entry added successfully!' });
      handleCloseDialog();
      if (activeTab === 'fuel') fuelList.mutate();
      else if (activeTab === 'distance') distanceList.mutate();
      else spendList.mutate();
    } catch (err: any) {
      console.error('❌ Error creating Business Travel entry:', err);
      if (err?.exception?.includes('CSRFTokenError')) {
        showAlert({ type: 'error', message: 'Session expired. Please refresh the page and try again.' });
      } else {
        showAlert({ type: 'error', message: err.message || 'Failed to add entry. Please try again.' });
      }
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteDoc(toDelete.doctype, toDelete.name);
      showAlert({ type: 'success', message: 'Entry deleted successfully!' });
      setDeleteDialogOpen(false);
      setToDelete(null);
      if (toDelete.doctype === DT_FUEL) fuelList.mutate();
      else if (toDelete.doctype === DT_DISTANCE) distanceList.mutate();
      else spendList.mutate();
    } catch (err: any) {
      console.error('Error deleting Business Travel entry:', err);
      showAlert({ type: 'error', message: err.message || 'Failed to delete entry' });
    }
  };

  // Current list by tab
  const currentList = activeTab === 'fuel' ? fuelRecords : activeTab === 'distance' ? distanceRecords : spendRecords;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = currentList.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(currentList.length / itemsPerPage) || 1;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Business Travel</h1>
            <p className="text-sm text-gray-600 mt-1">Scope 3 → Upstream → Employee business travel</p>
          </div>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{ backgroundColor: '#00BCD4', '&:hover': { backgroundColor: '#008BA3' }, textTransform: 'none', borderRadius: '8px', px: 3, color: 'white' }}
          >
            Add entry
          </Button>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Total Emissions
                    </Typography>
                    <Typography variant="h5" fontWeight="600">
                      {formatNumber(totalEmissions)} CO₂e
                    </Typography>
                  </Box>
                  <BarChartIcon sx={{ fontSize: 40, color: '#00BCD4', opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Latest Entry
                    </Typography>
                    <Typography variant="h6" fontWeight="600">
                      {currentList[0]?.date ? new Date(currentList[0].date).toLocaleDateString() : '-'}
                    </Typography>
                  </Box>
                  <CalendarIcon sx={{ fontSize: 40, color: '#4CAF50', opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Total Entries
                    </Typography>
                    <Typography variant="h5" fontWeight="600">{currentList.length}</Typography>
                  </Box>
                  <FuelIcon sx={{ fontSize: 40, color: '#FF9800', opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 4, borderRadius: '12px', overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => {
              setActiveTab(v);
              setCurrentPage(1);
            }}
            variant="fullWidth"
            sx={{
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: '0.95rem', color: '#64748b', flex: 1, maxWidth: 'none', '&.Mui-selected': { color: '#00BCD4' } },
              '& .MuiTabs-indicator': { backgroundColor: '#00BCD4', height: 3 },
            }}
          >
            <Tab icon={<FuelIcon fontSize="small" />} iconPosition="start" label="Fuel-Based Method" value="fuel" />
            <Tab icon={<FlightIcon fontSize="small" />} iconPosition="start" label="Distance-Based Method" value="distance" />
            <Tab icon={<RoadIcon fontSize="small" />} iconPosition="start" label="Spend-Based Method" value="spend" />
          </Tabs>

          {/* Table */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: '#00BCD4' }} />
            </Box>
          ) : hasError ? (
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" color="error" gutterBottom>
                Backend DocType Not Found
              </Typography>
              <Typography color="text.secondary">
                Please ensure the Business Travel doctypes exist: "{DT_FUEL}", "{DT_DISTANCE}", "{DT_SPEND}".
              </Typography>
            </Box>
          ) : currentItems.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No entries yet. Click "Add entry" to create your first record.</Typography>
            </Box>
          ) : (
            <>
              {activeTab === 'fuel' && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#F5F7FA' }}>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>S.No</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Fuel Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Fuel Consumed</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Unit</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>EF</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>EF Unit</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Emissions</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentItems.map((r: FuelRecord) => (
                        <TableRow key={r.name} sx={{ '&:hover': { backgroundColor: '#F9FAFB' } }}>
                          <TableCell>{r.s_no}</TableCell>
                          <TableCell>{r.date ? new Date(r.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{r.description || '-'}</TableCell>
                          <TableCell><Chip label={r.fuel_type || '-'} size="small" sx={{ backgroundColor: '#E3F2FD' }} /></TableCell>
                          <TableCell>{formatNumber(r.fuel_consumed || 0)}</TableCell>
                          <TableCell><Chip label={r.unit || '-'} size="small" sx={{ backgroundColor: '#FFF3E0' }} /></TableCell>
                          <TableCell>{formatNumber(r.emission_factor || 0)}</TableCell>
                          <TableCell>{r.ef_unit || '-'}</TableCell>
                          <TableCell><Typography fontWeight={600} color="#00BCD4">{formatNumber(r.total_emissions || 0)}</Typography></TableCell>
                          <TableCell>
                            <IconButton size="small" sx={{ color: '#F44336' }} onClick={() => { setToDelete({ name: r.name, doctype: DT_FUEL }); setDeleteDialogOpen(true); }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 'distance' && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#F5F7FA' }}>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>S.No</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Mode</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Distance</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Unit</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>EF</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>EF Unit</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Emissions</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentItems.map((r: DistanceRecord) => (
                        <TableRow key={r.name} sx={{ '&:hover': { backgroundColor: '#F9FAFB' } }}>
                          <TableCell>{r.s_no}</TableCell>
                          <TableCell>{r.date ? new Date(r.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{r.description || '-'}</TableCell>
                          <TableCell><Chip label={r.transport_mode || '-'} size="small" sx={{ backgroundColor: '#E3F2FD' }} /></TableCell>
                          <TableCell>{formatNumber(r.distance_traveled || 0)}</TableCell>
                          <TableCell><Chip label={r.unit || '-'} size="small" sx={{ backgroundColor: '#FFF3E0' }} /></TableCell>
                          <TableCell>{formatNumber(r.emission_factor || 0)}</TableCell>
                          <TableCell>{r.ef_unit || '-'}</TableCell>
                          <TableCell><Typography fontWeight={600} color="#00BCD4">{formatNumber(r.total_emissions || 0)}</Typography></TableCell>
                          <TableCell>
                            <IconButton size="small" sx={{ color: '#F44336' }} onClick={() => { setToDelete({ name: r.name, doctype: DT_DISTANCE }); setDeleteDialogOpen(true); }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 'spend' && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#F5F7FA' }}>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>S.No</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Currency</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>EEIO EF</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>EF Unit</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Emissions</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentItems.map((r: SpendRecord) => (
                        <TableRow key={r.name} sx={{ '&:hover': { backgroundColor: '#F9FAFB' } }}>
                          <TableCell>{r.s_no}</TableCell>
                          <TableCell>{r.date ? new Date(r.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{r.description || '-'}</TableCell>
                          <TableCell>{formatNumber(r.amount_spent || 0)}</TableCell>
                          <TableCell><Chip label={r.currency || '$'} size="small" sx={{ backgroundColor: '#FFF3E0' }} /></TableCell>
                          <TableCell>{formatNumber(r.eeio_ef || 0)}</TableCell>
                          <TableCell>{r.ef_unit || '-'}</TableCell>
                          <TableCell><Typography fontWeight={600} color="#00BCD4">{formatNumber(r.total_emissions || 0)}</Typography></TableCell>
                          <TableCell>
                            <IconButton size="small" sx={{ color: '#F44336' }} onClick={() => { setToDelete({ name: r.name, doctype: DT_SPEND }); setDeleteDialogOpen(true); }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={currentList.length}
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

        {/* Add Entry Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
          <DialogTitle sx={{ pb: 1, fontSize: '1.25rem', fontWeight: 600 }}>
            Add Entry - {activeTab === 'fuel' ? 'Fuel-Based' : activeTab === 'distance' ? 'Distance-Based' : 'Spend-Based'} Method
          </DialogTitle>
          <DialogContent>
            {activeTab === 'fuel' && (
              <FuelFormComponent form={fuelForm} setForm={setFuelForm} companyUnits={companyUnits} />
            )}
            {activeTab === 'distance' && (
              <DistanceFormComponent form={distanceForm} setForm={setDistanceForm} companyUnits={companyUnits} />
            )}
            {activeTab === 'spend' && (
              <SpendFormComponent form={spendForm} setForm={setSpendForm} companyUnits={companyUnits} />
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog} sx={{ textTransform: 'none', color: '#5F6368' }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} variant="contained" sx={{ backgroundColor: '#00BCD4', '&:hover': { backgroundColor: '#008BA3' }, textTransform: 'none', px: 3 }}>
              Add Entry
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete Entry"
          message="Are you sure you want to delete this entry? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => {
            setDeleteDialogOpen(false);
            setToDelete(null);
          }}
          confirmText="Delete"
          cancelText="Cancel"
        />
      </Box>
    </LocalizationProvider>
  );
}

function FuelFormComponent({
  form,
  setForm,
  companyUnits,
}: {
  form: FuelForm;
  setForm: React.Dispatch<React.SetStateAction<FuelForm>>;
  companyUnits: Array<{ name: string; unit_name?: string }>;
}) {
  const handle = (k: keyof FuelForm, v: any) => setForm(prev => ({ ...prev, [k]: v }));
  const total = (form.fuel_consumed || 0) * (form.emission_factor || 0);

  return (
    <Grid container spacing={3} sx={{ mt: 0.5 }}>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="S.No" type="number" value={form.s_no} disabled sx={{ backgroundColor: '#F5F5F5' }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <DatePicker label="Date *" value={form.date} onChange={(v) => handle('date', v)} slotProps={{ textField: { fullWidth: true, required: true } }} />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Description" value={form.description} onChange={(e) => handle('description', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Fuel Type *" value={form.fuel_type} onChange={(e) => handle('fuel_type', e.target.value)} required />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="Fuel Consumed *" type="number" value={form.fuel_consumed} onChange={(e) => handle('fuel_consumed', parseFloat(e.target.value) || 0)} required inputProps={{ step: '0.01' }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="Unit" value={form.unit} onChange={(e) => handle('unit', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="Emission Factor *" type="number" value={form.emission_factor} onChange={(e) => handle('emission_factor', parseFloat(e.target.value) || 0)} required inputProps={{ step: '0.0001' }} />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="EF Unit" value={form.ef_unit} onChange={(e) => handle('ef_unit', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required={companyUnits.length > 0}>
          <InputLabel>Company Unit {companyUnits.length > 0 ? '*' : ''}</InputLabel>
          <Select value={form.company_unit} label={`Company Unit ${companyUnits.length > 0 ? '*' : ''}`} onChange={(e) => handle('company_unit', e.target.value)} disabled={companyUnits.length === 0}>
            <MenuItem value="">Select Unit</MenuItem>
            {companyUnits.map(u => (
              <MenuItem key={u.name} value={u.name}>{u.unit_name || u.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2, backgroundColor: '#00BCD4', borderRadius: '8px' }}>
          <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }} gutterBottom>
            Calculated Emissions = Fuel Consumed × EF
          </Typography>
          <Typography variant="h5" fontWeight="600" sx={{ color: 'white' }}>
            {total.toFixed(4)} CO₂e
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}

function DistanceFormComponent({
  form,
  setForm,
  companyUnits,
}: {
  form: DistanceForm;
  setForm: React.Dispatch<React.SetStateAction<DistanceForm>>;
  companyUnits: Array<{ name: string; unit_name?: string }>;
}) {
  const handle = (k: keyof DistanceForm, v: any) => setForm(prev => ({ ...prev, [k]: v }));
  const total = (form.distance_traveled || 0) * (form.emission_factor || 0);

  return (
    <Grid container spacing={3} sx={{ mt: 0.5 }}>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="S.No" type="number" value={form.s_no} disabled sx={{ backgroundColor: '#F5F5F5' }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <DatePicker label="Date *" value={form.date} onChange={(v) => handle('date', v)} slotProps={{ textField: { fullWidth: true, required: true } }} />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Description" value={form.description} onChange={(e) => handle('description', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Transport Mode *</InputLabel>
          <Select value={form.transport_mode} label="Transport Mode *" onChange={(e) => handle('transport_mode', e.target.value)}>
            <MenuItem value="Air">Air</MenuItem>
            <MenuItem value="Rail">Rail</MenuItem>
            <MenuItem value="Road">Road</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="Distance Traveled *" type="number" value={form.distance_traveled} onChange={(e) => handle('distance_traveled', parseFloat(e.target.value) || 0)} required inputProps={{ step: '0.01' }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="Unit" value={form.unit} onChange={(e) => handle('unit', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="Emission Factor *" type="number" value={form.emission_factor} onChange={(e) => handle('emission_factor', parseFloat(e.target.value) || 0)} required inputProps={{ step: '0.0001' }} />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="EF Unit" value={form.ef_unit} onChange={(e) => handle('ef_unit', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required={companyUnits.length > 0}>
          <InputLabel>Company Unit {companyUnits.length > 0 ? '*' : ''}</InputLabel>
          <Select value={form.company_unit} label={`Company Unit ${companyUnits.length > 0 ? '*' : ''}`} onChange={(e) => handle('company_unit', e.target.value)} disabled={companyUnits.length === 0}>
            <MenuItem value="">Select Unit</MenuItem>
            {companyUnits.map(u => (
              <MenuItem key={u.name} value={u.name}>{u.unit_name || u.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2, backgroundColor: '#00BCD4', borderRadius: '8px' }}>
          <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }} gutterBottom>
            Calculated Emissions = Distance × EF
          </Typography>
          <Typography variant="h5" fontWeight="600" sx={{ color: 'white' }}>
            {total.toFixed(4)} CO₂e
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}

function SpendFormComponent({
  form,
  setForm,
  companyUnits,
}: {
  form: SpendForm;
  setForm: React.Dispatch<React.SetStateAction<SpendForm>>;
  companyUnits: Array<{ name: string; unit_name?: string }>;
}) {
  const handle = (k: keyof SpendForm, v: any) => setForm(prev => ({ ...prev, [k]: v }));
  const total = (form.amount_spent || 0) * (form.eeio_ef || 0);

  return (
    <Grid container spacing={3} sx={{ mt: 0.5 }}>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="S.No" type="number" value={form.s_no} disabled sx={{ backgroundColor: '#F5F5F5' }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <DatePicker label="Date *" value={form.date} onChange={(v) => handle('date', v)} slotProps={{ textField: { fullWidth: true, required: true } }} />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Description" value={form.description} onChange={(e) => handle('description', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Amount Spent *" type="number" value={form.amount_spent} onChange={(e) => handle('amount_spent', parseFloat(e.target.value) || 0)} required inputProps={{ step: '0.01' }} />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="Currency" value={form.currency} onChange={(e) => handle('currency', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="EEIO EF *" type="number" value={form.eeio_ef} onChange={(e) => handle('eeio_ef', parseFloat(e.target.value) || 0)} required inputProps={{ step: '0.0001' }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="EF Unit" value={form.ef_unit} onChange={(e) => handle('ef_unit', e.target.value)} />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required={companyUnits.length > 0}>
          <InputLabel>Company Unit {companyUnits.length > 0 ? '*' : ''}</InputLabel>
          <Select value={form.company_unit} label={`Company Unit ${companyUnits.length > 0 ? '*' : ''}`} onChange={(e) => handle('company_unit', e.target.value)} disabled={companyUnits.length === 0}>
            <MenuItem value="">Select Unit</MenuItem>
            {companyUnits.map(u => (
              <MenuItem key={u.name} value={u.name}>{u.unit_name || u.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2, backgroundColor: '#00BCD4', borderRadius: '8px' }}>
          <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }} gutterBottom>
            Calculated Emissions = Amount × EEIO EF
          </Typography>
          <Typography variant="h5" fontWeight="600" sx={{ color: 'white' }}>
            {total.toFixed(4)} CO₂e
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}


