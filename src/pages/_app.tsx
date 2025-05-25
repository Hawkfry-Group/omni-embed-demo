/*
 * This file customizes the Next.js App component to wrap all pages in a global error boundary for user-friendly error handling.
 * See the README section 'How the Main Files Work Together' for an overview of the architecture and data flow.
 */
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
} 