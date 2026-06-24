import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SidePanel.css';

const SidePanel = ({ 
  title, 
  items, 
  loading, 
  onItemClick,
  renderItem,
  emptyMessage = "No items found",
  type = "default",
  isExpanded: externalExpanded,
  onToggle
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [internalExpanded, setInternalExpanded] = useState(false);
  
  // Use external state if provided, otherwise use internal
  const isExpanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const setIsExpanded = onToggle || setInternalExpanded;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Auto-collapse on mobile
      if (mobile && isExpanded) {
        setIsExpanded(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close panel when clicking outside on mobile
  useEffect(() => {
    if (!isMobile || !isExpanded) return;
    
    const handleClickOutside = (e) => {
      const panel = document.querySelector('.zzz999_side_panel');
      const toggle = document.querySelector('.zzz999_side_panel_toggle');
      if (panel && !panel.contains(e.target) && toggle && !toggle.contains(e.target)) {
        setIsExpanded(false);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isExpanded]);

  // Handle item click - auto-close on mobile
  const handleItemClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
    }
    if (isMobile) {
      setIsExpanded(false);
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && isExpanded && (
        <div className="zzz999_panel_backdrop" onClick={() => setIsExpanded(false)} />
      )}
      
      <div className={`zzz999_side_panel ${isExpanded ? 'expanded' : 'collapsed'} ${type} ${isMobile ? 'mobile' : 'desktop'}`}>
        <div className="zzz999_panel_content">
          <div className="zzz999_panel_header">
            <h3 className="zzz999_panel_title">{title}</h3>
            {isMobile && (
              <button className="zzz999_panel_close" onClick={() => setIsExpanded(false)}>
                ✕
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="zzz999_panel_loading">
              <div className="zzz999_loading_spinner"></div>
              <p className="zzz999_loading_text">Loading...</p>
            </div>
          ) : items && items.length > 0 ? (
            <div className="zzz999_panel_items">
              {items.map((item, index) => (
                <div 
                  key={item._id || index} 
                  className="zzz999_panel_item"
                  onClick={() => handleItemClick(item)}
                >
                  {renderItem(item)}
                </div>
              ))}
            </div>
          ) : (
            <div className="zzz999_panel_empty">
              <span className="zzz999_empty_icon">📭</span>
              <p>{emptyMessage}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SidePanel;