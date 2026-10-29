const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/jeevesData.ts');

// Extract dataset by evaluating
const code = fs.readFileSync(filePath, 'utf8')
  .replace(/^import .*?;/gm, '')
  .replace(/export interface[\s\S]*?^export const JEEVES_100_DATASET:\s*JeevesItem\[\]\s*=\s*/m, 'const dataset = ')
  .replace(/;?\s*$/, '; module.exports = dataset;');

const tmpScript = path.join(__dirname, 'tmp-eval.cjs');
fs.writeFileSync(tmpScript, code, 'utf8');
const dataset = require(tmpScript);
fs.unlinkSync(tmpScript);

console.log('Loaded', dataset.length, 'items');

const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function parsePipelineRows(rawText) {
  const rows = [];
  const chunks = rawText.split(/(?:^|\n)\s*\d+\.\s+/).filter(c => c.trim().length > 0);
  chunks.forEach((chunk, idx) => {
    const uuidMatch = chunk.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    const uuid = uuidMatch ? uuidMatch[0] : '';
    
    let name = '';
    const nameMatch1 = chunk.match(/opportunity_name:\s*([^,\n]+)/i);
    const nameMatch2 = chunk.match(/Opportunity Name:\s*([^\n]+)/i);
    const nameMatch3 = chunk.match(/^[^\n-]+?(?=[0-9a-f]{8}-[0-9a-f]{4})/i);
    if (nameMatch1) name = nameMatch1[1].trim();
    else if (nameMatch2) name = nameMatch2[1].trim();
    else if (nameMatch3 && nameMatch3[0].trim()) name = nameMatch3[0].trim();
    else {
      const firstLine = chunk.split('\n')[0].replace(uuid, '').replace(/^[0-9a-f-]{36}/, '').trim();
      name = firstLine.replace(/^[-\s]+/, '') || ('Opportunity ' + (idx + 1));
    }

    let company = 'Enterprise';
    const compMatch1 = chunk.match(/(?:company_name|Company Name|Company):\s*([^,\n]+)/i);
    if (compMatch1) company = compMatch1[1].trim();

    let industry = 'Tech';
    const indMatch = chunk.match(/(?:industry|Industry):\s*([^,\n]+)/i);
    if (indMatch) industry = indMatch[1].trim();

    let dealValue = 'Not provided';
    const valMatch = chunk.match(/(?:deal_value|Deal Value|deal value):\s*([^,\n]+)/i);
    if (valMatch && valMatch[1].trim().toLowerCase() !== 'none') {
      const v = valMatch[1].trim();
      dealValue = v.startsWith('$') ? v : (/^\d+/.test(v) ? '$' + Number(v).toLocaleString() : v);
    }

    let closeDate = 'Not provided';
    const dateMatch = chunk.match(/(?:estimated_close_date|Estimated Close Date|Estimated Close):\s*([^,\n]+)/i);
    if (dateMatch && dateMatch[1].trim().toLowerCase() !== 'none') closeDate = dateMatch[1].trim();

    let healthScore = 'Not provided';
    const healthMatch = chunk.match(/(?:health_score|Health Score):\s*([^,\n]+)/i);
    if (healthMatch && healthMatch[1].trim().toLowerCase() !== 'none') healthScore = healthMatch[1].trim();

    let stage = 'New Inquiry';
    const stageMatch = chunk.match(/(?:current_labels|Current Labels|Labels):\s*([^,\n]+)/i);
    if (stageMatch && stageMatch[1].trim().toLowerCase() !== 'none') stage = stageMatch[1].trim();

    if (uuid) {
      rows.push({
        num: rows.length + 1,
        name: name.replace(/^opportunity_id:.*?,?\s*/, '').replace(/^[0-9a-f-]{36}/, '').trim(),
        id: uuid,
        company,
        industry,
        dealValue,
        closeDate,
        healthScore,
        stage
      });
    }
  });
  return rows;
}

dataset.forEach((item) => {
  const raw = item.rawInput || '';
  const uuids = (raw.match(uuidRegex) || []).map(u => u.toLowerCase());

  // Pipeline Table items: re-parse with robust parser if needed
  if (item.realType === 'pipeline-table' || (item.category === 'lists' && uuids.length >= 3)) {
    const parsedRows = parsePipelineRows(raw);
    if (parsedRows.length >= 3) {
      item.realType = 'pipeline-table';
      item.badge = 'Sales Pipeline';
      item.pipelineData = {
        totalOpportunities: parsedRows.length,
        rows: parsedRows
      };
      item.defaultOutput.table = {
        headers: ['#', 'Opportunity Name', 'Opportunity ID (UUID)', 'Account', 'Deal Value', 'Close Date', 'Health', 'Stage'],
        rows: parsedRows.map(r => [
          String(r.num),
          r.name,
          r.id,
          r.company,
          r.dealValue,
          r.closeDate,
          r.healthScore,
          r.stage
        ])
      };
    }
  }

  // Catalog items: ensure table has UUID column
  if (item.realType === 'catalog' && item.catalogData && item.catalogData.items) {
    item.defaultOutput.table = {
      headers: ['#', 'Product Name', 'Publisher', 'Product ID (UUID)', 'Approval Policy'],
      rows: item.catalogData.items.map(it => [
        String(it.num),
        it.name,
        it.publisher,
        it.id || 'N/A',
        it.policy || 'Needs Approval'
      ])
    };
  }
});

// Re-serialize dataset to file
const header = `import type { UniversalOutput } from '../services/formatter';

export interface JeevesItem {
  number: number;
  category: 'leads' | 'licenses' | 'lists' | 'do-not-format' | 'catalog' | 'other';
  badge: string;
  realType: 'deal-360' | 'pipeline-table' | 'catalog' | 'ticket' | 'software-spec' | 'do-not-format' | 'confirmation' | 'diagnostic';
  charCount: number;
  tokenCount: number;
  rawInput: string;
  formData?: { prompt: string; fields: string[] };
  confirmationData?: { requestId: string; message: string; status: string };
  diagnosticData?: { headline: string; message: string; code: string };
  ticketData?: {
    ticketId: string;
    status: string;
    priority: string;
    group: string;
    customer: string;
    resourceType: string;
    note: string;
    samRequestUuid?: string;
    resourceWorkUuid?: string;
  };
  catalogData?: {
    totalFound: number;
    showingCount: number;
    items: { num: number; name: string; publisher: string; id: string; policy?: string }[];
  };
  pipelineData?: {
    totalOpportunities: number;
    rows: {
      num: number;
      name: string;
      company: string;
      industry: string;
      dealValue: string;
      closeDate: string;
      healthScore: string;
      stage: string;
      id: string;
    }[];
  };
  specData?: {
    id?: string;
    title: string;
    cost: string;
    unit: string;
    termPolicy: string;
    approval: string;
    minQty: string;
    maxQty: string;
    requiredFields: string[];
  };
  dealData?: {
    id?: string;
    companyId?: string;
    title: string;
    company: string;
    owner: string;
    dealValue: string;
    closeDate: string;
    healthScore: string;
    aiProbability: string;
    labels: string[];
    stakeholder: { name: string; jobTitle: string; email: string; phone: string; role: string };
    lineItems: { name: string; quantity: number; agreedPrice: string; id?: string }[];
    activities: { type: string; title: string; status: string; date: string; id?: string }[];
  };
  defaultOutput: UniversalOutput;
}

export const JEEVES_100_DATASET: JeevesItem[] = `;

const jsonOutput = JSON.stringify(dataset, null, 2);
fs.writeFileSync(filePath, header + jsonOutput + ';\n', 'utf8');

console.log('Successfully updated jeevesData.ts with complete pipeline rows and full UUIDs.');
