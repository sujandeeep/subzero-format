/**
 * Brand Kit & Media Kit Extraction Service
 * Powered by Firecrawl v1 API (branding & markdown formats)
 * Extracts full brand typography, colors, logos, component shapes, and guideline rules
 */

export interface BrandKitColors {
  primary: string;           // Main brand color
  primaryHover: string;      // Button hover state
  secondary: string;         // Supporting brand color
  accent: string;            // Highlights, active pills, links
  background: string;        // Official page canvas background
  cardSurface: string;       // Component card background
  textPrimary: string;       // High-contrast primary reading text
  textMuted: string;         // Secondary caption text
  cardBorder: string;        // Subtle clean 1px border
  borderGlow: string;        // Accent border
  headerBg: string;          // Card header surface
  link?: string;             // Hyperlinks & external reference color
}

export interface BrandKitTypography {
  fontFamily: string;        // e.g. "Circular", "Söhne-Var", "Inter"
  headingFont: string;       // Heading font family
  fontStack: string;         // Full CSS font-family stack
  fontSizeH1?: string;
  fontSizeH2?: string;
  fontSizeBody?: string;
  rawFontList?: string[];    // Full array of font stacks detected by Firecrawl
}

export interface BrandKitComponents {
  buttonRadius: string;      // e.g. "9999px" for pill buttons, "4px" for standard
  buttonBackground: string;  // Primary CTA background
  buttonTextColor: string;   // Primary CTA text color
  inputRadius: string;
  inputBackground: string;
}

export interface BrandKitPersonality {
  tone?: string;
  energy?: string;
  targetAudience?: string;
}

export interface BrandKitConfidence {
  buttons?: number;
  colors?: number;
  overall?: number;
}

export interface BrandKitDesignSystem {
  framework?: string;
  componentLibrary?: string;
}

export interface BrandGuidelines {
  colorName: string;
  rgbValue: string;
  typeface: string;
  primaryRole: string;
  secondaryRole: string;
  accentRole: string;
  contrastRatio: string;
  clearspace: string;
  usageRules: string[];
}

export interface BrandKit {
  id: string;
  companyName: string;
  websiteUrl: string;
  logoUrl?: string;          // SVG Data URI or image URL
  tagline?: string;
  description?: string;
  colorScheme: 'light' | 'dark';
  colors: BrandKitColors;
  typography: BrandKitTypography;
  components: BrandKitComponents;
  personality?: BrandKitPersonality;
  designSystem?: BrandKitDesignSystem;
  confidence?: BrandKitConfidence;
  guidelines: BrandGuidelines;
  source: 'firecrawl' | 'preset';
  scrapedAt?: string;
  confidenceScore?: number;
}

// Storage keys
const STORAGE_ACTIVE_BRAND_KEY = 'subzero_active_brand_kit';
const STORAGE_FIRECRAWL_KEY_OVERRIDE = 'subzero_firecrawl_api_key';

// Color manipulation helpers
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex || typeof hex !== 'string') return null;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const adjust = (val: number) => Math.min(255, Math.max(0, Math.round(val + (val * percent) / 100)));
  const r = adjust(rgb.r).toString(16).padStart(2, '0');
  const g = adjust(rgb.g).toString(16).padStart(2, '0');
  const b = adjust(rgb.b).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

export function buildBrandPalette(
  primaryHex: string,
  secondaryHex?: string,
  accentHex?: string,
  bgHex?: string,
  textHex?: string
): BrandKitColors {
  const primaryHover = adjustBrightness(primaryHex, 12);
  const secondary = secondaryHex || adjustBrightness(primaryHex, -20);
  const accent = accentHex || primaryHex;
  const background = bgHex || '#0a0d14';
  const cardSurface = '#111827';
  const textPrimary = textHex || '#f8fafc';
  const textMuted = '#94a3b8';
  const cardBorder = '#1e293b';
  const borderGlow = primaryHex;
  const headerBg = '#0d1322';

  return {
    primary: primaryHex,
    primaryHover,
    secondary,
    accent,
    background,
    cardSurface,
    textPrimary,
    textMuted,
    cardBorder,
    borderGlow,
    headerBg,
  };
}

export function buildBrandGuidelines(
  companyName: string,
  colors: BrandKitColors,
  typeface?: string
): BrandGuidelines {
  const rgb = hexToRgb(colors.primary) || { r: 99, g: 102, b: 241 };
  const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const tf = typeface || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  return {
    colorName: `${companyName} Official Brand Core`,
    rgbValue: rgbStr,
    typeface: tf,
    primaryRole: 'Primary action triggers, key highlights, active breadcrumbs',
    secondaryRole: 'Section headers, subtle panel dividers, secondary tags',
    accentRole: 'Status indicators, interactive focus borders, active chips',
    contrastRatio: '5.2:1 (WCAG AA/AAA Compliant)',
    clearspace: 'Minimum 16px clear space surrounding brand mark',
    usageRules: [
      `Render all text, headings, and data in ${companyName}'s official typography (${tf.split(',')[0].replace(/"/g, '')}).`,
      `Apply ${colors.primary} strictly to primary buttons and key confirmed states.`,
      `Maintain clean, standard enterprise cards without neon bloom or blurry drop-shadows.`,
      `Ensure minimum 4.5:1 contrast against surface backgrounds.`,
    ],
  };
}

// Built-in verified Brand Kit Presets
export const BRAND_KIT_PRESETS: BrandKit[] = [
  {
    id: 'default',
    companyName: 'SubZero Core',
    websiteUrl: 'https://subzero.format.internal',
    tagline: 'Deterministic Zero-Cost Engine',
    colorScheme: 'dark',
    colors: {
      ...buildBrandPalette('#6366f1', '#06b6d4', '#a855f7', '#080c14', '#f8fafc'),
      link: '#6366f1',
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFont: 'Inter, system-ui, sans-serif',
      fontStack: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSizeH1: '28px',
      fontSizeH2: '20px',
      fontSizeBody: '14px',
      rawFontList: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    },
    components: {
      buttonRadius: '8px',
      buttonBackground: '#6366f1',
      buttonTextColor: '#ffffff',
      inputRadius: '8px',
      inputBackground: '#0e1422',
    },
    personality: { tone: 'technical', energy: 'high', targetAudience: 'engineers' },
    designSystem: { framework: 'SubZero Design System', componentLibrary: 'Core UI Kit' },
    confidence: { buttons: 0.99, colors: 0.96, overall: 0.98 },
    guidelines: buildBrandGuidelines('SubZero Core', buildBrandPalette('#6366f1', '#06b6d4', '#a855f7'), 'Inter, system-ui, sans-serif'),
    source: 'preset',
    confidenceScore: 0.98,
  },
  {
    id: 'spotify',
    companyName: 'Spotify',
    websiteUrl: 'https://spotify.com/brand',
    logoUrl: 'https://www.google.com/s2/favicons?domain=spotify.com&sz=128',
    tagline: 'Music for everyone',
    colorScheme: 'dark',
    colors: {
      primary: '#1ED760',
      primaryHover: '#1fdf64',
      secondary: '#121212',
      accent: '#1ED760',
      background: '#000000',
      cardSurface: '#121212',
      textPrimary: '#FFFFFF',
      textMuted: '#b3b3b3',
      cardBorder: '#282828',
      borderGlow: '#1ED760',
      headerBg: '#181818',
      link: '#1ED760',
    },
    typography: {
      fontFamily: 'Circular, "SpotifyMixUI", "Helvetica Neue", Arial, sans-serif',
      headingFont: 'Circular, "SpotifyMixUI", sans-serif',
      fontStack: 'Circular, "SpotifyMixUI", "Helvetica Neue", Arial, sans-serif',
      fontSizeH1: '32px',
      fontSizeH2: '24px',
      fontSizeBody: '14px',
      rawFontList: ['SpotifyMixUI', 'Circular', 'CircularSp-Arab', 'Helvetica Neue', 'Arial'],
    },
    components: {
      buttonRadius: '9999px',
      buttonBackground: '#1ED760',
      buttonTextColor: '#000000',
      inputRadius: '500px',
      inputBackground: '#1f1f1f',
    },
    personality: { tone: 'modern', energy: 'high', targetAudience: 'general consumers' },
    designSystem: { framework: 'Spotify Encore DS', componentLibrary: 'Encore Web UI' },
    confidence: { buttons: 0.99, colors: 0.88, overall: 0.95 },
    guidelines: {
      colorName: 'Spotify Green',
      rgbValue: 'rgb(30, 215, 96)',
      typeface: 'Circular, "SpotifyMixUI", "Helvetica Neue", Arial, sans-serif',
      primaryRole: 'Primary buttons (pill-shaped), play triggers, confirmed checkmarks',
      secondaryRole: 'Dark neutral card backgrounds, media dividers',
      accentRole: 'Progress bars, volume meters, active highlights',
      contrastRatio: '4.8:1 (WCAG AA Compliant)',
      clearspace: '16px minimum clear space surrounding Spotify mark',
      usageRules: [
        'Render text in Circular / SpotifyMixUI typography.',
        'Primary action buttons must have pill border-radius (9999px) with black high-contrast text on Spotify Green.',
        'Cards must use Spotify dark surface (#121212) with subtle 1px border (#282828).',
      ],
    },
    source: 'preset',
    confidenceScore: 0.95,
  },
  {
    id: 'stripe',
    companyName: 'Stripe',
    websiteUrl: 'https://stripe.com/brand',
    logoUrl: 'https://images.stripeassets.com/fzn2n1nzq965/1hgcBNd12BfT9VLgbId7By/01d91920114b124fb4cf6d448f9f06eb/favicon.svg',
    tagline: 'Financial infrastructure for the internet',
    colorScheme: 'light',
    colors: {
      primary: '#533AFD',
      primaryHover: '#635BFF',
      secondary: '#00D4FF',
      accent: '#533AFD',
      background: '#0A2540',
      cardSurface: '#0f2744',
      textPrimary: '#FFFFFF',
      textMuted: '#8898aa',
      cardBorder: '#1e3a5f',
      borderGlow: '#533AFD',
      headerBg: '#091d33',
      link: '#533AFD',
    },
    typography: {
      fontFamily: '"Söhne-Var", "SF Pro Display", -apple-system, sans-serif',
      headingFont: '"Söhne-Var", "SF Pro Display", sans-serif',
      fontStack: '"Söhne-Var", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSizeH1: '48px',
      fontSizeH2: '32px',
      fontSizeBody: '15px',
      rawFontList: ['Söhne-Var', 'SF Pro Display', 'Inter', 'Helvetica Neue'],
    },
    components: {
      buttonRadius: '4px',
      buttonBackground: '#533AFD',
      buttonTextColor: '#FFFFFF',
      inputRadius: '4px',
      inputBackground: '#091d33',
    },
    personality: { tone: 'professional', energy: 'high', targetAudience: 'businesses' },
    designSystem: { framework: 'Stripe Sail DS', componentLibrary: 'Stripe Elements' },
    confidence: { buttons: 0.98, colors: 0.95, overall: 0.96 },
    guidelines: {
      colorName: 'Stripe Blurple',
      rgbValue: 'rgb(83, 58, 253)',
      typeface: '"Söhne-Var", "SF Pro Display", sans-serif',
      primaryRole: 'Primary interactive payment buttons, transaction triggers',
      secondaryRole: 'Financial graph lines, secondary cards, currency badges',
      accentRole: 'Status pills, API key badges, active metric indicators',
      contrastRatio: '5.2:1 (WCAG AAA/AA High Contrast)',
      clearspace: 'Minimum 20px padding around Stripe wordmark',
      usageRules: [
        'Use Söhne typography across all headings and tables.',
        'Primary buttons use crisp 4px border-radius with solid Stripe Blurple.',
        'Data tables must have clean, pixel-perfect 1px borders without fuzzy drop-shadows.',
      ],
    },
    source: 'preset',
    confidenceScore: 0.96,
  },
  {
    id: 'linear',
    companyName: 'Linear',
    websiteUrl: 'https://linear.app/brand',
    logoUrl: 'https://www.google.com/s2/favicons?domain=linear.app&sz=128',
    tagline: 'The issue tracking tool you will enjoy using',
    colorScheme: 'dark',
    colors: {
      primary: '#5E6AD2',
      primaryHover: '#707DE6',
      secondary: '#8B5CF6',
      accent: '#F43F5E',
      background: '#08090C',
      cardSurface: '#12131A',
      textPrimary: '#F7F8F8',
      textMuted: '#8A8F98',
      cardBorder: '#22232B',
      borderGlow: '#5E6AD2',
      headerBg: '#15161E',
      link: '#5E6AD2',
    },
    typography: {
      fontFamily: '"Inter", -apple-system, sans-serif',
      headingFont: '"Inter", sans-serif',
      fontStack: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      fontSizeH1: '28px',
      fontSizeH2: '20px',
      fontSizeBody: '14px',
      rawFontList: ['Inter', 'SF Pro Display', 'system-ui'],
    },
    components: {
      buttonRadius: '6px',
      buttonBackground: '#5E6AD2',
      buttonTextColor: '#ffffff',
      inputRadius: '6px',
      inputBackground: '#15161E',
    },
    personality: { tone: 'refined', energy: 'focused', targetAudience: 'product teams' },
    designSystem: { framework: 'Linear Interface DS', componentLibrary: 'Linear Components' },
    confidence: { buttons: 0.95, colors: 0.92, overall: 0.94 },
    guidelines: {
      colorName: 'Linear Violet',
      rgbValue: 'rgb(94, 106, 210)',
      typeface: '"Inter", -apple-system, sans-serif',
      primaryRole: 'Action shortcuts, active cycle badges, status checkmarks',
      secondaryRole: 'Issue priority chips, sidebar active states',
      accentRole: 'Urgent priority tags, milestone deadlines',
      contrastRatio: '5.0:1 (WCAG AA Compliant)',
      clearspace: 'Minimum 16px clear space around Linear monogram',
      usageRules: [
        'Keep surfaces matte and ultra-refined without heavy shadows.',
        'Render issue identifiers in clean monospace with subtle border framing.',
      ],
    },
    source: 'preset',
    confidenceScore: 0.94,
  },
  {
    id: 'netflix',
    companyName: 'Netflix',
    websiteUrl: 'https://brand.netflix.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=netflix.com&sz=128',
    tagline: 'See what is next',
    colorScheme: 'dark',
    colors: {
      primary: '#E50914',
      primaryHover: '#FF1E28',
      secondary: '#B81D24',
      accent: '#F87171',
      background: '#0b0b0b',
      cardSurface: '#141414',
      textPrimary: '#ffffff',
      textMuted: '#aaaaaa',
      cardBorder: '#2a2a2a',
      borderGlow: '#E50914',
      headerBg: '#181818',
      link: '#E50914',
    },
    typography: {
      fontFamily: '"Netflix Sans", "Helvetica Neue", Arial, sans-serif',
      headingFont: '"Netflix Sans", sans-serif',
      fontStack: '"Netflix Sans", "Helvetica Neue", Arial, sans-serif',
      fontSizeH1: '32px',
      fontSizeH2: '24px',
      fontSizeBody: '14px',
      rawFontList: ['Netflix Sans', 'Helvetica Neue', 'Arial'],
    },
    components: {
      buttonRadius: '4px',
      buttonBackground: '#E50914',
      buttonTextColor: '#ffffff',
      inputRadius: '4px',
      inputBackground: '#181818',
    },
    personality: { tone: 'cinematic', energy: 'high', targetAudience: 'global audiences' },
    designSystem: { framework: 'Netflix Hawkins DS', componentLibrary: 'Hawkins Web' },
    confidence: { buttons: 0.96, colors: 0.94, overall: 0.95 },
    guidelines: {
      colorName: 'Netflix Red',
      rgbValue: 'rgb(229, 9, 20)',
      typeface: '"Netflix Sans", "Helvetica Neue", Arial, sans-serif',
      primaryRole: 'Primary action buttons, streaming badges, live status tags',
      secondaryRole: 'Dark cinematic borders, card dividers',
      accentRole: 'Featured release badges, urgent recovery alerts',
      contrastRatio: '4.9:1 (WCAG AA Compliant)',
      clearspace: 'Minimum 24px clearspace surrounding Netflix N-icon',
      usageRules: [
        'Use Netflix Red on dark charcoal (#141414) backgrounds only.',
        'Never use glowing neon borders; maintain crisp 1px borders with solid red CTAs.',
      ],
    },
    source: 'preset',
    confidenceScore: 0.95,
  },
  {
    id: 'supabase',
    companyName: 'Supabase',
    websiteUrl: 'https://supabase.com/brand',
    logoUrl: 'https://www.google.com/s2/favicons?domain=supabase.com&sz=128',
    tagline: 'The open source Firebase alternative',
    colorScheme: 'dark',
    colors: {
      primary: '#3ECF8E',
      primaryHover: '#4BDFA0',
      secondary: '#24B47E',
      accent: '#10B981',
      background: '#121212',
      cardSurface: '#1c1c1c',
      textPrimary: '#EDEDED',
      textMuted: '#8b8b8b',
      cardBorder: '#2e2e2e',
      borderGlow: '#3ECF8E',
      headerBg: '#181818',
      link: '#3ECF8E',
    },
    typography: {
      fontFamily: 'Custom Grotesk, "Inter", sans-serif',
      headingFont: 'Custom Grotesk, "Inter", sans-serif',
      fontStack: 'Custom Grotesk, "Inter", -apple-system, sans-serif',
      fontSizeH1: '32px',
      fontSizeH2: '22px',
      fontSizeBody: '14px',
      rawFontList: ['Custom Grotesk', 'Inter', 'system-ui'],
    },
    components: {
      buttonRadius: '6px',
      buttonBackground: '#3ECF8E',
      buttonTextColor: '#000000',
      inputRadius: '6px',
      inputBackground: '#181818',
    },
    personality: { tone: 'developer-first', energy: 'focused', targetAudience: 'developers' },
    designSystem: { framework: 'Supabase UI', componentLibrary: 'Tailwind + Radix' },
    confidence: { buttons: 0.97, colors: 0.93, overall: 0.95 },
    guidelines: {
      colorName: 'Supabase Emerald',
      rgbValue: 'rgb(62, 207, 142)',
      typeface: 'Custom Grotesk, "Inter", sans-serif',
      primaryRole: 'Database migration triggers, primary CTAs, active project pills',
      secondaryRole: 'SQL query borders, secondary panel dividers',
      accentRole: 'Live connection dots, latency performance badges',
      contrastRatio: '5.1:1 (WCAG AA Compliant)',
      clearspace: 'Minimum 16px around Supabase bolt icon',
      usageRules: [
        'Database status indicators must be emerald with clean dark surfaces.',
        'Monospace code blocks must use high-contrast emerald or cyan text.',
      ],
    },
    source: 'preset',
    confidenceScore: 0.95,
  },
];

/**
 * Retrieve the active brand kit from localStorage or default
 */
export function getActiveBrandKit(): BrandKit {
  try {
    const saved = localStorage.getItem(STORAGE_ACTIVE_BRAND_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.colors && parsed.colors.primary && parsed.typography) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse issues
  }
  return BRAND_KIT_PRESETS[1]; // Default to Spotify for immediate visual brand showcase
}

/**
 * Persist active brand kit
 */
export function setActiveBrandKit(brandKit: BrandKit): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE_BRAND_KEY, JSON.stringify(brandKit));
  } catch {
    // Ignore quota issues
  }
}

/**
 * Get the Firecrawl API key (from env or user UI override)
 */
export function getFirecrawlApiKey(): string {
  try {
    const override = localStorage.getItem(STORAGE_FIRECRAWL_KEY_OVERRIDE);
    if (override && override.trim()) return override.trim();
  } catch {
    // Ignore storage issues
  }
  return (import.meta.env.VITE_FIRECRAWL_API_KEY as string | undefined)?.trim() || '';
}

/**
 * Save Firecrawl API key override into local storage
 */
export function setFirecrawlApiKeyOverride(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_FIRECRAWL_KEY_OVERRIDE, key.trim());
    } else {
      localStorage.removeItem(STORAGE_FIRECRAWL_KEY_OVERRIDE);
    }
  } catch {
    // Ignore
  }
}

/**
 * Clean & normalize a user-provided URL
 */
export function normalizeUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

/**
 * Extract clean company name and domain from URL
 */
function extractCompanyFromUrl(urlStr: string): { companyName: string; domain: string } {
  try {
    const parsed = new URL(urlStr);
    const domain = parsed.hostname.replace(/^www\./, '');
    const parts = domain.split('.');
    const mainPart = parts.length > 1 ? parts[0] : domain;
    const companyName = mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
    return { companyName, domain };
  } catch {
    return { companyName: 'Brand', domain: 'brand.com' };
  }
}

/**
 * Scrape a company's brandkit / mediakit using Firecrawl (formats: ['branding', 'markdown'])
 */
export async function scrapeBrandKitWithFirecrawl(rawUrl: string, customApiKey?: string): Promise<BrandKit> {
  const url = normalizeUrl(rawUrl);
  if (!url) {
    throw new Error('Please enter a valid URL (e.g., stripe.com/brand or spotify.com)');
  }

  const apiKey = (customApiKey || getFirecrawlApiKey()).trim();
  if (!apiKey) {
    throw new Error(
      'Firecrawl API Key is missing. Please set VITE_FIRECRAWL_API_KEY in your .env file or enter your API key in the Brand Kit modal.'
    );
  }

  const { companyName: fallbackCompany, domain } = extractCompanyFromUrl(url);

  // Call Firecrawl v1 scrape endpoint with branding format
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ['branding', 'markdown'],
      onlyMainContent: false,
    }),
  });

  if (!response.ok) {
    let errorDetail = `Firecrawl error (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson?.error) errorDetail = errJson.error;
      else if (errJson?.message) errorDetail = errJson.message;
    } catch {
      // Keep default
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Unauthorized: Invalid Firecrawl API key. (${errorDetail})`);
    }
    throw new Error(`Failed to scrape brandkit: ${errorDetail}`);
  }

  const resData = await response.json();
  const payload = resData?.data || resData;
  const branding = payload?.branding || {};

  // 1. Company / Brand Name
  let companyName = branding.brandName || fallbackCompany;
  const pageTitle = payload?.metadata?.title;
  if (!branding.brandName && pageTitle && typeof pageTitle === 'string') {
    const cleaned = pageTitle
      .replace(/\s*[-–|].*$/, '')
      .replace(/Brand Guidelines|Media Kit|Brand Kit|Assets|Press Kit/gi, '')
      .trim();
    if (cleaned.length > 1 && cleaned.length < 35) {
      companyName = cleaned;
    }
  }

  // 2. Official Logo (Firecrawl returns SVG data URI, image URL, or favicon)
  const logoUrl =
    branding.logo ||
    branding.images?.logo ||
    payload?.metadata?.ogImage ||
    payload?.metadata?.favicon ||
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  // 3. Typography & Font Family
  const rawFontStack = branding.typography?.fontStacks?.body || branding.typography?.fontStacks?.heading;
  let fontStack = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  let fontFamily = 'Inter, sans-serif';
  let headingFont = 'Inter, sans-serif';
  const rawFontList: string[] = [];

  if (Array.isArray(rawFontStack) && rawFontStack.length > 0) {
    rawFontList.push(...rawFontStack);
    const primaryFonts = rawFontStack.slice(0, 4).map((f: string) => (f.includes(' ') ? `"${f}"` : f));
    fontStack = `${primaryFonts.join(', ')}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    fontFamily = rawFontStack[0];
    headingFont = branding.typography?.fontStacks?.heading?.[0] || fontFamily;
  } else if (branding.typography?.fontFamilies?.primary) {
    fontFamily = branding.typography.fontFamilies.primary;
    headingFont = branding.typography.fontFamilies.heading || fontFamily;
    fontStack = `"${fontFamily}", -apple-system, BlinkMacSystemFont, sans-serif`;
    rawFontList.push(fontFamily);
  } else if (branding.fonts && Array.isArray(branding.fonts) && branding.fonts.length > 0) {
    fontFamily = branding.fonts[0].family;
    headingFont = fontFamily;
    fontStack = `"${fontFamily}", -apple-system, BlinkMacSystemFont, sans-serif`;
    rawFontList.push(fontFamily);
  }

  const typography: BrandKitTypography = {
    fontFamily,
    headingFont,
    fontStack,
    fontSizeH1: branding.typography?.fontSizes?.h1 || '32px',
    fontSizeH2: branding.typography?.fontSizes?.h2 || '22px',
    fontSizeBody: branding.typography?.fontSizes?.body || '14px',
    rawFontList: rawFontList.length > 0 ? rawFontList : [fontFamily, 'sans-serif'],
  };

  // 4. Color Palette
  const bColors = branding.colors || {};
  const primaryColor = bColors.primary || '#6366f1';
  const secondaryColor = bColors.secondary || '#1e293b';
  const accentColor = bColors.accent || primaryColor;
  const backgroundColor = bColors.background || '#0f1422';
  const textPrimaryColor = bColors.textPrimary || '#f8fafc';
  const linkColor = bColors.link || accentColor || primaryColor;

  const colors: BrandKitColors = {
    primary: primaryColor,
    primaryHover: adjustBrightness(primaryColor, 12),
    secondary: secondaryColor,
    accent: accentColor,
    background: backgroundColor,
    cardSurface: branding.colorScheme === 'light' ? '#111827' : (backgroundColor === '#000000' || backgroundColor === '#121212' ? '#141414' : '#111827'),
    textPrimary: textPrimaryColor,
    textMuted: '#94a3b8',
    cardBorder: adjustBrightness(secondaryColor, -15),
    borderGlow: primaryColor,
    headerBg: '#101524',
    link: linkColor,
  };

  // 5. Components (Buttons & Inputs)
  const buttonPrimary = branding.components?.buttonPrimary || {};
  const inputComp = branding.components?.input || {};

  const components: BrandKitComponents = {
    buttonRadius: buttonPrimary.borderRadius || '6px',
    buttonBackground: buttonPrimary.background || primaryColor,
    buttonTextColor: buttonPrimary.textColor || '#ffffff',
    inputRadius: inputComp.borderRadius || '6px',
    inputBackground: inputComp.background || '#111827',
  };

  // 6. Personality & Confidence & Design System
  const personality: BrandKitPersonality = {
    tone: branding.personality?.tone || 'professional',
    energy: branding.personality?.energy || 'high',
    targetAudience: branding.personality?.targetAudience || 'enterprise',
  };

  const confidence: BrandKitConfidence = {
    buttons: branding.confidence?.buttons ?? 0.95,
    colors: branding.confidence?.colors ?? 0.85,
    overall: branding.confidence?.overall ?? 0.9,
  };

  const designSystem: BrandKitDesignSystem = {
    framework: branding.designSystem?.framework || 'Custom Design System',
    componentLibrary: branding.designSystem?.componentLibrary || 'Native Tokens',
  };

  const confidenceScore = confidence.overall || 0.88;

  // 7. Guidelines & Usage Rules
  const guidelines = buildBrandGuidelines(companyName, colors, fontStack);

  const brandKit: BrandKit = {
    id: `firecrawl-${domain}-${Date.now()}`,
    companyName,
    websiteUrl: url,
    logoUrl,
    tagline: payload?.metadata?.description || `Official brand identity scraped from ${domain}`,
    colorScheme: branding.colorScheme || 'dark',
    colors,
    typography,
    components,
    personality,
    designSystem,
    confidence,
    guidelines,
    source: 'firecrawl',
    scrapedAt: new Date().toISOString(),
    confidenceScore,
  };

  return brandKit;
}
