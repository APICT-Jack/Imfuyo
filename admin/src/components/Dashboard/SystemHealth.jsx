import React from 'react';
import { formatBytes } from '../../utils/formatters';
import './SystemHealth.css';

const SystemHealth = ({ metrics }) => {
  if (!metrics) return null;

  const healthItems = [
    {
      label: 'CPU Usage',
      value: metrics.process?.cpuUsage ? 
        `${((metrics.process.cpuUsage.user + metrics.process.cpuUsage.system) / 1000).toFixed(2)}ms` : 
        'N/A',
      status: 'good'
    },
    {
      label: 'Memory Usage',
      value: metrics.process?.memoryUsage ? 
        formatBytes(metrics.process.memoryUsage.heapUsed) : 
        'N/A',
      status: metrics.process?.memoryUsage?.heapUsed > 100 * 1024 * 1024 ? 'warning' : 'good'
    },
    {
      label: 'Uptime',
      value: metrics.system?.uptime ? 
        `${Math.floor(metrics.system.uptime / 3600)}h ${Math.floor((metrics.system.uptime % 3600) / 60)}m` : 
        'N/A',
      status: 'good'
    },
    {
      label: 'MongoDB',
      value: metrics.mongodb?.state || 'N/A',
      status: metrics.mongodb?.readyState === 1 ? 'good' : 'error'
    },
    {
      label: 'Platform',
      value: metrics.system?.platform || 'N/A',
      status: 'info'
    },
    {
      label: 'Node Version',
      value: metrics.process?.version || 'N/A',
      status: 'info'
    }
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case 'good': return 'status-good';
      case 'warning': return 'status-warning';
      case 'error': return 'status-error';
      default: return 'status-info';
    }
  };

  return (
    <div className="system-health">
      <h3>System Health</h3>
      <div className="health-grid">
        {healthItems.map((item, index) => (
          <div key={index} className="health-item">
            <span className="health-label">{item.label}</span>
            <span className={`health-value ${getStatusClass(item.status)}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemHealth;