import React from 'react';
import { FiUsers, FiShoppingBag, FiDollarSign, FiActivity } from 'react-icons/fi';
import { formatNumber, formatCurrency } from '../../utils/formatters';
import './MetricsCards.css';

const MetricsCards = ({ stats }) => {
  const metrics = [
    {
      title: 'Total Users',
      value: formatNumber(stats?.totalUsers || 0),
      icon: FiUsers,
      color: '#2196f3',
      change: stats?.userGrowth || '+0%'
    },
    {
      title: 'Total Listings',
      value: formatNumber(stats?.totalListings || 0),
      icon: FiShoppingBag,
      color: '#4caf50',
      change: stats?.listingGrowth || '+0%'
    },
    {
      title: 'Revenue',
      value: formatCurrency(stats?.revenue || 0),
      icon: FiDollarSign,
      color: '#ff9800',
      change: stats?.revenueGrowth || '+0%'
    },
    {
      title: 'Active Sessions',
      value: formatNumber(stats?.activeSessions || 0),
      icon: FiActivity,
      color: '#9c27b0',
      change: 'Current'
    }
  ];

  return (
    <div className="metrics-grid">
      {metrics.map((metric, index) => (
        <div key={index} className="metric-card">
          <div className="metric-icon" style={{ background: metric.color }}>
            <metric.icon />
          </div>
          <div className="metric-info">
            <h3>{metric.title}</h3>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-change">{metric.change}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsCards;