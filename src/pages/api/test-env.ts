// This file provides a diagnostic API route to check environment variable setup for the Omni Embed Demo.
// Intended for demo/instructional use. See README for setup and usage instructions.

import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const secretLength = process.env.OMNI_SECRET?.length || 0;
  const hasValidSecret = secretLength === 32;
  const orgName = process.env.OMNI_ORGANIZATION_NAME;
  const host = process.env.OMNI_HOST;
  
  // Determine status and issues
  const issues: string[] = [];
  
  if (!process.env.OMNI_SECRET) {
    issues.push('OMNI_SECRET is not set');
  } else if (secretLength !== 32) {
    issues.push(`OMNI_SECRET must be exactly 32 characters (current: ${secretLength})`);
  }
  
  if (!orgName && !host) {
    issues.push('Either OMNI_ORGANIZATION_NAME or OMNI_HOST must be set');
  }
  
  if (orgName && host) {
    issues.push('Only use either OMNI_ORGANIZATION_NAME or OMNI_HOST, not both');
  }
  
  const isConfigValid = issues.length === 0;
  
  res.status(isConfigValid ? 200 : 400).json({
    status: isConfigValid ? 'OK' : 'ERROR',
    issues,
    config: {
      hasSecret: !!process.env.OMNI_SECRET,
      secretLength,
      isSecretValid: hasValidSecret,
      hasOrgName: !!orgName,
      orgName: orgName || 'not set',
      hasHost: !!host,
      host: host || 'not set',
      nodeEnv: process.env.NODE_ENV,
    },
    expectedDomain: orgName 
      ? `${orgName}.embed-omniapp.co` 
      : host || 'not configured',
    help: {
      secretInfo: 'Get your 32-character secret from Admin > Embed in your Omni instance',
      orgNameInfo: 'Use OMNI_ORGANIZATION_NAME if your embed URL is like: yourorg.embed-omniapp.co',
      hostInfo: 'Use OMNI_HOST if you have a custom domain like: omni.yourdomain.com',
    }
  });
} 