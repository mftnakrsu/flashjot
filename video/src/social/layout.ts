/**
 * The 9:16 frame (1080×1920) and the margins that stay clear of the apps' own overlays: the top
 * bar on Reels and TikTok, the like and share column on the right, the caption and the buttons at
 * the bottom. Headlines start at `top`; scene content ends at `contentBottom`; the subtitles sit
 * between that and `captionBottom` (measured from the bottom of the frame).
 */
export const SOCIAL = { width: 1080, height: 1920 } as const;
export const SAFE = { top: 230, side: 100, contentBottom: 1350, captionBottom: 390 } as const;
/** Width of a headline or a full-width block inside the side margins. */
export const SAFE_WIDTH = SOCIAL.width - 2 * SAFE.side;
/** Screens are a little wider than the text margins: they read better big, and carry no text at their edges. */
export const STAGE = { left: 60, width: 960 } as const;
/** A zoomed-in piece of the app: rounded, with a shadow, like a window. */
export const framed = {
  borderRadius: 28,
  boxShadow: "0 30px 80px rgba(35, 38, 43, 0.18), 0 0 0 2px rgba(35, 38, 43, 0.06)",
} as const;
