"use client";

import { Typography } from "@mui/material";
import { trpc } from "@/lib/trpc/react";

/** Calls the health procedure to prove the tRPC + TanStack Query wiring. */
export function HealthStatus() {
  const health = trpc.health.useQuery();

  if (health.isPending) {
    return <Typography color="text.secondary">Checking API health…</Typography>;
  }
  if (health.isError) {
    return (
      <Typography color="error">
        API health check failed: {health.error.message}
      </Typography>
    );
  }
  return (
    <Typography color="success.main">
      API healthy: {health.data.name} ({health.data.status})
    </Typography>
  );
}
