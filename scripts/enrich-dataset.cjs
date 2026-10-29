const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/jeevesData.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original file size:', content.length);

// 1. Collect all full 36-char UUIDs in the file
const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const allFullUuids = content.match(uuidRegex) || [];
const prefixMap = new Map();
allFullUuids.forEach(u => prefixMap.set(u.slice(0, 8).toLowerCase(), u));
console.log('Unique full UUIDs found:', prefixMap.size);

// 2. Replace all truncated UUIDs (e.g. 98eff6e6...) with full UUIDs
let replacedTruncated = 0;
content = content.replace(/([0-9a-f]{8})\.\.\./gi, (match, prefix) => {
  const full = prefixMap.get(prefix.toLowerCase());
  if (full) {
    replacedTruncated++;
    return full;
  }
  return match;
});
console.log('Replaced truncated UUIDs:', replacedTruncated);

// 3. Update the JeevesItem interface in the file to include id fields
const oldInterface = `export interface JeevesItem {
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
  ticketData?: { ticketId: string; status: string; priority: string; group: string; customer: string; resourceType: string; note: string };
  catalogData?: { totalFound: number; showingCount: number; items: { num: number; name: string; publisher: string; id: string }[] };
  pipelineData?: { totalOpportunities: number; rows: { num: number; name: string; company: string; industry: string; dealValue: string; closeDate: string; healthScore: string; stage: string; id: string }[] };
  specData?: { title: string; cost: string; unit: string; termPolicy: string; approval: string; minQty: string; maxQty: string; requiredFields: string[] };
  dealData?: {
    title: string;
    company: string;
    owner: string;
    dealValue: string;
    closeDate: string;
    healthScore: string;
    aiProbability: string;
    labels: string[];
    stakeholder: { name: string; jobTitle: string; email: string; phone: string; role: string };
    lineItems: { name: string; quantity: number; agreedPrice: string }[];
    activities: { type: string; title: string; status: string; date: string }[];
  };
  defaultOutput: UniversalOutput;
}`;

const newInterface = `export interface JeevesItem {
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
}`;

if (content.includes(oldInterface)) {
  content = content.replace(oldInterface, newInterface);
  console.log('Updated JeevesItem interface definition.');
} else {
  console.log('Note: oldInterface text differed slightly, will check manual replace.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Saved updated jeevesData.ts');
