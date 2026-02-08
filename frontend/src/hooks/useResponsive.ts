import { useWindowDimensions } from 'react-native';

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const MAX_CONTENT_WIDTH = 500;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const isSmallPhone = width < 380;
  const isPhone = width < 500;
  const isTablet = width >= 500;

  const effectiveWidth = isTablet ? MAX_CONTENT_WIDTH : width;
  const ratio = effectiveWidth / BASE_WIDTH;
  const vRatio = height / BASE_HEIGHT;

  const clampedRatio = Math.max(0.82, Math.min(ratio, 1.35));
  const clampedVRatio = Math.max(0.7, Math.min(vRatio, 1.3));

  const s = (size: number) => Math.round(size * clampedRatio);
  const vs = (size: number) => Math.round(size * clampedVRatio);
  const fs = (size: number) => {
    const fontRatio = 1 + (clampedRatio - 1) * 0.6;
    return Math.round(size * Math.max(0.85, Math.min(fontRatio, 1.4)));
  };

  const contentWidth = isTablet ? MAX_CONTENT_WIDTH : width;
  const horizontalPadding = isTablet ? (width - MAX_CONTENT_WIDTH) / 2 : 0;

  return {
    s, fs, vs,
    screenWidth: width,
    screenHeight: height,
    contentWidth,
    horizontalPadding,
    isSmallPhone, isPhone, isTablet, isLandscape,
  };
}
