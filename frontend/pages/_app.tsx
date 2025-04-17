import { AppProvider } from '../contexts/AppContext';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import GlobalBackground from '../components/GlobalBackground';
import '../styles/variables.css';
import '../styles/globals.css';
import '../styles/fix-grid-layout.css';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WebSocketProvider>
      <AppProvider>
        <GlobalBackground />
        <Component {...pageProps} />
      </AppProvider>
    </WebSocketProvider>
  );
}

export default MyApp; 