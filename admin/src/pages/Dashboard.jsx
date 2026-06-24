import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import MetricsCards from '../components/Dashboard/MetricsCards';
import SystemHealth from '../components/Dashboard/SystemHealth';
import Charts from '../components/Dashboard/Charts';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, metricsRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getSystemMetrics()
      ]);
      setStats(statsRes.data);
      setMetrics(metricsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="dashboard fade-in">
      <MetricsCards stats={stats} />
      <div className="dashboard-grid">
        <div className="grid-item full-width">
          <Charts stats={stats} />
        </div>
        <div className="grid-item">
          <SystemHealth metrics={metrics} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;