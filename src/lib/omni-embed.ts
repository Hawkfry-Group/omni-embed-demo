/*
 * This file is the SDK wrapper utility for generating signed Omni embed URLs.
 * It is used by the API route (api/embed-url.ts) to securely generate signed URLs using environment variables and the Omni SDK.
 * All sensitive logic and secrets are kept server-side in this module.
 * See the README section 'How the Main Files Work Together' for an overview of the architecture and data flow.
 * NOTE: The Omni SDK's type definitions for host/organizationName are strict and cause linter errors.
 * We always provide either host or organizationName, but TypeScript cannot infer this. These errors are safe to ignore.
 */

import { 
  embedSsoDashboard, 
  embedSsoWorkbook, 
  embedSsoContentDiscovery,
  EmbedConnectionRoles, 
  EmbedSessionMode,
  EmbedEntityFolderContentRoles
} from '@omni-co/embed';

// Re-export types for convenience
export { 
  EmbedConnectionRoles, 
  EmbedSessionMode, 
  EmbedEntityFolderContentRoles
};

interface BaseEmbedConfig {
  externalId: string;
  name: string;
  email?: string;
  entity?: string;
  entityFolderContentRole?: EmbedEntityFolderContentRoles;
  theme?: 'dawn' | 'vibes' | 'breeze' | 'blank';
  prefersDark?: 'true' | 'false' | 'system';
  filterSearchParam?: string;
  userAttributes?: Record<string, string | string[] | number | number[]>;
  connectionRoles?: Record<string, EmbedConnectionRoles>;
  mode?: EmbedSessionMode;
  linkAccess?: string;
  groups?: string[];
  accessBoost?: boolean;
  customTheme?: Record<string, any>;
  customThemeId?: string;
  uiSettings?: Record<string, boolean>;
}

interface DashboardEmbedConfig extends BaseEmbedConfig {
  contentType: 'dashboard';
  contentId: string;
}

interface WorkbookEmbedConfig extends BaseEmbedConfig {
  contentType: 'workbook';
  contentId: string;
}

interface ContentDiscoveryEmbedConfig extends BaseEmbedConfig {
  contentType: 'content-discovery';
  path: string;
}

export type EmbedConfig = DashboardEmbedConfig | WorkbookEmbedConfig | ContentDiscoveryEmbedConfig;

export async function generateEmbedUrl(config: EmbedConfig): Promise<string> {
  const secret = process.env.OMNI_SECRET;
  const organizationName = process.env.OMNI_ORGANIZATION_NAME;
  const host = process.env.OMNI_HOST;

  if (!secret) {
    throw new Error('OMNI_SECRET environment variable is not set');
  }

  if (!organizationName && !host) {
    throw new Error('Either OMNI_ORGANIZATION_NAME or OMNI_HOST must be set');
  }

  // Map string mode to enum if needed
  let mode = config.mode;
  if (mode === 'APPLICATION') {
    mode = EmbedSessionMode.Application;
  }

  const baseConfig = {
    externalId: config.externalId,
    name: config.name,
    secret,
    email: config.email,
    entity: config.entity,
    entityFolderContentRole: config.entityFolderContentRole,
    theme: config.theme,
    prefersDark: config.prefersDark,
    filterSearchParam: config.filterSearchParam,
    userAttributes: config.userAttributes,
    connectionRoles: config.connectionRoles,
    mode: mode || EmbedSessionMode.SingleContent,
    linkAccess: config.linkAccess,
    groups: config.groups,
    accessBoost: config.accessBoost,
    customTheme: config.customTheme,
    customThemeId: config.customThemeId,
    uiSettings: config.uiSettings,
    ...(host ? { host } : { organizationName }),
  };

  // Use the appropriate SDK function based on content type
  switch (config.contentType) {
    case 'workbook':
      // @ts-expect-error: host/organizationName type is stricter than runtime usage
      return await embedSsoWorkbook({
        ...baseConfig,
        contentId: config.contentId,
      });
    
    case 'content-discovery':
      // @ts-expect-error: host/organizationName type is stricter than runtime usage
      return await embedSsoContentDiscovery({
        ...baseConfig,
        path: config.path,
        connectionRoles: baseConfig.connectionRoles || {},
      });
    
    case 'dashboard':
    default:
      // @ts-expect-error: host/organizationName type is stricter than runtime usage
      return await embedSsoDashboard({
        ...baseConfig,
        contentId: config.contentId,
      });
  }
} 