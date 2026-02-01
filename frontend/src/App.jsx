import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import NOCDashboard from './pages/NOCDashboard';
import SLADashboard from './pages/SLADashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import CustomerContacts from './pages/CustomerContacts';
import Engineers from './pages/Engineers';
import EngineerDetail from './pages/EngineerDetail';
import Members from './pages/Members';
import Projects from './pages/Projects';
import AlarmNotes from './pages/AlarmNotes';
import CMDB from './pages/CMDB';
import Network from './pages/Network';
import CustomerReports from './pages/CustomerReports';
import TimeSpent from './pages/TimeSpent';

// Placeholder component for pages not yet implemented
const PlaceholderPage = ({ title, description, color = "violet" }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <div className={`p-4 bg-${color}-100 text-${color}-600 rounded-2xl`}>
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <div>
        <h1 className="text-3xl font-black text-slate-900">{title}</h1>
        <p className="text-slate-500 font-medium">{description}</p>
      </div>
    </div>
    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-700 mb-2">Coming Soon</h2>
      <p className="text-slate-400 max-w-md mx-auto">
        This module is under development. Check back soon for updates.
      </p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home page without Layout */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />

        {/* All other routes with Layout */}
        <Route element={<Layout />}>
          {/* Dashboards */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/noc" element={<NOCDashboard />} />
          <Route path="/dashboard/sla" element={<SLADashboard />} />
          <Route path="/dashboard/capacity" element={<PlaceholderPage title="Capacity & Trend" description="Resource utilization and growth forecasting" color="amber" />} />

          {/* Customers */}
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/customers/services" element={<PlaceholderPage title="Customer Services" description="Services subscribed by customers" color="cyan" />} />
          <Route path="/customers/reports" element={<CustomerReports />} />

          {/* Services */}
          <Route path="/services/monitoring" element={<PlaceholderPage title="Monitoring Services" description="Prometheus, Grafana, and alerting services" color="violet" />} />
          <Route path="/services/backup" element={<PlaceholderPage title="Backup Services" description="Backup jobs, schedules, and recovery" color="green" />} />
          <Route path="/services/security" element={<PlaceholderPage title="Security Services" description="Firewall, WAF, and security monitoring" color="red" />} />
          <Route path="/services/cloud" element={<PlaceholderPage title="Cloud / Infrastructure" description="Cloud resources and infrastructure management" color="sky" />} />

          {/* Alarms */}
          <Route path="/alarms" element={<AlarmNotes />} />
          <Route path="/alarms/history" element={<PlaceholderPage title="Alarm History" description="Historical alarm data and trends" color="orange" />} />
          <Route path="/alarms/correlation" element={<PlaceholderPage title="Alarm Correlation" description="Root cause analysis and event correlation" color="purple" />} />
          <Route path="/alarms/rules" element={<PlaceholderPage title="Auto-Ticket Rules" description="Rules for automatic ticket creation from alarms" color="indigo" />} />

          {/* CMDB */}
          <Route path="/cmdb" element={<CMDB />} />
          <Route path="/cmdb/network" element={<Network />} />
          <Route path="/cmdb/relationships" element={<PlaceholderPage title="CI Relationships" description="Dependencies and connections between assets" color="teal" />} />
          <Route path="/cmdb/locations" element={<PlaceholderPage title="Locations" description="Data centers, racks, and physical locations" color="lime" />} />
          <Route path="/cmdb/lifecycle" element={<PlaceholderPage title="Lifecycle Management" description="Asset lifecycle tracking and deprecation" color="yellow" />} />

          {/* Projects */}
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/completed" element={<PlaceholderPage title="Completed Projects" description="Archive of finished projects" color="emerald" />} />
          <Route path="/projects/changes" element={<PlaceholderPage title="Change / Upgrade" description="Change requests and system upgrades" color="amber" />} />

          {/* People */}
          <Route path="/people/engineers" element={<Engineers />} />
          <Route path="/people/engineers/:id" element={<EngineerDetail />} />
          <Route path="/people/schedule" element={<PlaceholderPage title="On-duty Schedule" description="Engineer shift schedules and rotations" color="blue" />} />
          <Route path="/people/skills" element={<PlaceholderPage title="Skill Matrix" description="Engineer skills and certifications" color="violet" />} />
          <Route path="/people/time-spent" element={<TimeSpent />} />

          {/* Contacts */}
          <Route path="/contacts/customers" element={<CustomerContacts />} />
          <Route path="/contacts/vendors" element={<PlaceholderPage title="Vendor Contacts" description="Hardware and software vendor contacts" color="orange" />} />
          <Route path="/contacts/emergency" element={<PlaceholderPage title="Emergency Contacts" description="Critical escalation and emergency contacts" color="red" />} />

          {/* Legacy routes - redirect or keep for compatibility */}
          <Route path="/members" element={<Members />} />
          <Route path="/engineers" element={<Engineers />} />
          <Route path="/engineers/:id" element={<EngineerDetail />} />
          <Route path="/network" element={<Network />} />
          <Route path="/customers/contacts" element={<CustomerContacts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
