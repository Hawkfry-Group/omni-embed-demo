import type { NextApiRequest, NextApiResponse } from 'next';
import {
  CustomThemeProperty,
  EmbedEntityFolderContentRoles,
  EmbedSessionMode,
  EmbedUiSettings,
  type CustomThemeProperties,
  type EmbedSsoDashboardProps,
  type EmbedUiSettingsObject,
} from '@omni-co/embed';
import { generateEmbedUrl } from '@/lib/omni-embed';
import type { OmniEmbedConfig, OmniError, OmniUser } from '@/types/omni';

type SuccessResponse = {
  success: true;
  data: { url: string };
};

type ErrorResponse = {
  success: false;
  error: OmniError;
};

type ApiResponse = SuccessResponse | ErrorResponse;
type UserAttributes = NonNullable<EmbedSsoDashboardProps['userAttributes']>;
type ConnectionRoles = NonNullable<EmbedSsoDashboardProps['connectionRoles']>;

const CONTENT_TYPES = [
  'dashboard',
  'workbook',
  'navigation',
  'content-discovery',
] as const;
const THEMES = ['dawn', 'vibes', 'breeze', 'blank'] as const;
const DARK_PREFERENCES = ['true', 'false', 'system'] as const;
const SESSION_MODES = Object.values(EmbedSessionMode);
const ENTITY_FOLDER_ROLES = Object.values(EmbedEntityFolderContentRoles);
const CUSTOM_THEME_PROPERTIES = new Set<string>(Object.values(CustomThemeProperty));
const UI_SETTING_KEYS = new Set<string>(Object.values(EmbedUiSettings));
const BOOLEAN_UI_SETTING_KEYS = new Set<string>([
  EmbedUiSettings.SHOW_HEADER,
  EmbedUiSettings.SHOW_NAVIGATION,
  EmbedUiSettings.DASHBOARD_CHART_CONTEXT_MENU,
  EmbedUiSettings.DASHBOARD_GENERATED_AT,
  EmbedUiSettings.TILE_RAN_TIMESTAMP,
  EmbedUiSettings.SHARE_BUTTON,
]);
const BREADCRUMB_MODES = ['display', 'link', 'none'] as const;
const BODY_KEYS = new Set(['config', 'user']);
const CONFIG_KEYS = new Set([
  'contentId',
  'contentType',
  'mode',
  'theme',
  'prefersDark',
  'filterSearchParam',
  'linkAccess',
  'accessBoost',
  'customTheme',
  'customThemeId',
  'connectionRoles',
  'entityFolderContentRole',
  'groups',
  'uiSettings',
  'path',
]);
const USER_KEYS = new Set(['externalId', 'name', 'email', 'attributes']);

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.getPrototypeOf(value) === Object.prototype;
}

function hasOnlyOwnStringKeys(
  value: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>,
): boolean {
  return Reflect.ownKeys(value).every(
    (key) => typeof key === 'string' && allowedKeys.has(key),
  );
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOptionalNonBlankString(value: unknown): value is string | undefined {
  return value === undefined || isNonBlankString(value);
}

function isOneOf<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
): value is T {
  return typeof value === 'string' && allowedValues.some((item) => item === value);
}

function isUserAttributeValue(
  value: unknown,
): value is string | string[] | number | number[] {
  if (isNonBlankString(value)) return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (!Array.isArray(value)) return false;
  return value.every(isNonBlankString)
    || value.every((item) => typeof item === 'number' && Number.isFinite(item));
}

function isUserAttributes(value: unknown): value is UserAttributes {
  return isPlainRecord(value)
    && Object.entries(value).every(
      ([key, attribute]) => isNonBlankString(key) && isUserAttributeValue(attribute),
    );
}

function isConnectionRoles(value: unknown): value is ConnectionRoles {
  return isPlainRecord(value)
    && Object.entries(value).every(
      ([connectionId, role]) => isNonBlankString(connectionId) && isNonBlankString(role),
    );
}

function isCustomTheme(value: unknown): value is CustomThemeProperties {
  return isPlainRecord(value)
    && Reflect.ownKeys(value).every(
      (key) => typeof key === 'string'
        && CUSTOM_THEME_PROPERTIES.has(key)
        && isNonBlankString(value[key]),
    );
}

function isGroups(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonBlankString);
}

function isUiSettings(value: unknown): value is EmbedUiSettingsObject {
  if (!isPlainRecord(value) || !hasOnlyOwnStringKeys(value, UI_SETTING_KEYS)) return false;

  return Object.entries(value).every(([key, setting]) => {
    if (key === EmbedUiSettings.DOCUMENT_BREADCRUMB) {
      return isOneOf(setting, BREADCRUMB_MODES);
    }
    return BOOLEAN_UI_SETTING_KEYS.has(key) && typeof setting === 'boolean';
  });
}

function invalidRequest(res: NextApiResponse<ApiResponse>) {
  return res.status(400).json({
    success: false,
    error: { code: 'INVALID_REQUEST', message: 'Invalid request body' },
  });
}

function parseRequestBody(
  body: unknown,
): { config: OmniEmbedConfig; user: OmniUser } | undefined {
  if (
    !isPlainRecord(body)
    || !hasOnlyOwnStringKeys(body, BODY_KEYS)
    || !Object.hasOwn(body, 'config')
    || !Object.hasOwn(body, 'user')
    || !isPlainRecord(body.config)
    || !hasOnlyOwnStringKeys(body.config, CONFIG_KEYS)
    || !isPlainRecord(body.user)
    || !hasOnlyOwnStringKeys(body.user, USER_KEYS)
  ) {
    return undefined;
  }

  const config = body.config;
  const user = body.user;
  const contentType = config.contentType ?? 'dashboard';

  if (
    !isOneOf(contentType, CONTENT_TYPES)
    || !isOptionalNonBlankString(config.contentId)
    || !isOptionalNonBlankString(config.path)
    || (contentType !== 'content-discovery' && config.contentId === undefined)
    || !isNonBlankString(user.externalId)
    || !isOptionalNonBlankString(user.name)
    || !isOptionalNonBlankString(user.email)
    || !isOptionalNonBlankString(config.filterSearchParam)
    || !isOptionalNonBlankString(config.linkAccess)
    || !isOptionalNonBlankString(config.customThemeId)
    || (config.mode !== undefined && !isOneOf(config.mode, SESSION_MODES))
    || (config.theme !== undefined && !isOneOf(config.theme, THEMES))
    || (config.prefersDark !== undefined
      && !isOneOf(config.prefersDark, DARK_PREFERENCES))
    || (config.accessBoost !== undefined && typeof config.accessBoost !== 'boolean')
    || (config.connectionRoles !== undefined && !isConnectionRoles(config.connectionRoles))
    || (config.customTheme !== undefined && !isCustomTheme(config.customTheme))
    || (config.groups !== undefined && !isGroups(config.groups))
    || (config.entityFolderContentRole !== undefined
      && !isOneOf(config.entityFolderContentRole, ENTITY_FOLDER_ROLES))
    || (config.uiSettings !== undefined && !isUiSettings(config.uiSettings))
    || (user.attributes !== undefined && !isUserAttributes(user.attributes))
  ) {
    return undefined;
  }

  return {
    config: {
      contentId: config.contentId,
      contentType,
      mode: config.mode,
      theme: config.theme,
      prefersDark: config.prefersDark,
      filterSearchParam: config.filterSearchParam,
      linkAccess: config.linkAccess,
      accessBoost: config.accessBoost,
      customTheme: config.customTheme,
      customThemeId: config.customThemeId,
      connectionRoles: config.connectionRoles,
      entityFolderContentRole: config.entityFolderContentRole,
      groups: config.groups,
      uiSettings: config.uiSettings,
      path: config.path,
    },
    user: {
      externalId: user.externalId,
      name: user.name,
      email: user.email,
      attributes: user.attributes,
    },
  };
}

function isConfigurationError(error: Error): boolean {
  return error.message.startsWith('OMNI_SECRET')
    || error.message.startsWith('OMNI_HOST')
    || error.message.startsWith('Either OMNI_ORGANIZATION_NAME')
    || error.message.startsWith('Only one of OMNI_ORGANIZATION_NAME');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed',
      },
    });
  }

  const parsed = parseRequestBody(req.body);
  if (!parsed) return invalidRequest(res);

  const { config, user } = parsed;
  const contentType = config.contentType ?? 'dashboard';
  const entity = typeof user.attributes?.entity === 'string'
    ? user.attributes.entity
    : undefined;
  const sharedConfig = {
    externalId: user.externalId,
    name: user.name ?? user.externalId,
    email: user.email,
    entity,
    entityFolderContentRole: config.entityFolderContentRole,
    theme: config.theme,
    prefersDark: config.prefersDark,
    filterSearchParam: config.filterSearchParam,
    userAttributes: user.attributes,
    connectionRoles: config.connectionRoles,
    linkAccess: config.linkAccess,
    groups: config.groups,
    customTheme: config.customTheme,
    customThemeId: config.customThemeId,
    uiSettings: config.uiSettings,
  };

  try {
    let url: string;

    if (contentType === 'navigation') {
      url = await generateEmbedUrl({
        ...sharedConfig,
        contentType: 'dashboard',
        contentId: config.contentId!,
        accessBoost: config.accessBoost,
        mode: EmbedSessionMode.Application,
      });
    } else if (contentType === 'content-discovery') {
      url = await generateEmbedUrl({
        ...sharedConfig,
        contentType: 'content-discovery',
        path: config.path ?? 'root',
        mode: config.mode,
      });
    } else if (contentType === 'workbook') {
      url = await generateEmbedUrl({
        ...sharedConfig,
        contentType: 'workbook',
        contentId: config.contentId!,
        mode: config.mode,
      });
    } else {
      url = await generateEmbedUrl({
        ...sharedConfig,
        contentType: 'dashboard',
        contentId: config.contentId!,
        accessBoost: config.accessBoost,
        mode: config.mode,
      });
    }

    return res.status(200).json({
      success: true,
      data: { url },
    });
  } catch (error) {
    console.error('Error generating embed URL:', error);

    if (error instanceof Error && isConfigurationError(error)) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'Server configuration error. Please contact support.',
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}
