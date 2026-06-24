export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getStatusColor = (status) => {
  const colors = {
    pending: '#ff9800',
    approved: '#4caf50',
    rejected: '#f44336',
    active: '#4caf50',
    inactive: '#9e9e9e',
    suspended: '#f44336',
  };
  return colors[status] || '#2196f3';
};

export const getStatusBadge = (status) => {
  const badges = {
    pending: { text: 'Pending', class: 'badge-warning' },
    approved: { text: 'Approved', class: 'badge-success' },
    rejected: { text: 'Rejected', class: 'badge-danger' },
    active: { text: 'Active', class: 'badge-success' },
    inactive: { text: 'Inactive', class: 'badge-secondary' },
    suspended: { text: 'Suspended', class: 'badge-danger' },
  };
  return badges[status] || { text: status, class: 'badge-info' };
};