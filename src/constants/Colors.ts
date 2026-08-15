const tintColorLight = "#4A90E2";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#000",
    background: "#fff",
    tint: tintColorLight,
    tabIconDefault: "#888",
    tabIconSelected: tintColorLight,
    cardBg: "#F8F9FA",
    borderColor: "#EAEAEA",
    primary: "#4A90E2", // Blue
    success: "#4CAF50", // Green
    danger: "#FF4747", // Red
  },
  dark: {
    text: "#fff",
    background: "#000",
    tint: tintColorDark,
    tabIconDefault: "#888",
    tabIconSelected: tintColorDark,
    cardBg: "#1A1A1A",
    borderColor: "#333333",
    primary: "#fff", // White or maybe a lighter blue in dark mode, but we used white #fff for buttons
    success: "#4CAF50", // Green
    danger: "#FF4747", // Red
  },
};
