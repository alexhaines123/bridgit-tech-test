import { httpLink } from "@trpc/client";
import { trpc } from "./react";

/**
 * Creates the browser tRPC client. The spec requires plain httpLink —
 * deliberately NOT httpBatchLink, so each request is independently visible
 * in the network tab.
 */
export function createTRPCApiClient() {
  return trpc.createClient({
    links: [httpLink({ url: "/api/trpc" })],
  });
}
