"use client";

import { Chip, Stack, Typography } from "@mui/material";
import { categoryColors } from "@/lib/theme";

interface CategoryFilterProps {
  categories: string[];
  categoryTitles: Record<string, string>;
  selected: string[];
  onChange: (selected: string[]) => void;
}

/**
 * Category chips filter Events by Category.
 * Clicking a chip toggles that Category on/off.
 * When no categories are selected, all Events are shown.
 */
export function CategoryFilter({
  categories,
  categoryTitles,
  selected,
  onChange,
}: CategoryFilterProps) {
  const selectedSet = new Set(selected);

  const handleToggle = (categoryId: string) => {
    if (selectedSet.has(categoryId)) {
      onChange(selected.filter((c) => c !== categoryId));
    } else {
      onChange([...selected, categoryId]);
    }
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
        Categories:
      </Typography>
      {categories.map((categoryId) => {
        const isSelected = selectedSet.has(categoryId);
        const color = categoryColors[categoryId] || "#8b949e";
        return (
          <Chip
            key={categoryId}
            label={categoryTitles[categoryId] || categoryId}
            onClick={() => handleToggle(categoryId)}
            role="button"
            aria-pressed={isSelected}
            sx={{
              backgroundColor: isSelected ? color : "transparent",
              color: isSelected ? "#0d1117" : color,
              borderColor: color,
              borderWidth: 1,
              borderStyle: "solid",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: isSelected ? color : `${color}22`,
              },
            }}
          />
        );
      })}
    </Stack>
  );
}
