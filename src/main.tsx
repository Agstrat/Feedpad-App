import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles.css';
import Start from './pages/Start';
import Defaults from './pages/Defaults';
import Calculator from './pages/Calculator';

const router = createBrowserRouter([
  { path: '/', element: <Start /> },
  { path: '/defaults', element: <Defaults /> },
  { path: '/calculator', element: <Calculator /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
