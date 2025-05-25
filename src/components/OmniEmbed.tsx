
/*
 * This file contains the OmniEmbed React component, which fetches a signed embed URL from the server (via the API route) and displays the content in an iframe.
 * It handles loading and error states, and is a key part of the secure embedding flow described in the README section 'How the Main Files Work Together'.
 */
import React, { useEffect, useRef, useState } from 'react';
import { OmniEmbedConfig, OmniUser } from '@/types/omni';

interface OmniEmbedProps {
  config: OmniEmbedConfig;
  user: OmniUser;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const OmniEmbed: React.FC<OmniEmbedProps> = ({
  config,
  user,
  className = '',
  onLoad,
  onError,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the signed embed URL from the server API
    const fetchEmbedUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/embed-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config,
            user,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to get embed URL: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error.message);
        }

        setEmbedUrl(data.data.url);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error.message);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmbedUrl();
  }, [config, user, onError]);

  const handleIframeLoad = () => {
    onLoad?.();
  };

  if (loading) {
    return (
      <div className={`embed-container flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`embed-container flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-800 font-medium mb-2">Failed to load analytics</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!embedUrl) {
    return null;
  }

  return (
    <iframe
      ref={iframeRef}
      src={embedUrl}
      className={`embed-container ${className}`}
      onLoad={handleIframeLoad}
      title="Omni Analytics"
      allow="fullscreen"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
    />
  );
}; 