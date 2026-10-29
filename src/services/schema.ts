import { z } from 'zod';

/**
 * SCHEMA-FIRST, TOOL-NATIVE BLOCKS
 * 
 * In this architecture, backend tools emit typed blocks directly.
 * There is NO secondary LLM summarizing or transforming data.
 * Every field, identifier, and UUID is preserved with 100% fidelity.
 */

// 1. Software Catalog Grid Block (e.g. Items 11, 14, 15, 16...)
export const CatalogItemSchema = z.object({
  num: z.number(),
  name: z.string(),
  id: z.string().describe('Full 36-char software UUID'),
  publisher: z.string().default('Unknown'),
  requiresConfirmation: z.boolean().default(true),
});
export type CatalogItem = z.infer<typeof CatalogItemSchema>;

export const CatalogGridBlockSchema = z.object({
  blockType: z.literal('CATALOG_GRID'),
  title: z.string().default('Software Catalog'),
  totalFound: z.number(),
  showingCount: z.number(),
  items: z.array(CatalogItemSchema),
});
export type CatalogGridBlock = z.infer<typeof CatalogGridBlockSchema>;

// 2. Opportunity Pipeline Table Block (e.g. Items 5, 6, 18, 19...)
export const PipelineRowSchema = z.object({
  num: z.number(),
  id: z.string().describe('Opportunity UUID'),
  name: z.string(),
  dealValue: z.string(),
  closeDate: z.string(),
  healthScore: z.string(),
  labels: z.array(z.string()),
  company: z.string().optional(),
  industry: z.string().optional(),
  fields: z.record(z.string(), z.string()).optional(),
});
export type PipelineRow = z.infer<typeof PipelineRowSchema>;

export const PipelineSummaryKpiSchema = z.object({
  totalValueFormatted: z.string().optional(),
  averageValueFormatted: z.string().optional(),
  totalRows: z.number().optional(),
  atRiskCount: z.number().optional(),
  highHealthCount: z.number().optional(),
});
export type PipelineSummaryKpis = z.infer<typeof PipelineSummaryKpiSchema>;

export const PipelineTableBlockSchema = z.object({
  blockType: z.literal('PIPELINE_TABLE'),
  title: z.string().default('Opportunity Pipeline'),
  totalCount: z.number(),
  columns: z.array(z.string()),
  rows: z.array(PipelineRowSchema),
  suggestedActions: z.array(z.string()).default([]),
  summaryKpis: PipelineSummaryKpiSchema.optional(),
  detectedFormat: z.enum(['COLON_LIST', 'MARKDOWN_TABLE', 'CSV_TSV', 'JSON_PAYLOAD']).optional(),
});
export type PipelineTableBlock = z.infer<typeof PipelineTableBlockSchema>;

// 3. Deal 360 Block (e.g. Items 1, 3, 4...)
export const DealActivitySchema = z.object({
  id: z.string().describe('Activity UUID'),
  type: z.string(),
  title: z.string(),
  status: z.string(),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  description: z.string().optional(),
});

export const DealStakeholderSchema = z.object({
  name: z.string(),
  role: z.string(),
  raci: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
});

export const Deal360BlockSchema = z.object({
  blockType: z.literal('DEAL_360'),
  title: z.string(),
  description: z.string().optional(),
  opportunityId: z.string().describe('36-char Opportunity UUID'),
  company: z.object({
    name: z.string(),
    companyId: z.string().optional(),
    profile: z.string().optional(),
  }),
  owner: z.string(),
  dealValue: z.string(),
  closeDate: z.string(),
  healthScore: z.string(),
  manualProbability: z.string().optional(),
  aiProbability: z.object({
    score: z.string(),
    rationale: z.string(),
  }).optional(),
  labels: z.array(z.string()),
  lineItems: z.array(
    z.object({
      title: z.string(),
      productId: z.string().optional(),
      quantity: z.string(),
      price: z.string(),
    })
  ).default([]),
  activities: z.array(DealActivitySchema).default([]),
  stakeholders: z.array(DealStakeholderSchema).default([]),
  documents: z.string().default('None'),
  customFields: z.record(z.string(), z.string()).optional(),
});
export type Deal360Block = z.infer<typeof Deal360BlockSchema>;

// 4. Software Product Specification Block (e.g. Items 10, 12, 13, 57, 64...)
export const SoftwareSpecBlockSchema = z.object({
  blockType: z.literal('SOFTWARE_SPEC'),
  title: z.string(),
  softwareId: z.string().describe('Software UUID'),
  revisionId: z.string().optional(),
  publisher: z.string(),
  description: z.string(),
  licensingUnit: z.string(),
  termPolicy: z.string(),
  approval: z.string(),
  cost: z.string(),
  minQuantity: z.string(),
  maxQuantity: z.string(),
  minTermDays: z.string().optional(),
  maxTermDays: z.string().optional(),
  requestable: z.boolean(),
  manualFulfillment: z.boolean().default(true),
  attributes: z.record(z.string()).default({}),
});
export type SoftwareSpecBlock = z.infer<typeof SoftwareSpecBlockSchema>;

// 5. Form Gate / Parameter Collection Block (e.g. Items 9, 20, 76...)
export const FormFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().default(true),
  type: z.enum(['text', 'number', 'select']).default('text'),
});

export const FormGateBlockSchema = z.object({
  blockType: z.literal('FORM_GATE'),
  softwareTitle: z.string(),
  softwareId: z.string().optional(),
  prompt: z.string(),
  fields: z.array(FormFieldSchema),
});
export type FormGateBlock = z.infer<typeof FormGateBlockSchema>;

// 6. Action Confirmation Block (e.g. Items 80, 82, 87, 99...)
export const ActionConfirmationBlockSchema = z.object({
  blockType: z.literal('ACTION_CONFIRMATION'),
  headline: z.string(),
  target: z.string().optional(),
  status: z.enum(['pending', 'submitted', 'completed']),
  details: z.record(z.string()).optional(),
  actions: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      style: z.enum(['primary', 'secondary', 'danger']).default('primary'),
    })
  ),
});
export type ActionConfirmationBlock = z.infer<typeof ActionConfirmationBlockSchema>;

// 7. SAM License Ticket Block (e.g. Items 7, 8...)
export const LicenseTicketBlockSchema = z.object({
  blockType: z.literal('LICENSE_TICKET'),
  ticketNumber: z.string(),
  title: z.string(),
  status: z.string(),
  priority: z.string(),
  group: z.string(),
  customer: z.string(),
  created: z.string(),
  updated: z.string(),
  samRequestUuid: z.string().optional(),
  resourceWorkUuid: z.string().optional(),
  action: z.string().optional(),
  comments: z.array(
    z.object({
      author: z.string(),
      date: z.string(),
      text: z.string(),
    })
  ).default([]),
});
export type LicenseTicketBlock = z.infer<typeof LicenseTicketBlockSchema>;

// 8. System Diagnostic Alert Block (e.g. Items 39, 85, 91...)
export const SystemAlertBlockSchema = z.object({
  blockType: z.literal('SYSTEM_ALERT'),
  severity: z.enum(['info', 'warning', 'error', 'success']),
  headline: z.string(),
  message: z.string(),
  canRetry: z.boolean().default(true),
});
export type SystemAlertBlock = z.infer<typeof SystemAlertBlockSchema>;

// 9. Prose Block / DO-NOT-FORMAT (e.g. Items 2, 21, 22...)
export const ProseBlockSchema = z.object({
  blockType: z.literal('PROSE'),
  content: z.string(),
  isDoNotFormat: z.boolean().default(false),
});
export type ProseBlock = z.infer<typeof ProseBlockSchema>;

// 10. Workflow Step Audit Log Block (e.g. Items 88, 93-97)

export const WorkflowAuditBlockSchema = z.object({
  blockType: z.literal('WORKFLOW_AUDIT'),
  headline: z.string(),
  status: z.enum(['incomplete', 'failed', 'completed']),
  steps: z.array(
    z.object({
      toolName: z.string(),
      status: z.enum(['completed', 'failed', 'pending']),
      message: z.string(),
    })
  ),
  actions: z.array(z.string()).default([]),
});
export type WorkflowAuditBlock = z.infer<typeof WorkflowAuditBlockSchema>;

// Canonical Tool Native Block Union
export type ToolNativeBlock =
  | CatalogGridBlock
  | PipelineTableBlock
  | Deal360Block
  | SoftwareSpecBlock
  | FormGateBlock
  | ActionConfirmationBlock
  | LicenseTicketBlock
  | SystemAlertBlock
  | ProseBlock
  | WorkflowAuditBlock;


export interface ToolNativeExecutionTrace {
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  blockType: ToolNativeBlock['blockType'];
  networkHops: 0;
  costUsd: 0;
  preservedUuids: string[];
  totalUuidsFound: number;
  validationStatus: 'PASSED';
  detectedFormat?: 'COLON_LIST' | 'MARKDOWN_TABLE' | 'CSV_TSV' | 'JSON_PAYLOAD' | 'CONVERSATIONAL' | 'STRUCTURED_ENTITY';
  sanitizationApplied?: boolean;
}

export interface ToolNativeResult {
  block: ToolNativeBlock;
  trace: ToolNativeExecutionTrace;
  rawInput: string;
  inputNumber: number;
}
