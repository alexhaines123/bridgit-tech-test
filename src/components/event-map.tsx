"use client";

import dynamic from "next/dynamic";
import { CircularProgress, Box } from "@mui/material";

// Dynamic import to avoid SSR issues with MapLibre GL JS (WebGL required)
const EventMapInner = dynamic(() => import("./event-map-inner"), {
  loading: () => (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
      <CircularProgress />
    </Box>
  ),
  ssr: false,
});

export { EventMapInner as default };
