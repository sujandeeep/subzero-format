import React from 'react';
import { Palette, RotateCcw } from 'lucide-react';
import { type BrandKit } from '../services/brandKitService';
import './BrandKitModal.css';

interface BrandKitBannerProps {
  brandKit: BrandKit;
  onOpenModal: () => void;
  onReset: () => void;
}

export const BrandKitBanner: React.FC<BrandKitBannerProps> = ({
  brandKit,
  onOpenModal,
  onReset,
}) => {
  const isCustomBrand = brandKit.id !== 'default';

  return (
    <div className="brand-identity-banner">
      <div className="brand-banner-left">
        {brandKit.logoUrl ? (
          <img
            src={brandKit.logoUrl}
            alt={brandKit.companyName}
            className="brand-banner-logo"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="brand-banner-logo-fallback">
            {brandKit.companyName.charAt(0)}
          </div>
        )}

        <div className="brand-banner-titles">
          <div className="brand-banner-status">
            <span className="brand-pill-live">
              {brandKit.source === 'firecrawl' ? 'Firecrawl Brandkit' : 'Active Brand'}
            </span>
            <span className="brand-banner-name">{brandKit.companyName}</span>
          </div>
          <span className="brand-banner-tagline">
            {brandKit.tagline || brandKit.websiteUrl}
          </span>
        </div>
      </div>

      <div className="brand-banner-right">
        {/* Color swatches */}
        <div className="brand-swatches-inline" title="Extracted Brand Palette">
          <span
            className="banner-swatch"
            style={{ backgroundColor: brandKit.colors.primary }}
            title={`Primary: ${brandKit.colors.primary}`}
          />
          <span
            className="banner-swatch"
            style={{ backgroundColor: brandKit.colors.secondary }}
            title={`Secondary: ${brandKit.colors.secondary}`}
          />
          <span
            className="banner-swatch"
            style={{ backgroundColor: brandKit.colors.accent }}
            title={`Accent: ${brandKit.colors.accent}`}
          />
        </div>

        {/* Change / Re-scrape button */}
        <button
          type="button"
          className="btn-banner-edit"
          onClick={onOpenModal}
          title="Change brand kit or scrape another URL"
        >
          <Palette size={13} />
          <span>Change Brand</span>
        </button>

        {isCustomBrand && (
          <button
            type="button"
            className="btn-banner-reset"
            onClick={onReset}
            title="Reset to default theme"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>
    </div>
  );
};
