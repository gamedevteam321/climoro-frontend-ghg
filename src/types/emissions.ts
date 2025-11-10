/**
 * TypeScript types for GHG Emission Data from Frappe
 */

// Base emission entry structure
export interface BaseEmission {
  name: string;
  creation: string;
  modified: string;
  owner: string;
  company?: string;
  date?: string;
  reporting_period?: string;
}

// Scope 1: Stationary Emissions
export interface StationaryEmission extends BaseEmission {
  fuel_type: string;
  fuel_name?: string;
  quantity: number;
  unit?: string;
  efco2?: number;
  efch4?: number;
  efn2o?: number;
  etco2eq?: number;
}

// Scope 1: Mobile Combustion
export interface MobileEmission extends BaseEmission {
  transportation_type: string;
  vehicle_type?: string;
  distance_traveled: number;
  fuel_consumed?: number;
  emission_factor?: number;
  etco2eq?: number;
}

// Scope 1: Fugitive Emissions
export interface FugitiveEmission extends BaseEmission {
  refrigerant_type: string;
  quantity: number;
  gwp?: number;
  etco2eq?: number;
}

// Scope 2: Electricity
export interface ElectricityEmission extends BaseEmission {
  kwh: number;
  grid_factor?: number;
  etco2eq?: number;
}

// Scope 3: Business Travel
export interface BusinessTravelEmission extends BaseEmission {
  travel_mode: string;
  passenger_km: number;
  emission_factor?: number;
  etco2eq?: number;
}

// Aggregated emission data by scope
export interface EmissionByScope {
  scope: 1 | 2 | 3;
  scope_name: string;
  etco2eq: number;
  percentage: number;
  color: string;
  [key: string]: string | number; // Index signature for chart compatibility
}

// Time series data for charts
export interface EmissionTimeSeries {
  date: string;
  month: string;
  year: number;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
}

// Dashboard stats
export interface DashboardStats {
  total_emissions: number;
  scope1_emissions: number;
  scope1_stationary?: number; // Scope 1 breakdown
  scope1_mobile?: number;      // Scope 1 breakdown
  scope1_fugitive?: number;    // Scope 1 breakdown
  scope2_emissions: number;
  scope3_emissions: number;
  change_from_baseline?: number;
  change_percentage?: number;
  entries_count: number;
  last_entry_date?: string;
}

// Monthly comparison data
export interface MonthlyComparison {
  month: string;
  current_year: number;
  previous_year: number;
  change_percentage: number;
}

// Filter parameters for fetching emissions
export interface EmissionFilters {
  company?: string;
  unit?: string;
  from_date?: string;
  to_date?: string;
  scope?: 1 | 2 | 3;
  emission_type?: string;
}

// API response types
export interface EmissionListResponse<T> {
  data: T[];
  total_count?: number;
}

export interface EmissionStatsResponse {
  stats: DashboardStats;
  by_scope: EmissionByScope[];
  time_series: EmissionTimeSeries[];
  monthly_comparison: MonthlyComparison[];
}

