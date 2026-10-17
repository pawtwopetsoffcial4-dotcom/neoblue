import { NextResponse } from 'next/server';

// Temporary diagnostic route — reports only boolean presence of watched env
// vars (never their values) to debug "configured on one host but not
// another" issues. Safe to leave public since nothing sensitive is exposed.
const WATCHED_KEYS = [
  'ONESIGNAL_APP_ID',
  'ONESIGNAL_REST_API_KEY',
  'SENDER_API_TOKEN',
  'SENDER_FROM_EMAIL',
  'SENDER_GROUP_ID',
  'MONGODB_URI',
  'NEXT_PUBLIC_ONESIGNAL_APP_ID',
];

export async function GET() {
  const presence = Object.fromEntries(WATCHED_KEYS.map((key) => [key, Boolean(process.env[key])]));
  return NextResponse.json({
    presence,
    gitCommit: process.env.APP_GIT_COMMIT || 'unknown',
    buildTime: process.env.APP_BUILD_TIME || 'unknown',
  });
}
