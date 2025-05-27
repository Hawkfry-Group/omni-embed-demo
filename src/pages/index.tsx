/*
 * This is the main demo page for the Omni Embed Demo project.
 * It allows user and content selection, then passes the selected data to the OmniEmbed component for secure embedding.
 * See the README section 'How the Main Files Work Together' for an overview of the architecture and data flow.
 */
// index.tsx

import React, { useState } from 'react';
import { OmniEmbed } from '@/components/OmniEmbed';
import { OmniEmbedConfig, OmniUser } from '@/types/omni';
import { EmbedConnectionRoles } from '@omni-co/embed';
import Head from 'next/head';

/*
 * Demo users - Edit this array to mimic real users, groups, and attributes in your Omni instance.
 * When using demo default user when you load locally is user-001, the first listed
 */
const DEMO_USERS: OmniUser[] = [
  {
    externalId: 'user-001',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    attributes: {
      department: ['Sales', 'Finance']
    },
  },
  {
    externalId: 'user-002',
    name: 'Bob Smith',
    email: 'bob@example.com',
    attributes: {
      // department: 'Marketing',
      // role: 'Analyst',
      // region: 'Europe',
    },
  },
  {
    externalId: 'user-003',
    name: 'Carol Davis',
    email: 'carol@example.com',
    attributes: {
      // department: 'Engineering',
      // role: 'Director',
      // region: 'Asia Pacific',
    },
  },
];

// Example embed configurations
const EMBED_CONFIGS: { name: string; config: OmniEmbedConfig }[] = [
  {
    name: 'Dashboard',
    config: {
      contentType: 'dashboard',
      // contentId: 'your-dashboard-id-here', // Replace with your actual dashboard ID
      contentId: '68fde74b',
      theme: 'dawn',
      prefersDark: 'false'  // Forces light mode
    },
  },
  {
    name: 'Workbook',
    config: {
      contentType: 'workbook',
      // contentId: 'your-workbook-id-here', // Replace with your actual workbook ID
      contentId: 'ee1eb1a6',
    },
  },
  {
    name: 'Custom Theme Dashboard',
    config: {
      contentType: 'dashboard',
      // contentId: 'your-dashboard-id-here', // Replace with your actual dashboard ID
      contentId: '3b9aa13b',
      customThemeId: '232250d4-cc11-4dff-97a4-cc4298f2f3f1',
      accessBoost: true, // Enable access boost for this dashboard
      prefersDark: 'true'
      // ,customTheme: {
      //   "dashboard-background": "#2563eb",
      //   "dashboard-tile-title-font-family": "url(https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf)",
      //   "dashboard-tile-subtitle-font-family": "url(https://fonts.gstatic.com/s/opensans/v34/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-muw.ttf)",
      //   "dashboard-tile-value-font-family": "url(https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXp-p7K4KLg.ttf)",
      //   "dashboard-tile-title-font-size": "16px",
      //   "dashboard-tile-subtitle-font-size": "14px",
      //   "dashboard-tile-value-font-size": "24px"
      // }
    },
  },
  // Full navigation embed always requires a contentId and starts on that dashboard/workbook, not the Hub (Current Omni SDK limitation)
  {
    name: 'Full Omni Navigation',
    config: {
      contentType: 'navigation', // Custom type for navigation embedding
      contentId: '68fde74b', // Use any valid dashboard ID for demo
      mode: 'APPLICATION', // Will be mapped to EmbedSessionMode.Application in backend
      theme: 'dawn',
      prefersDark: 'system'
    },
  },
  // Hub (Home Page) demo config (official way per Omni docs)
  {
    name: 'Omni Hub (Home Page)',
    config: {
      contentType: 'content-discovery', // Official way to land on the hub page
      path: 'root', // This lands on the Hub page
      theme: 'dawn',
      prefersDark: 'system'
    },
  },
];

// Map user externalId to their connection roles
//
// You can remove this mapping if you want everyone to get the same role for the connection.
// For example, to give all users the RESTRICTED_QUERIER role for the connection, use:
//
//   config={{
//     ...currentConfig,
//     connectionRoles: {
//       '1dd6899b-569b-4c11-bdc6-f6331ab23b5b': EmbedConnectionRoles.RESTRICTED_QUERIER,
//     },
//   }}
//
const USER_CONNECTION_ROLES: Record<string, Record<string, EmbedConnectionRoles>> = {
  'user-001': {
    '1dd6899b-569b-4c11-bdc6-f6331ab23b5b': EmbedConnectionRoles.RESTRICTED_QUERIER,
  },
  'user-002': {
    '1dd6899b-569b-4c11-bdc6-f6331ab23b5b': EmbedConnectionRoles.VIEWER,
  },
  'user-003': {
    '1dd6899b-569b-4c11-bdc6-f6331ab23b5b': EmbedConnectionRoles.RESTRICTED_QUERIER,
    // You can add more connection IDs here if needed
  },
  // Add more users as needed
};

export default function Home() {
  // You can add more users or change attributes above to test different scenarios.
  // The UI allows you to switch between users and content configs.
  const [currentUser, setCurrentUser] = useState<OmniUser>(DEMO_USERS[0]);
  const [currentConfig, setCurrentConfig] = useState<OmniEmbedConfig>(EMBED_CONFIGS[0].config);
  const [embedKey, setEmbedKey] = useState(0); // Force re-render on user/config change

  const handleUserChange = (userId: string) => {
    const user = DEMO_USERS.find(u => u.externalId === userId);
    if (user) {
      setCurrentUser(user);
      setEmbedKey(prev => prev + 1); // Force new embed URL generation
    }
  };

  const handleConfigChange = (index: number) => {
    setCurrentConfig(EMBED_CONFIGS[index].config);
    setEmbedKey(prev => prev + 1); // Force new embed URL generation
  };

  return (
    <>
      <Head>
        <title>Omni Embed Demo</title>
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-0">
              Omni Embed Demo
            </h1>
            <div className="flex flex-col items-center">
              <a href="https://www.hawkfry.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group">
                <img src="/logo.png" alt="Hawkfry Logo" className="h-12 w-auto" />
                <span className="text-xs text-gray-500 group-hover:underline mt-1 text-center" style={{ fontSize: '0.7rem' }}>www.hawkfry.com</span>
              </a>
            </div>
          </div>

          {/* User Switcher */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Current User
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.externalId}
                  onClick={() => handleUserChange(user.externalId)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    currentUser.externalId === user.externalId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400 mt-1">ID: {user.externalId}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> In a real application, user information would come from your authentication system.
                Each user gets their own unique embed URL with their specific permissions and data access.
              </p>
            </div>
          </div>

          {/* Content Selector */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Try an Integration
            </h2>
            <div className="flex flex-wrap gap-2">
              {EMBED_CONFIGS.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleConfigChange(index)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    currentConfig === item.config
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Important:</strong> Replace the contentId values in the code with your actual dashboard or workbook IDs from Omni.
              </p>
            </div>
          </div>

          {/* Embed Display */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Embedded Analytics
            </h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <OmniEmbed
                key={embedKey}
                config={{
                  ...currentConfig,
                  connectionRoles: USER_CONNECTION_ROLES[currentUser.externalId] || {},
                }}
                user={currentUser}
                className="w-full h-full"
                onLoad={() => console.log('Embed loaded successfully')}
                onError={(error) => console.error('Embed error:', error)}
              />
            </div>
          </div>

          {/* Implementation Guide */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Implementation Guide
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>1. User Authentication:</strong> When a user logs into your app, use their information to create the embed URL.
              </p>
              <p>
                <strong>2. Unique URLs:</strong> Each user gets a unique, signed URL that includes their permissions and data access.
              </p>
              <p>
                <strong>3. Security:</strong> The embed URL is generated server-side using your Omni secret, ensuring security.
              </p>
              <p>
                <strong>4. User Attributes:</strong> Pass additional attributes (department, role, etc.) to filter data in Omni.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 