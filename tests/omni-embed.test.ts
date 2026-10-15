import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EmbedConnectionRoles,
  EmbedSessionMode,
  unpackSignedPayload,
} from '@omni-co/embed';
import { generateEmbedUrl } from '@/lib/omni-embed';

const SECRET = '12345678901234567890123456789012';
const NOW = new Date('2026-10-15T12:00:00.000Z');
const EXPECTED_EXPIRY_SECONDS = 300;

type SignedPayload = Record<string, unknown> & { exp: number };

function unpack(urlString: string): SignedPayload {
  const url = new URL(urlString);
  const payload = url.searchParams.get('payload');
  const signature = url.searchParams.get('signature');

  expect(payload).toBeTruthy();
  expect(signature).toBeTruthy();

  return unpackSignedPayload({
    payload: payload!,
    signature: signature!,
    secret: SECRET,
  }) as SignedPayload;
}

describe('generateEmbedUrl', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    process.env.OMNI_SECRET = SECRET;
    process.env.OMNI_ORGANIZATION_NAME = 'acme';
    delete process.env.OMNI_HOST;
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.OMNI_SECRET;
    delete process.env.OMNI_ORGANIZATION_NAME;
    delete process.env.OMNI_HOST;
  });

  it('generates a v1 dashboard URL with a five-minute signed payload', async () => {
    const customTheme = {
      'dashboard-background': '#eff6ff',
      'dashboard-key-color': '#2563eb',
    };
    const userAttributes = { department: ['Sales', 'Finance'], tier: 2 };
    const connectionRoles = {
      'connection-1': EmbedConnectionRoles.RESTRICTED_QUERIER,
    };

    const result = await generateEmbedUrl({
      contentType: 'dashboard',
      contentId: 'dashboard-123',
      externalId: 'user-001',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      userAttributes,
      connectionRoles,
      filterSearchParam: 'f--region={"values":["EMEA"]}',
      customTheme,
      theme: 'dawn',
      prefersDark: 'false',
      mode: EmbedSessionMode.SingleContent,
    });

    const url = new URL(result);
    expect(url.origin).toBe('https://acme.embed-omniapp.co');
    expect(url.pathname).toBe('/embed/login');
    expect(Array.from(url.searchParams.keys()).sort()).toEqual([
      'payload',
      'sdk',
      'signature',
    ]);
    expect(url.searchParams.get('sdk')).toBe('@omni-co/embed@1.1.0');

    const payload = unpack(result);
    expect(payload).toMatchObject({
      contentPath: '/dashboards/dashboard-123',
      externalId: 'user-001',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      userAttributes,
      connectionRoles,
      filterSearchParam: 'f--region={"values":["EMEA"]}',
      customTheme,
      theme: 'dawn',
      prefersDark: 'false',
      mode: EmbedSessionMode.SingleContent,
      exp: Math.floor(NOW.getTime() / 1000) + EXPECTED_EXPIRY_SECONDS,
    });
  });

  it('trims and preserves a bare vanity host for a v1 workbook path', async () => {
    delete process.env.OMNI_ORGANIZATION_NAME;
    process.env.OMNI_HOST = '  analytics.example.com  ';

    const result = await generateEmbedUrl({
      contentType: 'workbook',
      contentId: 'workbook-123',
      externalId: 'user-002',
      name: 'Bob Smith',
      groups: ['Analysts'],
    });

    const url = new URL(result);
    expect(url.origin).toBe('https://analytics.example.com');
    expect(unpack(result)).toMatchObject({
      contentPath: '/w/workbook-123/duplicate',
      groups: ['Analysts'],
      exp: Math.floor(NOW.getTime() / 1000) + EXPECTED_EXPIRY_SECONDS,
    });
  });

  it('creates a v1 content-discovery path and preserves application permissions', async () => {
    const result = await generateEmbedUrl({
      contentType: 'content-discovery',
      path: 'root',
      externalId: 'user-003',
      name: 'Carol Davis',
      entity: 'customer-1',
      mode: EmbedSessionMode.Application,
      connectionRoles: {
        'connection-1': EmbedConnectionRoles.VIEWER,
      },
    });

    expect(unpack(result)).toMatchObject({
      contentPath: '/root',
      entity: 'customer-1',
      mode: EmbedSessionMode.Application,
      connectionRoles: {
        'connection-1': EmbedConnectionRoles.VIEWER,
      },
      exp: Math.floor(NOW.getTime() / 1000) + EXPECTED_EXPIRY_SECONDS,
    });
  });

  it.each([
    'https://analytics.example.com',
    'http://analytics.example.com',
    'analytics.example.com/embed/login',
    'analytics.example.com?tenant=acme',
    'analytics.example.com#embed',
    'user@analytics.example.com',
    'analytics.example.com:443',
    'analytics..example.com',
    '-analytics.example.com',
    'analytics.example.com.',
    '   ',
  ])('rejects malformed OMNI_HOST values: %s', async (host) => {
    delete process.env.OMNI_ORGANIZATION_NAME;
    process.env.OMNI_HOST = host;

    await expect(generateEmbedUrl({
      contentType: 'dashboard',
      contentId: 'dashboard-123',
      externalId: 'user-001',
      name: 'Alice Johnson',
    })).rejects.toThrow('OMNI_HOST must be a bare hostname without protocol, port, path, query, fragment, or credentials');
  });

  it.each([
    ['missing secret', undefined, 'acme', undefined, 'OMNI_SECRET environment variable is not set'],
    ['missing host', SECRET, undefined, undefined, 'Either OMNI_ORGANIZATION_NAME or OMNI_HOST must be set'],
    ['both host forms', SECRET, 'acme', 'analytics.example.com', 'Only one of OMNI_ORGANIZATION_NAME or OMNI_HOST may be set'],
    ['invalid secret length', 'too-short', 'acme', undefined, 'OMNI_SECRET must be exactly 32 characters'],
  ])('rejects invalid environment configuration: %s', async (_case, secret, organizationName, host, message) => {
    if (secret === undefined) delete process.env.OMNI_SECRET;
    else process.env.OMNI_SECRET = secret;
    if (organizationName === undefined) delete process.env.OMNI_ORGANIZATION_NAME;
    else process.env.OMNI_ORGANIZATION_NAME = organizationName;
    if (host === undefined) delete process.env.OMNI_HOST;
    else process.env.OMNI_HOST = host;

    await expect(generateEmbedUrl({
      contentType: 'dashboard',
      contentId: 'dashboard-123',
      externalId: 'user-001',
      name: 'Alice Johnson',
    })).rejects.toThrow(message);
  });
});
