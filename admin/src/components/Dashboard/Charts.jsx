import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import './Charts.css';

const Charts = ({ stats }) => {
  // Sample data - replace with actual API data
  const userGrowthData = [
    { month: 'Jan', users: 400 },
    { month: 'Feb', users: 450 },
    { month: 'Mar', users: 500 },
    { month: 'Apr', users: 580 },
    { month: 'May', users: 650 },
    { month: 'Jun', users: 720 }
  ];

  const listingDistribution = [
    { name: 'Cattle', value: 400 },
    { name: 'Sheep', value: 300 },
    { name: 'Goat', value: 250 },
    { name: 'Pig', value: 150 },
    { name: 'Other', value: 100 }
  ];

  const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336'];

  return (
    <div className="charts-container">
      <div className="chart-card">
        <h3>User Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="users" stroke="#4caf50" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Listing Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={listingDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {listingDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Monthly Revenue</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="users" fill="#ff9800" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;