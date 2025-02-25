import React from 'react';

export function Tabs({ children, activeTab, onChange }) {
  // Filter out non-Tab children
  const tabs = React.Children.toArray(children).filter(
    child => React.isValidElement(child) && child.type === Tab
  );

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map(tab => (
          <button
            key={tab.props.id}
            className={`tab-button ${activeTab === tab.props.id ? 'active' : ''}`}
            onClick={() => onChange(tab.props.id)}
          >
            {tab.props.title}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {tabs.find(tab => tab.props.id === activeTab)}
      </div>
    </div>
  );
}

export function Tab({ children, id }) {
  return <div className="tab-content">{children}</div>;
}