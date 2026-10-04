/**
 * The product screenshots, taken by the app itself from real drawings
 * (tools/screenshots in the engine repo). Alt text describes what's on screen;
 * the caption says why it matters. Regenerate the files with scripts/make-images.sh.
 */
export interface Screenshot {
  /** 1000px-wide WebP, the full-size image. */
  src: string;
  /** 500px-wide WebP for small screens. */
  srcSmall: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

const shot = (name: string, alt: string, caption: string): Screenshot => ({
  src: `/screenshots/${name}-1000.webp`,
  srcSmall: `/screenshots/${name}-500.webp`,
  width: 1000,
  height: 700,
  alt,
  caption,
});

export const SCREENSHOTS: Screenshot[] = [
  shot(
    'overview',
    "The Musa CAD window: the ribbon, three drawings in tabs, a house plan with an exterior wall selected, and the Properties palette showing the wall's layer and width",
    'The ribbon, drawing tabs and Properties palette, with a wall of a house plan selected.',
  ),
  shot(
    'command-entry',
    'REC typed at the cursor on a house plan, with RECTANG and RECTANGLE offered below it',
    'Commands typed at the cursor, their matches offered as you type.',
  ),
  shot(
    'dynamic-input',
    'A wide polyline being drawn from the house, its length and angle at the cursor and polar tracking holding it to 45 degrees',
    'Dynamic input: length and angle at the cursor, polar tracking holding 45°.',
  ),
  shot(
    'architectural-plan',
    'A house floor plan with its south elevation and a room schedule',
    'A house plan with its south elevation and room schedule.',
  ),
  shot(
    'mechanical-detail',
    'A dimensioned flange with section A-A, a bolt circle and geometric tolerances',
    'A dimensioned flange with a section view and geometric tolerances.',
  ),
  shot(
    'hatch-section',
    'The Hatch Editor tab over a wall and strip-footing construction detail',
    'The Hatch Editor on a wall and footing construction detail.',
  ),
];
