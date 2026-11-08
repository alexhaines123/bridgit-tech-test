import { Stack, Typography } from "@mui/material";
import { HealthStatus } from "@/components/health-status";

export default function HomePage() {
  return (
    <Stack component="main" spacing={2} sx={{ p: 4 }}>
      <Typography variant="h3">Planet Watch</Typography>
      <Typography color="text.secondary">
        Scaffold is up. Later tickets build the map, charts and briefing here.
      </Typography>
      <HealthStatus />
    </Stack>
  );
}
