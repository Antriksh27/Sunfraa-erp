export type UserRole =
  | 'DIRECTOR'
  | 'SALES'
  | 'ACCOUNTS'
  | 'SITE_EXECUTION'
  | 'STORE_PURCHASE'
  | 'DESIGN'
  | 'LIAISONING'
  | 'HEAD_ENGINEER';

export type ProjectCategory =
  | 'RESIDENTIAL_BUNGALOW'
  | 'RESIDENTIAL_FLAT'
  | 'COMMERCIAL'
  | 'INDUSTRIAL';

export type ProjectStage =
  | 'LEAD'
  | 'SITE_SURVEY_SCHEDULED'
  | 'SITE_SURVEY_DONE'
  | 'DESIGN_PENDING'
  | 'DESIGN_UPLOADED'
  | 'QUOTATION_SENT'
  | 'STALE'
  | 'PAYMENT_COLLECTED'
  | 'DIRECTOR_APPROVED'
  | 'EXECUTION_IN_PROGRESS'
  | 'EXECUTION_COMPLETE'
  | 'LIAISONING_IN_PROGRESS'
  | 'CEI_IN_PROGRESS'
  | 'CONNECTED'
  | 'CLOSED';

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'COLLECTED';

export type PaymentMode = 'CASH' | 'CHEQUE' | 'NEFT' | 'UPI';

export type InvoiceType = 'ADVANCE' | 'TAX' | 'FINAL';

export interface PaymentMilestone {
  id: string;
  project_id: string;
  milestone_name: string;
  percentage: number;
  amount: number;
  due_date: string | null;
  status: 'PENDING' | 'COLLECTED';
  collected_at: string | null;
  payment_mode: PaymentMode | null;
  reference_number: string | null;
  receipt_url: string | null;
  collected_by_id: string | null;
  created_at: string;
  updated_at: string;
  collected_by?: { name: string } | null;
}

export interface Invoice {
  id: string;
  project_id: string;
  invoice_number: string;
  invoice_type: InvoiceType;
  amount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  issued_at: string;
  pdf_url: string | null;
  created_by_id: string | null;
  created_at: string;
  created_by?: { name: string } | null;
}

export type DesignFileType = 'INITIAL' | 'CEI_DRAWING';

export type DesignSystemType = 'STRING_INVERTER' | 'MICRO_INVERTER' | 'HYBRID';
export type DesignReviewStatus = 'PENDING' | 'APPROVED' | 'NEEDS_REVISION';

export type StockDirection = 'IN' | 'OUT';

export type ExecutionStage =
  | 'STRUCTURE_FABRICATION'
  | 'PANEL'
  | 'WIRING'
  | 'CIVIL';

export type CompletionCaptureMethod = 'SCAN' | 'PHOTO_OCR';

export type LeadSource =
  | 'REFERRAL'
  | 'PAID_ADS'
  | 'CAMPAIGN'
  | 'WALK_IN'
  | 'GOVT_TENDER'
  | 'COLD_OUTREACH';

export type LeadTemperature = 'HOT' | 'WARM' | 'COLD';

export type LeadLostReason =
  | 'PRICE'
  | 'COMPETITOR'
  | 'PROJECT_SHELVED'
  | 'FINANCING_FELL_THROUGH'
  | 'OTHER';

export type LeadActivityType = 'NOTE' | 'CALL' | 'MEETING';

export interface Profile {
  id: string;
  name: string;
  email?: string | null;
  phone: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_name: string;
  address: string;
  phone: string;
  category: ProjectCategory;
  kw_required: number;
  sanctioned_load: string | null;
  connection_number: string | null;
  lead_owner_id: string | null;
  stage: ProjectStage;
  quotation_amount: number | null;
  quotation_sent_at: string | null;
  payment_status: PaymentStatus;
  payment_collected_at: string | null;
  payment_collected_by_id: string | null;
  director_approved_at: string | null;
  director_approved_by_id: string | null;
  cei_required: boolean;
  lead_source?: LeadSource;
  source_detail?: string | null;
  temperature?: LeadTemperature;
  expected_close_date?: string | null;
  lost_reason?: LeadLostReason | null;
  lost_competitor_name?: string | null;
  lost_at?: string | null;
  last_rejected_reason?: DirectorRejectionReason | null;
  last_rejected_notes?: string | null;
  last_rejected_at?: string | null;
  survey_scheduled_date?: string | null;
  survey_assigned_engineer_id?: string | null;
  survey_assigned_engineer?: { name: string; phone?: string | null } | null;
  created_at: string;
  updated_at: string;
}

export type DirectorApprovalAction = 'APPROVED' | 'REJECTED';

export type DirectorRejectionReason =
  | 'LOW_MARGIN'
  | 'HIGH_RISK'
  | 'INCOMPLETE_DATA'
  | 'CAPACITY_OVERLOAD'
  | 'OTHER';

export interface ApprovalAuditLog {
  id: string;
  project_id: string;
  action: DirectorApprovalAction;
  actor_id: string;
  reason?: DirectorRejectionReason | null;
  notes?: string | null;
  estimated_margin?: number | null;
  created_at: string;
  actor?: { name: string } | null;
}

export interface LeadActivity {
  id: string;
  project_id: string;
  type: LeadActivityType;
  content: string;
  call_outcome: string | null;
  created_by_id: string | null;
  created_at: string;
  created_by?: { name: string } | null;
}

export interface DocumentChecklistItem {
  id: string;
  project_id: string;
  document_name: string;
  required: boolean;
  uploaded: boolean;
  file_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuotationLineItem {
  item_name: string;
  category: string;
  qty: number;
  rate: number;
  amount: number;
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';

export interface Quotation {
  id: string;
  project_id: string;
  version: number;
  line_items: QuotationLineItem[];
  total_amount: number;
  status: QuotationStatus;
  sent_at: string | null;
  created_by_id: string | null;
  created_at: string;
  created_by?: { name: string } | null;
}

export interface SiteSurvey {
  id: string;
  project_id: string;
  no_of_panels: number;
  physical_measurement: string;
  photo_urls: string[];
  diagram_urls: string[];
  gps_location: string;
  contacted_person: string;
  surveyed_by_id: string;
  surveyed_at: string;
}

export interface DesignFile {
  id: string;
  project_id: string;
  type: DesignFileType;
  file_url: string;
  version: number;
  version_notes?: string | null;
  status?: DesignReviewStatus;
  revision_comments?: string | null;
  uploaded_by_id: string;
  uploaded_at: string;
  uploaded_by?: { name: string } | null;
}

export interface CEIChecklist {
  id: string;
  project_id: string;
  earthing_pit_verified: boolean;
  lightning_arrestor_verified: boolean;
  transformer_ht_attached: boolean;
  cei_fee_challan_attached: boolean;
  verified_by_id?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SLDSpecification {
  id: string;
  project_id: string;
  system_type: DesignSystemType;
  inverter_kw: number;
  panel_count: number;
  string_count: number;
  dc_cable_length_m: number;
  ac_cable_length_m: number;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface BOM {
  id: string;
  project_id: string;
  created_by_id: string | null;
  created_at: string;
  approved_at?: string | null;
  approved_by_id?: string | null;
  approved_by?: { name: string } | null;
}

export type ItemCategory = 'PANEL' | 'INVERTER' | 'STRUCTURE' | 'CABLE' | 'BOS' | 'CIVIL';
export type ItemUnit = 'NOS' | 'MTR' | 'SET' | 'KG';
export type SupplierPaymentTerms = 'ADVANCE' | 'NET_15' | 'NET_30' | 'NET_60';

export interface ItemMaster {
  id: string;
  item_code: string;
  name: string;
  category: ItemCategory;
  unit: ItemUnit;
  hsn_code: string | null;
  gst_rate: number;
  reorder_point: number;
  min_order_qty: number;
  standard_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string;
  email: string | null;
  gstin: string | null;
  city: string;
  payment_terms: SupplierPaymentTerms;
  rating: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type POStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: POStatus;
  total_amount: number;
  tax_amount: number;
  issued_at: string;
  created_by_id: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier | null;
  items?: POItem[];
  created_by?: { name: string } | null;
}

export interface POItem {
  id: string;
  po_id: string;
  item_master_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
  quantity_received: number;
  created_at: string;
  item_master?: ItemMaster | null;
}

export interface GoodsReceiptNote {
  id: string;
  grn_number: string;
  po_id: string;
  received_date: string;
  received_by_id: string;
  notes?: string | null;
  created_at: string;
  po?: PurchaseOrder | null;
  items?: GRNItem[];
  received_by?: { name: string } | null;
}

export interface GRNItem {
  id: string;
  grn_id: string;
  po_item_id: string;
  quantity_received: number;
  quantity_rejected: number;
  remarks?: string | null;
  created_at: string;
  po_item?: POItem | null;
}

export interface BOMItem {
  id: string;
  bom_id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
}

export interface DeliveryChallan {
  id: string;
  project_id: string;
  vehicle_type: string;
  registration_number: string;
  driver_name: string;
  driver_mobile: string;
  distance: number;
  created_by_id: string;
  created_at: string;
}

export interface StockLedger {
  id: string;
  item_name: string;
  direction: StockDirection;
  quantity: number;
  project_id: string | null;
  delivery_challan_id: string | null;
  created_by_id: string;
  created_at: string;
}

export interface LabourTeam {
  id: string;
  name: string;
  headcount: number;
  available: boolean;
}

export type SubcontractorTrade = 'STRUCTURE' | 'PANEL' | 'WIRING' | 'CIVIL' | 'ALL';

export type SubcontractorRateType = 'PER_KW' | 'PER_DAY' | 'LUMPSUM';

export interface Subcontractor {
  id: string;
  name: string;
  trade: SubcontractorTrade;
  phone: string;
  rate_type: SubcontractorRateType;
  default_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabourAssignment {
  id: string;
  labour_team_id: string;
  project_id: string;
  stage: ExecutionStage;
  assigned_date: string;
  subcontractor_id?: string | null;
  headcount?: number;
  notes?: string | null;
  rate?: number | null;
  total_cost?: number | null;
  labour_team?: { name: string; headcount: number } | null;
  subcontractor?: Subcontractor | null;
}

export interface ExecutionStageProgress {
  id: string;
  project_id: string;
  stage: ExecutionStage;
  photo_url: string;
  photo_urls?: string[];
  comment: string | null;
  started_at?: string;
  completed_at: string;
  completed_by_id: string;
  completed_by?: { name: string } | null;
}

export interface ExecutionCompletion {
  id: string;
  project_id: string;
  panel_serial_numbers: string[];
  panel_count: number;
  inverter_serial_number: string;
  captured_via: CompletionCaptureMethod;
  completed_at: string;
}

export interface FollowUpLog {
  id: string;
  project_id: string;
  reminder_sent_at: string;
  assigned_to_id: string;
  acknowledged: boolean;
}

export type PortalRoute = 'NATIONAL_PORTAL_SUBSIDY' | 'NATIONAL_PORTAL_NON_SUBSIDY' | 'GEDA_PORTAL';
export type SubsidyType = 'COMMON_SUBSIDY' | 'INDIVIDUAL_SUBSIDY' | 'NON_SUBSIDY';

export interface LiaisoningRecord {
  id: string;
  project_id: string;
  portal_route?: PortalRoute | null;
  subsidy_type?: SubsidyType | null;
  documents_received_at: string | null;
  acknowledgement_number: string | null;
  govt_estimate_quotation_number: string | null;
  govt_estimate_amount: number | null;
  estimate_paid_at: string | null;
  discom_file_ready_at: string | null;
  connected_at: string | null;
  meter_report_url: string | null;
  meter_report_uploaded_at: string | null;
}

export interface DiscomFollowUpLog {
  id: string;
  liaisoning_record_id: string;
  follow_up_date: string;
  note: string;
  logged_by_id: string;
}

export interface CEIRecord {
  id: string;
  project_id: string;
  self_certificate_generated_at: string | null;
  filed_for_client_signing_at: string | null;
  drawing_approval_design_file_id: string | null;
  cei_portal_reference_number: string | null;
  cei_approved_at: string | null;
  cei_approval_upload_url: string | null;
  inspection_reference_number: string | null;
  inspector_name: string | null;
  inspector_date: string | null;
  inspector_contact: string | null;
}

export type DISCOMPortalName =
  | 'TORRENT_POWER'
  | 'UGVCL'
  | 'PGVCL'
  | 'MGVCL'
  | 'DGVCL'
  | 'OTHER';

export type DISCOMAppStatus = 'APPLIED' | 'QUERY_RAISED' | 'APPROVED' | 'REJECTED';
export type SubsidyClaimStatus = 'CLAIMED' | 'INSPECTED' | 'DISBURSED' | 'REJECTED';

export interface DISCOMPortalRecord {
  id: string;
  project_id: string;
  portal_name: DISCOMPortalName;
  portal_other_name?: string | null;
  application_number: string;
  ack_receipt_url?: string | null;
  applied_at: string;
  approved_at?: string | null;
  query_raised_at?: string | null;
  query_resolved_at?: string | null;
  query_text?: string | null;
  status: DISCOMAppStatus;
  created_at: string;
  updated_at: string;
}

export interface CEIInspectorLog {
  id: string;
  project_id: string;
  inspector_name: string;
  inspector_phone?: string | null;
  scheduled_date: string;
  visit_completed: boolean;
  report_notes?: string | null;
  certificate_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeterTestRecord {
  id: string;
  project_id: string;
  meter_serial_number: string;
  ct_pt_ratio?: string | null;
  test_report_number: string;
  test_date: string;
  passed: boolean;
  test_report_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubsidyClaim {
  id: string;
  project_id: string;
  consumer_number?: string | null;
  national_portal_app_no: string;
  subsidy_amount: number;
  claim_submitted_at: string;
  inspected_at?: string | null;
  disbursed_at?: string | null;
  utr_number?: string | null;
  status: SubsidyClaimStatus;
  created_at: string;
  updated_at: string;
}

export interface SavedView {
  id: string;
  user_id: string;
  module_name: string;
  view_name: string;
  filter_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationRead {
  id: string;
  user_id: string;
  notification_key: string;
  read_at: string;
}

export interface ReassignmentLog {
  id: string;
  project_id: string;
  reassigned_from_id?: string | null;
  reassigned_to_id: string;
  reassignment_reason: string;
  reassigned_by_id: string;
  created_at: string;
  project?: Project | null;
  reassigned_from?: Profile | null;
  reassigned_to?: Profile | null;
  reassigned_by?: Profile | null;
}

export interface ProjectComment {
  id: string;
  project_id: string;
  author_id: string;
  comment_text: string;
  is_pinned: boolean;
  mentioned_user_ids: string[];
  parent_comment_id?: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile | null;
  replies?: ProjectComment[];
}
