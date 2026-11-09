"use client";

import { Card, CardContent, Typography, Stack, Table, TableBody, TableCell, TableHead, TableRow, Box } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import type { Measurement } from "@/server/measurements/types";

interface MeasurementChartProps {
  measurement: Measurement;
  /** Optional caption shown below the chart. */
  caption?: string;
}

/**
 * Renders a chart for the given Measurement with titles, axes, and units.
 * Includes a text/table alternative for accessibility.
 */
export function MeasurementChart({ measurement, caption }: MeasurementChartProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" component="h2">
            {measurement.title}
          </Typography>

          <Box sx={{ width: "100%", height: 300 }}>
            <ChartRenderer measurement={measurement} />
          </Box>

          {caption && (
            <Typography variant="body2" color="text.secondary">
              {caption}
            </Typography>
          )}

          {/* Accessible text/table alternative */}
          <ChartAlternative measurement={measurement} />
        </Stack>
      </CardContent>
    </Card>
  );
}

function ChartRenderer({ measurement }: { measurement: Measurement }) {
  switch (measurement.id) {
    case "eventsByCategory":
      return <EventsByCategoryChart data={measurement.data} />;
    case "eventsByRegion":
      return <EventsByRegionChart data={measurement.data} />;
    case "biggestInCategory":
      return <BiggestInCategoryChart data={measurement.data} />;
    case "newVsOngoing":
      return <NewVsOngoingChart data={measurement.data} />;
    case "startedPerDay":
      return <StartedPerDayChart data={measurement.data} />;
  }
}

function EventsByCategoryChart({ data }: { data: Extract<Measurement, { id: "eventsByCategory" }>["data"] }) {
  if (data.length === 0) {
    return <EmptyState />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
        <XAxis
          dataKey="categoryTitle"
          stroke="#8b949e"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#8b949e" tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 4,
          }}
        />
        <Bar dataKey="count" fill="#58a6ff" name="Events" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EventsByRegionChart({ data }: { data: Extract<Measurement, { id: "eventsByRegion" }>["data"] }) {
  if (data.length === 0) {
    return <EmptyState />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
        <XAxis
          dataKey="region"
          stroke="#8b949e"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#8b949e" tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 4,
          }}
        />
        <Bar dataKey="count" fill="#3fb950" name="Events" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function BiggestInCategoryChart({ data }: { data: Extract<Measurement, { id: "biggestInCategory" }>["data"] }) {
  if (!data.eventId || data.magnitudeValue === null) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <Typography color="text.secondary">
          {data.categoryTitle
            ? `No magnitude data for ${data.categoryTitle}`
            : "No events to display"}
        </Typography>
      </Box>
    );
  }

  const chartData = [
    {
      name: data.eventTitle || "Event",
      value: data.magnitudeValue,
      unit: data.magnitudeUnit,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
        <XAxis dataKey="name" stroke="#8b949e" tick={{ fontSize: 12 }} />
        <YAxis
          stroke="#8b949e"
          tick={{ fontSize: 12 }}
          label={{
            value: data.magnitudeUnit,
            angle: -90,
            position: "insideLeft",
            fill: "#8b949e",
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 4,
          }}
          formatter={(value) => [`${value} ${data.magnitudeUnit}`, "Magnitude"]}
        />
        <Bar dataKey="value" fill="#f0883e" name="Magnitude" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function NewVsOngoingChart({ data }: { data: Extract<Measurement, { id: "newVsOngoing" }>["data"] }) {
  const chartData = [
    { name: "New", value: data.newCount },
    { name: "Ongoing", value: data.ongoingCount },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
        <XAxis dataKey="name" stroke="#8b949e" tick={{ fontSize: 12 }} />
        <YAxis stroke="#8b949e" tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 4,
          }}
        />
        <Bar dataKey="value" fill="#a371f7" name="Events" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function StartedPerDayChart({ data }: { data: Extract<Measurement, { id: "startedPerDay" }>["data"] }) {
  if (data.length === 0) {
    return <EmptyState />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
        <XAxis
          dataKey="date"
          stroke="#8b949e"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#8b949e" tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 4,
          }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#58a6ff"
          strokeWidth={2}
          dot={{ fill: "#58a6ff" }}
          name="Events"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EmptyState() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <Typography color="text.secondary">No data to display</Typography>
    </Box>
  );
}

/**
 * Accessible text/table alternative for the chart.
 * Provides a table representation of the data for screen readers and
 * users who prefer tabular data.
 */
function ChartAlternative({ measurement }: { measurement: Measurement }) {
  switch (measurement.id) {
    case "eventsByCategory":
      return (
        <Table size="small" aria-label="Events by Category">
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="right">Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {measurement.data.map((row) => (
              <TableRow key={row.categoryId}>
                <TableCell>{row.categoryTitle}</TableCell>
                <TableCell align="right">{row.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    case "eventsByRegion":
      return (
        <Table size="small" aria-label="Events by Region">
          <TableHead>
            <TableRow>
              <TableCell>Region</TableCell>
              <TableCell align="right">Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {measurement.data.map((row) => (
              <TableRow key={row.region}>
                <TableCell>{row.region}</TableCell>
                <TableCell align="right">{row.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    case "biggestInCategory":
      return (
        <Table size="small" aria-label="Biggest in a Category">
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Event</TableCell>
              <TableCell align="right">Magnitude</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{measurement.data.categoryTitle || "—"}</TableCell>
              <TableCell>{measurement.data.eventTitle || "—"}</TableCell>
              <TableCell align="right">
                {measurement.data.magnitudeValue !== null
                  ? `${measurement.data.magnitudeValue} ${measurement.data.magnitudeUnit}`
                  : "—"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
    case "newVsOngoing":
      return (
        <Table size="small" aria-label="New vs ongoing">
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell align="right">Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>New</TableCell>
              <TableCell align="right">{measurement.data.newCount}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Ongoing</TableCell>
              <TableCell align="right">{measurement.data.ongoingCount}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
    case "startedPerDay":
      return (
        <Table size="small" aria-label="Started per day">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell align="right">Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {measurement.data.map((row) => (
              <TableRow key={row.date}>
                <TableCell>{row.date}</TableCell>
                <TableCell align="right">{row.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
  }
}
