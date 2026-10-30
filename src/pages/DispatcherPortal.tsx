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
  CornerDownLeft,
  Play,
} from 'lucide-react';
import { JEEVES_100_ITEMS } from '../data/loader';
import {
  dispatchToolNativeBlock,
  cleanMd,
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
  const [justProcessed, setJustProcessed] = useState<boolean>(false);

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

  const handleProcess = useCallback(() => {
    if (!activeText.trim()) return;

    let textToProcess = activeText.trim();
    if (textToProcess.includes('\\n') || (textToProcess.startsWith('"') && textToProcess.endsWith('"'))) {
      try {
        const parsed = JSON.parse(textToProcess);
        if (typeof parsed === 'string') {
          textToProcess = parsed;
          setCustomInput(textToProcess);
        }
      } catch {
        if (
          (textToProcess.startsWith('"') && textToProcess.endsWith('"')) ||
          (textToProcess.startsWith("'") && textToProcess.endsWith("'"))
        ) {
          textToProcess = textToProcess.slice(1, -1);
        }
        if (textToProcess.includes('\\n')) {
          textToProcess = textToProcess
            .replace(/\\r\\n/g, '\n')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"');
        }
        setCustomInput(textToProcess);
      }
    }

    setJustProcessed(true);
    setTimeout(() => setJustProcessed(false), 1400);
    // Automatically reveal the formatted output tab
    setMobileTab('output');
    if (desktopView === 'input') {
      setDesktopView('split');
    }
  }, [activeText, desktopView]);

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
            {isCustomized && (
              <span className="custom-input-pill" title="Custom raw input is active">
                Custom
              </span>
            )}
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
              <button
                type="button"
                className={`toolbar-btn process-btn ${justProcessed ? 'processed' : ''}`}
                onClick={handleProcess}
                title="Process raw input into structured output (Ctrl+Enter)"
              >
                <CornerDownLeft size={13} />
                <span>{justProcessed ? 'Processed ✓' : 'Enter ↵'}</span>
              </button>
            </div>
          </div>

          <div className="raw-input-scroll-wrap">
            <textarea
              className="raw-input-textarea"
              value={activeText}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleProcess();
                }
              }}
              placeholder="Paste raw unstructured agent or boss message here (e.g. JSON, table, list, or text with Key: Value pairs)..."
              spellCheck={false}
              aria-label="Raw input text"
            />
            <div className="input-action-bar">
              <span className="input-action-hint">
                <kbd>Ctrl</kbd> + <kbd>Enter ↵</kbd>
              </span>
              <button
                type="button"
                className={`primary-process-btn ${justProcessed ? 'processed' : ''}`}
                onClick={handleProcess}
                title="Format raw data into structured output"
              >
                <Play size={12} fill="currentColor" />
                <span>{justProcessed ? 'Processed Live ✓' : 'Process & Format (Enter ↵)'}</span>
              </button>
            </div>
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
              {justProcessed && (
                <span className="toolbar-tag" style={{ color: '#34d399', borderColor: '#34d399', background: 'rgba(52, 211, 153, 0.12)' }}>
                  ✓ LIVE COMPILED
                </span>
              )}
            </div>

            <div className="toolbar-actions">
              <span className="toolbar-tip">
                <Hash size={12} style={{ color: '#38bdf8' }} /> UUIDs hide under #
              </span>
            </div>
          </div>

          <div className="panel-scroll-area">
            {!activeText.trim() ? (
              <div className="output-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
                <Sparkles size={36} style={{ color: '#38bdf8', margin: '0 auto 14px auto', display: 'block' }} />
                <h2 className="output-main-title" style={{ fontSize: '18px', marginBottom: '8px' }}>Waiting for Raw Input</h2>
                <p className="output-desc" style={{ maxWidth: '420px', margin: '0 auto 20px auto', lineHeight: '1.6' }}>
                  Paste any unstructured data, JSON payload, table, or entity fields on the left and click <strong>Process &amp; Format (Enter ↵)</strong> to instantly generate clean deterministic output.
                </p>
              </div>
            ) : (
              renderOutputBlock(block)
            )}
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
                            {row.name}
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
                    <th>Product UUID</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {blk.lineItems.map((li, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{li.title}</td>
                      <td className="portal-uuid-cell">
                        {li.productId ? <UuidBadge uuid={li.productId} /> : '—'}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <h2 className="output-main-title" style={{ margin: 0 }}>
              {blk.ticketNumber ? `Ticket #${blk.ticketNumber}` : ''}
              {blk.title && blk.title !== `Ticket #${blk.ticketNumber}` ? (blk.ticketNumber ? `: ${blk.title}` : blk.title) : ''}
            </h2>
            {blk.samRequestUuid && <UuidBadge uuid={blk.samRequestUuid} />}
          </div>

          <div className="portal-kv-grid">
            {blk.ticketNumber && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Ticket ID</span>
                <span className="portal-v-value">#{blk.ticketNumber}</span>
              </div>
            )}
            {blk.status && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Status</span>
                <span className="portal-badge">{blk.status}</span>
              </div>
            )}
            {blk.priority && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Priority</span>
                <span className="portal-v-value">{blk.priority}</span>
              </div>
            )}
            {blk.group && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Group</span>
                <span className="portal-v-value">{blk.group}</span>
              </div>
            )}
            {blk.customer && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Customer</span>
                <span className="portal-v-value">{blk.customer}</span>
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
                <span className="portal-k-label">HITL / SAM Request</span>
                <UuidBadge uuid={blk.samRequestUuid} />
              </div>
            )}
            {blk.resourceWorkUuid && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Resource Work</span>
                <UuidBadge uuid={blk.resourceWorkUuid} />
              </div>
            )}
          </div>

          {blk.comments && blk.comments.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              {blk.comments.map((c, idx) => (
                <div key={idx} className="output-card" style={{ background: 'rgba(15, 23, 42, 0.6)', borderColor: '#1e293b', marginBottom: '16px' }}>
                  <div className="catalog-item-header" style={{ marginBottom: '12px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="portal-badge" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>Public Comment</span>
                      <span className="catalog-item-name" style={{ color: '#f1f5f9' }}>{c.author}</span>
                    </div>
                    {c.date && <span style={{ fontSize: '12px', color: '#64748b' }}>{c.date}</span>}
                  </div>
                  <div>
                    {renderRichStructuredContent(c.text)}
                  </div>
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

    // 10. STRUCTURED PROSE & UNSTRUCTURED CONTENT
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

      if (parsedJson) {
        return (
          <div className="output-card">
            <h2 className="output-main-title">Parsed JSON Payload</h2>
            <pre className="raw-input-pre" style={{ color: '#38bdf8' }}>
              {JSON.stringify(parsedJson, null, 2)}
            </pre>
          </div>
        );
      }

      return (
        <div className="output-card">
          {renderRichStructuredContent(blk.content)}
        </div>
      );
    }
  }
}

interface RichTable {
  type: 'table';
  headers: string[];
  rows: string[][];
}

interface RichHeading {
  type: 'heading';
  level: number;
  text: string;
}

interface RichRule {
  type: 'rule';
  name: string;
  target?: string;
  decision?: string;
  conditions?: string;
}

interface RichKv {
  type: 'kv';
  pairs: Array<{ key: string; val: string }>;
}

interface RichStep {
  type: 'step';
  num: string;
  text: string;
}

interface RichBullet {
  type: 'bullet';
  text: string;
}

interface RichProse {
  type: 'prose';
  text: string;
}

type RichElement = RichHeading | RichTable | RichRule | RichKv | RichStep | RichBullet | RichProse;

function parseRichContent(rawText: string): RichElement[] {
  const elements: RichElement[] = [];
  const lines = rawText.split('\n').map((l) => l.trimEnd());
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    // Dividers: ====== or ------ or ---
    if (/^[=\-]{3,}$/.test(line)) {
      i++;
      continue;
    }

    // Markdown Table: starts with | and ends with |
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const rawHeaders = tableLines[0].split('|').map((c) => c.trim()).filter(Boolean);
        const hasDivider = tableLines.length > 1 && /^\|(?:\s*:?-+:?\s*\|)+$/.test(tableLines[1]);
        const dataRowsStart = hasDivider ? 2 : 1;
        const rows: string[][] = [];

        for (let r = dataRowsStart; r < tableLines.length; r++) {
          const rawCells = tableLines[r].split('|').map((c) => c.trim());
          const cells = rawCells.slice(1, rawCells.length - 1);
          rows.push(cells);
        }

        elements.push({
          type: 'table',
          headers: rawHeaders,
          rows,
        });
        continue;
      }
    }

    // Big Section Banner (e.g. "1. FULL TEXT OF THE POLICY REQUEST...")
    const bannerMatch = line.match(/^(\d+)\.\s+([A-Z0-9_\s\(\):\-]{4,}:?)$/);
    if (
      bannerMatch &&
      (line === line.toUpperCase() ||
        line.includes('POLICY') ||
        line.includes('ANALYSIS') ||
        line.includes('DETAILS'))
    ) {
      elements.push({ type: 'heading', level: 1, text: line.replace(/:$/, '') });
      i++;
      continue;
    }

    // Headings with # (e.g. ## 1. What the new policy adds...)
    if (line.startsWith('#')) {
      const levelMatch = line.match(/^(#+)\s*(.*)$/);
      const level = levelMatch ? levelMatch[1].length : 2;
      const text = levelMatch ? levelMatch[2].trim() : line.replace(/^#+\s*/, '');
      elements.push({ type: 'heading', level, text });
      i++;
      continue;
    }

    // Rule definition: e.g. "- Rule: rule_name"
    if (line.match(/^[-*•]?\s*Rule:\s*(.+)$/i)) {
      const ruleMatch = line.match(/^[-*•]?\s*Rule:\s*(.+)$/i);
      const ruleName = ruleMatch ? ruleMatch[1].trim() : '';
      let target = '';
      let decision = '';
      let conditions = '';
      i++;

      while (
        i < lines.length &&
        lines[i].trim().length > 0 &&
        !lines[i].trim().startsWith('- Rule') &&
        !lines[i].trim().startsWith('=') &&
        !lines[i].trim().startsWith('#')
      ) {
        const sub = lines[i].trim();
        if (sub.startsWith('Target:')) target = sub.replace(/^Target:\s*/i, '');
        else if (sub.startsWith('Decision:')) decision = sub.replace(/^Decision:\s*/i, '');
        else if (sub.startsWith('Conditions:')) conditions = sub.replace(/^Conditions:\s*/i, '');
        else break;
        i++;
      }

      elements.push({
        type: 'rule',
        name: ruleName,
        target,
        decision,
        conditions,
      });
      continue;
    }

    if (line.toLowerCase() === 'rules:') {
      i++;
      continue;
    }

    // Numbered steps: 1. ... 2. ...
    const numMatch = line.match(/^(\d+)[\.\)]\s*(.+)$/);
    if (numMatch && !line.includes('|')) {
      elements.push({ type: 'step', num: numMatch[1], text: numMatch[2] });
      i++;
      continue;
    }

    // Bullets: - ... * ... • ...
    if ((line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) && !line.includes('|')) {
      elements.push({ type: 'bullet', text: line.replace(/^[-*•]\s*/, '') });
      i++;
      continue;
    }

    // Key-Value pairs: Key: Value (group consecutive pairs into a kv block)
    const kvMatch = line.match(/^([a-zA-Z0-9_\s]{2,30}):\s*(.+)$/);
    if (kvMatch && !kvMatch[1].toLowerCase().startsWith('http') && !line.includes('|')) {
      const pairs: Array<{ key: string; val: string }> = [{ key: kvMatch[1].trim(), val: kvMatch[2].trim() }];
      i++;
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        const nextKv = nextLine.match(/^([a-zA-Z0-9_\s]{2,30}):\s*(.+)$/);
        if (nextKv && !nextKv[1].toLowerCase().startsWith('http') && !nextLine.includes('|')) {
          pairs.push({ key: nextKv[1].trim(), val: nextKv[2].trim() });
          i++;
        } else {
          break;
        }
      }
      elements.push({ type: 'kv', pairs });
      continue;
    }

    // Default: Prose paragraph
    elements.push({ type: 'prose', text: line });
    i++;
  }

  return elements;
}

function renderFormattedInline(text: string, allowTitleUuidBadge: boolean = true): React.ReactNode {
  const uuidRegex = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
  const parts = text.split(uuidRegex);

  return parts.map((part, pIdx) => {
    if (allowTitleUuidBadge && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) {
      return <UuidBadge key={pIdx} uuid={part} />;
    }

    const subParts = part.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return (
      <span key={pIdx}>
        {subParts.map((sub, sIdx) => {
          if (sub.startsWith('**') && sub.endsWith('**') && sub.length >= 4) {
            return (
              <strong key={sIdx} style={{ color: '#f8fafc', fontWeight: 600 }}>
                {sub.slice(2, -2)}
              </strong>
            );
          }
          if (sub.startsWith('*') && sub.endsWith('*') && sub.length >= 2) {
            return (
              <em key={sIdx} style={{ color: '#94a3b8' }}>
                {sub.slice(1, -1)}
              </em>
            );
          }
          if (sub.startsWith('`') && sub.endsWith('`') && sub.length >= 2) {
            return (
              <code
                key={sIdx}
                style={{
                  background: '#0f172a',
                  color: '#38bdf8',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontFamily: 'monospace',
                }}
              >
                {sub.slice(1, -1)}
              </code>
            );
          }
          return sub;
        })}
      </span>
    );
  });
}

function renderTableCellContent(rawCell: string, isTitleCol: boolean): React.ReactNode {
  const lines = rawCell.split(/<br\s*\/?>/i).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) {
    return renderFormattedInline(rawCell, !isTitleCol);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {lines.map((line, lIdx) => (
        <div key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
          {line.startsWith('•') || line.startsWith('-') ? (
            <>
              <span style={{ color: '#38bdf8', fontSize: '12px', lineHeight: '1.4' }}>•</span>
              <span>{renderFormattedInline(line.replace(/^[•\-]\s*/, ''), !isTitleCol)}</span>
            </>
          ) : (
            renderFormattedInline(line, !isTitleCol)
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Transforms any raw prose or unstructured text into high-fidelity structured components
 */
function renderRichStructuredContent(content: string): React.ReactNode {
  const elements = parseRichContent(content);
  if (elements.length === 0) return null;

  return (
    <div className="rich-structured-container">
      {elements.map((el, idx) => {
        switch (el.type) {
          case 'heading': {
            if (el.level === 1) {
              return (
                <div key={idx} className="portal-section-header">
                  <span className="portal-badge" style={{ color: '#38bdf8' }}>SECTION</span>
                  <span>{cleanMd(el.text)}</span>
                </div>
              );
            }
            if (el.level === 2) {
              return (
                <h3 key={idx} className="portal-section-header" style={{ fontSize: '14px', margin: '18px 0 10px' }}>
                  {cleanMd(el.text)}
                </h3>
              );
            }
            return (
              <h4 key={idx} className="portal-section-subhead">
                {cleanMd(el.text)}
              </h4>
            );
          }

          case 'table': {
            return (
              <div key={idx} className="portal-table-container" style={{ margin: '12px 0 16px' }}>
                <table className="portal-table">
                  <thead>
                    <tr>
                      {el.headers.map((h, hIdx) => (
                        <th key={hIdx}>{cleanMd(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {el.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} style={cIdx === 0 ? { fontWeight: 600, color: '#f8fafc' } : undefined}>
                            {renderTableCellContent(cell, cIdx === 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          case 'rule': {
            const isAllow = (el.decision || '').toUpperCase().includes('ALLOW');
            return (
              <div key={idx} className="rich-rule-card">
                <div className="rich-rule-header">
                  <span className="rich-rule-name">{el.name}</span>
                  {el.decision && (
                    <span
                      className="portal-badge"
                      style={{
                        color: isAllow ? '#4ade80' : '#f87171',
                        borderColor: isAllow ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)',
                      }}
                    >
                      {el.decision}
                    </span>
                  )}
                </div>
                {el.target && (
                  <div className="rich-rule-target">
                    <strong style={{ color: '#64748b' }}>Target:</strong> {el.target}
                  </div>
                )}
                {el.conditions && (
                  <div className="rich-rule-condition">
                    <span style={{ color: '#64748b', marginRight: '6px' }}>Condition:</span>
                    {el.conditions}
                  </div>
                )}
              </div>
            );
          }

          case 'kv': {
            return (
              <div key={idx} className="portal-kv-grid" style={{ margin: '10px 0' }}>
                {el.pairs.map((kv, kIdx) => {
                  const isCurrency = /\$[0-9,.]+|₹[0-9,.]+|€[0-9,.]+/i.test(kv.val);
                  const isStatus = /^(active|completed|in progress|pending|approved|closed|open|failed|success|online)$/i.test(
                    kv.val
                  );
                  const uuidMatch = kv.val.match(
                    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
                  );

                  return (
                    <div key={kIdx} className="portal-kv-card">
                      <span className="portal-k-label">{kv.key}</span>
                      {uuidMatch ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span>{kv.val.replace(uuidMatch[0], '').trim()}</span>
                          <UuidBadge uuid={uuidMatch[0]} />
                        </div>
                      ) : isStatus ? (
                        <span className="portal-badge">{kv.val}</span>
                      ) : (
                        <span className={`portal-v-value ${isCurrency ? 'highlight-green' : ''}`}>
                          {kv.val}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }

          case 'step': {
            return (
              <div
                key={idx}
                className="catalog-item-row"
                style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', margin: '6px 0' }}
              >
                <span
                  className="portal-badge"
                  style={{ padding: '2px 8px', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}
                >
                  #{el.num}
                </span>
                <div style={{ flex: 1, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {renderFormattedInline(el.text, true)}
                </div>
              </div>
            );
          }

          case 'bullet': {
            return (
              <div
                key={idx}
                className="catalog-item-row"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}
              >
                <span style={{ color: '#38bdf8', fontSize: '14px', flexShrink: 0 }}>•</span>
                <div style={{ flex: 1, fontSize: '13px', color: '#cbd5e1' }}>
                  {renderFormattedInline(el.text, true)}
                </div>
              </div>
            );
          }

          case 'prose': {
            return (
              <p
                key={idx}
                style={{ margin: '0 0 10px 0', fontSize: '13px', lineHeight: '1.6', color: '#cbd5e1' }}
              >
                {renderFormattedInline(el.text, true)}
              </p>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}

export default DispatcherPortal;
