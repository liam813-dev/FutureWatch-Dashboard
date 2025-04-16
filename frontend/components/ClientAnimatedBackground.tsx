import React from 'react';
import dynamic from 'next/dynamic';

// Import AnimatedBackground with no SSR
const AnimatedBackground = dynamic(
  () => import('./AnimatedBackground'),
  { ssr: false }
);

interface ClientAnimatedBackgroundProps {
  opacity?: number;
}

const ClientAnimatedBackground: React.FC<ClientAnimatedBackgroundProps> = ({ opacity = 0.6 }) => {
  // Directly return the dynamically imported component
  // The dynamic import with ssr: false handles the client-only rendering
  return <AnimatedBackground opacity={opacity} />;
};

export default ClientAnimatedBackground; 