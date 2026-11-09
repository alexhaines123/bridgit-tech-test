"use client";

import dynamic from "next/dynamic";
import { CircularProgress, Stack } from "@mui/material";

// Dynamic import to avoid SSR issues with MapLibre GL JS (WebGL required)
const EventMapInner = dynamic(() => import("./event-map-inner"), {
  loading: () => (
    <Stack sx={{ justifyContent: "center", alignItems: "center", height: "100%" }}>
      <CircularProgress />
    </Stack>
  ),
  ssr: false,
});

export { EventMapInner as default };
