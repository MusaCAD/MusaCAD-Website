/**
 * The FAQ. One source for the visible page and its FAQPage structured data, so
 * the two can't drift. Answers are small HTML fragments with root-relative links;
 * `faqJsonLd` makes those absolute for search engines.
 */
import {
  CLI_URL,
  CONTACT_EMAIL,
  ISSUES_URL,
  REPO_URL,
} from './site';

export interface Faq {
  id: string;
  question: string;
  /** HTML: <a>, <code>, <strong> only. */
  answer: string;
}

export const FAQS: Faq[] = [
  {
    id: 'free',
    question: 'Is Musa CAD really free?',
    answer:
      "Yes. There's no price, no subscription, no trial, no account and no license key. It's free software under the LGPL, so every version that's out stays free for good. I keep it going with donations — if it saves you money, <a href=\"/donate/\">you can chip in</a>.",
  },
  {
    id: 'open-source',
    question: 'Is Musa CAD open source?',
    answer: `Yes, under the GNU LGPL-3.0-or-later. <a href="${REPO_URL}">The full source code is on GitHub</a>: you can read it, build it, change it and share it under the terms of the license.`,
  },
  {
    id: 'commercial',
    question: 'Can I use Musa CAD for commercial work?',
    answer:
      'Yes — at work, for clients, in a firm of any size. The license covers the program, not what you draw with it: your drawings are yours.',
  },
  {
    id: 'autocad',
    question: 'Is Musa CAD a good AutoCAD alternative?',
    answer:
      "For 2D drafting, that's exactly what it's for. It follows AutoCAD's ribbon, command line, prompts and shortcuts, so <code>L</code> draws a line, <code>TR</code> trims and F8 is ortho. It doesn't do 3D, and there's no AutoLISP. <a href=\"/autocad-alternative/\">What carries over, and what doesn't yet</a>.",
  },
  {
    id: 'dwg',
    question: 'Can Musa CAD open DWG files?',
    answer:
      'Yes, through the free ODA File Converter, which Musa CAD downloads for you in one click from DWG Setup (LibreDWG works too). The converter runs as a separate program, so Musa CAD stays free of closed code. DXF needs nothing extra: it is read and written natively.',
  },
  {
    id: 'platforms',
    question: 'Does Musa CAD run on Windows, macOS and Linux?',
    answer:
      "On Windows 10 and 11 and on 64-bit Linux, yes. macOS is a preview: Musa CAD draws with OpenGL 4.5 and macOS stops at 4.1, so the drawing window can't open there until the Metal renderer on the roadmap lands. The command-line tools already work on a Mac.",
  },
  {
    id: 'three-d',
    question: 'Does Musa CAD do 3D?',
    answer:
      "No. It's a 2D drafting application: plans, elevations, sections, details and schematics. The geometry kernel sits behind an interface that leaves room for 3D later, but it isn't on the near roadmap.",
  },
  {
    id: 'requirements',
    question: 'What computer do I need?',
    answer:
      'A 64-bit PC with a graphics driver for OpenGL 4.5 — most graphics hardware from the last ten years, integrated graphics included. <a href="/download/#requirements">The system requirements</a> have the details.',
  },
  {
    id: 'privacy',
    question: 'Does Musa CAD collect any data?',
    answer:
      "No. There's no telemetry, no analytics, no crash reporting and no account, and your drawings never leave your computer. The one thing it does on its own is look for a new version, at most once a day: a single request to GitHub (or to Flathub, for the Flatpak) that sends nothing but the request itself. You can switch it off in Options (<code>OP</code>). <a href=\"/privacy/\">The privacy policy</a> has the details.",
  },
  {
    id: 'updates',
    question: 'How do I update Musa CAD?',
    answer:
      'Musa CAD tells you in the status bar when a new version is out. On Windows, the Update window downloads, checks and installs it for you. From Flathub, it updates along with your other apps. For the AppImage and on macOS, download the new file.',
  },
  {
    id: 'scripting',
    question: 'Can I script Musa CAD or run it in CI?',
    answer: `Yes. The same program runs headless: <code>musacad --check</code> validates a drawing and reports problems, and <code>musacad --plot</code> turns it into a PDF at a given paper size and scale, with no display needed. <a href="${CLI_URL}">The command-line guide</a> has the full grammar.`,
  },
  {
    id: 'bugs',
    question: "I found a bug, or a command I need is missing. Where do I say so?",
    answer: `On <a href="${ISSUES_URL}">the issue tracker on GitHub</a> — what you did, what you expected, and the drawing if you can share it. For anything private, email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`,
  },
  {
    id: 'support',
    question: 'How can I support Musa CAD?',
    answer: `Use it, tell people about it, report what's broken, and <a href="${REPO_URL}">star it on GitHub</a>. If it saves you a subscription, <a href="/donate/">a donation</a> goes straight into development time.`,
  },
];

/** FAQPage `mainEntity`, with links made absolute. */
export function faqJsonLd(absolute: (path: string) => string) {
  return FAQS.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.answer.replace(/href="(\/[^"]*)"/g, (_, path: string) => `href="${absolute(path)}"`),
    },
  }));
}
