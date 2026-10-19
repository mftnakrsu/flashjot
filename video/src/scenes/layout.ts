/**
 * The 16:9 demo's layout (1920×1080): the scene's headline on the left, the app on the right,
 * and the bottom strip kept free for the burned-in subtitles.
 */
export const CAPTION = { left: 120, top: 220, width: 560 } as const;
/** Key caps sit under the headline. */
export const KEYS = { left: 120, top: 700, size: 84 } as const;
/** The app window (or desktop) on the right. */
export const STAGE = { left: 760, top: 170, width: 1040 } as const;
/** Subtitles: distance from the bottom of the frame, font size and widest line. */
export const SUBTITLES = { bottom: 44, fontSize: 40, maxWidth: 1640 } as const;
