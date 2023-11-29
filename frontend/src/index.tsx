import React from 'react';
import ReactDOM from 'react-dom/client';
import './reset.scss';
import './index.scss';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './reset.scss';
import './index.scss';
import { QueryClient, QueryClientProvider } from 'react-query';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

const queryClient = new QueryClient();

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>   
        </BrowserRouter>
    </React.StrictMode>
);