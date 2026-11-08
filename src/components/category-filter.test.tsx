// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryFilter } from "./category-filter";
import { ThemeProvider } from "@mui/material";
import { appTheme } from "@/lib/theme";

afterEach(cleanup);

const categories = ["wildfires", "earthquakes", "floods"];
const categoryTitles: Record<string, string> = {
  wildfires: "Wildfires",
  earthquakes: "Earthquakes",
  floods: "Floods",
};

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={appTheme}>{ui}</ThemeProvider>);
}

function getChip(name: string) {
  return screen.getAllByRole("button", { name })[0];
}

describe("CategoryFilter", () => {
  it("renders a chip for each category", () => {
    const onChange = vi.fn();
    renderWithTheme(
      <CategoryFilter
        categories={categories}
        categoryTitles={categoryTitles}
        selected={[]}
        onChange={onChange}
      />,
    );

    expect(getChip("Wildfires")).toBeInTheDocument();
    expect(getChip("Earthquakes")).toBeInTheDocument();
    expect(getChip("Floods")).toBeInTheDocument();
  });

  it("marks selected categories as selected", () => {
    const onChange = vi.fn();
    renderWithTheme(
      <CategoryFilter
        categories={categories}
        categoryTitles={categoryTitles}
        selected={["wildfires"]}
        onChange={onChange}
      />,
    );

    // Selected chip has aria-pressed="true"
    expect(getChip("Wildfires")).toHaveAttribute("aria-pressed", "true");

    // Unselected chip has aria-pressed="false"
    expect(getChip("Earthquakes")).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with toggled category when chip clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithTheme(
      <CategoryFilter
        categories={categories}
        categoryTitles={categoryTitles}
        selected={[]}
        onChange={onChange}
      />,
    );

    await user.click(getChip("Wildfires"));
    expect(onChange).toHaveBeenCalledWith(["wildfires"]);
  });

  it("removes category from selection when already selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithTheme(
      <CategoryFilter
        categories={categories}
        categoryTitles={categoryTitles}
        selected={["wildfires", "earthquakes"]}
        onChange={onChange}
      />,
    );

    await user.click(getChip("Wildfires"));
    expect(onChange).toHaveBeenCalledWith(["earthquakes"]);
  });

  it("does not render when no categories", () => {
    const onChange = vi.fn();
    const { container } = renderWithTheme(
      <CategoryFilter
        categories={[]}
        categoryTitles={{}}
        selected={[]}
        onChange={onChange}
      />,
    );

    expect(container.innerHTML).toBe("");
  });
});
