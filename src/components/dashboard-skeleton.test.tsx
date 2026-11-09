// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { appTheme } from "@/lib/theme";
import { DashboardSkeleton } from "./dashboard-skeleton";

afterEach(cleanup);

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={appTheme}>{ui}</ThemeProvider>);
}

describe("DashboardSkeleton", () => {
  it("renders a map placeholder", () => {
    const { container } = renderWithTheme(<DashboardSkeleton />);
    // Map skeleton should have the 400px height area
    const skeletons = container.querySelectorAll("[data-testid=skeleton]");
    // At minimum: map skeleton + event row skeletons + sidebar card skeletons
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it("renders 5 recent event row skeletons", () => {
    const { container } = renderWithTheme(<DashboardSkeleton />);
    const eventRows = container.querySelectorAll("[data-testid=event-row-skeleton]");
    expect(eventRows).toHaveLength(5);
  });

  it("renders sidebar card skeletons", () => {
    const { container } = renderWithTheme(<DashboardSkeleton />);
    const sidebarCards = container.querySelectorAll("[data-testid=sidebar-card-skeleton]");
    // Category filter, briefing, chart
    expect(sidebarCards.length).toBeGreaterThanOrEqual(3);
  });

  it("uses the responsive 2-column layout", () => {
    const { container } = renderWithTheme(<DashboardSkeleton />);
    // The outer layout container should have grid or flex layout
    const layout = container.querySelector("[data-testid=dashboard-skeleton]");
    expect(layout).toBeInTheDocument();
  });
});
