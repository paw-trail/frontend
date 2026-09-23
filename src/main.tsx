import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import '@/styles/index.css';
import { App } from '@/app/App';
import { cleanupLegacyStorage } from '@/app/cleanupLegacy';

cleanupLegacyStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
