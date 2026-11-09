"use client";

import {
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Box,
  Button,
} from "@mui/material";
import type { ShapedEvent } from "@/server/eonet/types";

interface EventListProps {
  events: ShapedEvent[];
  selectedEventId?: string | null;
  onSelectEvent?: (id: string | null) => void;
}

/**
 * Displays a list of Events with Category, dates and Magnitude with its own unit.
 * Magnitudes are never summed or compared across Categories.
 * Supports bidirectional selection with the map.
 */
export function EventList({ events, selectedEventId, onSelectEvent }: EventListProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2} sx={{ alignItems: "center", py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No events in this window
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try widening the Window to see more events.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          isSelected={selectedEventId === event.id}
          onSelect={() => onSelectEvent?.(event.id)}
        />
      ))}
    </Stack>
  );
}

function EventCard({
  event,
  isSelected,
  onSelect,
}: {
  event: ShapedEvent;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const date = new Date(event.latest.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      sx={{
        cursor: "pointer",
        borderColor: isSelected ? "primary.main" : undefined,
        borderWidth: isSelected ? 2 : 1,
        transition: "border-color 0.2s",
        "&:focus": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: "2px",
        },
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <Typography variant="h6" component="h2">
              {event.title}
            </Typography>
            <Chip
              label={event.categoryTitle}
              size="small"
              sx={{
                backgroundColor: (theme) =>
                  theme.custom.categoryColors[event.categoryId] || theme.palette.primary.main,
                color: "#0d1117",
                fontWeight: 600,
              }}
            />
          </Stack>

          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {date}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {event.region}
            </Typography>
            {event.closed && (
              <Chip label="Closed" size="small" variant="outlined" color="default" />
            )}
          </Stack>

          {event.latest.magnitude && (
            <Box>
              <Typography variant="body2" color="text.secondary" component="span">
                Magnitude:{" "}
              </Typography>
              <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                {event.latest.magnitude.value.toLocaleString()}{" "}
                {event.latest.magnitude.unit}
              </Typography>
            </Box>
          )}

          {event.historyTrimmed && (
            <Typography variant="caption" color="text.secondary">
              {event.historyLength} locations tracked
            </Typography>
          )}

          <Button
            href={event.link}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            variant="text"
            onClick={(e) => e.stopPropagation()}
          >
            View details →
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
