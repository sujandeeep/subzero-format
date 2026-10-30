import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Columns,
  Hash,
} from 'lucide-react';
import { JEEVES_100_ITEMS } from '../data/loader';
import {
  dispatchToolNativeBlock,
  type ToolNativeBlock,
  type CatalogGridBlock,
  type PipelineTableBlock,
  type Deal360Block,
  type SoftwareSpecBlock,
  type FormGateBlock,
  type ActionConfirmationBlock,
  type LicenseTicketBlock,
  type WorkflowAuditBlock,
  type SystemAlertBlock,
  type ProseBlock,
} from '../services/toolNativeDispatcher';
import { UuidBadge } from '../components/UuidBadge';
import './DispatcherPortal.css';

export const DispatcherPortal: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [customInput, setCustomInput] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'input' | 'output'>('output');
  const [desktopView, setDesktopView] = useState<'split' | 'input' | 'output'>('split');
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);

  // Swipe detection for mobile navigation
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const totalItems = JEEVES_100_ITEMS.length;
  const originalText = JEEVES_100_ITEMS[currentIndex]?.message || '';
  const activeText = customInput !== null ? customInput : originalText;
  const isCustomized = customInput !== null && customInput !== originalText;

  const dispatchResult = dispatchToolNativeBlock(currentIndex + 1, activeText);
  const block: ToolNativeBlock = dispatchResult.block;

  // Arrow navigation
  const handlePrev = useCallback(() => {
    setCustomInput(null);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
  }, [totalItems]);

  const handleNext = useCallback(() => {
    setCustomInput(null);
    setCurrentIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
  }, [totalItems]);

  // Keyboard navigation: Left and Right arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') {
        handlePrev();
      }
      if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;

    // Trigger swipe if horizontal movement is > 70px and predominantly horizontal
    if (Math.abs(deltaX) > 70 && Math.abs(deltaX) > Math.abs(deltaY) * 1.6) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(activeText);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 1800);
  };

  const handleReset = () => {
    setCustomInput(null);
  };

  const handleClear = () => {
    setCustomInput('');
  };

  return (
    <div
      className={`portal-root mobile-tab-${mobileTab} desktop-view-${desktopView}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* HEADER: NUMBER NAVIGATION + RAW/OUTPUT BUTTONS */}
      <header className="portal-header">
        <div className="header-nav-group">
          <button
            className="nav-arrow-btn"
            onClick={handlePrev}
            aria-label="Previous Item"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="nav-counter">
            <input
              type="number"
              min={1}
              max={totalItems}
              value={currentIndex + 1}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= totalItems) {
                  setCustomInput(null);
                  setCurrentIndex(val - 1);
                }
              }}
              className="nav-input-num"
              aria-label="Current Item Number"
            />
            <span className="nav-counter-total">/ {totalItems}</span>
          </div>

          <button
            className="nav-arrow-btn"
            onClick={handleNext}
            aria-label="Next Item"
            title="Next (Right Arrow)"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* VIEW BUTTONS: RAW INPUT BUTTON & FORMATTED OUTPUT BUTTON */}
        <div className="header-view-toggle">
          <button
            type="button"
            className={`view-btn ${mobileTab === 'input' ? 'is-active' : ''}`}
            onClick={() => {
              setMobileTab('input');
              setDesktopView('input');
            }}
            aria-label="Raw Input View"
            aria-pressed={mobileTab === 'input'}
          >
            <FileText size={15} />
            <span className="view-btn-text">Raw Input</span>
            <span className="view-btn-pill">{activeText.length} chars</span>
          </button>

          <button
            type="button"
            className={`view-btn ${mobileTab === 'output' ? 'is-active' : ''}`}
            onClick={() => {
              setMobileTab('output');
              setDesktopView('output');
            }}
            aria-label="Formatted Output View"
            aria-pressed={mobileTab === 'output'}
          >
            <Sparkles size={15} />
            <span className="view-btn-text">Formatted Output</span>
            <span className="view-btn-pill badge-pill">
              {block.blockType.replace('_', ' ')}
            </span>
          </button>

          {/* DESKTOP SPLIT VIEW BUTTON */}
          <button
            type="button"
            className={`view-btn desktop-only-btn ${desktopView === 'split' ? 'is-active' : ''}`}
            onClick={() => setDesktopView('split')}
            aria-label="Desktop Split View"
            title="Side-by-side view"
          >
            <Columns size={15} />
            <span className="view-btn-text">Split</span>
          </button>
        </div>
      </header>

      {/* MOBILE QUICK TAB BAR (VISIBLE ON MOBILE FOR ONE-TOUCH SWITCHING) */}
      <nav className="mobile-view-nav" aria-label="Mobile View Selection">
        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'input' ? 'active' : ''}`}
          onClick={() => setMobileTab('input')}
        >
          <FileText size={16} />
          <span>Raw Input</span>
          <span className="tab-pill">{activeText.length}c</span>
        </button>

        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'output' ? 'active' : ''}`}
          onClick={() => setMobileTab('output')}
        >
          <Sparkles size={16} />
          <span>Formatted Output</span>
          <span className="tab-pill active-type-pill">
            {block.blockType.replace('_', ' ')}
          </span>
        </button>
      </nav>

      {/* BODY CONTAINER: INPUT (LEFT) | OUTPUT (RIGHT) */}
      <div className="portal-split-body">
        {/* LEFT PANEL: RAW INPUT */}
        <section
          className={`portal-panel left-panel ${mobileTab === 'input' ? 'mobile-visible' : 'mobile-hidden'}`}
          aria-label="Raw Input Editor"
        >
          <div className="panel-toolbar">
            <div className="toolbar-info">
              <span className="toolbar-tag">SOURCE INPUT</span>
              {isCustomized && <span className="toolbar-modified-tag">MODIFIED</span>}
            </div>

            <div className="toolbar-actions">
              {isCustomized && (
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={handleReset}
                  title="Reset to original Jeeves item"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              )}
              {activeText.length > 0 && (
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={handleClear}
                  title="Clear input"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              )}
              <button
                type="button"
                className={`toolbar-btn ${copiedRaw ? 'copied' : ''}`}
                onClick={handleCopyRaw}
                title="Copy raw text to clipboard"
              >
                {copiedRaw ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedRaw ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="raw-input-scroll-wrap">
            <textarea
              className="raw-input-textarea"
              value={activeText}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Paste raw unstructured agent or boss message here..."
              spellCheck={false}
              aria-label="Raw input text"
            />
          </div>
        </section>

        {/* RIGHT PANEL: FORMATTED OUTPUT */}
        <section
          className={`portal-panel right-panel ${mobileTab === 'output' ? 'mobile-visible' : 'mobile-hidden'}`}
          aria-label="Formatted Deterministic Output"
        >
          <div className="panel-toolbar right-toolbar">
            <div className="toolbar-info">
              <span className="toolbar-tag output-tag">STRUCTURED OUTPUT</span>
              <span className="toolbar-type-badge">{block.blockType}</span>
            </div>

            <div className="toolbar-actions">
              <span className="toolbar-tip">
                <Hash size={12} style={{ color: '#38bdf8' }} /> UUIDs hide under #
              </span>
            </div>
          </div>

          <div className="panel-scroll-area">
            {renderOutputBlock(block)}
          </div>
        </section>
      </div>
    </div>
  );
};

// ============================================================================
// OUTPUT RENDERERS (CLEAN ZERO-LATENCY NATIVE DISPLAY WITH UUID HASHTAGS)
// ============================================================================

function renderOutputBlock(block: ToolNativeBlock): React.ReactNode {
  switch (block.blockType) {
    // 1. CATALOG GRID / SEARCH RESULTS
    case 'CATALOG_GRID': {
      const blk = block as CatalogGridBlock;
      return (
        <div className="output-card">
          {blk.title && <h2 className="output-main-title">{blk.title}</h2>}
          <div className="catalog-cards-grid">
            {blk.items.map((item) => (
              <div key={item.id} className="catalog-item-card">
                <div className="catalog-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="catalog-card-title">
                      {item.num}. {item.name}
                    </span>
                    <UuidBadge uuid={item.id} />
                  </div>
                  {item.publisher && (
                    <span className="catalog-card-publisher">{item.publisher}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 2. PIPELINE TABLE / OPPORTUNITIES
    case 'PIPELINE_TABLE': {
      const blk = block as PipelineTableBlock;
      return (
        <div className="output-card">
          {blk.title && <h2 className="output-main-title">{blk.title}</h2>}
          <div className="portal-table-container">
            <div className="table-mobile-hint">Swipe horizontally to view full table &rarr;</div>
            <table className="portal-table">
              <thead>
                <tr>
                  {blk.columns.map((col, idx) => (
                    <th key={idx}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blk.rows.map((row) => (
                  <tr key={row.id}>
                    {blk.columns.map((col, cIdx) => {
                      if (col === '#') return <td key={cIdx}>{row.num}</td>;
                      if (col === 'Opportunity Name') {
                        return (
                          <td key={cIdx} style={{ fontWeight: 600 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span>{row.name}</span>
                              <UuidBadge uuid={row.id} />
                            </div>
                          </td>
                        );
                      }
                      if (col === 'Opportunity UUID') {
                        return (
                          <td key={cIdx} className="portal-uuid-cell">
                            <UuidBadge uuid={row.id} />
                          </td>
                        );
                      }
                      if (col === 'Company') {
                        return <td key={cIdx}>{row.company || row.fields?.['Company'] || '—'}</td>;
                      }
                      if (col === 'Deal Value') {
                        return (
                          <td key={cIdx} style={{ color: '#34d399', fontWeight: 600 }}>
                            {row.dealValue || row.fields?.['Deal Value'] || '—'}
                          </td>
                        );
                      }
                      if (col === 'Close Date') {
                        return <td key={cIdx}>{row.closeDate || row.fields?.['Close Date'] || '—'}</td>;
                      }
                      if (col === 'Health Score') {
                        return (
                          <td key={cIdx} style={{ color: '#38bdf8' }}>
                            {row.healthScore || row.fields?.['Health Score'] || '—'}
                          </td>
                        );
                      }
                      if (col === 'Labels') {
                        return <td key={cIdx}>{row.labels.join(', ') || '—'}</td>;
                      }

                      // Check if generic field value looks like a UUID
                      const val = row.fields?.[col] || '—';
                      if (
                        typeof val === 'string' &&
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim())
                      ) {
                        return (
                          <td key={cIdx} className="portal-uuid-cell">
                            <UuidBadge uuid={val.trim()} />
                          </td>
                        );
                      }

                      return <td key={cIdx}>{val}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 3. DEAL 360 RECORD
    case 'DEAL_360': {
      const blk = block as Deal360Block;
      return (
        <div className="output-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {blk.title && <h2 className="output-main-title">{blk.title}</h2>}
            {blk.opportunityId && <UuidBadge uuid={blk.opportunityId} />}
          </div>
          {blk.description && <p className="output-desc">{blk.description}</p>}

          <div className="portal-kv-grid">
            {blk.opportunityId && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Opportunity UUID</span>
                <UuidBadge uuid={blk.opportunityId} />
              </div>
            )}

            {blk.company?.name && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Company</span>
                <span className="portal-v-value">{blk.company.name}</span>
              </div>
            )}

            {blk.company?.companyId && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Company ID</span>
                <UuidBadge uuid={blk.company.companyId} />
              </div>
            )}

            {blk.owner && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Owner</span>
                <span className="portal-v-value">{blk.owner}</span>
              </div>
            )}

            {blk.dealValue && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Deal Value</span>
                <span className="portal-v-value highlight-green">{blk.dealValue}</span>
              </div>
            )}

            {blk.healthScore && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Health Score</span>
                <span className="portal-v-value highlight-cyan">{blk.healthScore}</span>
              </div>
            )}

            {blk.closeDate && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Close Date</span>
                <span className="portal-v-value">{blk.closeDate}</span>
              </div>
            )}

            {blk.manualProbability && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Manual Probability</span>
                <span className="portal-v-value">{blk.manualProbability}</span>
              </div>
            )}

            {blk.aiProbability?.score && (
              <div className="portal-kv-card">
                <span className="portal-k-label">AI Probability</span>
                <span className="portal-v-value" style={{ color: '#c084fc' }}>
                  {blk.aiProbability.score}
                </span>
              </div>
            )}

            {blk.documents && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Documents</span>
                <span className="portal-v-value">{blk.documents}</span>
              </div>
            )}
          </div>

          {blk.aiProbability?.rationale && (
            <p className="output-desc">{blk.aiProbability.rationale}</p>
          )}

          {blk.company?.profile && (
            <p className="output-desc">{blk.company.profile}</p>
          )}

          {blk.labels && blk.labels.length > 0 && (
            <div className="portal-pills-wrap">
              {blk.labels.map((lbl, idx) => (
                <span key={idx} className="portal-pill">{lbl}</span>
              ))}
            </div>
          )}

          {blk.lineItems && blk.lineItems.length > 0 && (
            <div className="portal-table-container">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {blk.lineItems.map((li, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>{li.title}</span>
                          {li.productId && <UuidBadge uuid={li.productId} />}
                        </div>
                      </td>
                      <td>{li.quantity}</td>
                      <td style={{ color: '#34d399', fontWeight: 600 }}>{li.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {blk.stakeholders && blk.stakeholders.length > 0 && (
            <div className="portal-table-container">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Job Title</th>
                    <th>Email</th>
                    <th>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {blk.stakeholders.map((sh, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{sh.name}</td>
                      <td>{sh.role || '—'}</td>
                      <td>{sh.jobTitle || '—'}</td>
                      <td>{sh.email || '—'}</td>
                      <td>{sh.phone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {blk.activities && blk.activities.length > 0 && (
            <div className="catalog-items-list">
              {blk.activities.map((act) => (
                <div key={act.id} className="catalog-item-row">
                  <div className="catalog-item-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="catalog-item-name">{act.title}</span>
                      {act.id && <UuidBadge uuid={act.id} />}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className="portal-badge">{act.type}</span>
                      <span className="portal-badge">{act.status}</span>
                    </div>
                  </div>
                  {act.description && <p className="output-desc">{act.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 4. SOFTWARE PRODUCT SPECIFICATION
    case 'SOFTWARE_SPEC': {
      const blk = block as SoftwareSpecBlock;
      return (
        <div className="output-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {blk.title && <h2 className="output-main-title">{blk.title}</h2>}
            {blk.softwareId && <UuidBadge uuid={blk.softwareId} />}
          </div>
          {blk.description && <p className="output-desc">{blk.description}</p>}

          <div className="portal-kv-grid">
            {blk.softwareId && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Software UUID</span>
                <UuidBadge uuid={blk.softwareId} />
              </div>
            )}

            {blk.revisionId && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Revision UUID</span>
                <UuidBadge uuid={blk.revisionId} />
              </div>
            )}

            {blk.publisher && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Publisher</span>
                <span className="portal-v-value">{blk.publisher}</span>
              </div>
            )}

            {blk.licensingUnit && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Licensing Unit</span>
                <span className="portal-v-value">{blk.licensingUnit}</span>
              </div>
            )}

            {blk.termPolicy && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Term Policy</span>
                <span className="portal-v-value">{blk.termPolicy}</span>
              </div>
            )}

            {blk.approval && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Approval Policy</span>
                <span className="portal-v-value">{blk.approval}</span>
              </div>
            )}

            {blk.cost && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Cost</span>
                <span className="portal-v-value highlight-green">${blk.cost}</span>
              </div>
            )}

            {(blk.minQuantity || blk.maxQuantity) && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Quantity</span>
                <span className="portal-v-value">{blk.minQuantity || '—'} to {blk.maxQuantity || '—'}</span>
              </div>
            )}
          </div>

          {blk.attributes && Object.keys(blk.attributes).length > 0 && (
            <div className="portal-kv-grid" style={{ marginTop: '12px' }}>
              {Object.entries(blk.attributes).map(([k, v]) => (
                <div key={k} className="portal-kv-card">
                  <span className="portal-k-label">{k}</span>
                  {typeof v === 'string' &&
                  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim()) ? (
                    <UuidBadge uuid={v.trim()} />
                  ) : (
                    <span className="portal-v-value">{v}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 5. FORM GATE / PARAMETER PROMPT
    case 'FORM_GATE': {
      const blk = block as FormGateBlock;
      return (
        <div className="output-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {blk.softwareTitle && <h2 className="output-main-title">{blk.softwareTitle}</h2>}
            {blk.softwareId && <UuidBadge uuid={blk.softwareId} />}
          </div>
          {blk.prompt && <p className="output-desc">{blk.prompt}</p>}

          <div className="catalog-items-list">
            {blk.fields.map((f, idx) => (
              <div key={idx} className="catalog-item-row">
                <div className="catalog-item-header">
                  <span className="catalog-item-name">{f.label}</span>
                  <span className="portal-badge">{f.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 6. ACTION CONFIRMATION
    case 'ACTION_CONFIRMATION': {
      const blk = block as ActionConfirmationBlock;
      return (
        <div className="output-card">
          {blk.headline && <h2 className="output-main-title">{blk.headline}</h2>}
          {blk.status && <span className="portal-badge">{blk.status}</span>}

          {blk.target && (
            <div className="portal-kv-card" style={{ marginTop: '12px' }}>
              <span className="portal-k-label">Target</span>
              <span className="portal-v-value">{blk.target}</span>
            </div>
          )}

          {blk.details && Object.keys(blk.details).length > 0 && (
            <div className="portal-kv-grid" style={{ marginTop: '12px' }}>
              {Object.entries(blk.details).map(([k, v]) => (
                <div key={k} className="portal-kv-card">
                  <span className="portal-k-label">{k}</span>
                  {typeof v === 'string' &&
                  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim()) ? (
                    <UuidBadge uuid={v.trim()} />
                  ) : (
                    <span className="portal-v-value">{v}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 7. LICENSE TICKET
    case 'LICENSE_TICKET': {
      const blk = block as LicenseTicketBlock;
      return (
        <div className="output-card">
          {blk.title && <h2 className="output-main-title">{blk.title}</h2>}

          <div className="portal-kv-grid">
            {blk.ticketNumber && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Ticket</span>
                <span className="portal-v-value">#{blk.ticketNumber}</span>
              </div>
            )}
            {blk.status && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Status</span>
                <span className="portal-v-value">{blk.status}</span>
              </div>
            )}
            {blk.customer && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Customer</span>
                <span className="portal-v-value">{blk.customer}</span>
              </div>
            )}
            {blk.group && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Group</span>
                <span className="portal-v-value">{blk.group}</span>
              </div>
            )}
            {blk.priority && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Priority</span>
                <span className="portal-v-value">{blk.priority}</span>
              </div>
            )}
            {blk.created && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Created</span>
                <span className="portal-v-value">{blk.created}</span>
              </div>
            )}
            {blk.updated && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Updated</span>
                <span className="portal-v-value">{blk.updated}</span>
              </div>
            )}
            {blk.samRequestUuid && (
              <div className="portal-kv-card">
                <span className="portal-k-label">SAM Request UUID</span>
                <UuidBadge uuid={blk.samRequestUuid} />
              </div>
            )}
            {blk.resourceWorkUuid && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Resource Work UUID</span>
                <UuidBadge uuid={blk.resourceWorkUuid} />
              </div>
            )}
          </div>

          {blk.comments && blk.comments.length > 0 && (
            <div className="catalog-items-list" style={{ marginTop: '14px' }}>
              {blk.comments.map((c, idx) => (
                <div key={idx} className="catalog-item-row">
                  <div className="catalog-item-header">
                    <span className="catalog-item-name">{c.author}</span>
                    {c.date && <span style={{ fontSize: '12px', color: '#64748b' }}>{c.date}</span>}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                    {c.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 8. WORKFLOW STEP AUDIT
    case 'WORKFLOW_AUDIT': {
      const blk = block as WorkflowAuditBlock;
      return (
        <div className="output-card">
          {blk.headline && <h2 className="output-main-title">{blk.headline}</h2>}
          {blk.status && <span className="portal-badge">{blk.status}</span>}

          <div className="portal-step-list" style={{ marginTop: '14px' }}>
            {blk.steps.map((st, idx) => (
              <div key={idx} className="portal-step-item">
                <div className="portal-step-top">
                  <span className="portal-step-tool">{st.toolName}</span>
                  <span className="portal-badge">{st.status}</span>
                </div>
                <p className="portal-step-msg">{st.message}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 9. SYSTEM DIAGNOSTIC ALERT
    case 'SYSTEM_ALERT': {
      const blk = block as SystemAlertBlock;
      return (
        <div className="output-card" style={{ borderColor: '#ef4444' }}>
          {blk.headline && <h2 className="output-main-title" style={{ color: '#f87171' }}>{blk.headline}</h2>}
          {blk.severity && <span className="portal-badge" style={{ color: '#f87171' }}>{blk.severity}</span>}
          <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {blk.message}
          </p>
        </div>
      );
    }

    // 10. RAW PROSE
    case 'PROSE': {
      const blk = block as ProseBlock;
      let parsedJson: unknown = null;
      try {
        const trimmed = blk.content.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          parsedJson = JSON.parse(trimmed);
        }
      } catch {
        parsedJson = null;
      }

      return (
        <div className="output-card">
          {parsedJson ? (
            <pre className="raw-input-pre" style={{ color: '#38bdf8' }}>
              {JSON.stringify(parsedJson, null, 2)}
            </pre>
          ) : (
            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {blk.content}
            </p>
          )}
        </div>
      );
    }
  }
}

export default DispatcherPortal;
