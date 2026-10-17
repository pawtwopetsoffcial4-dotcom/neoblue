export async function register() {
  // Runs once when the server process boots, before any request is handled —
  // prints which GitHub commit this live instance was actually built from,
  // so a deploy can be confirmed from the host's log viewer at a glance.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log(
      `[Boot] NeoBlue server starting — commit: ${process.env.APP_GIT_COMMIT || 'unknown'} | built: ${process.env.APP_BUILD_TIME || 'unknown'}`
    );
  }
}
