import React from 'react';
import { FaCheckCircle, FaClock } from 'react-icons/fa';

const AvailabilityBadge = ({ available, size = 'md', showText = true }) => {
  const getConfig = () => {
    if (available) {
      return {
        text: 'Available',
        icon: FaCheckCircle,
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        iconColor: 'text-green-600',
        borderColor: 'border-green-200'
      };
    } else {
      return {
        text: 'On Duty',
        icon: FaClock,
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        iconColor: 'text-orange-600',
        borderColor: 'border-orange-200'
      };
    }
  };
  
  const config = getConfig();
  const Icon = config.icon;
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  return (
    <div className={`inline-flex items-center gap-2 ${config.bgColor} ${config.textColor} ${config.borderColor} border rounded-full ${sizes[size]}`}>
      <Icon className={config.iconColor} size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
      {showText && <span>{config.text}</span>}
    </div>
  );
};

export default AvailabilityBadge;