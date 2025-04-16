import React from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Import the Dashboard component dynamically with no SSR to avoid hydration issues with WebSockets
const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
});

// This component will serve as the dashboard entry point
const DashboardPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Dashboard | Neo Future</title>
        <meta name="description" content="Real-time cryptocurrency market dashboard" />
      </Head>
      <Dashboard />
    </>
  );
};

export default DashboardPage; 