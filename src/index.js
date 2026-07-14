import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import buildInfo from './buildInfo.json';
import reportWebVitals from './reportWebVitals';

// 배포 버전 배지 — 기기에 뜬 빌드가 최신인지 대시보드 없이 확인용
function BuildBadge() {
  return (
    <div
      title={"빌드: " + buildInfo.commit + (buildInfo.builtAt ? " · " + buildInfo.builtAt : "")}
      style={{
        position: 'fixed', bottom: 3, right: 5, zIndex: 99999, pointerEvents: 'none',
        fontSize: 9, lineHeight: 1.4, fontFamily: 'monospace', color: '#B0AEA8',
        background: 'rgba(255,255,255,0.55)', padding: '1px 5px', borderRadius: 4,
      }}
    >
      v{buildInfo.commit}{buildInfo.builtAt ? ' · ' + buildInfo.builtAt : ''}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <BuildBadge />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
