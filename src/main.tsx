// src/main.tsx (or src/main.jsx)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './styles.css';

import Start from './pages/Start';
import Defaults from './pages/Defaults';
import Calculator from './pages/Calculator';

// Use Vite's resolved base so GitHub Pages subpath works ("/<repo>/")
const basename = import.meta.env.BASE_URL;

const router = createBrowserRouter(
  [
    { path: '/', element: <Start /> },
    { path: '/defaults', element: <Defaults /> },
    { path: '/calculator', element: <Calculator /> },
    // optional catch-all to land back on Start (safe on GH Pages)
    { path: '*', element: <Start /> },
  ],
  { basename }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
