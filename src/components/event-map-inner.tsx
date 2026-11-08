"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import Map, { Source, Layer, Popup, Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Box, Typography, Button, Stack, Chip } from "@mui/material";
import type { ShapedEvent } from "@/server/eonet/types";
import { categoryColors } from "@/lib/theme";
import { eventsToGeoJSON } from "./map-utils";

const MAP_STYLE = process.env.NEXT_PUBLIC_MAP_STYLE || "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

interface EventMapInnerProps {
  events: ShapedEvent[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
}

/**
 * Interactive MapLibre map with clustered event pins.
 * Client-only component (loaded via dynamic import in event-map.tsx).
 */
export default function EventMapInner({
  events,
  selectedEventId,
  onSelectEvent,
}: EventMapInnerProps) {
  const mapRef = useRef<MapRef>(null);
  const [popupEvent, setPopupEvent] = useState<ShapedEvent | null>(null);

  const geojson = eventsToGeoJSON(events);

  // Fly to selected event when selection changes
  useEffect(() => {
    if (selectedEventId && mapRef.current) {
      const event = events.find((e) => e.id === selectedEventId);
      if (event) {
        mapRef.current.flyTo({
          center: event.latest.coordinates,
          zoom: 6,
          duration: 1000,
        });
      }
    }
  }, [selectedEventId, events]);

  const handleMarkerClick = useCallback(
    (event: ShapedEvent) => {
      onSelectEvent(event.id);
      setPopupEvent(event);
    },
    [onSelectEvent],
  );

  const handleMapClick = useCallback(() => {
    onSelectEvent(null);
    setPopupEvent(null);
  }, [onSelectEvent]);

  return (
    <Box sx={{ width: "100%", height: 500, position: "relative" }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 0,
          latitude: 20,
          zoom: 1.5,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        onClick={handleMapClick}
      >
        <NavigationControl position="top-right" />

        {/* Clustered circle layer */}
        <Source
          id="events"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={8}
          clusterRadius={50}
        >
          {/* Cluster circles */}
          <Layer
            id="clusters"
            type="circle"
            source="events"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": "#58a6ff",
              "circle-radius": [
                "step",
                ["get", "point_count"],
                15,
                10,
                20,
                30,
                25,
              ],
              "circle-opacity": 0.7,
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            source="events"
            filter={["has", "point_count"]}
            layout={{
              "text-field": "{point_count_abbreviated}",
              "text-size": 12,
            }}
            paint={{
              "text-color": "#0d1117",
            }}
          />

          {/* Unclustered event points */}
          <Layer
            id="unclustered-point"
            type="circle"
            source="events"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": [
                "match",
                ["get", "categoryId"],
                "wildfires", categoryColors.wildfires,
                "earthquakes", categoryColors.earthquakes,
                "floods", categoryColors.floods,
                "volcanoes", categoryColors.volcanoes,
                "seaLakeIce", categoryColors.seaLakeIce,
                "severeStorms", categoryColors.severeStorms,
                "drought", categoryColors.drought,
                "landslides", categoryColors.landslides,
                "snow", categoryColors.snow,
                "tempExtremes", categoryColors.tempExtremes,
                "waterColor", categoryColors.waterColor,
                "dustHaze", categoryColors.dustHaze,
                "manmade", categoryColors.manmade,
                "#8b949e",
              ],
              "circle-radius": 8,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#0d1117",
            }}
          />
        </Source>

        {/* Individual markers for click handling */}
        {events.map((event) => (
          <Marker
            key={event.id}
            longitude={event.latest.coordinates[0]}
            latitude={event.latest.coordinates[1]}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(event);
            }}
            style={{ cursor: "pointer" }}
          >
            <div
              style={{
                width: selectedEventId === event.id ? 24 : 16,
                height: selectedEventId === event.id ? 24 : 16,
                borderRadius: "50%",
                backgroundColor: categoryColors[event.categoryId] || "#8b949e",
                border: "2px solid #0d1117",
                boxShadow: selectedEventId === event.id ? "0 0 0 3px #58a6ff" : "none",
                transition: "all 0.2s",
              }}
              aria-label={`${event.title} - ${event.categoryTitle}`}
            />
          </Marker>
        ))}

        {/* Popup for selected event */}
        {popupEvent && (
          <Popup
            longitude={popupEvent.latest.coordinates[0]}
            latitude={popupEvent.latest.coordinates[1]}
            onClose={() => {
              setPopupEvent(null);
              onSelectEvent(null);
            }}
            closeOnClick={true}
          >
            <EventDetailsPopup event={popupEvent} />
          </Popup>
        )}
      </Map>
    </Box>
  );
}

function EventDetailsPopup({ event }: { event: ShapedEvent }) {
  const date = new Date(event.latest.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Box sx={{ minWidth: 200, maxWidth: 300 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
        {event.title}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: "center" }}>
        <Chip
          label={event.categoryTitle}
          size="small"
          sx={{
            backgroundColor: categoryColors[event.categoryId] || "#8b949e",
            color: "#0d1117",
            fontWeight: 600,
            fontSize: "0.7rem",
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {date}
        </Typography>
      </Stack>
      {event.latest.magnitude && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          Magnitude: {event.latest.magnitude.value.toLocaleString()}{" "}
          {event.latest.magnitude.unit}
        </Typography>
      )}
      <Button
        href={event.link}
        target="_blank"
        rel="noopener noreferrer"
        size="small"
        variant="outlined"
        sx={{ textTransform: "none" }}
      >
        View source →
      </Button>
    </Box>
  );
}
