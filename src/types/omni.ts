import type {
  CustomThemeProperties,
  EmbedEntityFolderContentRoles,
  EmbedSessionMode,
  EmbedSsoDashboardProps,
  EmbedUiSettingsObject,
} from '@omni-co/embed';

export type OmniUserAttributes = NonNullable<
  EmbedSsoDashboardProps['userAttributes']
>;

export interface OmniEmbedConfig {
  contentId?: string;
  contentType?: 'dashboard' | 'workbook' | 'navigation' | 'content-discovery';
  /** Application mode exposes Omni navigation; single-content mode is the default. */
  mode?: EmbedSessionMode;
  theme?: 'dawn' | 'vibes' | 'breeze' | 'blank';
  prefersDark?: 'true' | 'false' | 'system';
  filterSearchParam?: string;
  linkAccess?: string;
  accessBoost?: boolean;
  customTheme?: CustomThemeProperties;
  customThemeId?: string;
  connectionRoles?: EmbedSsoDashboardProps['connectionRoles'];
  entityFolderContentRole?: EmbedEntityFolderContentRoles;
  groups?: string[];
  uiSettings?: EmbedUiSettingsObject;
  /** Content-discovery path, such as `root` for the Hub page. */
  path?: string;
}

export interface OmniUser {
  externalId: string;
  name?: string;
  email?: string;
  attributes?: OmniUserAttributes;
}

export interface OmniError {
  code: string;
  message: string;
  details?: unknown;
}
