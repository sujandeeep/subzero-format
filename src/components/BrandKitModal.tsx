import React, { useState } from 'react';
import {
  X,
  Palette,
  Globe,
  Loader2,
  Sparkles,
  Key,
  RotateCcw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  type BrandKit,
  BRAND_KIT_PRESETS,
  scrapeBrandKitWithFirecrawl,
  getFirecrawlApiKey,
  setFirecrawlApiKeyOverride,
} from '../services/brandKitService';
import './BrandKitModal.css';

interface BrandKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBrand: BrandKit;
  onApplyBrand: (brand: BrandKit) => void;
}

export const BrandKitModal: React.FC<BrandKitModalProps> = ({
  isOpen,
  onClose,
  activeBrand,
  onApplyBrand,
}) => {
  const currentApiKey = getFirecrawlApiKey();
  const isKeyConfigured = Boolean(currentApiKey && currentApiKey.length > 5);

  const [urlInput, setUrlInput] = useState<string>('');
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewBrand, setPreviewBrand] = useState<BrandKit>(() => activeBrand);
  const [showKeySettings, setShowKeySettings] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>(() => currentApiKey);
  const [savedKeySuccess, setSavedKeySuccess] = useState<boolean>(false);


  if (!isOpen) return null;

  const handleScrape = async () => {
    if (!urlInput.trim()) {
      setErrorMessage('Please enter a company brand kit or website URL (e.g. stripe.com/brand or spotify.com).');
      return;
    }

    setIsScraping(true);
    setErrorMessage(null);

    try {
      const scraped = await scrapeBrandKitWithFirecrawl(urlInput.trim(), customApiKey);
      setPreviewBrand(scraped);
      onApplyBrand(scraped);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to scrape brand kit with Firecrawl.';
      setErrorMessage(message);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSelectPreset = (preset: BrandKit) => {
    setPreviewBrand(preset);
    setErrorMessage(null);
  };

  const handleApplyCurrent = () => {
    onApplyBrand(previewBrand);
    onClose();
  };

  const handleResetDefault = () => {
    const defaultKit = BRAND_KIT_PRESETS[0];
    setPreviewBrand(defaultKit);
    onApplyBrand(defaultKit);
    onClose();
  };

  const handleSaveApiKey = () => {
    setFirecrawlApiKeyOverride(customApiKey.trim());
    setSavedKeySuccess(true);
    setTimeout(() => setSavedKeySuccess(false), 2000);
  };

  return (
    <div className="brandkit-modal-overlay" onClick={onClose}>
      <div className="brandkit-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="brandkit-modal-header">
          <div className="brandkit-header-title">
            <div className="brandkit-header-icon">
              <Palette size={20} />
            </div>
            <div>
              <h2>Brand Media Kit & Theming</h2>
              <p>Scrape brand colors and logos via Firecrawl to theme formatted outputs</p>
            </div>
          </div>
          <button className="brandkit-close-btn" onClick={onClose} title="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="brandkit-modal-body">
          {/* Firecrawl API Key Status & Config */}
          <div className="firecrawl-status-bar">
            <div className="firecrawl-status-row">
              <span className={`firecrawl-status-badge ${isKeyConfigured ? 'connected' : 'missing'}`}>
                <Key size={12} />
                {isKeyConfigured
                  ? 'Firecrawl API Connected (via .env / settings)'
                  : 'Firecrawl API Key Missing — enter below or set VITE_FIRECRAWL_API_KEY in .env'}
              </span>
              <button
                type="button"
                className="btn-toggle-key-input"
                onClick={() => setShowKeySettings(!showKeySettings)}
              >
                {showKeySettings ? 'Hide Key Settings' : 'Configure Key'}
              </button>
            </div>

            {showKeySettings && (
              <div className="firecrawl-key-input-row">
                <input
                  type="password"
                  placeholder="Paste Firecrawl key (e.g. fc-xxxxxxxxxx)"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                />
                <button type="button" className="btn-save-key" onClick={handleSaveApiKey}>
                  {savedKeySuccess ? 'Saved!' : 'Save Key'}
                </button>
              </div>
            )}
          </div>

          {/* Scrape URL Input Section */}
          <div className="brandkit-scrape-section">
            <label htmlFor="brand-url-input">
              <Globe size={14} /> Enter Company Media Kit or Website URL
            </label>
            <div className="brandkit-input-group">
              <div className="brandkit-url-input-wrap">
                <Globe size={15} className="brandkit-url-icon" />
                <input
                  id="brand-url-input"
                  type="text"
                  className="brandkit-url-input"
                  placeholder="e.g. spotify.com/brand, stripe.com, linear.app"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleScrape();
                    }
                  }}
                  disabled={isScraping}
                />
              </div>
              <button
                type="button"
                className="btn-scrape-firecrawl"
                onClick={handleScrape}
                disabled={isScraping}
              >
                {isScraping ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Scraping with Firecrawl...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Scrape Brand Kit</span>
                  </>
                )}
              </button>
            </div>
            <span className="scrape-hint">
              Firecrawl will extract brand colors, primary logo, and metadata from the page.
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="brandkit-error-box">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick 1-Click Presets */}
          <div className="brandkit-presets-section">
            <h3>Quick Brand Presets (Instant 1-Click Testing)</h3>
            <div className="brandkit-preset-grid">
              {BRAND_KIT_PRESETS.map((preset) => {
                const isCurrent = previewBrand.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`preset-chip-btn ${isCurrent ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(preset)}
                  >
                    <div className="preset-top">
                      {preset.logoUrl ? (
                        <img
                          src={preset.logoUrl}
                          alt={preset.companyName}
                          className="preset-logo"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="preset-logo-fallback">
                          {preset.companyName.charAt(0)}
                        </span>
                      )}
                      <span
                        className="preset-swatch-dot"
                        style={{ backgroundColor: preset.colors.primary }}
                      />
                    </div>
                    <span className="preset-name">{preset.companyName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Preview Card */}
          <div className="brandkit-active-preview">
            <div className="preview-brand-header">
              <div className="preview-brand-info">
                {previewBrand.logoUrl ? (
                  <img
                    src={previewBrand.logoUrl}
                    alt={previewBrand.companyName}
                    className="preview-brand-logo"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    className="preview-brand-logo"
                    style={{
                      background: previewBrand.colors.primary,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                  >
                    {previewBrand.companyName.charAt(0)}
                  </div>
                )}
                <div className="preview-brand-titles">
                  <h4>{previewBrand.companyName}</h4>
                  <p>{previewBrand.tagline || previewBrand.websiteUrl}</p>
                </div>
              </div>

              <span className="preview-source-badge">
                {previewBrand.source === 'firecrawl' ? 'Scraped via Firecrawl' : 'Built-in Preset'}
              </span>
            </div>

            {/* Extracted Swatches */}
            <div className="preview-palette-row">
              <div className="palette-swatch-item">
                <span
                  className="palette-color-box"
                  style={{ backgroundColor: previewBrand.colors.primary }}
                />
                <span className="palette-label">Primary:</span>
                <span>{previewBrand.colors.primary}</span>
              </div>

              <div className="palette-swatch-item">
                <span
                  className="palette-color-box"
                  style={{ backgroundColor: previewBrand.colors.secondary }}
                />
                <span className="palette-label">Secondary:</span>
                <span>{previewBrand.colors.secondary}</span>
              </div>

              <div className="palette-swatch-item">
                <span
                  className="palette-color-box"
                  style={{ backgroundColor: previewBrand.colors.accent }}
                />
                <span className="palette-label">Accent:</span>
                <span>{previewBrand.colors.accent}</span>
              </div>

              {previewBrand.websiteUrl && (
                <div className="palette-swatch-item" style={{ marginLeft: 'auto' }}>
                  <ExternalLink size={12} />
                  <span style={{ fontSize: '0.68rem' }}>
                    {previewBrand.websiteUrl.replace(/^https?:\/\//, '')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="brandkit-modal-footer">
          <button type="button" className="btn-reset-brand" onClick={handleResetDefault}>
            <RotateCcw size={13} />
            <span>Reset to Default SubZero</span>
          </button>

          <button type="button" className="btn-apply-brand" onClick={handleApplyCurrent}>
            <Palette size={14} />
            <span>Apply Brand Palette to Formatted Outputs</span>
          </button>
        </div>
      </div>
    </div>
  );
};
