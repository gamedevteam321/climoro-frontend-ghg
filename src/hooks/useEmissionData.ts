import { useFrappeGetCall } from 'frappe-react-sdk';
import { useMemo } from 'react';
import type {
  StationaryEmission,
  MobileEmission,
  FugitiveEmission,
  ElectricityEmission,
  EmissionByScope,
  EmissionTimeSeries,
  DashboardStats,
  EmissionFilters,
} from '../types/emissions';

/**
 * Hook to fetch all emission entries for dashboard
 */
export function useEmissionData(filters?: EmissionFilters) {
  // Fetch Scope 1: Stationary
  const { data: stationaryData } = useFrappeGetCall<{ message: StationaryEmission[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Stationary Emissions',
      fields: ['name', 'date', 'fuel_type', 'activity_data', 'etco2eq', 'company'],
      filters: filters?.company ? { company: filters.company } : undefined,
      limit_page_length: 1000,
    },
    undefined,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Fetch Scope 1: Mobile - Distance Method
  const { data: mobileDistanceData } = useFrappeGetCall<{ message: MobileEmission[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Mobile Combustion Transportation Method',
      fields: ['name', 'date', 'etco2eq', 'company'],
      filters: filters?.company ? { company: filters.company } : undefined,
      limit_page_length: 1000,
    },
    undefined,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Fetch Scope 1: Mobile - Fuel Method
  const { data: mobileFuelData } = useFrappeGetCall<{ message: MobileEmission[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Mobile Combustion Fuel Method',
      fields: ['name', 'date', 'etco2eq', 'company'],
      filters: filters?.company ? { company: filters.company } : undefined,
      limit_page_length: 1000,
    },
    undefined,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Fetch Scope 1: Fugitive Scale Base
  const { data: fugitiveScaleBaseData } = useFrappeGetCall<{ message: FugitiveEmission[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Fugitive Scale Base',
      fields: ['name', 'date', 'etco2eq', 'company'],
      filters: filters?.company ? { company: filters.company } : undefined,
      limit_page_length: 1000,
    },
    undefined,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Fetch Scope 1: Fugitive Screening
  const { data: fugitiveScreeningData } = useFrappeGetCall<{ message: FugitiveEmission[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Fugitive Screening',
      fields: ['name', 'date', 'etco2eq', 'company'],
      filters: filters?.company ? { company: filters.company } : undefined,
      limit_page_length: 1000,
    },
    undefined,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Fetch Scope 1: Fugitive Simple
  const { data: fugitiveSimpleData } = useFrappeGetCall<{ message: FugitiveEmission[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Fugitive Simple',
      fields: ['name', 'date', 'etco2eq', 'company'],
      filters: filters?.company ? { company: filters.company } : undefined,
      limit_page_length: 1000,
    },
    undefined,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Fetch Scope 2: Electricity Purchased
  const { data: electricityData } = useFrappeGetCall<{ message: ElectricityEmission[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Electricity Purchased',
      fields: ['name', 'date', 'etco2eq', 'company'],
      filters: filters?.company ? { company: filters.company } : undefined,
      limit_page_length: 1000,
    },
    undefined,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Fetch Scope 3: Business Travel - disabled for now (doctype doesn't exist)
  // const { data: businessTravelData } = useFrappeGetCall<{ data: BusinessTravelEmission[] }>(
  //   'frappe.client.get_list',
  //   {
  //     doctype: 'Business Travel Method',
  //     fields: ['name', 'date', 'travel_mode', 'passenger_km', 'etco2eq', 'company'],
  //     filters: filters?.company ? { company: filters.company } : undefined,
  //     limit_page_length: 1000,
  //   },
  //   undefined,
  //   {
  //     revalidateOnFocus: false,
  //     shouldRetryOnError: false,
  //   }
  // );
  const businessTravelData: { data: any[] } = { data: [] }; // Placeholder until doctype is created

  // Calculate aggregated data
  const aggregatedData = useMemo(() => {
    const stationary = stationaryData?.message || [];
    const mobileDistance = mobileDistanceData?.message || [];
    const mobileFuel = mobileFuelData?.message || [];
    const fugitiveScaleBase = fugitiveScaleBaseData?.message || [];
    const fugitiveScreening = fugitiveScreeningData?.message || [];
    const fugitiveSimple = fugitiveSimpleData?.message || [];
    const electricity = electricityData?.message || [];
    const businessTravel: any[] = businessTravelData?.data || [];

    // Calculate individual Scope 1 totals
    const stationaryTotal = stationary.reduce((sum, item) => sum + (item.etco2eq || 0), 0);
    const mobileTotal = 
      mobileDistance.reduce((sum, item) => sum + (item.etco2eq || 0), 0) +
      mobileFuel.reduce((sum, item) => sum + (item.etco2eq || 0), 0);
    const fugitiveTotal = 
      fugitiveScaleBase.reduce((sum, item) => sum + (item.etco2eq || 0), 0) +
      fugitiveScreening.reduce((sum, item) => sum + (item.etco2eq || 0), 0) +
      fugitiveSimple.reduce((sum, item) => sum + (item.etco2eq || 0), 0);

    // Calculate Scope 1 total
    const scope1Total = stationaryTotal + mobileTotal + fugitiveTotal;

    // Calculate Scope 2 total
    const scope2Total = electricity.reduce((sum, item) => sum + (item.etco2eq || 0), 0);

    // Calculate Scope 3 total
    const scope3Total = businessTravel.reduce((sum, item) => sum + (item.etco2eq || 0), 0);

    const totalEmissions = scope1Total + scope2Total + scope3Total;

    // Stats
    const stats: DashboardStats = {
      total_emissions: totalEmissions,
      scope1_emissions: scope1Total,
      scope1_stationary: stationaryTotal,
      scope1_mobile: mobileTotal,
      scope1_fugitive: fugitiveTotal,
      scope2_emissions: scope2Total,
      scope3_emissions: scope3Total,
      entries_count:
        stationary.length +
        mobileDistance.length +
        mobileFuel.length +
        fugitiveScaleBase.length +
        fugitiveScreening.length +
        fugitiveSimple.length +
        electricity.length +
        businessTravel.length,
    };

    // By Scope breakdown for pie chart
    const byScope: EmissionByScope[] = [
      {
        scope: 1,
        scope_name: 'Scope 1',
        etco2eq: scope1Total,
        percentage: totalEmissions > 0 ? (scope1Total / totalEmissions) * 100 : 0,
        color: '#00BCD4', // Climoro cyan
      },
      {
        scope: 2,
        scope_name: 'Scope 2',
        etco2eq: scope2Total,
        percentage: totalEmissions > 0 ? (scope2Total / totalEmissions) * 100 : 0,
        color: '#FF5252', // Red
      },
      {
        scope: 3,
        scope_name: 'Scope 3',
        etco2eq: scope3Total,
        percentage: totalEmissions > 0 ? (scope3Total / totalEmissions) * 100 : 0,
        color: '#4CAF50', // Green
      },
    ];

    // Time series data for line chart
    const allEntries = [
      ...stationary.map((e) => ({ ...e, scope: 1 })),
      ...mobileDistance.map((e) => ({ ...e, scope: 1 })),
      ...mobileFuel.map((e) => ({ ...e, scope: 1 })),
      ...fugitiveScaleBase.map((e) => ({ ...e, scope: 1 })),
      ...fugitiveScreening.map((e) => ({ ...e, scope: 1 })),
      ...fugitiveSimple.map((e) => ({ ...e, scope: 1 })),
      ...electricity.map((e) => ({ ...e, scope: 2 })),
      ...businessTravel.map((e) => ({ ...e, scope: 3 })),
    ];

    // Group by month
    const monthlyData = new Map<string, EmissionTimeSeries>();

    allEntries.forEach((entry: any) => {
      if (!entry.date) return;

      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          date: monthKey,
          month: date.toLocaleString('default', { month: 'short' }),
          year: date.getFullYear(),
          scope1: 0,
          scope2: 0,
          scope3: 0,
          total: 0,
        });
      }

      const monthEntry = monthlyData.get(monthKey)!;
      const co2e = entry.etco2eq || 0;

      if (entry.scope === 1) {
        monthEntry.scope1 += co2e;
      } else if (entry.scope === 2) {
        monthEntry.scope2 += co2e;
      } else if (entry.scope === 3) {
        monthEntry.scope3 += co2e;
      }
      monthEntry.total += co2e;
    });

    const timeSeries: EmissionTimeSeries[] = Array.from(monthlyData.values()).sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    return {
      stats,
      byScope,
      timeSeries,
      isLoading: false,
      error: null,
    };
  }, [stationaryData, mobileDistanceData, mobileFuelData, fugitiveScaleBaseData, fugitiveScreeningData, fugitiveSimpleData, electricityData, businessTravelData]);

  return aggregatedData;
}

