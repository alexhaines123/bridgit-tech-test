"use client";

import { useState, useMemo } from "react";
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
import { RecentEventsCompact } from "@/components/recent-events-compact";
import { CategoryFilter } from "@/components/category-filter";
import { MeasurementChart } from "@/components/measurement-chart";
import { BriefingCard } from "@/components/briefing-card";
import dynamic from "next/dynamic";
import { DEFAULT_WINDOW_DAYS, type WindowDays } from "@/server/eonet/types";
import {
  filterEventsByCategories,
  getCategoriesFromEvents,
  getCategoryTitlesFromEvents,
} from "@/lib/filters";
import type { MeasurementSummary } from "@/server/measurements/types";

// Dynamic import for the map to avoid SSR issues with WebGL
const EventMap = dynamic(() => import("@/components/event-map"), {
  loading: () => (
    <Stack
      sx={{
        justifyContent: "center",
        alignItems: "center",
        height: 400,
        bgcolor: "background.paper",
        borderRadius: 1,
      }}
    >
      <CircularProgress />
    </Stack>
  ),
  ssr: false,
});

export default function HomePage() {
  const [windowDays, setWindowDays] = useState<WindowDays>(DEFAULT_WINDOW_DAYS);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const events = trpc.events.useQuery({ windowDays });

  // Derive available categories from all events
  const allCategories = useMemo(
    () => (events.data ? getCategoriesFromEvents(events.data.events) : []),
    [events.data],
  );

  const categoryTitles = useMemo(
    () => (events.data ? getCategoryTitlesFromEvents(events.data.events) : {}),
    [events.data],
  );

  // Filter events by selected categories
  const filteredEvents = useMemo(
    () =>
      events.data
        ? filterEventsByCategories(events.data.events, selectedCategories)
        : [],
    [events.data, selectedCategories],
  );

  // Map the startedPerDay Measurement for the sidebar Activity chart
  const startedPerDayMeasurement = useMemo(() => {
    if (!events.data) return null;
    const measurements = events.data.measurements as MeasurementSummary;
    return measurements.startedPerDay ?? null;
  }, [events.data]);

  const handleRetry = () => {
    events.refetch();
  };

  const handleSelectEvent = (id: string | null) => {
    setSelectedEventId(id);
  };

  return (
    <Stack component="main" sx={{ p: 4, maxWidth: 1400, mx: "auto" }} spacing={3}>
      {/* Header */}
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
        <Stack sx={{ justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Stack>
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

      {events.isSuccess && (
        /*
         * Responsive grid layout.
         * Desktop (md+): 2-column grid — Map + Recent Events in column 1,
         *   CategoryFilter + BriefingCard + MeasurementChart in column 2.
         * Mobile (xs): single column, items ordered: Map → CategoryFilter →
         *   BriefingCard → MeasurementChart → RecentEventsCompact.
         */
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          }}
        >
          {/* Map — column 1 on desktop, order 1 on mobile */}
          <Box
            sx={{
              gridColumn: { xs: "1", md: "1" },
              order: { xs: 1, md: 1 },
            }}
          >
            <Box
              sx={{
                borderRadius: 1,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                height: 400,
              }}
            >
              <EventMap
                events={filteredEvents}
                selectedEventId={selectedEventId}
                onSelectEvent={handleSelectEvent}
              />
            </Box>
          </Box>

          {/* Category filter — column 2 on desktop, order 2 on mobile */}
          {allCategories.length > 0 && (
            <Box
              sx={{
                gridColumn: { xs: "1", md: "2" },
                order: { xs: 2, md: 2 },
              }}
            >
              <CategoryFilter
                categories={allCategories}
                categoryTitles={categoryTitles}
                selected={selectedCategories}
                onChange={setSelectedCategories}
              />
            </Box>
          )}

          {/* AI Briefing — column 2 on desktop, order 3 on mobile */}
          <Box
            sx={{
              gridColumn: { xs: "1", md: "2" },
              order: { xs: 3, md: 3 },
            }}
          >
            <BriefingCard windowDays={windowDays} />
          </Box>

          {/* Event Activity chart (startedPerDay) — column 2 on desktop, order 4 on mobile */}
          {startedPerDayMeasurement && (
            <Box
              sx={{
                gridColumn: { xs: "1", md: "2" },
                order: { xs: 4, md: 4 },
              }}
            >
              <MeasurementChart
                measurement={startedPerDayMeasurement}
                caption="Events started per day in the current Window."
              />
            </Box>
          )}

          {/* Recent Events compact list — column 1 on desktop, order 5 on mobile (last) */}
          <Box
            sx={{
              gridColumn: { xs: "1", md: "1" },
              order: { xs: 5, md: 5 },
            }}
          >
            <RecentEventsCompact events={filteredEvents} maxItems={5} />
          </Box>
        </Box>
      )}
    </Stack>
  );
}
