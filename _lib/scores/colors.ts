// Soft tinted backgrounds — distinct but easy on the eyes
export const DEFAULT_ROW_COLORS = [
  "#C7E8D4",
  "#C5D9F5",
  "#F5DFB8",
  "#D8CFF0",
  "#F5C9CF",
  "#B8E8E5",
  "#F5D4BC",
  "#E5C9E8",
];

export const ROW_COLORS = [
  ...DEFAULT_ROW_COLORS,
  "#DCFCE7",
  "#DBEAFE",
  "#FEF3C7",
  "#EDE9FE",
  "#FFE4E6",
  "#CCFBF1",
  "#FFEDD5",
  "#FCE7F3",
  "#E2E8F0",
  "#F1F5F9",
];

export const defaultRowColorForIndex = (index: number) =>
  DEFAULT_ROW_COLORS[index % DEFAULT_ROW_COLORS.length];
