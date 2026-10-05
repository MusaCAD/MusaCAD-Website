/**
 * Structured data (schema.org JSON-LD) and the copy search engines see first.
 *
 * Every page emits one @graph. The organization, the website and the application
 * are declared with stable @ids, and each page adds its own WebPage node (plus
 * breadcrumbs, FAQ and so on) pointing back at them. Everything here is a checked
 * fact taken from the engine repo and its Flathub metainfo — no ratings, no
 * reviews, nothing a search engine could call invented.
 */
import {
  CONTACT_EMAIL,
  FLATHUB_URL,
  GPU_REQUIREMENT,
  LICENSE_URL,
  MAINTAINER,
  MAINTAINER_URL,
  ORG_URL,
  REPO_URL,
  type Catalog,
} from './site';

const SITE = (import.meta.env.SITE ?? 'https://musacad.org').replace(/\/$/, '');

/** Absolute URL on this site for a root-relative path. */
export const absolute = (path: string) => new URL(path.replace(/^\//, ''), SITE + '/').href;

export const IDS = {
  org: absolute('/#organization'),
  website: absolute('/#website'),
  app: absolute('/#software'),
  source: absolute('/#source-code'),
  logo: absolute('/#logo'),
};

export const SITE_NAME = 'Musa CAD';

/** The default share card: 1200×630, the size every network previews well. */
export const OG_IMAGE = {
  path: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'Musa CAD — free, open-source 2D CAD with AutoCAD-style commands, shown drafting a house plan',
};

/** The drafting features, as the Flathub listing states them. */
export const FEATURE_LIST = [
  'Lines, polylines with widths, arcs, circles, ellipses, splines, hatches and gradients',
  'Move, copy, rotate, scale, stretch, trim, extend, fillet, offset and arrays, with grips',
  'Object snaps, polar and object snap tracking, and dynamic input at the cursor',
  'Dimensions, leaders, text, tables and geometric tolerancing',
  'Layers, linetypes, lineweights, blocks with attributes and external references',
  'Layouts with viewports, and plotting to PDF or a printer',
  'DXF read and write; DWG through the free ODA File Converter',
  'AutoCAD-style ribbon, command line, prompts and keyboard shortcuts',
  'Several drawings open at once in tabs',
  'Headless command line to check drawings and plot them to PDF in scripts and CI',
];

export const KEYWORDS = [
  'AutoCAD alternative',
  'free CAD software',
  'open-source CAD',
  '2D CAD',
  'drafting software',
  'DWG viewer and editor',
  'DXF editor',
  'technical drawing',
  'floor plan software',
  'CAD for Linux',
  'CAD for Windows',
];

type Node = Record<string, unknown>;

/** The nodes every page shares: who makes it, the site, the app and its source. */
export function siteGraph(catalog: Catalog): Node[] {
  const version = catalog.latest.replace(/^v/, '');
  return [
    {
      '@type': 'Organization',
      '@id': IDS.org,
      name: SITE_NAME,
      url: absolute('/'),
      email: CONTACT_EMAIL,
      logo: {
        '@type': 'ImageObject',
        '@id': IDS.logo,
        url: absolute('/icon-512.png'),
        width: 512,
        height: 512,
        caption: 'Musa CAD logo',
      },
      image: { '@id': IDS.logo },
      founder: { '@type': 'Person', name: MAINTAINER, url: MAINTAINER_URL },
      sameAs: [ORG_URL, REPO_URL, FLATHUB_URL],
    },
    {
      '@type': 'WebSite',
      '@id': IDS.website,
      url: absolute('/'),
      name: SITE_NAME,
      description: 'The home of Musa CAD, a free and open-source 2D CAD application.',
      publisher: { '@id': IDS.org },
      inLanguage: 'en',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': IDS.app,
      name: SITE_NAME,
      alternateName: 'MusaCAD',
      url: absolute('/'),
      description:
        'Musa CAD is a free, open-source 2D CAD application for technical, architectural and ' +
        "engineering drawings. It follows AutoCAD's ribbon, command line, prompts and shortcuts, " +
        'reads and writes DXF, opens and saves DWG through the free ODA File Converter, and runs ' +
        'on Windows and Linux, with a macOS preview.',
      applicationCategory: 'DesignApplication',
      applicationSubCategory: '2D computer-aided design (CAD) and drafting',
      operatingSystem: 'Windows 10, Windows 11, Linux, macOS 12+ (preview)',
      softwareVersion: version,
      ...(catalog.published ? { dateModified: catalog.published } : {}),
      datePublished: '2026-06-23',
      softwareRequirements: GPU_REQUIREMENT,
      downloadUrl: absolute('/download/'),
      installUrl: FLATHUB_URL,
      releaseNotes: catalog.latestUrl,
      isAccessibleForFree: true,
      license: LICENSE_URL,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
      featureList: FEATURE_LIST,
      keywords: KEYWORDS.join(', '),
      screenshot: absolute('/og-image.png'),
      image: absolute('/og-image.png'),
      author: { '@id': IDS.org },
      publisher: { '@id': IDS.org },
      sameAs: [REPO_URL, FLATHUB_URL],
    },
    {
      '@type': 'SoftwareSourceCode',
      '@id': IDS.source,
      name: 'Musa CAD source code',
      codeRepository: REPO_URL,
      programmingLanguage: ['C++', 'GLSL'],
      runtimePlatform: ['Windows', 'Linux', 'macOS'],
      license: LICENSE_URL,
      targetProduct: { '@id': IDS.app },
      author: { '@id': IDS.org },
    },
  ];
}

export interface Crumb {
  name: string;
  path: string;
}

/** The page's own node, plus its breadcrumb trail when it isn't the home page. */
export function pageGraph(opts: {
  url: string;
  title: string;
  description: string;
  type?: string;
  crumbs?: Crumb[];
  /** Extra properties for the page node itself (e.g. an FAQPage's mainEntity). */
  extra?: Node;
}): Node[] {
  const { url, title, description, type = 'WebPage', crumbs, extra = {} } = opts;
  const nodes: Node[] = [
    {
      '@type': type,
      '@id': `${url}#webpage`,
      url,
      name: title,
      description,
      isPartOf: { '@id': IDS.website },
      about: { '@id': IDS.app },
      primaryImageOfPage: absolute(OG_IMAGE.path),
      inLanguage: 'en',
      ...(crumbs?.length ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
      ...extra,
    },
  ];
  if (crumbs?.length) {
    nodes.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [{ name: 'Home', path: '/' }, ...crumbs].map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: absolute(c.path),
      })),
    });
  }
  return nodes;
}
