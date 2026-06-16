export function getResponsiveLayout(width: number) {
  const isTablet = width >= 768;
  const isLandscape = width > 900;

  return {
    isTablet,
    isLandscape,
    pagePadding: isTablet ? 40 : 24,
    titleSize: isLandscape ? 42 : isTablet ? 38 : 32,
    subtitleSize: isTablet ? 18 : 16,
  };
}
