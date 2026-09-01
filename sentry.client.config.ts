import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://examplePublicKey@o0.ingest.sentry.io/0",

  // Adjust this value in production to prevent spamming edge requests
  tracesSampleRate: 0.05,

  // Setting this option to true will print useful information to the console when the SDK is initialized
  debug: false,
});
