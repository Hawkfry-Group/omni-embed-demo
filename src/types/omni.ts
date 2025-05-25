/*
 * This file defines TypeScript types for user, config, and error objects used throughout the app for type safety.
 * It is referenced by the main page, embed component, and API route as described in the README section 'How the Main Files Work Together'.
 */
export interface OmniEmbedConfig {
  contentId?: string;
  contentType?: 'dashboard' | 'workbook' | 'navigation' | 'content-discovery';
  /** Controls navigation embedding: 'APPLICATION' for full app navigation, 'SINGLE_CONTENT' (default) for single dashboard/workbook. */
  mode?: string;
  theme?: 'dawn' | 'vibes' | 'breeze' | 'blank';
  prefersDark?: 'true' | 'false' | 'system';
  filterSearchParam?: string;
  linkAccess?: string;
  accessBoost?: boolean;
  customTheme?: Record<string, any>;
  customThemeId?: string;
  connectionRoles?: Record<string, any>;
  /** For content-discovery embeds, path is required and must be a string (e.g. 'root' for Hub page) */
  path?: string;
}

export interface OmniUser {
  externalId: string;
  name?: string;
  email?: string;
  attributes?: Record<string, any>;
}

export interface OmniError {
  code: string;
  message: string;
  details?: any;
} 