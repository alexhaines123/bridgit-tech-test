"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { trpc } from "@/lib/trpc/react";
import type { WindowDays } from "@/server/eonet/types";

interface BriefingCardProps {
  windowDays: WindowDays;
}

/**
 * Renders the AI-generated Briefing for the current data.
 * Shows loading, success and degraded states. The degraded state offers
 * a retry while the map, list and chart keep working.
 *
 * The Briefing is a soft dependency: when the AI fails, only this card
 * shows an error. The rest of the dashboard keeps functioning.
 *
 * Per ticket #21: the Briefing includes the AI-chosen Measurement, a caption,
 * and a reason why it was chosen.
 */
export function BriefingCard({ windowDays }: BriefingCardProps) {
  const briefing = trpc.briefing.useQuery({ windowDays });

  const handleRetry = () => {
    briefing.refetch();
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" component="h2">
            Briefing
          </Typography>

          {briefing.isPending && (
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <CircularProgress size={20} />
              <Typography color="text.secondary">
                Generating your briefing…
              </Typography>
            </Stack>
          )}

          {briefing.isError && (
            <Alert
              severity="warning"
              action={
                <Button color="inherit" size="small" onClick={handleRetry}>
                  Retry
                </Button>
              }
            >
              {briefing.error.message || "Could not generate the briefing."}
            </Alert>
          )}

          {briefing.isSuccess && (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Reading from: {briefing.data.measurementTitle}
              </Typography>
              <Box sx={{ typography: "body1" }}>
                {briefing.data.summary}
              </Box>
              {briefing.data.caption && (
                <Typography variant="caption" color="text.secondary">
                  Caption: {briefing.data.caption}
                </Typography>
              )}
              {briefing.data.reason && (
                <Typography variant="caption" color="text.secondary">
                  Why: {briefing.data.reason}
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
