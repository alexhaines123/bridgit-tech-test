"use client";

import { useState } from "react";
import {
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Box,
} from "@mui/material";
import { trpc } from "@/lib/trpc/react";
import { WindowSelector } from "@/components/window-selector";
import { EventList } from "@/components/event-list";
import { DEFAULT_WINDOW_DAYS, type WindowDays } from "@/server/eonet/types";

export default function HomePage() {
  const [windowDays, setWindowDays] = useState<WindowDays>(DEFAULT_WINDOW_DAYS);

  const events = trpc.events.useQuery({ windowDays });

  const handleRetry = () => {
    events.refetch();
  };

  return (
    <Stack component="main" spacing={3} sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Stack spacing={0.5}>
          <Typography variant="h3">Planet Watch</Typography>
          <Typography color="text.secondary">
            Live events from NASA&apos;s EONET
          </Typography>
        </Stack>
        <WindowSelector value={windowDays} onChange={setWindowDays} />
      </Stack>

      {events.isPending && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {events.isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          {events.error.message || "Failed to load events"}
        </Alert>
      )}

      {events.isSuccess && <EventList events={events.data.events} />}
    </Stack>
  );
}
