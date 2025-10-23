import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@src/App';
import { App as AppAntd } from 'antd';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  // <React.StrictMode>
  <AppAntd>
    <App />
  </AppAntd>,
  // </React.StrictMode>,
);
