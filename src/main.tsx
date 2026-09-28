import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/queryClient';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        theme="light"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            border: '1px solid #E5E2D9',
            color: '#1A2233',
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
);
