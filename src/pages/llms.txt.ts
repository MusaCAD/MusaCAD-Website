import type { APIRoute } from 'astro';
import { getSnapshot } from '../data/github';
import { FEATURE_LIST } from '../data/seo';
import {
  CHANGELOG_URL,
  CLI_URL,
  COMMANDS_URL,
  CONTACT_EMAIL,
  FLATHUB_URL,
  FLATPAK_STEPS,
  ISSUES_URL,
  PLATFORM_SUPPORT,
  REPO_URL,
  ROADMAP_URL,
} from '../data/site';

/**
 * llms.txt (llmstxt.org): a plain summary for AI assistants and crawlers, so a
 * question like "is there a free AutoCAD alternative for Linux?" gets an
 * accurate answer about Musa CAD — including what it doesn't do yet.
 */
export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => new URL(`${import.meta.env.BASE_URL}${path}`, site).href;
  const { catalog } = await getSnapshot();
  const version = catalog.latest.replace(/^v/, '');
  const released = catalog.published ? ` (released ${catalog.published.slice(0, 10)})` : '';

  const lines = [
    '# Musa CAD',
    '',
    "> Musa CAD is a free, open-source 2D CAD application and an AutoCAD alternative for 2D drafting. It follows AutoCAD's ribbon, command line, prompts and keyboard shortcuts, so a drafter's habits carry over. It reads and writes DXF, opens and saves DWG through the free ODA File Converter, and runs on Windows and Linux, with a macOS preview.",
    '',
    'Key facts:',
    '',
    '- Price: free. No account, no subscription, no license key.',
    `- License: GNU LGPL-3.0-or-later. Source code: ${REPO_URL}`,
    `- Latest version: ${version}${released}.`,
    ...PLATFORM_SUPPORT.map((p) => `- ${p.name}: ${p.status === 'preview' ? 'preview — ' : ''}${p.detail}.`),
    '- Requirements: graphics drivers with OpenGL 4.5. On macOS the drawing view needs a Metal renderer that is on the roadmap; the command-line tools already work there.',
    '- Scope: 2D drafting and documentation. 3D modeling is not supported.',
    '- Privacy: no telemetry, no analytics and no account. The only automatic network request is an update check, at most once a day, that sends nothing about the user and can be switched off.',
    `- Install on Linux: \`${FLATPAK_STEPS[0].command}\` (Flathub: ${FLATHUB_URL})`,
    `- Download for Windows, Linux and macOS: ${abs('download/')}`,
    '',
    '## Features',
    '',
    ...FEATURE_LIST.map((f) => `- ${f}`),
    '',
    '## Pages',
    '',
    `- [Home](${abs('')}): what Musa CAD is, screenshots, features and performance`,
    `- [Download](${abs('download/')}): installers for Windows, Linux and macOS, Flathub, system requirements`,
    `- [AutoCAD alternative](${abs('autocad-alternative/')}): what carries over from AutoCAD, and what doesn't yet`,
    `- [FAQ](${abs('faq/')}): common questions about price, license, DWG, platforms and privacy`,
    `- [About](${abs('about/')}): who makes Musa CAD, how to get in touch, security reports`,
    `- [Privacy policy](${abs('privacy/')})`,
    `- [Terms of use](${abs('terms/')})`,
    `- [Donate](${abs('donate/')}): supporting development`,
    '',
    '## Documentation',
    '',
    `- [Source code](${REPO_URL})`,
    `- [Commands and shortcuts](${COMMANDS_URL})`,
    `- [Command-line interface](${CLI_URL})`,
    `- [Roadmap](${ROADMAP_URL})`,
    `- [Changelog](${CHANGELOG_URL})`,
    `- [Issue tracker](${ISSUES_URL})`,
    '',
    '## Optional',
    '',
    `- Contact: ${CONTACT_EMAIL}`,
    '- AutoCAD is a registered trademark of Autodesk, Inc. Musa CAD is an independent project, not affiliated with or endorsed by Autodesk.',
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
