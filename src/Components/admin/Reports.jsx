import React, { useState } from 'react';
import { 
  BarChart3, Package, Users, Download, Target, Briefcase, Calendar
} from 'lucide-react';
import SalesAnalytics from '../../features/admin/components/analytics/SalesAnalytics';
import CustomerAnalytics from '../../features/admin/components/analytics/CustomerAnalytics';
import ProductAnalytics from '../../features/admin/components/analytics/ProductAnalytics';
import InventoryAnalytics from '../../features/admin/components/analytics/InventoryAnalytics';
import OperationsAnalytics from '../../features/admin/components/analytics/OperationsAnalytics';

const AnalyticsTab = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [timeRange, setTimeRange] = useState('30days'); // today, 7days, 30days, year

  const tabs = [
    { id: 'sales', label: 'Sales', icon: BarChart3 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Target },
    { id: 'operations', label: 'Operations', icon: Briefcase },
  ];

  const handleExport = () => {
    alert("CSV Export is currently configured for summary tables. Please see full data exports in the Data Management section.");
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center justify-center gap-2.5 px-6 py-3 font-body font-bold text-sm tracking-wide rounded-lg transition-all duration-300 whitespace-nowrap flex-1 md:flex-none ${
        activeTab === id 
        ? 'bg-[var(--brand)] text-[var(--surface)] shadow-[var(--shadow-strong)]' 
        : 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--brand)]'
      }`}
    >
      <Icon size={18} strokeWidth={1.5} /> {label}
    </button>
  );

  const TimeFilterButton = ({ id, label }) => (
    <button 
      onClick={() => setTimeRange(id)}
      className={`px-4 py-2 font-body font-medium text-xs tracking-wide rounded-md transition-colors ${
        timeRange === id 
        ? 'bg-[var(--text)] text-[var(--bg)] shadow-sm' 
        : 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 sm:p-6 lg:p-8 space-y-6 animate-fadeIn font-body transition-colors duration-300 pb-20">
      
      {/* HEADER WITH GLOBAL FILTERS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)]">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-medium text-[var(--text)] tracking-tight">
            Analytics
          </h1>
          <p className="font-display italic text-base text-[var(--sub)] mt-2 tracking-wide max-w-lg">
            Deep insights into business performance. Filtered globally by the selected time period.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          {/* TIME RANGE SELECTOR */}
          <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)] w-full sm:w-auto overflow-x-auto">
            <TimeFilterButton id="today" label="Today" />
            <TimeFilterButton id="week" label="7 Days" />
            <TimeFilterButton id="month" label="30 Days" />
            <TimeFilterButton id="6months" label="6 Months" />
            <TimeFilterButton id="year" label="Year" />
          </div>

          <button 
            onClick={handleExport}
            className="flex items-center gap-2.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] px-6 py-2.5 rounded-lg font-body font-bold text-sm tracking-wide hover:bg-[var(--surface-muted)] hover:border-[var(--border)] hover:text-[var(--brand)] transition-all shadow-sm w-full sm:w-auto justify-center whitespace-nowrap h-full"
          >
            <Download size={16} strokeWidth={2} className="text-[var(--muted)]" /> Export CSV
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex bg-[var(--surface)] p-1.5 rounded-xl border border-[var(--border)] shadow-sm w-full overflow-x-auto smooth-scrollbar">
        {tabs.map(tab => (
          <TabButton key={tab.id} id={tab.id} label={tab.label} icon={tab.icon} />
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="bg-[var(--surface)] rounded-2xl shadow-[var(--shadow)] border border-[var(--border)] min-h-[500px] overflow-hidden transition-all duration-300">
        {activeTab === 'sales' && <SalesAnalytics timeRange={timeRange} />}
        {activeTab === 'customers' && <CustomerAnalytics timeRange={timeRange} />}
        {activeTab === 'products' && <ProductAnalytics timeRange={timeRange} />}
        {activeTab === 'inventory' && <InventoryAnalytics />}
        {activeTab === 'operations' && <OperationsAnalytics timeRange={timeRange} />}
      </div>
    </div>
  );
};

export default AnalyticsTab;