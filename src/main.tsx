import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './styles.css';

import Start from './pages/Start';
import Defaults from './pages/Defaults';
import Calculator from './pages/Calculator';

// Vite exposes the correct base at build: '/Feedpad-App/'
// Normalize to no trailing slash for React Router
const basename = import.meta.env.BASE_URL.replace(/\/+$/, '');

const router = createBrowserRouter(
  [
    { path: '/', element: <Start /> },
    { path: '/defaults', element: <Defaults /> },
    { path: '/calculator', element: <Calculator /> },
  ],
  { basename }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
