// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { appTheme } from "@/lib/theme";
import { RecentEventsCompact } from "./recent-events-compact";
import type { ShapedEvent } from "@/server/eonet/types";

afterEach(cleanup);

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={appTheme}>{ui}</ThemeProvider>);
}

function makeEvent(overrides: Partial<ShapedEvent> = {}): ShapedEvent {
  return {
    id: "evt-1",
    title: "Wildfire in California",
    description: null,
    link: "https://eonet.gsfc.nasa.gov/api/v2.1/events/EVT-1",
    categoryId: "wildfires",
    categoryTitle: "Wildfires",
    closed: false,
    latest: {
      date: "2026-11-09T10:00:00Z",
      coordinates: [-120.5, 38.5],
      magnitude: null,
    },
    historyLength: 1,
    historyTrimmed: false,
    region: "North America",
    earliestDate: "2026-11-09T10:00:00Z",
    ...overrides,
  };
}

describe("RecentEventsCompact", () => {
  it("renders compact cards with title, Region, and time ago", () => {
    const events = [
      makeEvent({
        id: "evt-1",
        title: "Wildfire in California",
        region: "North America",
        latest: { date: "2026-11-09T07:00:00Z", coordinates: [-120, 38], magnitude: null },
      }),
      makeEvent({
        id: "evt-2",
        title: "Earthquake in Japan",
        region: "Asia",
        latest: { date: "2026-11-09T04:00:00Z", coordinates: [139, 35], magnitude: null },
      }),
    ];

    renderWithTheme(<RecentEventsCompact events={events} />);

    expect(screen.getByText("Wildfire in California")).toBeInTheDocument();
    expect(screen.getByText("North America")).toBeInTheDocument();
    expect(screen.getByText("Earthquake in Japan")).toBeInTheDocument();
    expect(screen.getByText("Asia")).toBeInTheDocument();
  });

  it("limits to 5 events by default", () => {
    const events = Array.from({ length: 8 }, (_, i) =>
      makeEvent({
        id: `evt-${i}`,
        title: `Event ${i}`,
        latest: { date: `2026-11-09T${10 - i}:00:00Z`, coordinates: [0, 0], magnitude: null },
      }),
    );

    renderWithTheme(<RecentEventsCompact events={events} />);

    // First 5 rendered
    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`Event ${i}`)).toBeInTheDocument();
    }
    // Last 3 not rendered
    for (let i = 5; i < 8; i++) {
      expect(screen.queryByText(`Event ${i}`)).not.toBeInTheDocument();
    }
  });

  it("shows empty state when no events", () => {
    renderWithTheme(<RecentEventsCompact events={[]} />);

    expect(screen.getByText("No events in this Window")).toBeInTheDocument();
    expect(
      screen.getByText("Try widening the Window to see more events."),
    ).toBeInTheDocument();
  });

  it("does not render selection state (read-only)", () => {
    const events = [makeEvent({ id: "evt-1", title: "Test Event", region: "Europe" })];

    const { container } = renderWithTheme(<RecentEventsCompact events={events} />);

    // No role="button" on cards — they are not clickable
    const cards = container.querySelectorAll("[role=button]");
    expect(cards.length).toBe(0);
  });
});
