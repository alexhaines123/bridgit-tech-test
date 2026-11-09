"use client";

import { useTheme } from "@mui/material/styles";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
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

          {/* Accessible text/table alternative (visually hidden, available to screen readers) */}
          <Box
            sx={{
              position: "absolute",
              width: "1px",
              height: "1px",
              margin: "-1px",
              padding: 0,
              overflow: "hidden",
              clip: "rect(0, 0, 0, 0)",
              whiteSpace: "nowrap",
              border: 0,
            }}
          >
            <ChartAlternative measurement={measurement} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ChartRenderer({ measurement }: { measurement: Measurement }) {
  const theme = useTheme();
  const gridColor = theme.palette.divider;
  const axisColor = theme.palette.text.secondary;
  const tooltipBg = theme.palette.background.paper;
  const tooltipBorder = theme.palette.divider;

  const commonGrid = <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />;
  const commonXAxis = (
    <XAxis
      stroke={axisColor}
      tick={{ fontSize: 12, fill: axisColor }}
      angle={-45}
      textAnchor="end"
      height={80}
    />
  );
  const commonYAxis = (
    <YAxis stroke={axisColor} tick={{ fontSize: 12, fill: axisColor }} />
  );
  const commonTooltip = (
    <Tooltip
      contentStyle={{
        backgroundColor: tooltipBg,
        border: `1px solid ${tooltipBorder}`,
        borderRadius: 4,
        color: theme.palette.text.primary,
      }}
    />
  );

  switch (measurement.id) {
    case "eventsByCategory": {
      if (measurement.data.length === 0) return <EmptyState />;
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={measurement.data}>
            {commonGrid}
            <XAxis
              dataKey="categoryTitle"
              stroke={axisColor}
              tick={{ fontSize: 12, fill: axisColor }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            {commonYAxis}
            {commonTooltip}
            <Bar dataKey="count" fill={theme.palette.primary.main} name="Events" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    case "eventsByRegion": {
      if (measurement.data.length === 0) return <EmptyState />;
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={measurement.data}>
            {commonGrid}
            <XAxis
              dataKey="region"
              stroke={axisColor}
              tick={{ fontSize: 12, fill: axisColor }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            {commonYAxis}
            {commonTooltip}
            <Bar dataKey="count" fill={theme.palette.success.main} name="Events" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    case "biggestInCategory": {
      const data = measurement.data;
      if (!data.eventId || data.magnitudeValue === null) {
        return (
          <Stack
            sx={{
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography color="text.secondary">
              {data.categoryTitle
                ? `No magnitude data for ${data.categoryTitle}`
                : "No events to display"}
            </Typography>
          </Stack>
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
            {commonGrid}
            <XAxis
              dataKey="name"
              stroke={axisColor}
              tick={{ fontSize: 12, fill: axisColor }}
            />
            <YAxis
              stroke={axisColor}
              tick={{ fontSize: 12, fill: axisColor }}
              label={{
                value: data.magnitudeUnit ?? "",
                angle: -90,
                position: "insideLeft",
                fill: axisColor,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: 4,
              }}
              formatter={(value) => [
                `${value} ${data.magnitudeUnit}`,
                "Magnitude",
              ]}
            />
            <Bar
              dataKey="value"
              fill={theme.palette.warning.main}
              name="Magnitude"
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    case "newVsOngoing": {
      const chartData = [
        { name: "New", value: measurement.data.newCount },
        { name: "Ongoing", value: measurement.data.ongoingCount },
      ];
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            {commonGrid}
            <XAxis
              dataKey="name"
              stroke={axisColor}
              tick={{ fontSize: 12, fill: axisColor }}
            />
            {commonYAxis}
            {commonTooltip}
            <Bar dataKey="value" fill={theme.palette.info.main} name="Events" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    case "startedPerDay": {
      if (measurement.data.length === 0) return <EmptyState />;
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={measurement.data}>
            {commonGrid}
            {commonXAxis}
            {commonYAxis}
            {commonTooltip}
            <Line
              type="monotone"
              dataKey="count"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={{ fill: theme.palette.primary.main }}
              name="Events"
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  }
}

function EmptyState() {
  return (
    <Stack
      sx={{
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <Typography color="text.secondary">No data to display</Typography>
    </Stack>
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
              <TableCell align="right">
                {measurement.data.ongoingCount}
              </TableCell>
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
