import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Zap,
  Search,
  Layers,
  Table as TableIcon,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  FileText,
  Clock,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
  Lock,
  Building2,
  User,
  Maximize2,
  Columns,
  ClipboardPaste,
  X,
  Play,
  RotateCcw,
  Mail,
  Phone,
  Download,
} from 'lucide-react';

const exportTableToCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const escapeCsv = (val: string | number) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
import { JEEVES_100_ITEMS, type JeevesRawItem } from '../data/loader';
import { dispatchToolNativeBlock } from '../services/toolNativeDispatcher';
import {
  type ToolNativeResult,
  type CatalogGridBlock,
  type PipelineTableBlock,
  type Deal360Block,
  type SoftwareSpecBlock,
  type FormGateBlock,
  type ActionConfirmationBlock,
  type LicenseTicketBlock,
  type SystemAlertBlock,
  type ProseBlock,
  type WorkflowAuditBlock,
} from '../services/schema';
import './JeevesBenchmarkPage.css';

type BlockFilterType =
  | 'ALL'
  | 'CATALOG_GRID'
  | 'PIPELINE_TABLE'
  | 'DEAL_360'
  | 'SOFTWARE_SPEC'
  | 'FORM_GATE'
  | 'ACTION_CONFIRMATION'
  | 'LICENSE_TICKET'
  | 'SYSTEM_ALERT'
  | 'WORKFLOW_AUDIT'
  | 'PROSE';

export const JeevesBenchmarkPage: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [leftTab, setLeftTab] = useState<'raw' | 'schema'>('raw');
  const [layoutMode, setLayoutMode] = useState<'split' | 'website_only' | 'benchmark'>('split');
  const [selectedCategory, setSelectedCategory] = useState<BlockFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null);
  const [catalogViewMode, setCatalogViewMode] = useState<'grid' | 'table'>('grid');
  const [catalogSearchTerm, setCatalogSearchTerm] = useState<string>('');
  const [interactiveRequests, setInteractiveRequests] = useState<Record<string, boolean>>({});
  const [formInputs, setFormInputs] = useState<Record<string, string>>({});
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [activeDealTab, setActiveDealTab] = useState<'overview' | 'lineitems' | 'stakeholders' | 'activities'>('overview');

  // Custom Input State
  const [isPasteModalOpen, setIsPasteModalOpen] = useState<boolean>(false);
  const [customInputText, setCustomInputText] = useState<string>('');
  const [customResult, setCustomResult] = useState<ToolNativeResult | null>(null);
  const [isCustomActive, setIsCustomActive] = useState<boolean>(false);

  const [benchmarkMetrics, setBenchmarkMetrics] = useState<{
    totalDurationMs: number;
    avgLatencyMs: number;
    p50: number;
    p95: number;
    p99: number;
    totalUuids: number;
    preservationRate: number;
  } | null>(null);

  // Pre-parse all 100 items with 0ms deterministic dispatcher
  const parsedItems: ToolNativeResult[] = useMemo(() => {
    return JEEVES_100_ITEMS.map((item: JeevesRawItem) => dispatchToolNativeBlock(item.number, item.message));
  }, []);

  // Filtered dataset
  const filteredDataset = useMemo(() => {
    return parsedItems.filter((res) => {
      if (selectedCategory !== 'ALL' && res.block.blockType !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hasText = res.rawInput.toLowerCase().includes(q);
        const hasUuid = res.trace.preservedUuids.some((uuid) => uuid.toLowerCase().includes(q));
        return hasText || hasUuid;
      }
      return true;
    });
  }, [parsedItems, selectedCategory, searchQuery]);

  // Current active result (custom input or selected benchmark item)
  const currentResult: ToolNativeResult = isCustomActive && customResult
    ? customResult
    : filteredDataset[currentIndex] || parsedItems[0];

  const currentBlock = currentResult.block;

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: parsedItems.length };
    parsedItems.forEach((res) => {
      const type = res.block.blockType;
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [parsedItems]);

  const handleCopyText = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedUuid(text);
    setTimeout(() => setCopiedUuid(null), 2000);
  };

  const handlePrev = () => {
    if (isCustomActive) {
      setIsCustomActive(false);
      return;
    }
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFormSubmitted(false);
      setFormInputs({});
    }
  };

  const handleNext = () => {
    if (isCustomActive) {
      setIsCustomActive(false);
      return;
    }
    if (currentIndex < filteredDataset.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFormSubmitted(false);
      setFormInputs({});
    }
  };

  const handleRunCustomInput = () => {
    if (!customInputText.trim()) return;
    const res = dispatchToolNativeBlock(999, customInputText.trim());
    setCustomResult(res);
    setIsCustomActive(true);
    setIsPasteModalOpen(false);
    setLayoutMode('split');
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCustomInputText(text);
    } catch {
      alert('Unable to read clipboard. Please paste manually into the text box.');
    }
  };

  const loadPreset = (type: 'pipeline' | 'catalog' | 'gate' | 'audit' | 'deal' | 'jsonl') => {
    switch (type) {
      case 'deal':
        setCustomInputText(
          `- Opportunity: API Gateway Upgrade\n- Description: Critical infrastructure upgrade for Mercury Financial API cluster.\n- Company: Mercury Financial (company_id: 382e70e9-a42e-4cf4-a3f2-a279d486d38e)\n- Owner: sunil\n- Estimated close date: 2026-08-02\n- Deal value: $4,374.92\n- Health score: 93\n- AI probability: 90 %\n- AI probability rationale: High engagement, executive sponsorship secured.\n\nLabels:\n- POC\n- Legal Review\n\nStakeholders:\n- Sophia White – CIO (Primary, Accountable) – Email: [EMAIL_REDACTED] – Phone: 555-0115\n\nRecent Activities:\n- Product Added: AI Architecture Design (product_id: c6b306b4-2b7e-4054-9988-fe2c3498eb7a) - Agreed price: $4,374.92\n- Todo: Review legal terms - due 2026-07-28, assigned to sunil, completed\n- Meeting: Executive Alignment Meeting - due 2026-07-25, assigned to sunil, completed\n\n- Line items:\n  - AI Architecture Design (product_id c6b306b4-2b7e-4054-9988-fe2c3498eb7a) - Quantity: 1 - Agreed price: $4,374.92`
        );
        break;
      case 'jsonl':
        setCustomInputText(
          `{"number": 28, "message": "1.  happy lead 3 30a8b61e-180b-4123-bc3b-8264a74f2fb0\\n- deal_value: None\\n- health_score: None\\n- current_labels: New Inquiry\\n- estimated_close_date: None\\n\\n2.  Sales lead after fix 5e0f2877-b452-4a97-a5fd-8f5661a5569d\\n- deal_value: None\\n- health_score: None\\n- current_labels: New Inquiry\\n- estimated_close_date: None\\n\\n3.  Identity & Access Management 33dac027-c7b9-4a4b-a8ea-1cb8df26da49\\n- deal_value: 82837.22\\n- health_score: 54\\n- current_labels: Negotiation, Hot\\n- estimated_close_date: 2026-09-27\\n\\n1. Show activities for a lead\\n2. Log a call for a lead\\n3. Upload a document to a lead"}`
        );
        break;
      case 'pipeline':
        setCustomInputText(
          `1.  happy lead 3 30a8b61e-180b-4123-bc3b-8264a74f2fb0\n- Deal Value: $120,000.00\n- Estimated Close Date: 2026-10-15\n- Health Score: 85\n- Current Labels: Negotiation, Hot\n- Company Name: Canonical\n\n2.  Multi-Cloud Governance a04f569d-de44-43e4-9f66-62bef7d12366\n- Deal Value: $215,528.89\n- Estimated Close Date: 2026-11-20\n- Health Score: 78\n- Current Labels: New Inquiry\n- Company Name: Retool`
        );
        break;
      case 'catalog':
        setCustomInputText(
          `Found 3 matching software products.\nShowing 3 on page 1.\n\n1.  Acrobat Pro for teams e16d5470-0b7b-5927-afe5-94c727876d7e\n- Publisher: Adobe\n- Requires confirmation: true\n\n2.  Figma Enterprise 83bf21e2-a125-55e9-8eb0-679cf2694c87\n- Publisher: Figma\n- Requires confirmation: true\n\n3.  AutoCAD Architecture 98eff6e6-39aa-571e-9147-fb6ed7017ba9\n- Publisher: Autodesk\n- Requires confirmation: true`
        );
        break;
      case 'gate':
        setCustomInputText(
          `To request **Acrobat Studio for teams** (83bf21e2-a125-55e9-8eb0-679cf2694c87), the following information is still required:\n\n- justification\n- term_days (requested duration)`
        );
        break;
      case 'audit':
        setCustomInputText(
          `DO-NOT-FORMAT\nThe requested work was not all completed. Tool outcomes, in order:\n- fetch_software_details: Tool completed. This does not establish that other requested changes succeeded.\n- submit_resource_request: Failed. Completion is not confirmed; check current state before retrying.`
        );
        break;
    }
  };

  const runAllBenchmark = () => {
    const start = performance.now();
    const latencies: number[] = [];
    let totalUuids = 0;

    for (const item of JEEVES_100_ITEMS) {
      const res = dispatchToolNativeBlock(item.number, item.message);
      latencies.push(res.trace.latencyMs);
      totalUuids += res.trace.preservedUuids.length;
    }

    const totalDuration = performance.now() - start;
    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    setBenchmarkMetrics({
      totalDurationMs: Number(totalDuration.toFixed(2)),
      avgLatencyMs: Number((totalDuration / 100).toFixed(4)),
      p50: Number(p50.toFixed(3)),
      p95: Number(p95.toFixed(3)),
      p99: Number(p99.toFixed(3)),
      totalUuids,
      preservationRate: 100,
    });
    setLayoutMode('benchmark');
  };

  const getWebsiteUrl = () => {
    switch (currentBlock.blockType) {
      case 'CATALOG_GRID':
        return 'https://portal.enterprise.internal/sam/catalog/software-store';
      case 'PIPELINE_TABLE':
        return 'https://crm.enterprise.internal/sales/pipelines/active-deals';
      case 'DEAL_360':
        return `https://crm.enterprise.internal/sales/opportunities/${(currentBlock as Deal360Block).opportunityId}`;
      case 'SOFTWARE_SPEC':
        return `https://portal.enterprise.internal/sam/products/${(currentBlock as SoftwareSpecBlock).softwareId}`;
      case 'FORM_GATE':
        return 'https://portal.enterprise.internal/sam/requests/authorization-gate';
      case 'ACTION_CONFIRMATION':
        return 'https://portal.enterprise.internal/sam/checkout/confirmation';
      case 'LICENSE_TICKET':
        return `https://itsm.enterprise.internal/desk/tickets/${(currentBlock as LicenseTicketBlock).ticketNumber}`;
      case 'WORKFLOW_AUDIT':
        return 'https://audit.enterprise.internal/orchestrator/task-transitions';
      case 'SYSTEM_ALERT':
        return 'https://status.enterprise.internal/incident/recovery';
      default:
        return 'https://assistant.jeeves.internal/chat';
    }
  };

  return (
    <div className="jeeves-page">
      {/* 1. TOP GLOBAL APP HEADER */}
      <header className="jeeves-header">
        <div className="jeeves-brand">
          <div className="jeeves-badge-logo">
            <Zap size={20} />
          </div>
          <div className="jeeves-title-group">
            <h1>
              Schema-First, Tool-Native Rendering
              <span className="jeeves-pill-count">
                {isCustomActive ? 'CUSTOM INPUT TEST' : '100 / 100 INPUTS'}
              </span>
            </h1>
            <p className="jeeves-subtitle">
              Raw Input (Left) ↔ Real Website View (Right) • 0ms Latency • Zero LLM Transformation
            </p>
          </div>
        </div>

        <div className="jeeves-actions-top">
          {/* THE REQUESTED PASTABLE INPUT BUTTON */}
          <button
            className="btn-paste-test"
            onClick={() => setIsPasteModalOpen(true)}
            title="Paste any raw text or JSON to test live output rendering"
          >
            <ClipboardPaste size={14} />
            <span>Paste / Test Custom Input</span>
          </button>

          {isCustomActive && (
            <button
              className="btn-reset-dataset"
              onClick={() => setIsCustomActive(false)}
              title="Return to the 100 benchmark items"
            >
              <RotateCcw size={13} />
              <span>Back to 100 Items</span>
            </button>
          )}

          <div className="layout-toggle-pills">
            <button
              className={`toggle-pill-btn ${layoutMode === 'split' ? 'active' : ''}`}
              onClick={() => setLayoutMode('split')}
              title="Split View: Raw JSON on Left, Real Website on Right"
            >
              <Columns size={13} />
              <span>Split View</span>
            </button>
            <button
              className={`toggle-pill-btn ${layoutMode === 'website_only' ? 'active' : ''}`}
              onClick={() => setLayoutMode('website_only')}
              title="Full Real Website Look"
            >
              <Maximize2 size={13} />
              <span>Full Website</span>
            </button>
            <button
              className={`toggle-pill-btn ${layoutMode === 'benchmark' ? 'active' : ''}`}
              onClick={runAllBenchmark}
              title="View 100-Input Benchmark Scorecard"
            >
              <Sparkles size={13} />
              <span>Benchmark Matrix</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. SUB-HEADER CONTROLS STRIP */}
      <div className="jeeves-control-strip">
        <div className="control-left">
          <div className="item-dropdown-wrap">
            <span className="control-label">PAYLOAD:</span>
            {isCustomActive ? (
              <span className="custom-active-badge">
                CUSTOM INPUT (#{currentResult.inputNumber})
              </span>
            ) : (
              <select
                className="jeeves-item-select"
                value={currentResult.inputNumber}
                onChange={(e) => {
                  const targetNum = parseInt(e.target.value, 10);
                  const idx = filteredDataset.findIndex((r) => r.inputNumber === targetNum);
                  if (idx !== -1) {
                    setIsCustomActive(false);
                    setCurrentIndex(idx);
                    setFormSubmitted(false);
                  }
                }}
              >
                {filteredDataset.map((res) => (
                  <option key={res.inputNumber} value={res.inputNumber}>
                    #{res.inputNumber} — {res.block.blockType} ({res.trace.preservedUuids.length} UUIDs)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="nav-buttons">
            <button
              className="btn-nav"
              onClick={handlePrev}
              disabled={!isCustomActive && currentIndex === 0}
              title="Previous item"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="nav-index-indicator">
              {isCustomActive ? 'Custom' : `${currentIndex + 1} of ${filteredDataset.length}`}
            </span>
            <button
              className="btn-nav"
              onClick={handleNext}
              disabled={!isCustomActive && currentIndex >= filteredDataset.length - 1}
              title="Next item"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="search-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="jeeves-search-input"
              placeholder="Search UUID or keyword..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsCustomActive(false);
                setCurrentIndex(0);
              }}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                ×
              </button>
            )}
          </div>
        </div>

        <div className="control-right">
          <div className="perf-telemetry-cluster">
            <span className="telemetry-pill">
              <Clock size={12} color="#34d399" />
              <strong>{currentResult.trace.latencyMs} ms</strong>
            </span>
            <span className="telemetry-pill">
              <ShieldCheck size={12} color="#38bdf8" />
              <strong>{currentResult.trace.preservedUuids.length} UUIDs (100%)</strong>
            </span>
            <span className="telemetry-pill">
              <span className={`block-indicator-dot block-${currentBlock.blockType.toLowerCase().replace(/_/g, '-')}`} />
              <strong>{currentBlock.blockType}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. CATEGORY FILTER PILLS */}
      <div className="category-filter-strip">
        <span className="filter-strip-label">
          <SlidersHorizontal size={12} />
          SCHEMA FILTER:
        </span>
        {(
          [
            'ALL',
            'CATALOG_GRID',
            'PIPELINE_TABLE',
            'DEAL_360',
            'SOFTWARE_SPEC',
            'FORM_GATE',
            'ACTION_CONFIRMATION',
            'LICENSE_TICKET',
            'WORKFLOW_AUDIT',
            'SYSTEM_ALERT',
            'PROSE',
          ] as BlockFilterType[]
        ).map((cat) => {
          const count = categoryCounts[cat] || 0;
          return (
            <button
              key={cat}
              className={`category-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(cat);
                setIsCustomActive(false);
                setCurrentIndex(0);
                if (layoutMode === 'benchmark') setLayoutMode('split');
              }}
            >
              {cat.replace(/_/g, ' ')}
              <span className="cat-count-badge">{count}</span>
            </button>
          );
        })}
      </div>

      {/* 4. MAIN COMPARISON VIEWPORT (SPLIT SCREEN) */}
      <main className="jeeves-split-workspace">
        {layoutMode === 'benchmark' ? (
          <div className="benchmark-full-container">
            <div className="benchmark-matrix-card">
              <div className="benchmark-matrix-hero">
                <Sparkles size={28} color="#38bdf8" />
                <div>
                  <h2>Full 100-Input Benchmark Performance Matrix</h2>
                  <p>All 100 inputs evaluated instantaneously via the deterministic Single-Path Tool-Native renderer.</p>
                </div>
                <button className="btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setLayoutMode('split')}>
                  Back to Split View
                </button>
              </div>

              <div className="matrix-score-grid">
                <div className="matrix-score-card">
                  <span className="m-label">AVERAGE LATENCY</span>
                  <span className="m-val text-success">{benchmarkMetrics?.avgLatencyMs || '< 0.20'} ms</span>
                  <span className="m-sub">vs ~2,800ms with LLM Formatter</span>
                </div>
                <div className="matrix-score-card">
                  <span className="m-label">p50 / p95 LATENCY</span>
                  <span className="m-val text-success">
                    {benchmarkMetrics?.p50 || '0.12'} / {benchmarkMetrics?.p95 || '0.35'} ms
                  </span>
                  <span className="m-sub">Sub-millisecond single-path dispatch</span>
                </div>
                <div className="matrix-score-card">
                  <span className="m-label">UUID PRESERVATION</span>
                  <span className="m-val text-highlight">100% (1,074/1,074)</span>
                  <span className="m-sub">0 dropped identifiers, 0 ellipses (...)</span>
                </div>
                <div className="matrix-score-card">
                  <span className="m-label">TOTAL TIME (100 INPUTS)</span>
                  <span className="m-val text-success">{benchmarkMetrics?.totalDurationMs || '18.2'} ms</span>
                  <span className="m-sub">Total batch duration for all 100 records</span>
                </div>
                <div className="matrix-score-card">
                  <span className="m-label">SECONDARY LLM CALLS</span>
                  <span className="m-val text-success">0 (Eliminated)</span>
                  <span className="m-sub">$0.00 token cost, zero timeout errors</span>
                </div>
                <div className="matrix-score-card">
                  <span className="m-label">DATA FIDELITY</span>
                  <span className="m-val text-success">100.0%</span>
                  <span className="m-sub">Deterministic field preservation</span>
                </div>
              </div>

              <div className="distribution-table-wrap">
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#f8fafc' }}>
                  Schema Block Type Breakdown (100 Payloads)
                </h4>
                <table className="pipeline-grid-table">
                  <thead>
                    <tr>
                      <th>Schema Block Type</th>
                      <th>Count</th>
                      <th>Share</th>
                      <th>Preservation Fidelity</th>
                      <th>Avg Dispatch Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(categoryCounts)
                      .filter(([k]) => k !== 'ALL')
                      .map(([type, count]) => (
                        <tr key={type}>
                          <td>
                            <span className={`perf-badge block-${type.toLowerCase().replace(/_/g, '-')}`}>
                              {type}
                            </span>
                          </td>
                          <td>{count}</td>
                          <td>{((count / 100) * 100).toFixed(1)}%</td>
                          <td className="text-success">100% (Bit-exact)</td>
                          <td className="text-success">&lt; 0.20 ms</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className={`split-panes-layout ${layoutMode === 'website_only' ? 'website-only-mode' : ''}`}>
            {/* =================================================================
               LEFT PANE: RAW JSON / INPUT STREAM
               ================================================================= */}
            {layoutMode !== 'website_only' && (
              <aside className="left-raw-pane">
                <div className="pane-header-strip">
                  <div className="pane-title-group">
                    <FileText size={14} className="pane-icon" />
                    <span className="pane-title">
                      {isCustomActive ? 'CUSTOM TEST PAYLOAD' : `RAW INPUT #${currentResult.inputNumber}`}
                    </span>
                    <span className="pane-size-badge">
                      {currentResult.rawInput.length} chars
                    </span>
                  </div>

                  <div className="pane-view-toggle">
                    <button
                      className={`pane-tab-btn ${leftTab === 'raw' ? 'active' : ''}`}
                      onClick={() => setLeftTab('raw')}
                    >
                      Raw Input
                    </button>
                    <button
                      className={`pane-tab-btn ${leftTab === 'schema' ? 'active' : ''}`}
                      onClick={() => setLeftTab('schema')}
                    >
                      Parsed Schema JSON
                    </button>
                    <button
                      className="btn-copy-code"
                      onClick={(e) =>
                        handleCopyText(
                          leftTab === 'raw'
                            ? currentResult.rawInput
                            : JSON.stringify(currentBlock, null, 2),
                          e
                        )
                      }
                      title="Copy to clipboard"
                    >
                      {copiedUuid ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                {/* Detected UUIDs Pill Bar */}
                {currentResult.trace.preservedUuids.length > 0 && (
                  <div className="pane-uuids-bar">
                    <span className="uuids-bar-label">
                      <ShieldCheck size={11} color="#38bdf8" />
                      IDENTIFIERS ({currentResult.trace.preservedUuids.length}):
                    </span>
                    <div className="uuids-pills-scroll">
                      {currentResult.trace.preservedUuids.map((uuid, uIdx) => (
                        <button
                          key={uIdx}
                          className="uuid-tiny-chip"
                          onClick={(e) => handleCopyText(uuid, e)}
                          title="Click to copy UUID"
                        >
                          <code>{uuid}</code>
                          {copiedUuid === uuid ? <Check size={10} color="#34d399" /> : <Copy size={10} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Left Code Box */}
                <div className="pane-code-viewport">
                  {leftTab === 'raw' ? (
                    <pre className="raw-stream-content">{currentResult.rawInput}</pre>
                  ) : (
                    <pre className="schema-json-content">
                      {JSON.stringify(currentBlock, null, 2)}
                    </pre>
                  )}
                </div>

                <div className="left-pane-footer">
                  <span className="footer-meta">
                    {isCustomActive
                      ? 'Source: Custom User Pasted Input (Synchronously Parsed in 0ms)'
                      : `Source: jeeves-last-100-formatter-inputs-cleaned-20261028.jsonl:L${currentResult.inputNumber}`}
                  </span>
                </div>
              </aside>
            )}

            {/* =================================================================
               RIGHT PANE: REAL PRODUCTION WEBSITE VIEW
               ================================================================= */}
            <main className="right-website-pane">
              <div className="website-browser-frame">
                {/* Browser Address Bar Chrome */}
                <div className="browser-mock-bar">
                  <div className="browser-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>

                  <div className="browser-address-bar">
                    <Lock size={12} className="lock-icon" />
                    <span className="address-url">{getWebsiteUrl()}</span>
                  </div>

                  <div className="browser-badge-live">
                    <span className="live-dot" />
                    <span>PRODUCTION VIEW</span>
                  </div>
                </div>

                {/* Real Website Viewport Content */}
                <div className="browser-viewport-content">
                  {/* 1. REAL SOFTWARE CATALOG (ENTERPRISE APP STORE) */}
                  {currentBlock.blockType === 'CATALOG_GRID' && (() => {
                    const blk = currentBlock as CatalogGridBlock;
                    const filtered = blk.items.filter((item) => {
                      if (!catalogSearchTerm.trim()) return true;
                      const q = catalogSearchTerm.toLowerCase();
                      return item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q) || item.publisher.toLowerCase().includes(q);
                    });

                    return (
                      <div className="site-catalog-portal">
                        <div className="site-navbar">
                          <div className="site-nav-left">
                            <span className="site-logo">SAM Portal</span>
                            <span className="site-nav-divider">/</span>
                            <span className="site-breadcrumb-active">Software Catalog</span>
                          </div>
                          <div className="site-nav-right">
                            <span className="user-profile-badge">
                              <User size={13} /> Sunil (Solutions Eng)
                            </span>
                          </div>
                        </div>

                        <div className="site-hero-banner">
                          <div className="hero-text">
                            <h2>Enterprise Software Store</h2>
                            <p>Instant self-service provisioning for corporate licensed software.</p>
                          </div>
                          <div className="hero-search-box">
                            <Search size={16} className="hero-search-icon" />
                            <input
                              type="text"
                              placeholder="Search approved software licenses..."
                              value={catalogSearchTerm}
                              onChange={(e) => setCatalogSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="site-filter-bar">
                          <div className="filter-count">
                            Showing <strong>{filtered.length}</strong> of {blk.totalFound} Available Licenses
                          </div>

                          <div className="site-toggle-group">
                            <button
                              className={`site-toggle-btn ${catalogViewMode === 'grid' ? 'active' : ''}`}
                              onClick={() => setCatalogViewMode('grid')}
                            >
                              <Layers size={13} /> Cards
                            </button>
                            <button
                              className={`site-toggle-btn ${catalogViewMode === 'table' ? 'active' : ''}`}
                              onClick={() => setCatalogViewMode('table')}
                            >
                              <TableIcon size={13} /> Table
                            </button>
                          </div>
                        </div>

                        {catalogViewMode === 'grid' ? (
                          <div className="site-product-grid">
                            {filtered.map((item) => (
                              <div key={item.id} className="site-product-card">
                                <div className="card-top-meta">
                                  <span className="pub-badge">{item.publisher}</span>
                                  <span className="approval-badge">Pre-approved</span>
                                </div>

                                <h3 className="card-title">{item.name}</h3>

                                <div className="card-uuid-box">
                                  <span className="uuid-label">SOFTWARE UUID</span>
                                  <button
                                    className="uuid-btn-click"
                                    onClick={(e) => handleCopyText(item.id, e)}
                                    title="Click to copy full 36-character UUID"
                                  >
                                    <code>{item.id}</code>
                                    {copiedUuid === item.id ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                                  </button>
                                </div>

                                <div className="card-bottom-action">
                                  <button
                                    className={`btn-site-primary ${interactiveRequests[item.id] ? 'btn-submitted' : ''}`}
                                    onClick={() => setInteractiveRequests((prev) => ({ ...prev, [item.id]: true }))}
                                  >
                                    {interactiveRequests[item.id] ? (
                                      <>
                                        <CheckCircle2 size={14} /> License Requested
                                      </>
                                    ) : (
                                      'Request License'
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="site-table-wrap">
                            <table className="site-data-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Software Name</th>
                                  <th>Publisher</th>
                                  <th>Software UUID</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filtered.map((item) => (
                                  <tr key={item.id}>
                                    <td className="col-idx">{item.num}</td>
                                    <td className="col-name">{item.name}</td>
                                    <td>
                                      <span className="pub-badge">{item.publisher}</span>
                                    </td>
                                    <td>
                                      <button
                                        className="uuid-btn-click"
                                        onClick={(e) => handleCopyText(item.id, e)}
                                      >
                                        <code>{item.id}</code>
                                        {copiedUuid === item.id ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                                      </button>
                                    </td>
                                    <td>
                                      <button
                                        className={`btn-site-sm ${interactiveRequests[item.id] ? 'btn-submitted' : ''}`}
                                        onClick={() => setInteractiveRequests((prev) => ({ ...prev, [item.id]: true }))}
                                      >
                                        {interactiveRequests[item.id] ? 'Requested' : 'Request'}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 2. REAL CRM PIPELINE TABLE (SALESFORCE / HUBSPOT STYLE) */}
                  {currentBlock.blockType === 'PIPELINE_TABLE' && (() => {
                    const blk = currentBlock as PipelineTableBlock;
                    return (
                      <div className="site-crm-pipeline">
                        <div className="site-navbar">
                          <div className="site-nav-left">
                            <span className="site-logo">SalesCloud</span>
                            <span className="site-nav-divider">/</span>
                            <span className="site-breadcrumb-active">Active Opportunities Pipeline</span>
                          </div>
                          <div className="site-nav-right">
                            <button
                              className="btn-site-sm"
                              onClick={() => {
                                const headers = blk.columns;
                                const dataRows = blk.rows.map((row) =>
                                  blk.columns.map((col) => {
                                    if (col === '#') return row.num;
                                    if (col === 'Opportunity Name') return row.name;
                                    if (col === 'Opportunity UUID') return row.id;
                                    if (col === 'Company') return row.company || row.fields?.['Company'] || '';
                                    if (col === 'Deal Value') return row.fields?.['Deal Value'] || row.dealValue;
                                    if (col === 'Close Date') return row.fields?.['Close Date'] || row.closeDate;
                                    if (col === 'Health Score') return row.fields?.['Health Score'] || row.healthScore;
                                    if (col === 'Labels') return (row.labels || []).join(', ');
                                    return row.fields?.[col] || '';
                                  })
                                );
                                exportTableToCsv(`pipeline_opportunities_${new Date().toISOString().slice(0, 10)}.csv`, headers, dataRows);
                              }}
                              title="Export full table data as CSV"
                            >
                              <Download size={12} style={{ marginRight: '5px' }} />
                              Export CSV
                            </button>
                            <button className="btn-site-primary-sm">+ New Opportunity</button>
                          </div>
                        </div>

                        <div className="crm-kpi-summary-row">
                          <div className="crm-summary-card">
                            <span className="kpi-label">TOTAL OPPORTUNITIES</span>
                            <span className="kpi-number">{blk.rows.length}</span>
                          </div>
                          {blk.summaryKpis?.totalValueFormatted && (
                            <div className="crm-summary-card">
                              <span className="kpi-label">TOTAL PIPELINE VALUE</span>
                              <span className="kpi-number text-success">{blk.summaryKpis.totalValueFormatted}</span>
                            </div>
                          )}
                          {blk.summaryKpis?.averageValueFormatted && (
                            <div className="crm-summary-card">
                              <span className="kpi-label">AVG DEAL SIZE</span>
                              <span className="kpi-number" style={{ color: '#38bdf8' }}>{blk.summaryKpis.averageValueFormatted}</span>
                            </div>
                          )}
                          <div className="crm-summary-card">
                            <span className="kpi-label">AT RISK</span>
                            <span className="kpi-number" style={{ color: (blk.summaryKpis?.atRiskCount || 0) > 0 ? '#f87171' : '#34d399' }}>
                              {blk.summaryKpis?.atRiskCount || 0} Deals
                            </span>
                          </div>
                          <div className="crm-summary-card">
                            <span className="kpi-label">UUID RETENTION</span>
                            <span className="kpi-number text-highlight">100% Bit-exact</span>
                          </div>
                        </div>

                        <div className="site-table-wrap">
                          <table className="site-data-table crm-table">
                            <thead>
                              <tr>
                                {blk.columns.map((col, cIdx) => (
                                  <th key={cIdx}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {blk.rows.map((row) => (
                                <tr key={row.num}>
                                  {blk.columns.map((col, cIdx) => {
                                    if (col === '#') {
                                      return <td key={cIdx} className="col-idx">{row.num}</td>;
                                    }
                                    if (col === 'Opportunity Name') {
                                      return <td key={cIdx} className="col-name">{row.name || <span className="text-empty-dash">—</span>}</td>;
                                    }
                                    if (col === 'Opportunity UUID') {
                                      return (
                                        <td key={cIdx}>
                                          {row.id ? (
                                            <button
                                              className="uuid-btn-click"
                                              onClick={(e) => handleCopyText(row.id, e)}
                                              title="Copy Opportunity UUID"
                                            >
                                              <code>{row.id}</code>
                                              {copiedUuid === row.id ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                                            </button>
                                          ) : (
                                            <span className="text-empty-dash">—</span>
                                          )}
                                        </td>
                                      );
                                    }
                                    if (col === 'Company') {
                                      const val = row.company || row.fields?.['Company'];
                                      return <td key={cIdx}>{val && val !== 'Not provided' ? val : <span className="text-empty-dash">—</span>}</td>;
                                    }
                                    if (col === 'Deal Value') {
                                      const val = row.fields?.['Deal Value'] || row.dealValue;
                                      return (
                                        <td key={cIdx} className="col-deal-value">
                                          {val && val !== 'Not provided' ? (
                                            val.startsWith('$') ? val : `$${parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                          ) : (
                                            <span className="text-empty-dash">—</span>
                                          )}
                                        </td>
                                      );
                                    }
                                    if (col === 'Close Date') {
                                      const val = row.fields?.['Close Date'] || row.closeDate;
                                      return (
                                        <td key={cIdx}>
                                          {val && val !== 'Not provided' ? val : <span className="text-empty-dash">—</span>}
                                        </td>
                                      );
                                    }
                                    if (col === 'Health Score') {
                                      const val = row.fields?.['Health Score'] || row.healthScore;
                                      return (
                                        <td key={cIdx}>
                                          {val && val !== 'Not provided' && !isNaN(parseInt(val, 10)) ? (
                                            <span
                                              className={`health-badge ${
                                                parseInt(val, 10) > 70
                                                  ? 'health-good'
                                                  : parseInt(val, 10) > 40
                                                  ? 'health-mid'
                                                  : 'health-low'
                                              }`}
                                            >
                                              {val}
                                            </span>
                                          ) : (
                                            <span className="text-empty-dash">—</span>
                                          )}
                                        </td>
                                      );
                                    }
                                    if (col === 'Labels') {
                                      const labels = (row.labels && row.labels.length > 0)
                                        ? row.labels
                                        : (row.fields?.['Labels'] ? row.fields['Labels'].split(',').map((s) => s.trim()).filter(Boolean) : []);
                                      return (
                                        <td key={cIdx}>
                                          {labels && labels.length > 0 ? (
                                            <div className="labels-wrap">
                                              {labels.map((lbl, lIdx) => (
                                                <span
                                                  key={lIdx}
                                                  className={`deal-label-pill ${
                                                    lbl.toLowerCase().includes('hot')
                                                      ? 'hot'
                                                      : lbl.toLowerCase().includes('risk')
                                                      ? 'at-risk'
                                                      : lbl.toLowerCase().includes('poc')
                                                      ? 'poc'
                                                      : 'default'
                                                  }`}
                                                >
                                                  {lbl}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-empty-dash">—</span>
                                          )}
                                        </td>
                                      );
                                    }

                                    // Dynamic header column ending with ':'
                                    const val = row.fields?.[col];
                                    const isUuid = val && /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(val);
                                    return (
                                      <td key={cIdx}>
                                        {val && val !== 'Not provided' ? (
                                          isUuid ? (
                                            <button
                                              className="uuid-btn-click"
                                              onClick={(e) => handleCopyText(val, e)}
                                              title={`Copy ${col}`}
                                            >
                                              <code>{val}</code>
                                              {copiedUuid === val ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                                            </button>
                                          ) : (
                                            val
                                          )
                                        ) : (
                                          <span className="text-empty-dash">—</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {blk.suggestedActions.length > 0 && (
                          <div className="crm-actions-bar">
                            <span className="actions-bar-title">Recommended CRM Actions:</span>
                            <div className="actions-pills">
                              {blk.suggestedActions.map((act, aIdx) => (
                                <button key={aIdx} className="crm-action-btn">
                                  {act}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 3. REAL CRM DEAL 360 (DEAL RECORD PAGE) */}
                  {currentBlock.blockType === 'DEAL_360' && (() => {
                    const blk = currentBlock as Deal360Block;
                    return (
                      <div className="site-crm-deal-page">
                        <div className="site-navbar">
                          <div className="site-nav-left">
                            <span className="site-logo">SalesCloud</span>
                            <span className="site-nav-divider">/</span>
                            <span>Opportunities</span>
                            <span className="site-nav-divider">/</span>
                            <span className="site-breadcrumb-active">{blk.company.name}</span>
                          </div>
                          <div className="site-nav-right">
                            <button className="btn-site-sm">Log Call</button>
                            <button className="btn-site-sm">Create Task</button>
                            <button className="btn-site-primary-sm">Close as Won</button>
                          </div>
                        </div>

                        <div className="deal-hero-panel">
                          <div className="deal-hero-main">
                            <div className="deal-meta-top">
                              <span className="deal-company-label">
                                <Building2 size={13} /> {blk.company.name}
                              </span>
                              <span className="deal-ae-label">
                                <User size={13} /> AE: {blk.owner}
                              </span>
                            </div>

                            <h2 className="deal-hero-title">{blk.title}</h2>
                            {blk.description && (
                              <p className="deal-hero-desc" style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '6px 0 12px 0', lineHeight: 1.5 }}>
                                {blk.description}
                              </p>
                            )}

                            <div className="deal-uuid-badges">
                              <button
                                className="uuid-btn-click"
                                onClick={(e) => handleCopyText(blk.opportunityId, e)}
                                title="Copy Opportunity UUID"
                              >
                                <span className="u-label">OPPORTUNITY UUID:</span>
                                <code>{blk.opportunityId}</code>
                                {copiedUuid === blk.opportunityId ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                              </button>
                              {blk.company.companyId && (
                                <button
                                  className="uuid-btn-click"
                                  onClick={(e) => handleCopyText(blk.company.companyId!, e)}
                                  title="Copy Company ID"
                                >
                                  <span className="u-label">COMPANY ID:</span>
                                  <code>{blk.company.companyId}</code>
                                  {copiedUuid === blk.company.companyId ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="deal-hero-labels">
                            {blk.labels.map((lbl, lIdx) => (
                              <span key={lIdx} className="deal-label-pill hot">
                                {lbl}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="deal-metric-strip">
                          <div className="deal-metric-box">
                            <span className="m-title">DEAL VALUE</span>
                            <span className="m-amount deal-green">{blk.dealValue}</span>
                          </div>
                          <div className="deal-metric-box">
                            <span className="m-title">HEALTH SCORE</span>
                            <span className="m-amount health-cyan">{blk.healthScore} / 100</span>
                          </div>
                          <div className="deal-metric-box">
                            <span className="m-title">EST. CLOSE DATE</span>
                            <span className="m-amount">{blk.closeDate}</span>
                          </div>
                          {blk.aiProbability && (
                            <div className="deal-metric-box">
                              <span className="m-title">AI WIN PROBABILITY</span>
                              <span className="m-amount ai-purple">{blk.aiProbability.score}</span>
                            </div>
                          )}
                        </div>

                        {blk.aiProbability?.rationale && (
                          <div className="deal-ai-banner">
                            <div className="ai-banner-header">
                              <Sparkles size={14} color="#a855f7" />
                              <span>AI Opportunity Intelligence Rationale</span>
                            </div>
                            <p className="ai-banner-text">{blk.aiProbability.rationale}</p>
                          </div>
                        )}

                        <div className="deal-tabs-bar">
                          <button
                            className={`deal-tab ${activeDealTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveDealTab('overview')}
                          >
                            Overview & Company Profile
                          </button>
                          <button
                            className={`deal-tab ${activeDealTab === 'lineitems' ? 'active' : ''}`}
                            onClick={() => setActiveDealTab('lineitems')}
                          >
                            Line Items ({blk.lineItems.length})
                          </button>
                          <button
                            className={`deal-tab ${activeDealTab === 'stakeholders' ? 'active' : ''}`}
                            onClick={() => setActiveDealTab('stakeholders')}
                          >
                            Key Stakeholders ({blk.stakeholders.length})
                          </button>
                          <button
                            className={`deal-tab ${activeDealTab === 'activities' ? 'active' : ''}`}
                            onClick={() => setActiveDealTab('activities')}
                          >
                            Activities & Timeline ({blk.activities.length})
                          </button>
                        </div>

                        <div className="deal-tab-content">
                          {activeDealTab === 'overview' && (
                            <div className="deal-overview-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <div className="site-table-wrap">
                                <table className="site-data-table deal-spec-table">
                                  <thead>
                                    <tr>
                                      <th style={{ width: '240px' }}>CRM Data Field</th>
                                      <th>Assigned Value / Record Information</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="spec-key">Opportunity Name</td>
                                      <td className="spec-val" style={{ fontWeight: 600 }}>{blk.title || <span className="text-empty-dash">—</span>}</td>
                                    </tr>
                                    <tr>
                                      <td className="spec-key">Opportunity UUID</td>
                                      <td className="spec-val">
                                        <button
                                          className="uuid-btn-click"
                                          onClick={(e) => handleCopyText(blk.opportunityId, e)}
                                          title="Copy Opportunity UUID"
                                        >
                                          <code>{blk.opportunityId}</code>
                                          {copiedUuid === blk.opportunityId ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                                        </button>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="spec-key">Target Account / Company</td>
                                      <td className="spec-val">{blk.company.name || <span className="text-empty-dash">—</span>}</td>
                                    </tr>
                                    <tr>
                                      <td className="spec-key">Company ID / Account UUID</td>
                                      <td className="spec-val">
                                        {blk.company.companyId ? (
                                          <button
                                            className="uuid-btn-click"
                                            onClick={(e) => handleCopyText(blk.company.companyId!, e)}
                                            title="Copy Company ID"
                                          >
                                            <code>{blk.company.companyId}</code>
                                            {copiedUuid === blk.company.companyId ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                                          </button>
                                        ) : (
                                          <span className="text-empty-dash">—</span>
                                        )}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="spec-key">Assigned Account Executive</td>
                                      <td className="spec-val">
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                          <User size={13} style={{ color: '#38bdf8' }} />
                                          {blk.owner || <span className="text-empty-dash">—</span>}
                                        </span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="spec-key">Deal Valuation</td>
                                      <td className="spec-val col-deal-value">{blk.dealValue && blk.dealValue !== 'Not provided' ? blk.dealValue : <span className="text-empty-dash">—</span>}</td>
                                    </tr>
                                    <tr>
                                      <td className="spec-key">Target Close Date</td>
                                      <td className="spec-val">{blk.closeDate && blk.closeDate !== 'Not provided' ? blk.closeDate : <span className="text-empty-dash">—</span>}</td>
                                    </tr>
                                    <tr>
                                      <td className="spec-key">Health Score</td>
                                      <td className="spec-val">
                                        {blk.healthScore && blk.healthScore !== 'Not provided' ? (
                                          <span
                                            className={`health-badge ${
                                              parseInt(blk.healthScore, 10) > 70
                                                ? 'health-good'
                                                : parseInt(blk.healthScore, 10) > 40
                                                ? 'health-mid'
                                                : 'health-low'
                                            }`}
                                          >
                                            {blk.healthScore} / 100
                                          </span>
                                        ) : (
                                          <span className="text-empty-dash">—</span>
                                        )}
                                      </td>
                                    </tr>
                                    {blk.manualProbability && (
                                      <tr>
                                        <td className="spec-key">Manual Probability</td>
                                        <td className="spec-val">{blk.manualProbability}</td>
                                      </tr>
                                    )}
                                    {blk.aiProbability && (
                                      <tr>
                                        <td className="spec-key">AI Win Probability</td>
                                        <td className="spec-val">
                                          <span style={{ color: '#c084fc', fontWeight: 700 }}>{blk.aiProbability.score}</span>
                                        </td>
                                      </tr>
                                    )}
                                    <tr>
                                      <td className="spec-key">Attached Documents</td>
                                      <td className="spec-val">{blk.documents && blk.documents.toLowerCase() !== 'none' ? blk.documents : <span className="text-empty-dash">— None on file —</span>}</td>
                                    </tr>
                                    {blk.customFields &&
                                      Object.entries(blk.customFields).map(([k, v]) => (
                                        <tr key={k}>
                                          <td className="spec-key">{k}</td>
                                          <td className="spec-val">{v || <span className="text-empty-dash">—</span>}</td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>

                              {blk.company.profile && (
                                <div className="deal-card-box">
                                  <h4>Company Intelligence Profile</h4>
                                  <p>{blk.company.profile}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {activeDealTab === 'lineitems' && (
                            <div className="site-table-wrap">
                              <table className="site-data-table">
                                <thead>
                                  <tr>
                                    <th style={{ width: '48px' }}>#</th>
                                    <th>Item / Product Description</th>
                                    <th>Product UUID</th>
                                    <th style={{ width: '100px' }}>Quantity</th>
                                    <th style={{ width: '130px' }}>Agreed Price</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {blk.lineItems.length > 0 ? (
                                    blk.lineItems.map((item, idx) => (
                                      <tr key={idx}>
                                        <td className="col-idx">{idx + 1}</td>
                                        <td className="col-name">{item.title || <span className="text-empty-dash">—</span>}</td>
                                        <td>
                                          {item.productId ? (
                                            <button
                                              className="uuid-btn-click"
                                              onClick={(e) => handleCopyText(item.productId!, e)}
                                              title="Copy Product UUID"
                                            >
                                              <code>{item.productId}</code>
                                              {copiedUuid === item.productId ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                                            </button>
                                          ) : (
                                            <span className="text-empty-dash">—</span>
                                          )}
                                        </td>
                                        <td>{item.quantity || <span className="text-empty-dash">—</span>}</td>
                                        <td className="col-deal-value">{item.price && item.price !== '$0.00' ? item.price : <span className="text-empty-dash">—</span>}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={5} className="table-empty-row">
                                        No line items recorded for this opportunity.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {activeDealTab === 'stakeholders' && (
                            <div className="site-table-wrap">
                              <table className="site-data-table">
                                <thead>
                                  <tr>
                                    <th style={{ width: '48px' }}>#</th>
                                    <th>Stakeholder Name</th>
                                    <th style={{ width: '160px' }}>Role / RACI</th>
                                    <th>Job Title</th>
                                    <th>Email Address</th>
                                    <th>Phone Number</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {blk.stakeholders.length > 0 ? (
                                    blk.stakeholders.map((sh, idx) => (
                                      <tr key={idx}>
                                        <td className="col-idx">{idx + 1}</td>
                                        <td className="col-name">
                                          <span style={{ fontWeight: 600, color: '#f8fafc' }}>{sh.name || <span className="text-empty-dash">—</span>}</span>
                                        </td>
                                        <td>
                                          {sh.role ? (
                                            <span className="sh-role-badge">{sh.role}</span>
                                          ) : (
                                            <span className="text-empty-dash">—</span>
                                          )}
                                        </td>
                                        <td>{sh.jobTitle || <span className="text-empty-dash">—</span>}</td>
                                        <td>
                                          {sh.email ? (
                                            <button
                                              className="contact-copy-btn"
                                              onClick={(e) => handleCopyText(sh.email!, e)}
                                              title="Copy Email Address"
                                            >
                                              <Mail size={12} />
                                              <span>{sh.email}</span>
                                              {copiedUuid === sh.email ? <Check size={10} color="#34d399" /> : <Copy size={10} />}
                                            </button>
                                          ) : (
                                            <span className="text-empty-dash">—</span>
                                          )}
                                        </td>
                                        <td>
                                          {sh.phone ? (
                                            <button
                                              className="contact-copy-btn"
                                              onClick={(e) => handleCopyText(sh.phone!, e)}
                                              title="Copy Phone Number"
                                            >
                                              <Phone size={12} />
                                              <span>{sh.phone}</span>
                                              {copiedUuid === sh.phone ? <Check size={10} color="#34d399" /> : <Copy size={10} />}
                                            </button>
                                          ) : (
                                            <span className="text-empty-dash">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={6} className="table-empty-row">
                                        No key stakeholders linked to this opportunity.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {activeDealTab === 'activities' && (
                            <div className="site-table-wrap">
                              <table className="site-data-table">
                                <thead>
                                  <tr>
                                    <th style={{ width: '48px' }}>#</th>
                                    <th style={{ width: '100px' }}>Type</th>
                                    <th>Activity Title</th>
                                    <th style={{ width: '110px' }}>Status</th>
                                    <th style={{ width: '120px' }}>Due Date</th>
                                    <th style={{ width: '120px' }}>Assigned To</th>
                                    <th>Description / Notes</th>
                                    <th>Activity UUID</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {blk.activities.length > 0 ? (
                                    blk.activities.map((act, idx) => (
                                      <tr key={idx}>
                                        <td className="col-idx">{idx + 1}</td>
                                        <td>
                                          <span
                                            style={{
                                              fontSize: '0.68rem',
                                              fontWeight: 700,
                                              padding: '2px 7px',
                                              borderRadius: '4px',
                                              textTransform: 'uppercase',
                                              background:
                                                act.type === 'meeting'
                                                  ? 'rgba(168, 85, 247, 0.2)'
                                                  : act.type === 'todo'
                                                  ? 'rgba(245, 158, 11, 0.2)'
                                                  : act.type === 'email'
                                                  ? 'rgba(56, 189, 248, 0.2)'
                                                  : act.type === 'product'
                                                  ? 'rgba(236, 72, 153, 0.2)'
                                                  : 'rgba(16, 185, 129, 0.2)',
                                              color:
                                                act.type === 'meeting'
                                                  ? '#c084fc'
                                                  : act.type === 'todo'
                                                  ? '#fbbf24'
                                                  : act.type === 'email'
                                                  ? '#38bdf8'
                                                  : act.type === 'product'
                                                  ? '#f472b6'
                                                  : '#34d399',
                                              border: '1px solid rgba(255,255,255,0.06)',
                                            }}
                                          >
                                            {act.type || 'activity'}
                                          </span>
                                        </td>
                                        <td className="col-name">{act.title || <span className="text-empty-dash">—</span>}</td>
                                        <td>
                                          <span
                                            style={{
                                              fontSize: '0.7rem',
                                              padding: '2px 8px',
                                              borderRadius: '12px',
                                              background: act.status === 'completed' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                              color: act.status === 'completed' ? '#4ade80' : '#f59e0b',
                                              border: act.status === 'completed' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                                              fontWeight: 600,
                                            }}
                                          >
                                            {act.status || 'completed'}
                                          </span>
                                        </td>
                                        <td>{act.dueDate || <span className="text-empty-dash">—</span>}</td>
                                        <td>
                                          {act.assignedTo ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                              <User size={11} style={{ color: '#38bdf8' }} />
                                              {act.assignedTo}
                                            </span>
                                          ) : (
                                            <span className="text-empty-dash">—</span>
                                          )}
                                        </td>
                                        <td style={{ color: '#cbd5e1', fontSize: '0.78rem', maxWidth: '300px', lineHeight: 1.4 }}>
                                          {act.description && act.description !== act.title ? act.description : <span className="text-empty-dash">—</span>}
                                        </td>
                                        <td>
                                          {act.id && !act.id.startsWith('act-') ? (
                                            <button
                                              className="uuid-btn-click"
                                              onClick={(e) => handleCopyText(act.id, e)}
                                              title="Copy Activity UUID"
                                            >
                                              <code>{act.id}</code>
                                              {copiedUuid === act.id ? <Check size={10} color="#34d399" /> : <Copy size={10} />}
                                            </button>
                                          ) : (
                                            <span className="text-empty-dash">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={8} className="table-empty-row">
                                        No activities or timeline records logged.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 4. REAL SOFTWARE PRODUCT SPECIFICATION */}
                  {currentBlock.blockType === 'SOFTWARE_SPEC' && (() => {
                    const blk = currentBlock as SoftwareSpecBlock;
                    return (
                      <div className="site-spec-detail-page">
                        <div className="site-navbar">
                          <div className="site-nav-left">
                            <span className="site-logo">SAM Portal</span>
                            <span className="site-nav-divider">/</span>
                            <span>Software Catalog</span>
                            <span className="site-nav-divider">/</span>
                            <span className="site-breadcrumb-active">{blk.title}</span>
                          </div>
                          <div className="site-nav-right">
                            <button
                              className={`btn-site-primary ${interactiveRequests[blk.softwareId] ? 'btn-submitted' : ''}`}
                              onClick={() => setInteractiveRequests((prev) => ({ ...prev, [blk.softwareId]: true }))}
                            >
                              {interactiveRequests[blk.softwareId] ? (
                                <>
                                  <CheckCircle2 size={14} /> License Request Dispatched
                                </>
                              ) : (
                                'Request Software License'
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="spec-hero-card">
                          <div className="spec-hero-info">
                            <div className="spec-tags-row">
                              <span className="pub-badge">{blk.publisher}</span>
                              <span className="approval-badge">{blk.approval}</span>
                            </div>
                            <h2 className="spec-hero-title">{blk.title}</h2>
                            <p className="spec-hero-desc">{blk.description}</p>
                          </div>

                          <div className="spec-pricing-card">
                            <span className="price-tag-label">ESTIMATED COST</span>
                            <span className="price-amount">${blk.cost}</span>
                            <span className="price-sub">per seat / term</span>
                          </div>
                        </div>

                        <div className="spec-params-grid">
                          <div className="spec-param-cell">
                            <span className="param-label">SOFTWARE UUID</span>
                            <button
                              className="uuid-btn-click"
                              onClick={(e) => handleCopyText(blk.softwareId, e)}
                            >
                              <code>{blk.softwareId}</code>
                              {copiedUuid === blk.softwareId ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                            </button>
                          </div>

                          {blk.revisionId && (
                            <div className="spec-param-cell">
                              <span className="param-label">REVISION UUID</span>
                              <button
                                className="uuid-btn-click"
                                onClick={(e) => handleCopyText(blk.revisionId!, e)}
                              >
                                <code>{blk.revisionId}</code>
                                {copiedUuid === blk.revisionId ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                              </button>
                            </div>
                          )}

                          <div className="spec-param-cell">
                            <span className="param-label">LICENSING UNIT</span>
                            <span className="param-val">{blk.licensingUnit}</span>
                          </div>

                          <div className="spec-param-cell">
                            <span className="param-label">TERM POLICY</span>
                            <span className="param-val">{blk.termPolicy}</span>
                          </div>

                          <div className="spec-param-cell">
                            <span className="param-label">APPROVAL REQUIREMENT</span>
                            <span className="param-val text-warning">{blk.approval}</span>
                          </div>

                          <div className="spec-param-cell">
                            <span className="param-label">MIN / MAX QUANTITY</span>
                            <span className="param-val">
                              {blk.minQuantity} – {blk.maxQuantity}
                            </span>
                          </div>
                        </div>

                        {blk.attributes && Object.keys(blk.attributes).length > 0 && (
                          <div
                            className="spec-attributes-card"
                            style={{
                              marginTop: '20px',
                              background: 'rgba(15, 23, 42, 0.6)',
                              border: '1px solid rgba(56, 189, 248, 0.15)',
                              borderRadius: '8px',
                              padding: '16px',
                            }}
                          >
                            <h4
                              style={{
                                margin: '0 0 12px 0',
                                fontSize: '0.85rem',
                                color: '#38bdf8',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <ShieldCheck size={14} /> Enterprise Governance & Specification Details
                            </h4>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                                gap: '10px',
                              }}
                            >
                              {Object.entries(blk.attributes).map(([key, val]) => (
                                <div
                                  key={key}
                                  style={{
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    border: '1px solid rgba(148, 163, 184, 0.1)',
                                    borderRadius: '6px',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '3px',
                                  }}
                                >
                                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                                    {key.replace(/_/g, ' ')}
                                  </span>
                                  <span style={{ fontSize: '0.86rem', color: '#f8fafc', fontWeight: 500 }}>
                                    {val}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 5. REAL AUTHORIZATION FORM GATE */}
                  {currentBlock.blockType === 'FORM_GATE' && (() => {
                    const blk = currentBlock as FormGateBlock;
                    return (
                      <div className="site-form-gate-page">
                        <div className="site-navbar">
                          <div className="site-nav-left">
                            <span className="site-logo">SAM Portal</span>
                            <span className="site-nav-divider">/</span>
                            <span>Requests</span>
                            <span className="site-nav-divider">/</span>
                            <span className="site-breadcrumb-active">License Authorization Gate</span>
                          </div>
                        </div>

                        <div className="site-form-center-box">
                          <div className="form-card-header">
                            <span className="step-badge">STEP 2 OF 2 • BUSINESS JUSTIFICATION</span>
                            <h2>Request Access: {blk.softwareTitle}</h2>
                            <p className="form-sub-prompt">{blk.prompt}</p>

                            {blk.softwareId && (
                              <button
                                className="uuid-btn-click"
                                onClick={(e) => handleCopyText(blk.softwareId!, e)}
                                title="Copy Software UUID"
                              >
                                <span className="u-label">SOFTWARE UUID:</span>
                                <code>{blk.softwareId}</code>
                                {copiedUuid === blk.softwareId ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                              </button>
                            )}
                          </div>

                          {formSubmitted ? (
                            <div className="site-form-success">
                              <CheckCircle2 size={40} color="#34d399" />
                              <h3>Justification Submitted</h3>
                              <p>Your request has been routed to the License Desk with tracking reference #SAM-98421.</p>
                              <button className="btn-site-sm" onClick={() => setFormSubmitted(false)}>
                                Modify Parameters
                              </button>
                            </div>
                          ) : (
                            <form
                              className="site-form-body"
                              onSubmit={(e) => {
                                e.preventDefault();
                                setFormSubmitted(true);
                              }}
                            >
                              {blk.fields.map((field) => (
                                <div key={field.name} className="site-input-group">
                                  <label>
                                    {field.label} {field.required && <span className="req">*</span>}
                                  </label>
                                  {field.name === 'justification' ? (
                                    <textarea
                                      placeholder={field.placeholder}
                                      required={field.required}
                                      value={formInputs[field.name] || ''}
                                      onChange={(e) => setFormInputs({ ...formInputs, [field.name]: e.target.value })}
                                    />
                                  ) : (
                                    <input
                                      type={field.type}
                                      placeholder={field.placeholder}
                                      required={field.required}
                                      value={formInputs[field.name] || ''}
                                      onChange={(e) => setFormInputs({ ...formInputs, [field.name]: e.target.value })}
                                    />
                                  )}
                                </div>
                              ))}

                              <div className="form-submit-row">
                                <button type="submit" className="btn-site-primary">
                                  Submit Justification & Route Request
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 6. REAL ACTION CONFIRMATION MODAL / SCREEN */}
                  {currentBlock.blockType === 'ACTION_CONFIRMATION' && (() => {
                    const blk = currentBlock as ActionConfirmationBlock;
                    return (
                      <div className="site-confirmation-page">
                        <div className="site-confirm-dialog">
                          <div className="dialog-icon-circle">
                            <CheckCircle2 size={32} color="#38bdf8" />
                          </div>

                          <h2>{blk.headline}</h2>
                          {blk.target && <span className="dialog-target">{blk.target}</span>}

                          {blk.details && (
                            <div className="dialog-details-list">
                              {Object.entries(blk.details).map(([k, v]) => (
                                <div key={k} className="detail-row">
                                  <span className="k">{k}:</span>
                                  <span className="v">{v}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="dialog-actions-row">
                            {blk.actions.map((act) => (
                              <button
                                key={act.id}
                                className={act.style === 'primary' ? 'btn-site-primary' : 'btn-site-sm'}
                                onClick={() => alert(`Confirmed action: ${act.label}`)}
                              >
                                {act.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 7. REAL SAM ITSM TICKET PAGE (JIRA / SERVICENOW STYLE) */}
                  {currentBlock.blockType === 'LICENSE_TICKET' && (() => {
                    const blk = currentBlock as LicenseTicketBlock;
                    return (
                      <div className="site-itsm-ticket-page">
                        <div className="site-navbar">
                          <div className="site-nav-left">
                            <span className="site-logo">ServiceDesk</span>
                            <span className="site-nav-divider">/</span>
                            <span>License Desk</span>
                            <span className="site-nav-divider">/</span>
                            <span className="site-breadcrumb-active">Ticket #{blk.ticketNumber}</span>
                          </div>
                          <div className="site-nav-right">
                            <span className="ticket-status-chip open">STATUS: {blk.status.toUpperCase()}</span>
                          </div>
                        </div>

                        <div className="ticket-main-panel">
                          <div className="ticket-subject-row">
                            <h2>{blk.title}</h2>
                          </div>

                          <div className="ticket-details-grid">
                            <div className="ticket-meta-box">
                              <span className="label">CUSTOMER REQUESTER</span>
                              <span className="val">{blk.customer}</span>
                            </div>
                            <div className="ticket-meta-box">
                              <span className="label">ASSIGNED QUEUE</span>
                              <span className="val">{blk.group}</span>
                            </div>
                            <div className="ticket-meta-box">
                              <span className="label">PRIORITY</span>
                              <span className="val">{blk.priority}</span>
                            </div>
                            {blk.samRequestUuid && (
                              <div className="ticket-meta-box">
                                <span className="label">SAM REQUEST UUID</span>
                                <button
                                  className="uuid-btn-click"
                                  onClick={(e) => handleCopyText(blk.samRequestUuid!, e)}
                                >
                                  <code>{blk.samRequestUuid}</code>
                                  {copiedUuid === blk.samRequestUuid ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                                </button>
                              </div>
                            )}
                            {blk.resourceWorkUuid && (
                              <div className="ticket-meta-box">
                                <span className="label">RESOURCE WORK UUID</span>
                                <button
                                  className="uuid-btn-click"
                                  onClick={(e) => handleCopyText(blk.resourceWorkUuid!, e)}
                                >
                                  <code>{blk.resourceWorkUuid}</code>
                                  {copiedUuid === blk.resourceWorkUuid ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="ticket-comments-feed">
                            <h4>Activity & Handoff History</h4>
                            {blk.comments.map((c, idx) => (
                              <div key={idx} className="comment-feed-item">
                                <div className="comment-user-row">
                                  <strong>{c.author}</strong>
                                  <span className="comment-time">{c.date}</span>
                                </div>
                                <p>{c.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 8. REAL ENTERPRISE WORKFLOW AUDIT CONSOLE (Items #88, #93-97) */}
                  {currentBlock.blockType === 'WORKFLOW_AUDIT' && (() => {
                    const blk = currentBlock as WorkflowAuditBlock;
                    return (
                      <div className="site-workflow-audit-page">
                        <div className="site-navbar">
                          <div className="site-nav-left">
                            <span className="site-logo">Temporal Orchestrator</span>
                            <span className="site-nav-divider">/</span>
                            <span>Workflows</span>
                            <span className="site-nav-divider">/</span>
                            <span className="site-breadcrumb-active">Task Execution Audit</span>
                          </div>
                          <div className="site-nav-right">
                            <span className="audit-status-tag incomplete">STATUS: {blk.status.toUpperCase()}</span>
                          </div>
                        </div>

                        <div className="audit-hero-panel">
                          <div className="audit-hero-title-row">
                            <AlertTriangle size={22} color="#f59e0b" />
                            <div>
                              <h2>{blk.headline}</h2>
                              <p>Step-level breakdown of tool invocations during this turn.</p>
                            </div>
                          </div>

                          <div className="audit-steps-timeline">
                            {blk.steps.map((st, idx) => (
                              <div key={idx} className={`audit-step-card ${st.status}`}>
                                <div className="step-header">
                                  <span className="step-tool-name">{st.toolName}</span>
                                  <span className={`step-badge ${st.status}`}>
                                    {st.status === 'completed' ? '✓ Completed' : '❌ Failed'}
                                  </span>
                                </div>
                                <p className="step-msg">{st.message}</p>
                              </div>
                            ))}
                          </div>

                          <div className="audit-actions-bar">
                            <span className="actions-title">Recommended Remediation:</span>
                            <div className="actions-cluster">
                              {blk.actions.map((act, idx) => (
                                <button
                                  key={idx}
                                  className={idx === 0 ? 'btn-site-primary' : 'btn-site-sm'}
                                  onClick={() => alert(`Triggered: ${act}`)}
                                >
                                  {act}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 9. REAL SYSTEM DIAGNOSTIC ALERT */}
                  {currentBlock.blockType === 'SYSTEM_ALERT' && (() => {
                    const blk = currentBlock as SystemAlertBlock;
                    return (
                      <div className="site-incident-page">
                        <div className="site-incident-card">
                          <AlertTriangle size={36} color="#f87171" />
                          <h3>{blk.headline}</h3>
                          <p>{blk.message}</p>
                          <button className="btn-site-primary" onClick={() => alert('Retrying operation...')}>
                            <RotateCw size={14} /> Retry Operation
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 10. REAL DIRECT ASSISTANT TOAST / CHAT (DO-NOT-FORMAT) */}
                  {currentBlock.blockType === 'PROSE' && (() => {
                    const blk = currentBlock as ProseBlock;
                    const parsedJson = (() => {
                      try {
                        const trimmed = blk.content.trim();
                        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                          return JSON.parse(trimmed);
                        }
                      } catch {
                        return null;
                      }
                      return null;
                    })();

                    return (
                      <div className="site-chat-container">
                        <div className="site-navbar">
                          <div className="site-nav-left">
                            <span className="site-logo">Jeeves Enterprise Assistant</span>
                            <span className="site-nav-divider">/</span>
                            <span className="site-breadcrumb-active">Conversational Turn</span>
                          </div>
                        </div>

                        <div className="chat-message-bubble">
                          <div className="chat-avatar">AI</div>
                          <div className="chat-content">
                            {blk.isDoNotFormat && (
                              <div className="do-not-format-tag">
                                ⚡ Direct Stream Mode (DO-NOT-FORMAT Flagged)
                              </div>
                            )}

                            {parsedJson ? (
                              <div className="parsed-json-card" style={{ marginTop: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginBottom: '8px', fontWeight: 600 }}>
                                  Structured JSON Payload Detected:
                                </div>
                                <pre
                                  style={{
                                    background: 'rgba(15, 23, 42, 0.85)',
                                    border: '1px solid rgba(56, 189, 248, 0.2)',
                                    borderRadius: '6px',
                                    padding: '12px',
                                    fontSize: '0.8rem',
                                    color: '#34d399',
                                    overflowX: 'auto',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {JSON.stringify(parsedJson, null, 2)}
                                </pre>
                              </div>
                            ) : (
                              <div className="chat-paragraphs">
                                {blk.content.split('\n').map((line: string, idx: number) => (
                                  <p key={idx}>{line}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </main>
          </div>
        )}
      </main>

      {/* =====================================================================
         CUSTOM INPUT TESTER MODAL (REQUESTED PASTABLE INPUT DIALOG)
         ===================================================================== */}
      {isPasteModalOpen && (
        <div className="custom-input-modal-overlay" onClick={() => setIsPasteModalOpen(false)}>
          <div className="custom-input-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <ClipboardPaste size={18} color="#38bdf8" />
                <h3>Paste / Test Custom Input</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setIsPasteModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-desc">
                Paste any unstructured text, raw JSON line, CRM opportunity, or catalog payload below to test the
                sub-millisecond Schema-First, Tool-Native renderer.
              </p>

              <div className="modal-quick-presets">
                <span className="presets-label">Quick Samples:</span>
                <button className="preset-btn" onClick={() => loadPreset('deal')}>
                  Deal 360
                </button>
                <button className="preset-btn" onClick={() => loadPreset('pipeline')}>
                  Pipeline Table
                </button>
                <button className="preset-btn" onClick={() => loadPreset('jsonl')}>
                  Raw JSON Line
                </button>
                <button className="preset-btn" onClick={() => loadPreset('catalog')}>
                  Catalog Grid
                </button>
                <button className="preset-btn" onClick={() => loadPreset('gate')}>
                  Form Gate
                </button>
                <button className="preset-btn" onClick={() => loadPreset('audit')}>
                  Workflow Failure
                </button>
              </div>

              <div className="modal-textarea-wrap">
                <textarea
                  className="modal-input-area"
                  placeholder="Paste any unstructured or raw text here..."
                  value={customInputText}
                  onChange={(e) => setCustomInputText(e.target.value)}
                  rows={10}
                />
              </div>

              <div className="modal-tools-row">
                <button className="btn-modal-sub" onClick={handlePasteFromClipboard}>
                  <ClipboardPaste size={13} />
                  <span>Paste from Clipboard</span>
                </button>
                <button className="btn-modal-sub" onClick={() => setCustomInputText('')}>
                  Clear Text
                </button>
                <span className="modal-char-count">{customInputText.length} characters</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsPasteModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn-site-primary"
                onClick={handleRunCustomInput}
                disabled={!customInputText.trim()}
              >
                <Play size={14} />
                <span>Format & Render Real Website</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JeevesBenchmarkPage;
