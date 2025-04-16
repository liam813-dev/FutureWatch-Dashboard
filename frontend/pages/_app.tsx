import { AppProvider } from '../contexts/AppContext';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import '../styles/variables.css';
import '../styles/globals.css';
import '../styles/fix-grid-layout.css';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WebSocketProvider>
      <AppProvider>
        <Component {...pageProps} />
      </AppProvider>
    </WebSocketProvider>
  );
}

export default MyApp; 