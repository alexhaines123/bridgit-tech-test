export async function register() {
  // Next.js runs register() once when the server starts. Importing the env
  // module validates configuration there, so a missing or invalid variable
  // stops startup with a clear message before any request is served.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./server/env");
  }
}
