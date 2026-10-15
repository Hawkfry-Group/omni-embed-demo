import {
  embedSsoContentDiscovery,
  embedSsoDashboard,
  embedSsoWorkbook,
  EmbedConnectionRoles,
  EmbedEntityFolderContentRoles,
  EmbedSessionMode,
  type CustomThemeProperties,
  type EmbedSsoDashboardProps,
  type EmbedUiSettingsObject,
} from '@omni-co/embed';

export {
  EmbedConnectionRoles,
  EmbedEntityFolderContentRoles,
  EmbedSessionMode,
};

/**
 * Omni v1 payloads require an `exp` claim, so this demo explicitly emits one
 * five minutes after signing instead of using the SDK's 24-hour default. The
 * pinned SDK documentation notes that Omni does not currently guarantee
 * server-side rejection after `exp`; do not treat this as replay prevention.
 */
export const EMBED_URL_EXPIRES_IN_SECONDS = 5 * 60;

const HOSTNAME_PATTERN = /^(?=.{1,253}$)[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)*$/i;
const INVALID_HOST_MESSAGE = 'OMNI_HOST must be a bare hostname without protocol, port, path, query, fragment, or credentials';

type UserAttributes = NonNullable<EmbedSsoDashboardProps['userAttributes']>;
type ConnectionRoles = NonNullable<EmbedSsoDashboardProps['connectionRoles']>;

interface BaseEmbedConfig {
  externalId: string;
  name: string;
  email?: string;
  entity?: string;
  entityFolderContentRole?: EmbedEntityFolderContentRoles;
  theme?: 'dawn' | 'vibes' | 'breeze' | 'blank';
  prefersDark?: 'true' | 'false' | 'system';
  filterSearchParam?: string;
  userAttributes?: UserAttributes;
  connectionRoles?: ConnectionRoles;
  mode?: EmbedSessionMode;
  linkAccess?: string;
  groups?: string[];
  customTheme?: CustomThemeProperties;
  customThemeId?: string;
  uiSettings?: EmbedUiSettingsObject;
}

interface DashboardEmbedConfig extends BaseEmbedConfig {
  contentType: 'dashboard';
  contentId: string;
  accessBoost?: boolean;
}

interface WorkbookEmbedConfig extends BaseEmbedConfig {
  contentType: 'workbook';
  contentId: string;
}

interface ContentDiscoveryEmbedConfig extends BaseEmbedConfig {
  contentType: 'content-discovery';
  path: string;
}

export type EmbedConfig =
  | DashboardEmbedConfig
  | WorkbookEmbedConfig
  | ContentDiscoveryEmbedConfig;

function getEnvironmentConfig() {
  const secret = process.env.OMNI_SECRET;
  const organizationName = process.env.OMNI_ORGANIZATION_NAME;
  const host = process.env.OMNI_HOST;

  if (!secret) {
    throw new Error('OMNI_SECRET environment variable is not set');
  }

  if (secret.length !== 32) {
    throw new Error('OMNI_SECRET must be exactly 32 characters');
  }

  if (!organizationName && !host) {
    throw new Error('Either OMNI_ORGANIZATION_NAME or OMNI_HOST must be set');
  }

  if (organizationName && host) {
    throw new Error('Only one of OMNI_ORGANIZATION_NAME or OMNI_HOST may be set');
  }

  if (host) {
    const normalizedHost = host.trim();
    if (!HOSTNAME_PATTERN.test(normalizedHost)) {
      throw new Error(INVALID_HOST_MESSAGE);
    }

    return { secret, target: { host: normalizedHost } };
  }

  return {
    secret,
    target: { organizationName: organizationName! },
  };
}

export async function generateEmbedUrl(config: EmbedConfig): Promise<string> {
  const { secret, target } = getEnvironmentConfig();
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
    mode: config.mode ?? EmbedSessionMode.SingleContent,
    linkAccess: config.linkAccess,
    groups: config.groups,
    customTheme: config.customTheme,
    customThemeId: config.customThemeId,
    uiSettings: config.uiSettings,
    expiresIn: EMBED_URL_EXPIRES_IN_SECONDS,
    ...target,
  };

  switch (config.contentType) {
    case 'workbook':
      return embedSsoWorkbook({
        ...baseConfig,
        contentId: config.contentId,
      });

    case 'content-discovery':
      return embedSsoContentDiscovery({
        ...baseConfig,
        path: config.path,
      });

    case 'dashboard':
      return embedSsoDashboard({
        ...baseConfig,
        contentId: config.contentId,
        accessBoost: config.accessBoost,
      });
  }
}
