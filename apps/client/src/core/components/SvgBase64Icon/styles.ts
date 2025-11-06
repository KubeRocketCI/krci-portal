export const getIconClasses = () => {
  // Use Tailwind arbitrary values for dynamic sizes
  return `flex justify-center items-center m-auto [&_img]:w-full [&_img]:h-full`;
};

export const getIconStyle = (width: number, height: number): React.CSSProperties => ({
  width: `${width}px`,
  height: `${height}px`,
});
