import React from 'react';
import './SettingsPage.css';

const SettingsPage = () => {
  return (
    <div className="settings-page fade-in">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure system settings and preferences</p>
      </div>

      <div className="settings-section">
        <h2>General Settings</h2>
        <div className="settings-form">
          <div className="form-group">
            <label>Site Name</label>
            <input type="text" defaultValue="IMFuyo" />
          </div>
          <div className="form-group">
            <label>Contact Email</label>
            <input type="email" defaultValue="admin@imfuyo.com" />
          </div>
          <div className="form-group">
            <label>Currency</label>
            <select defaultValue="USD">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2>Verification Settings</h2>
        <div className="settings-form">
          <div className="form-group">
            <label>Auto-approve Sellers</label>
            <input type="checkbox" />
          </div>
          <div className="form-group">
            <label>Required Documents</label>
            <select multiple>
              <option>Face Recognition</option>
              <option>Identity Document</option>
              <option>Resident Certificate</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button className="save-btn">Save Changes</button>
      </div>
    </div>
  );
};

export default SettingsPage;