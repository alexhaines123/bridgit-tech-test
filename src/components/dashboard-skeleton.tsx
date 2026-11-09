"use client";

import { Stack, Skeleton, Card, CardContent, Box } from "@mui/material";

/**
 * Skeleton loader for the dashboard.
 * Mirrors the 2-column layout with shimmer placeholders:
 * - Left column: Map (400px) + 5 Recent Event rows
 * - Right column: Category filter, Briefing card, Activity chart
 */
export function DashboardSkeleton() {
  return (
    <Stack
      data-testid="dashboard-skeleton"
      direction={{ xs: "column", md: "row" }}
      spacing={3}
      sx={{ flex: 1 }}
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
        {/* Map placeholder */}
        <Box
          sx={{
            order: { xs: 1, md: 0 },
            borderRadius: 1,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            height: 400,
            bgcolor: "background.paper",
          }}
        >
          <Skeleton
            data-testid="skeleton"
            variant="rectangular"
            width="100%"
            height="100%"
            animation="wave"
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Recent Events rows */}
        <Box sx={{ order: { xs: 5, md: 0 } }}>
          <Stack spacing={1.5}>
            {/* Recent Events header */}
            <Skeleton
              data-testid="skeleton"
              variant="text"
              width={120}
              height={28}
              animation="wave"
            />
            {[...Array(5)].map((_, i) => (
              <Card
                key={i}
                data-testid="event-row-skeleton"
              >
                <CardContent sx={{ py: 1.5, px: 2 }}>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between", alignItems: "center" }}
                  >
                    <Box sx={{ flex: 1 }}>
                      {/* Event title */}
                      <Skeleton
                        data-testid="skeleton"
                        variant="text"
                        width="60%"
                        height={24}
                        animation="wave"
                      />
                      {/* Region */}
                      <Skeleton
                        data-testid="skeleton"
                        variant="text"
                        width="30%"
                        height={20}
                        animation="wave"
                      />
                    </Box>
                    {/* Time ago */}
                    <Skeleton
                      data-testid="skeleton"
                      variant="text"
                      width={60}
                      height={20}
                      animation="wave"
                    />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
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
        {/* Category filter placeholder */}
        <Card data-testid="sidebar-card-skeleton">
          <CardContent>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
              <Skeleton data-testid="skeleton" variant="text" width={80} height={24} animation="wave" />
              <Skeleton data-testid="skeleton" variant="rounded" width={80} height={32} animation="wave" />
              <Skeleton data-testid="skeleton" variant="rounded" width={100} height={32} animation="wave" />
              <Skeleton data-testid="skeleton" variant="rounded" width={70} height={32} animation="wave" />
            </Stack>
          </CardContent>
        </Card>

        {/* Briefing card placeholder */}
        <Card data-testid="sidebar-card-skeleton">
          <CardContent>
            <Stack spacing={2}>
              <Skeleton data-testid="skeleton" variant="text" width={80} height={28} animation="wave" />
              <Skeleton data-testid="skeleton" variant="text" width="100%" height={20} animation="wave" />
              <Skeleton data-testid="skeleton" variant="text" width="90%" height={20} animation="wave" />
              <Skeleton data-testid="skeleton" variant="text" width="95%" height={20} animation="wave" />
            </Stack>
          </CardContent>
        </Card>

        {/* Activity chart placeholder */}
        <Card data-testid="sidebar-card-skeleton">
          <CardContent>
            <Stack spacing={2}>
              <Skeleton data-testid="skeleton" variant="text" width={120} height={28} animation="wave" />
              <Box sx={{ height: 200 }}>
                <Skeleton
                  data-testid="skeleton"
                  variant="rectangular"
                  width="100%"
                  height="100%"
                  animation="wave"
                />
              </Box>
              <Skeleton data-testid="skeleton" variant="text" width="80%" height={16} animation="wave" />
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
}
