import { createRemoteJWKSet, jwtVerify } from 'jose';

export async function verifyAppleToken(identityToken: string) {
  // Fetch Apple's public JWKS and verify in one step
  const JWKS = createRemoteJWKSet(
    new URL('https://appleid.apple.com/auth/keys')
  );

  const { payload } = await jwtVerify(identityToken, JWKS, {
    issuer: 'https://appleid.apple.com',
    audience: process.env.APPLE_BUNDLE_ID,
    algorithms: ['RS256'],
  });

  return payload;
  // payload contains: sub, email, email_verified, iat, exp
}
