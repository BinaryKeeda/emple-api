import DescopeClient from '@descope/node-sdk';
import { configDotenv } from 'dotenv';

configDotenv();
if (!process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID) {
  throw new Error('Missing DESCOPE project ID');
}

if (!process.env.DESCOPE_MANAGEMENT_KEY) {
  throw new Error('Missing DESCOPE management key');
}

export const descope = DescopeClient({
  projectId: process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID,
  managementKey: process.env.DESCOPE_MANAGEMENT_KEY,
});
