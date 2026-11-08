"use client";

import { ToggleButton, ToggleButtonGroup, Typography, Stack } from "@mui/material";
import { VALID_WINDOW_DAYS, type WindowDays } from "@/server/eonet/types";

interface WindowSelectorProps {
  value: WindowDays;
  onChange: (value: WindowDays) => void;
}

/**
 * Selector for the Window (7, 30, or 90 days).
 * Changing the Window changes the Events shown.
 */
export function WindowSelector({ value, onChange }: WindowSelectorProps) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <Typography variant="body2" color="text.secondary">
        Window:
      </Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, newValue) => {
          if (newValue !== null) {
            onChange(newValue);
          }
        }}
        aria-label="Select time window"
        size="small"
      >
        {VALID_WINDOW_DAYS.map((days) => (
          <ToggleButton key={days} value={days} aria-label={`${days} days`}>
            {days} days
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
}
