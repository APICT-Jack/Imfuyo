import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { formatBytes, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';
import './SystemMetricsPage.css';

const SystemMetricsPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const [metricsRes, dbStatsRes] = await Promise.all([
        adminAPI.getSystemMetrics(),
        adminAPI.getDBStats()
      ]);
      setMetrics(metricsRes.data);
      setDbStats(dbStatsRes.data);
    } catch (error) {
      toast.error('Failed to fetch system metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="metrics-page fade-in">
      <div className="page-header">
        <h1>System Metrics</h1>
        <p>Real-time system performance and database statistics</p>
      </div>

      <div className="metrics-section">
        <h2>System Information</h2>
        <div className="metrics-grid">
          <div className="metric-item">
            <label>Platform</label>
            <value>{metrics?.system?.platform}</value>
          </div>
          <div className="metric-item">
            <label>Hostname</label>
            <value>{metrics?.system?.hostname}</value>
          </div>
          <div className="metric-item">
            <label>Uptime</label>
            <value>{Math.floor(metrics?.system?.uptime / 3600)} hours</value>
          </div>
          <div className="metric-item">
            <label>CPU Cores</label>
            <value>{metrics?.system?.cpuCount}</value>
          </div>
          <div className="metric-item">
            <label>Total Memory</label>
            <value>{formatBytes(metrics?.system?.totalMemory)}</value>
          </div>
          <div className="metric-item">
            <label>Free Memory</label>
            <value>{formatBytes(metrics?.system?.freeMemory)}</value>
          </div>
          <div className="metric-item">
            <label>Load Average</label>
            <value>{metrics?.system?.loadAverage?.join(', ')}</value>
          </div>
          <div className="metric-item">
            <label>Node Version</label>
            <value>{metrics?.process?.version}</value>
          </div>
        </div>
      </div>

      <div className="metrics-section">
        <h2>Process Information</h2>
        <div className="metrics-grid">
          <div className="metric-item">
            <label>Process ID</label>
            <value>{metrics?.process?.pid}</value>
          </div>
          <div className="metric-item">
            <label>Environment</label>
            <value>{metrics?.process?.env}</value>
          </div>
          <div className="metric-item">
            <label>Heap Used</label>
            <value>{formatBytes(metrics?.process?.memoryUsage?.heapUsed)}</value>
          </div>
          <div className="metric-item">
            <label>Heap Total</label>
            <value>{formatBytes(metrics?.process?.memoryUsage?.heapTotal)}</value>
          </div>
          <div className="metric-item">
            <label>RSS</label>
            <value>{formatBytes(metrics?.process?.memoryUsage?.rss)}</value>
          </div>
        </div>
      </div>

      <div className="metrics-section">
        <h2>Database Statistics</h2>
        <div className="metrics-grid">
          <div className="metric-item">
            <label>Database Name</label>
            <value>{dbStats?.database?.name}</value>
          </div>
          <div className="metric-item">
            <label>Collections</label>
            <value>{dbStats?.database?.collections?.length}</value>
          </div>
          <div className="metric-item">
            <label>Data Size</label>
            <value>{formatBytes(dbStats?.database?.stats?.dataSize)}</value>
          </div>
          <div className="metric-item">
            <label>Index Size</label>
            <value>{formatBytes(dbStats?.database?.stats?.indexSize)}</value>
          </div>
          <div className="metric-item">
            <label>Storage Size</label>
            <value>{formatBytes(dbStats?.database?.stats?.storageSize)}</value>
          </div>
        </div>
      </div>

      <div className="metrics-section">
        <h2>Collection Statistics</h2>
        <div className="collection-stats">
          {dbStats?.collections && Object.entries(dbStats.collections).map(([name, stats]) => (
            <div key={name} className="collection-card">
              <h3>{name}</h3>
              <p>Documents: {stats.count}</p>
              <p>Size: {formatBytes(stats.stats?.size)}</p>
              <p>Indexes: {stats.stats?.nindexes}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemMetricsPage;