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

  const allCategories = useMemo(
    () => (events.data ? getCategoriesFromEvents(events.data.events) : []),
    [events.data],
  );

  const categoryTitles = useMemo(
    () => (events.data ? getCategoryTitlesFromEvents(events.data.events) : {}),
    [events.data],
  );

  const filteredEvents = useMemo(
    () =>
      events.data
        ? filterEventsByCategories(events.data.events, selectedCategories)
        : [],
    [events.data, selectedCategories],
  );

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
         * Responsive layout using flex + display:contents.
         *
         * Desktop (md+): outer Box is flex-row. Two Stacks act as independent
         *   columns — left (Map + Recent Events), right (CategoryFilter →
         *   BriefingCard → MeasurementChart). Each Stack uses gap for internal
         *   spacing. Sidebar items stack from the top, aligned with the map.
         *
         * Mobile (xs): outer Box is flex-column. Stacks use display:contents
         *   so their children become direct flex children of the outer Box.
         *   Each child's `order` controls visual position:
         *   1=Map, 2=CategoryFilter, 3=BriefingCard, 4=Chart, 5=RecentEvents.
         *   Outer Box gap:3 provides uniform vertical spacing.
         */
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
        >
          {/* Left column: Map + Recent Events */}
          <Stack
            sx={{
              flex: 2,
              minWidth: 0,
              display: { xs: "contents", md: "flex" },
              flexDirection: "column",
              gap: { xs: 0, md: 3 },
            }}
          >
            {/* Map — order 1 on mobile, default on desktop */}
            <Box sx={{ order: { xs: 1, md: 0 } }}>
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

            {/* Recent Events — order 5 (last) on mobile, default on desktop */}
            <Box sx={{ order: { xs: 5, md: 0 } }}>
              <RecentEventsCompact events={filteredEvents} maxItems={5} />
            </Box>
          </Stack>

          {/* Right column: Sidebar */}
          <Stack
            sx={{
              flex: 1,
              minWidth: 0,
              display: { xs: "contents", md: "flex" },
              flexDirection: "column",
              gap: { xs: 0, md: 2 },
            }}
          >
            {/* Category filter — order 2 on mobile */}
            {allCategories.length > 0 && (
              <Box sx={{ order: { xs: 2, md: 0 } }}>
                <CategoryFilter
                  categories={allCategories}
                  categoryTitles={categoryTitles}
                  selected={selectedCategories}
                  onChange={setSelectedCategories}
                />
              </Box>
            )}

            {/* AI Briefing — order 3 on mobile */}
            <Box sx={{ order: { xs: 3, md: 0 } }}>
              <BriefingCard windowDays={windowDays} />
            </Box>

            {/* Event Activity chart — order 4 on mobile */}
            {startedPerDayMeasurement && (
              <Box sx={{ order: { xs: 4, md: 0 } }}>
                <MeasurementChart
                  measurement={startedPerDayMeasurement}
                  caption="Events started per day in the current Window."
                />
              </Box>
            )}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
