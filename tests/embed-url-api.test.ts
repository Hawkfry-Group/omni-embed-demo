import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  CustomThemeProperty,
  EmbedConnectionRoles,
  EmbedEntityFolderContentRoles,
  EmbedSessionMode,
  EmbedUiSettings,
} from '@omni-co/embed';

const mocks = vi.hoisted(() => ({
  generateEmbedUrl: vi.fn(),
}));

vi.mock('@/lib/omni-embed', () => ({
  generateEmbedUrl: mocks.generateEmbedUrl,
}));

import handler from '@/pages/api/embed-url';

type JsonValue = Record<string, unknown>;

function createResponse() {
  let statusCode = 200;
  let body: JsonValue | undefined;
  const headers = new Map<string, string>();
  const response = {
    setHeader: vi.fn((name: string, value: string) => {
      headers.set(name.toLowerCase(), value);
      return response;
    }),
    status: vi.fn((code: number) => {
      statusCode = code;
      return response;
    }),
    json: vi.fn((value: JsonValue) => {
      body = value;
      return response;
    }),
  } as unknown as NextApiResponse;

  return {
    response,
    result: () => ({ statusCode, body, headers }),
  };
}

function request(body: unknown, method = 'POST'): NextApiRequest {
  return { method, body } as NextApiRequest;
}

function validRequest(overrides: Record<string, unknown> = {}) {
  return {
    config: {
      contentType: 'dashboard',
      contentId: 'dashboard-123',
      ...overrides,
    },
    user: { externalId: 'user-001' },
  };
}

const INVALID_REQUEST = {
  success: false,
  error: {
    code: 'INVALID_REQUEST',
    message: 'Invalid request body',
  },
};

describe('/api/embed-url', () => {
  beforeEach(() => {
    mocks.generateEmbedUrl.mockReset();
    mocks.generateEmbedUrl.mockResolvedValue('https://acme.embed-omniapp.co/embed/login?payload=x&signature=y');
  });

  it('maps the application demo to a dashboard signer payload and preserves valid settings', async () => {
    const { response, result } = createResponse();
    const customTheme = {
      [CustomThemeProperty.DASHBOARD_BACKGROUND]: '#eff6ff',
    };

    await handler(request({
      config: {
        contentType: 'navigation',
        contentId: 'dashboard-123',
        filterSearchParam: 'f--region={"values":["EMEA"]}',
        linkAccess: '__omni_link_access_open',
        connectionRoles: {
          'connection-1': EmbedConnectionRoles.RESTRICTED_QUERIER,
          'connection-2': 'CUSTOM_ANALYST',
        },
        entityFolderContentRole: EmbedEntityFolderContentRoles.VIEWER,
        groups: ['Analysts'],
        uiSettings: {
          [EmbedUiSettings.SHOW_HEADER]: false,
          [EmbedUiSettings.DOCUMENT_BREADCRUMB]: 'display',
        },
        customTheme,
        customThemeId: 'theme-123',
        theme: 'dawn',
        prefersDark: 'system',
        accessBoost: true,
      },
      user: {
        externalId: 'user-001',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        attributes: { entity: 'customer-1', department: ['Sales'] },
      },
    }), response);

    expect(mocks.generateEmbedUrl).toHaveBeenCalledWith(expect.objectContaining({
      contentType: 'dashboard',
      contentId: 'dashboard-123',
      externalId: 'user-001',
      entity: 'customer-1',
      userAttributes: { entity: 'customer-1', department: ['Sales'] },
      connectionRoles: {
        'connection-1': EmbedConnectionRoles.RESTRICTED_QUERIER,
        'connection-2': 'CUSTOM_ANALYST',
      },
      entityFolderContentRole: EmbedEntityFolderContentRoles.VIEWER,
      groups: ['Analysts'],
      uiSettings: {
        showHeader: false,
        documentBreadcrumb: 'display',
      },
      filterSearchParam: 'f--region={"values":["EMEA"]}',
      linkAccess: '__omni_link_access_open',
      customTheme,
      customThemeId: 'theme-123',
      theme: 'dawn',
      prefersDark: 'system',
      accessBoost: true,
      mode: EmbedSessionMode.Application,
    }));
    expect(result().statusCode).toBe(200);
  });

  it('dispatches workbook application mode to the workbook signer payload', async () => {
    const { response, result } = createResponse();

    await handler(request(validRequest({
      contentType: 'workbook',
      contentId: 'workbook-123',
      mode: EmbedSessionMode.Application,
    })), response);

    expect(mocks.generateEmbedUrl).toHaveBeenCalledWith(expect.objectContaining({
      contentType: 'workbook',
      contentId: 'workbook-123',
      mode: EmbedSessionMode.Application,
    }));
    expect(result().statusCode).toBe(200);
  });

  it.each([
    ['missing body', undefined],
    ['missing config', { user: { externalId: 'user-001' } }],
    ['unsupported content type', validRequest({ contentType: 'report' })],
    ['blank content id', validRequest({ contentId: '   ' })],
    ['numeric content id', validRequest({ contentId: 123 })],
    ['numeric content-discovery path', validRequest({
      contentType: 'content-discovery',
      contentId: undefined,
      path: 123,
    })],
    ['blank external id', { ...validRequest(), user: { externalId: '\t' } }],
    ['blank optional name', { ...validRequest(), user: { externalId: 'user-001', name: ' ' } }],
    ['non-string optional email', {
      ...validRequest(),
      user: { externalId: 'user-001', email: ['alice@example.com'] },
    }],
    ['connection roles string', validRequest({ connectionRoles: 'RESTRICTED_QUERIER' })],
    ['blank connection id', validRequest({ connectionRoles: { ' ': EmbedConnectionRoles.VIEWER } })],
    ['blank connection role', validRequest({ connectionRoles: { 'connection-1': ' ' } })],
    ['custom theme string', validRequest({ customTheme: 'dawn' })],
    ['unknown custom theme property', validRequest({ customTheme: { '--unknown': '#fff' } })],
    ['non-string custom theme value', validRequest({ customTheme: { [CustomThemeProperty.DASHBOARD_BACKGROUND]: 1 } })],
    ['blank custom theme value', validRequest({ customTheme: { [CustomThemeProperty.DASHBOARD_BACKGROUND]: ' ' } })],
    ['mode object', validRequest({ mode: { value: EmbedSessionMode.Application } })],
    ['unsupported mode', validRequest({ mode: 'ADMIN' })],
    ['access boost string', validRequest({ accessBoost: 'true' })],
    ['unsupported theme', validRequest({ theme: 'midnight' })],
    ['unsupported dark preference', validRequest({ prefersDark: true })],
    ['blank filter', validRequest({ filterSearchParam: ' ' })],
    ['blank link access', validRequest({ linkAccess: ' ' })],
    ['blank custom theme id', validRequest({ customThemeId: ' ' })],
    ['groups string', validRequest({ groups: 'Analysts' })],
    ['blank group', validRequest({ groups: ['Analysts', ' '] })],
    ['unsupported entity folder role', validRequest({ entityFolderContentRole: 'OWNER' })],
    ['ui settings string', validRequest({ uiSettings: 'compact' })],
    ['unknown ui setting', validRequest({ uiSettings: { showToolbar: false } })],
    ['invalid boolean ui setting', validRequest({ uiSettings: { showHeader: 'false' } })],
    ['invalid breadcrumb mode', validRequest({ uiSettings: { documentBreadcrumb: 'hidden' } })],
    ['non-object user attributes', {
      ...validRequest(),
      user: { externalId: 'user-001', attributes: 'admin' },
    }],
    ['mixed user attribute array', {
      ...validRequest(),
      user: { externalId: 'user-001', attributes: { team: ['Sales', 2] } },
    }],
    ['non-finite user attribute number', {
      ...validRequest(),
      user: { externalId: 'user-001', attributes: { tier: Number.NaN } },
    }],
    ['blank user attribute key', {
      ...validRequest(),
      user: { externalId: 'user-001', attributes: { ' ': 'admin' } },
    }],
  ])('rejects invalid input before signing: %s', async (_case, body) => {
    const { response, result } = createResponse();

    await handler(request(body), response);

    expect(result().statusCode).toBe(400);
    expect(result().body).toEqual(INVALID_REQUEST);
    expect(mocks.generateEmbedUrl).not.toHaveBeenCalled();
  });

  it('rejects inherited config properties before signing', async () => {
    const config = Object.create({ accessBoost: true }) as Record<string, unknown>;
    config.contentType = 'dashboard';
    config.contentId = 'dashboard-123';
    const { response, result } = createResponse();

    await handler(request({ config, user: { externalId: 'user-001' } }), response);

    expect(result().statusCode).toBe(400);
    expect(result().body).toEqual(INVALID_REQUEST);
    expect(mocks.generateEmbedUrl).not.toHaveBeenCalled();
  });

  it('returns Allow: POST for non-POST requests', async () => {
    const { response, result } = createResponse();

    await handler(request({}, 'GET'), response);

    expect(result().statusCode).toBe(405);
    expect(result().headers.get('allow')).toBe('POST');
    expect(mocks.generateEmbedUrl).not.toHaveBeenCalled();
  });

  it('maps signer configuration failures to a stable public error', async () => {
    mocks.generateEmbedUrl.mockRejectedValueOnce(new Error('OMNI_HOST must be a bare hostname'));
    const { response, result } = createResponse();

    await handler(request(validRequest()), response);

    expect(result()).toMatchObject({
      statusCode: 500,
      body: {
        success: false,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'Server configuration error. Please contact support.',
        },
      },
    });
  });

  it('maps unexpected signer failures without exposing details', async () => {
    mocks.generateEmbedUrl.mockRejectedValueOnce(new Error('sensitive signer detail'));
    const { response, result } = createResponse();

    await handler(request(validRequest()), response);

    expect(result()).toMatchObject({
      statusCode: 500,
      body: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
    });
  });
});
