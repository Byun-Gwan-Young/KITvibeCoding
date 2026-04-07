// apps/frontend/src/components/common/Tabs.jsx
// 탭 전환 컴포넌트 — 학생 상세, 시험 관리 등에서 재사용

import { useState } from "react";

export function Tabs({ tabs, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.key);
  const activeTabConfig = tabs.find((tab) => tab.key === activeTab);

  return (
    <>
      <div className="tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.badge != null && (
              <span className="tab-badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
      {activeTabConfig?.content ?? null}
    </>
  );
}
