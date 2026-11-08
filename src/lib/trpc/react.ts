import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/api/root";

/** Client-side tRPC hooks, backed by TanStack Query. */
export const trpc = createTRPCReact<AppRouter>();
