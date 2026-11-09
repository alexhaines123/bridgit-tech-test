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
import { EventList } from "@/components/event-list";
import { CategoryFilter } from "@/components/category-filter";
import { MeasurementChart } from "@/components/measurement-chart";
import dynamic from "next/dynamic";
import { DEFAULT_WINDOW_DAYS, type WindowDays } from "@/server/eonet/types";
import {
  filterEventsByCategories,
  getCategoriesFromEvents,
  getCategoryTitlesFromEvents,
} from "@/lib/filters";
import type { Measurement, MeasurementId, MeasurementSummary } from "@/server/measurements/types";

// Dynamic import for the map to avoid SSR issues with WebGL
const EventMap = dynamic(() => import("@/components/event-map"), {
  loading: () => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: 500,
        bgcolor: "background.paper",
        borderRadius: 1,
      }}
    >
      <CircularProgress />
    </Box>
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

  // The current Measurement to chart: the deterministic default until the AI chooses
  const currentMeasurement = useMemo<Measurement | null>(() => {
    if (!events.data) return null;
    const measurements = events.data.measurements as MeasurementSummary;
    const defaultId = events.data.defaultMeasurementId as MeasurementId;
    return measurements[defaultId];
  }, [events.data]);

  const handleRetry = () => {
    events.refetch();
  };

  const handleSelectEvent = (id: string | null) => {
    setSelectedEventId(id);
  };

  return (
    <Stack component="main" spacing={3} sx={{ p: 4, maxWidth: 1400, mx: "auto" }}>
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

      {events.isSuccess && (
        <>
          {/* Category filter */}
          {allCategories.length > 0 && (
            <CategoryFilter
              categories={allCategories}
              categoryTitles={categoryTitles}
              selected={selectedCategories}
              onChange={setSelectedCategories}
            />
          )}

          {/* Map */}
          <Box sx={{ borderRadius: 1, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
            <EventMap
              events={filteredEvents}
              selectedEventId={selectedEventId}
              onSelectEvent={handleSelectEvent}
            />
          </Box>

          {/* Measurement chart */}
          {currentMeasurement && (
            <MeasurementChart
              measurement={currentMeasurement}
              caption="Showing the default Measurement. AI-chosen Measurement coming in ticket #21."
            />
          )}

          {/* Event list */}
          <EventList
            events={filteredEvents}
            selectedEventId={selectedEventId}
            onSelectEvent={handleSelectEvent}
          />
        </>
      )}
    </Stack>
  );
}
