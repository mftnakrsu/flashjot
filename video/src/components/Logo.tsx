import type React from "react";

type LogoProps = {
  readonly size: number;
  readonly style?: React.CSSProperties;
};

/** The Flashjot icon (docs-site/public/favicon.svg): an index card with a red rule and a bolt on ink blue. */
export const Logo: React.FC<LogoProps> = ({ size, style }) => (
  <svg viewBox="64 64 896 896" width={size} height={size} style={style}>
    <rect x="64" y="64" width="896" height="896" rx="200" fill="#2F5BD3" />
    <g transform="rotate(-6 512 520)">
      <rect x="212" y="270" width="600" height="470" rx="36" fill="#FFFFFF" />
      <rect x="212" y="356" width="600" height="20" fill="#E0475B" />
      <rect x="262" y="470" width="500" height="10" rx="5" fill="#C9D6F6" />
      <rect x="262" y="560" width="500" height="10" rx="5" fill="#C9D6F6" />
      <rect x="262" y="650" width="500" height="10" rx="5" fill="#C9D6F6" />
    </g>
    <path
      d="M13 2 4 14h7l-1 8 9-12h-7z"
      transform="translate(282 278) scale(20)"
      fill="#23262B"
      stroke="#FFFFFF"
      strokeWidth="0.9"
      strokeLinejoin="round"
    />
  </svg>
);

type IconProps = {
  readonly size: number;
  readonly color?: string;
  readonly style?: React.CSSProperties;
};

const lucide = (paths: React.ReactNode) => {
  const Icon: React.FC<IconProps> = ({ size, color = "currentColor", style }) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
    >
      {paths}
    </svg>
  );
  return Icon;
};

const folderPath = "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z";

/** Lucide icons, as the app uses them. */
export const FolderIcon = lucide(<path d={folderPath} />);
export const FolderPlusIcon = lucide(
  <>
    <path d="M12 10v6" />
    <path d="M9 13h6" />
    <path d={folderPath} />
  </>,
);
export const HouseIcon = lucide(
  <>
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </>,
);
export const FileTextIcon = lucide(
  <>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </>,
);
