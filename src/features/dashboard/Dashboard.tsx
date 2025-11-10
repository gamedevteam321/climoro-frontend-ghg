import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEmissionData } from '../../hooks/useEmissionData';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { permissions, currentUser } = useAuth();
  const { stats, timeSeries, isLoading } = useEmissionData({
    company: permissions?.company || undefined,
  });
  const [selectedScope, setSelectedScope] = React.useState<'all' | 1 | 2 | 3>(1);

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Filter time series data based on selected scope
  const filteredTimeSeries = React.useMemo(() => {
    if (selectedScope === 'all') return timeSeries;
    
    return timeSeries.map(item => ({
      ...item,
      total: selectedScope === 1 ? item.scope1 : selectedScope === 2 ? item.scope2 : item.scope3,
    }));
  }, [timeSeries, selectedScope]);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-left">
            <h1 className="text-3xl font-semibold">
              <span className="text-gray-900">Welcome back, </span>
              <span className="text-climoro">{currentUser || 'User'}</span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="h-80 bg-gray-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-left">
          <h1 className="text-xl font-semibold">
            <span className="text-gray-900">Welcome back, </span>
            <span className="text-cyan-500">{currentUser || 'User'}</span>
          </h1>
        </div>
      </div>

      {/* Stats Cards - Scope Emissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Emissions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emissions</CardTitle>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.total_emissions)} tCO₂e</div>
            <div className="flex items-center pt-1 text-xs">
              {stats.change_percentage !== undefined && stats.change_percentage !== 0 ? (
                <>
                  <span className={stats.change_percentage > 0 ? 'text-red-600' : 'text-green-600'}>
                    {stats.change_percentage > 0 ? '+' : ''}{stats.change_percentage.toFixed(1)}%
                  </span>
                  <span className="text-gray-500 ml-1">from last month</span>
                </>
              ) : (
                <span className="text-gray-500">No previous data</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scope 1 Emissions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scope 1 Emissions</CardTitle>
            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.scope1_emissions || 0)} tCO₂e</div>
            <div className="flex items-center pt-1 text-xs">
              {stats.scope1_change !== undefined && stats.scope1_change !== 0 ? (
                <>
                  <span className={stats.scope1_change > 0 ? 'text-red-600' : 'text-green-600'}>
                    {stats.scope1_change > 0 ? '+' : ''}{stats.scope1_change.toFixed(1)}%
                  </span>
                  <span className="text-gray-500 ml-1">from last month</span>
                </>
              ) : (
                <span className="text-gray-500">No previous data</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scope 2 Emissions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scope 2 Emissions</CardTitle>
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.scope2_emissions || 0)} tCO₂e</div>
            <div className="flex items-center pt-1 text-xs">
              {stats.scope2_change !== undefined && stats.scope2_change !== 0 ? (
                <>
                  <span className={stats.scope2_change > 0 ? 'text-red-600' : 'text-green-600'}>
                    {stats.scope2_change > 0 ? '+' : ''}{stats.scope2_change.toFixed(1)}%
                  </span>
                  <span className="text-gray-500 ml-1">from last month</span>
                </>
              ) : (
                <span className="text-gray-500">No previous data</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scope 3 Emissions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scope 3 Emissions</CardTitle>
            <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.scope3_emissions || 0)} tCO₂e</div>
            <div className="flex items-center pt-1 text-xs">
              {stats.scope3_change !== undefined && stats.scope3_change !== 0 ? (
                <>
                  <span className={stats.scope3_change > 0 ? 'text-red-600' : 'text-green-600'}>
                    {stats.scope3_change > 0 ? '+' : ''}{stats.scope3_change.toFixed(1)}%
                  </span>
                  <span className="text-gray-500 ml-1">from last month</span>
                </>
              ) : (
                <span className="text-gray-500">No previous data</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emission Trend Chart - Full Width */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-lg font-semibold">Emission Trend over Time</CardTitle>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedScope(selectedScope === 1 ? 'all' : 1)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedScope === 1
                    ? 'bg-cyan-500 text-white border border-cyan-500'
                    : 'bg-transparent text-gray-500 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Scope 1
              </button>
              <button
                onClick={() => setSelectedScope(selectedScope === 2 ? 'all' : 2)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedScope === 2
                    ? 'bg-cyan-500 text-white border border-cyan-500'
                    : 'bg-transparent text-gray-500 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Scope 2
              </button>
              <button
                onClick={() => setSelectedScope(selectedScope === 3 ? 'all' : 3)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedScope === 3
                    ? 'bg-cyan-500 text-white border border-cyan-500'
                    : 'bg-transparent text-gray-500 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Scope 3
              </button>
              <button
                onClick={() => setSelectedScope('all')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedScope === 'all'
                    ? 'bg-cyan-500 text-white border border-cyan-500'
                    : 'bg-transparent text-gray-500 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Reduction Factor
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTimeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={filteredTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                  label={{ value: 'tCO2e', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E0E0E0',
                    borderRadius: '4px',
                  }}
                  formatter={(value: number) => [formatNumber(value) + ' tCO2e', '']}
                />
                {selectedScope === 'all' ? (
                  <>
                    <Line
                      type="monotone"
                      dataKey="scope1"
                      stroke="#00BCD4"
                      strokeWidth={2}
                      name="Scope 1"
                      dot={{ fill: '#00BCD4', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="scope2"
                      stroke="#FF5252"
                      strokeWidth={2}
                      name="Scope 2"
                      dot={{ fill: '#FF5252', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="scope3"
                      stroke="#4CAF50"
                      strokeWidth={2}
                      name="Scope 3"
                      dot={{ fill: '#4CAF50', r: 4 }}
                    />
                  </>
                ) : (
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={selectedScope === 1 ? '#00BCD4' : selectedScope === 2 ? '#FF5252' : '#4CAF50'}
                    strokeWidth={3}
                    name={`Scope ${selectedScope}`}
                    dot={{ 
                      fill: selectedScope === 1 ? '#00BCD4' : selectedScope === 2 ? '#FF5252' : '#4CAF50', 
                      r: 5 
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">No emission data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scope Breakdown & Reduction Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Emission Categories Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-4 py-2 text-sm font-semibold text-gray-500">
              <div>Category</div>
              <div>Emissions (tCO2e)</div>
              <div>Percentage</div>
            </div>
            
            {/* Scope 1 Header */}
            {stats.scope1_emissions > 0 && (
              <div className="grid grid-cols-3 gap-4 py-3 border-t-2 border-gray-300 items-center bg-cyan-50">
                <div className="text-sm font-semibold text-cyan-700">Scope 1 - Direct Emissions</div>
                <div className="text-sm font-bold text-cyan-700">{formatNumber(stats.scope1_emissions)}</div>
                <div className="text-sm font-semibold text-cyan-700">
                  {stats.total_emissions > 0 ? `${((stats.scope1_emissions / stats.total_emissions) * 100).toFixed(1)}%` : '0%'}
                </div>
              </div>
            )}
            
            {/* Stationary Emissions (Scope 1) */}
            {(stats.scope1_stationary ?? 0) > 0 && (
              <div className="grid grid-cols-3 gap-4 py-2 border-t border-gray-100 items-center pl-4">
                <div className="text-sm text-gray-700">• Stationary Combustion</div>
                <div className="text-sm font-medium">{formatNumber(stats.scope1_stationary ?? 0)}</div>
                <div className="text-sm text-gray-600">
                  {stats.scope1_emissions > 0 ? `${(((stats.scope1_stationary ?? 0) / stats.scope1_emissions) * 100).toFixed(1)}%` : '0%'}
                </div>
              </div>
            )}
            
            {/* Mobile Combustion (Scope 1) */}
            {(stats.scope1_mobile ?? 0) > 0 && (
              <div className="grid grid-cols-3 gap-4 py-2 border-t border-gray-100 items-center pl-4">
                <div className="text-sm text-gray-700">• Mobile Combustion</div>
                <div className="text-sm font-medium">{formatNumber(stats.scope1_mobile ?? 0)}</div>
                <div className="text-sm text-gray-600">
                  {stats.scope1_emissions > 0 ? `${(((stats.scope1_mobile ?? 0) / stats.scope1_emissions) * 100).toFixed(1)}%` : '0%'}
                </div>
              </div>
            )}
            
            {/* Fugitive Emissions (Scope 1) */}
            {(stats.scope1_fugitive ?? 0) > 0 && (
              <div className="grid grid-cols-3 gap-4 py-2 border-t border-gray-100 items-center pl-4">
                <div className="text-sm text-gray-700">• Fugitive Emissions</div>
                <div className="text-sm font-medium">{formatNumber(stats.scope1_fugitive ?? 0)}</div>
                <div className="text-sm text-gray-600">
                  {stats.scope1_emissions > 0 ? `${(((stats.scope1_fugitive ?? 0) / stats.scope1_emissions) * 100).toFixed(1)}%` : '0%'}
                </div>
              </div>
            )}
            
            {/* Scope 2 */}
            {stats.scope2_emissions > 0 && (
              <div className="grid grid-cols-3 gap-4 py-3 border-t-2 border-gray-300 items-center bg-red-50">
                <div className="text-sm font-semibold text-red-700">Scope 2 - Indirect Emissions</div>
                <div className="text-sm font-bold text-red-700">{formatNumber(stats.scope2_emissions)}</div>
                <div className="text-sm font-semibold text-red-700">
                  {stats.total_emissions > 0 ? `${((stats.scope2_emissions / stats.total_emissions) * 100).toFixed(1)}%` : '0%'}
                </div>
              </div>
            )}
            
            {/* Scope 3 */}
            {stats.scope3_emissions > 0 && (
              <div className="grid grid-cols-3 gap-4 py-3 border-t-2 border-gray-300 items-center bg-green-50">
                <div className="text-sm font-semibold text-green-700">Scope 3 - Value Chain Emissions</div>
                <div className="text-sm font-bold text-green-700">{formatNumber(stats.scope3_emissions)}</div>
                <div className="text-sm font-semibold text-green-700">
                  {stats.total_emissions > 0 ? `${((stats.scope3_emissions / stats.total_emissions) * 100).toFixed(1)}%` : '0%'}
                </div>
              </div>
            )}
            
            {/* Empty State */}
            {stats.total_emissions === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">
                  No emission data recorded yet. Start adding emission entries to see breakdown.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

