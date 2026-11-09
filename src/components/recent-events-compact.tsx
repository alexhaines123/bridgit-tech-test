"use client";

import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
} from "@mui/material";
import type { ShapedEvent } from "@/server/eonet/types";

interface RecentEventsCompactProps {
  events: ShapedEvent[];
  /** Maximum number of events to render. Default: 5 */
  maxItems?: number;
}

/**
 * Displays a compact, read-only list of recent Events.
 * Each card shows: title, Region, and time ago.
 * No click-to-select or bidirectional map interaction.
 */
export function RecentEventsCompact({
  events,
  maxItems = 5,
}: RecentEventsCompactProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2} sx={{ alignItems: "center", py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No events in this Window
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try widening the Window to see more events.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const visibleEvents = events.slice(0, maxItems);

  return (
    <Stack spacing={1.5}>
      <Typography variant="h6" component="h2">
        Recent Events
      </Typography>
      {visibleEvents.map((event) => (
        <RecentEventRow key={event.id} event={event} />
      ))}
    </Stack>
  );
}

function RecentEventRow({ event }: { event: ShapedEvent }) {
  const timeAgo = formatTimeAgo(event.latest.date);

  return (
    <Card>
      <CardContent sx={{ py: 1.5, px: 2 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {event.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {event.region}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {timeAgo}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
