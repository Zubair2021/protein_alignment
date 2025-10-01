import { createBrowserRouter, Navigate } from 'react-router-dom'
import { WorkspacePage } from '@/pages/WorkspacePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <WorkspacePage />,
  },
  {
    path: '*',
    element: <Navigate to='/' replace />,
  },
])
