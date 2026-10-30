import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
import './DispatcherPortal.css';

export const DispatcherPortal: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [customInput, setCustomInput] = useState<string | null>(null);

  const totalItems = JEEVES_100_ITEMS.length;
  const activeText = customInput !== null ? customInput : (JEEVES_100_ITEMS[currentIndex]?.message || '');

  const dispatchResult = dispatchToolNativeBlock(currentIndex + 1, activeText);
  const block: ToolNativeBlock = dispatchResult.block;

  // Arrow navigation
  const handlePrev = () => {
    setCustomInput(null);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
  };

  const handleNext = () => {
    setCustomInput(null);
    setCurrentIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
  };

  // Keyboard navigation: Left and Right arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') {
        setCustomInput(null);
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
      }
      if (e.key === 'ArrowRight') {
        setCustomInput(null);
        setCurrentIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalItems]);

  return (
    <div className="portal-root">
      {/* HEADER: ONLY ARROW CONTROLS TO 1 TO 100 */}
      <header className="portal-header">
        <button
          className="nav-arrow-btn"
          onClick={handlePrev}
          aria-label="Previous"
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
          />
          <span>/ {totalItems}</span>
        </div>

        <button
          className="nav-arrow-btn"
          onClick={handleNext}
          aria-label="Next"
        >
          <ChevronRight size={18} />
        </button>
      </header>

      {/* SPLIT BODY: INPUT AT LEFT (PASTEABLE), OUTPUT AT RIGHT */}
      <div className="portal-split-body">
        {/* LEFT: INPUT */}
        <section className="portal-panel left-panel">
          <textarea
            className="raw-input-textarea"
            value={activeText}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Paste your boss's raw input message here..."
            spellCheck={false}
          />
        </section>

        {/* RIGHT: OUTPUT */}
        <section className="portal-panel right-panel">
          <div className="panel-scroll-area">
            {renderOutputBlock(block)}
          </div>
        </section>
      </div>
    </div>
  );
};

// ============================================================================
// OUTPUT RENDERERS (STRICT RAW DATA FIDELITY - ZERO EXTRA FEATURES & TEXTS)
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
                  <span className="catalog-card-title">
                    {item.num}. {item.name}
                  </span>
                  {item.publisher && (
                    <span className="catalog-card-publisher">{item.publisher}</span>
                  )}
                </div>
                <div className="catalog-card-uuid">{item.id}</div>
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
                      if (col === 'Opportunity Name') return <td key={cIdx} style={{ fontWeight: 600 }}>{row.name}</td>;
                      if (col === 'Opportunity UUID') return <td key={cIdx} className="portal-uuid-text">{row.id}</td>;
                      if (col === 'Company') return <td key={cIdx}>{row.company || row.fields?.['Company'] || '—'}</td>;
                      if (col === 'Deal Value') return <td key={cIdx} style={{ color: '#34d399' }}>{row.dealValue || row.fields?.['Deal Value'] || '—'}</td>;
                      if (col === 'Close Date') return <td key={cIdx}>{row.closeDate || row.fields?.['Close Date'] || '—'}</td>;
                      if (col === 'Health Score') return <td key={cIdx}>{row.healthScore || row.fields?.['Health Score'] || '—'}</td>;
                      if (col === 'Labels') return <td key={cIdx}>{row.labels.join(', ') || '—'}</td>;
                      return <td key={cIdx}>{row.fields?.[col] || '—'}</td>;
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
          {blk.title && <h2 className="output-main-title">{blk.title}</h2>}
          {blk.description && <p className="output-desc">{blk.description}</p>}

          <div className="portal-kv-grid">
            {blk.opportunityId && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Opportunity UUID</span>
                <span className="portal-uuid-text">{blk.opportunityId}</span>
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
                <span className="portal-uuid-text">{blk.company.companyId}</span>
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
                <span className="portal-v-value" style={{ color: '#c084fc' }}>{blk.aiProbability.score}</span>
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
                      <td className="portal-uuid-text">{li.productId || '—'}</td>
                      <td>{li.quantity}</td>
                      <td style={{ color: '#34d399' }}>{li.price}</td>
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
                    <span className="catalog-item-name">{act.title}</span>
                    <span className="portal-badge">{act.type}</span>
                    <span className="portal-badge">{act.status}</span>
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
          {blk.title && <h2 className="output-main-title">{blk.title}</h2>}
          {blk.description && <p className="output-desc">{blk.description}</p>}

          <div className="portal-kv-grid">
            {blk.softwareId && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Software UUID</span>
                <span className="portal-uuid-text">{blk.softwareId}</span>
              </div>
            )}

            {blk.revisionId && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Revision UUID</span>
                <span className="portal-uuid-text">{blk.revisionId}</span>
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
                  <span className="portal-v-value">{v}</span>
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
          {blk.softwareTitle && <h2 className="output-main-title">{blk.softwareTitle}</h2>}
          {blk.prompt && <p className="output-desc">{blk.prompt}</p>}

          {blk.softwareId && (
            <div className="portal-uuid-text" style={{ marginBottom: '12px' }}>
              {blk.softwareId}
            </div>
          )}

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
                  <span className="portal-v-value">{v}</span>
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
                <span className="portal-uuid-text">{blk.samRequestUuid}</span>
              </div>
            )}
            {blk.resourceWorkUuid && (
              <div className="portal-kv-card">
                <span className="portal-k-label">Resource Work UUID</span>
                <span className="portal-uuid-text">{blk.resourceWorkUuid}</span>
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
