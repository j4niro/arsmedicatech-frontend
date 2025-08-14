//const API_URL = 'https://demo.arsmedicatech.com';
//const API_URL = process.env.API_URL || 'http://localhost:3123';

// Safely access process.env with fallbacks
const getEnvVar = (key: string, fallback: string = ''): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

const API_URL = getEnvVar('API_URL') || getEnvVar('REACT_APP_API_URL') || '';
if (!API_URL) {
  throw new Error('API_URL environment variable is not set');
}

console.log('API_URL:', API_URL);

const SENTRY_DSN =
  getEnvVar('SENTRY_DSN') || getEnvVar('REACT_APP_SENTRY_DSN') || '';
console.log('SENTRY_DSN:', SENTRY_DSN);
if (!SENTRY_DSN) {
  console.warn('SENTRY_DSN environment variable is not set');
}

console.log('SENTRY_DSN:', SENTRY_DSN);

const LIVE_KIT_TOKEN_URL = 'https://demo.arsmedicatech.com';
const LIVE_KIT_SERVER_URL = 'wss://demo.arsmedicatech.com';

const GOOGLE_LOGO =
  'https://darrenmackenzie-chalice-bucket.s3.us-east-1.amazonaws.com/icons/Google_logo.svg';

const DEBUG = getEnvVar('NODE_ENV') === 'development';

// Demo mode flag - allows unauthenticated access to certain endpoints
const DEMO_MODE =
  getEnvVar('DEMO_MODE') === 'true' ||
  getEnvVar('REACT_APP_DEMO_MODE') === 'true' ||
  API_URL.includes('demo.arsmedicatech.com');

console.log('DEMO_MODE:', DEMO_MODE);

export {
  API_URL,
  DEBUG,
  DEMO_MODE,
  GOOGLE_LOGO,
  LIVE_KIT_SERVER_URL,
  LIVE_KIT_TOKEN_URL,
  SENTRY_DSN,
};
