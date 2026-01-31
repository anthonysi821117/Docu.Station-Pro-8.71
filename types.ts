
// src/types.ts

// 1. 基础数据类型
export interface ProductItem {
  id: string;
  cnName: string;
  enName: string;
  hsCode: string;
  quantity: number | string;
  unit: string;
  unitPrice: number | string;
  totalPrice: number | string;
  purchaseUnitPriceRMB?: number | string;
  purchaseTotalPriceRMB?: number | string;
  declarationElements?: string;
  grossWeight: number | string;
  netWeight: number | string;
  cartonCount: number | string;
  packageType: string;
  volume: number | string;
  origin: string;
  originCountry?: string;
  remark?: string;
  // Tax Calculation Fields
  vatRate?: number;       // e.g. 13
  taxRefundRate?: number; // e.g. 13, 9, 0
}

export interface Seller {
  id: string;
  nameCn: string;
  nameEn: string;
  address: string;
  uscc: string;
  customsCode: string;
  invoiceSealBase64?: string;
  customsSealBase64?: string;
  isDefault?: boolean;
}

export interface Consignee {
  id: string;
  name: string;
  address: string;
  country: string;
}

export interface ProductPreset {
  id: string;
  cnName: string;
  enName: string;
  hsCode: string;
  unit?: string;
  remark?: string;
  declarationElements?: string;
  vatRate?: number;
  taxRefundRate?: number;
}

export interface RemarkItem {
  id: string;
  text: string;
}

export interface FXItem {
  id: string;
  amount: number | string;
  rate: number | string;
}

export interface CostItem {
  id: string;
  supplierName: string;
  amount: number | string;
  taxRefundRate: number | string;
  vatRate?: number | string;
}

export interface ExtraExpense {
  id: string;
  name: string;
  amount: number | string;
}

// Custom Validation Rules
export type RuleOperator = 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq' | 'contains' | 'not_contains' | 'empty' | 'not_empty';
export type RuleCompareMode = 'value' | 'field';

export interface CustomRule {
  id: string;
  name: string;
  targetField: keyof ProductItem; // The field to check
  operator: RuleOperator;
  compareMode: RuleCompareMode; // Compare against a static value or another field
  compareValue: string; // The value (e.g. "100") or field name (e.g. "netWeight")
  severity: 'warning' | 'critical';
  message: string;
  enabled: boolean;
}

// Knowledge Base Types
export interface ComplianceRule {
  hsCode: string;
  taxRefundRate: number;   // 退税率
  status: 'normal' | 'warning' | 'banned'; // 状态
  note: string;            // 比如 "2024新规：涉及反倾销"
  lastUpdated: string;
}

export interface KnowledgeBase {
  complianceRules: Record<string, ComplianceRule>; // Keyed by normalized HS Code
  // Future: productFingerprints for historical data
}

export const INITIAL_KNOWLEDGE_BASE: KnowledgeBase = {
  complianceRules: {}
};

// WebDAV Configuration
export interface WebDavConfig {
  url: string;
  username: string;
  password?: string; // Password can be sensitive, handle carefully
}

// Data Import Protocol (n8n Integration)
export interface DSPImportPacket {
  version: string;
  meta: {
    source: string;
    timestamp: string;
    processor: string; // e.g., "n8n-ocr-v1"
  };
  payload: {
    headerCandidate?: Partial<HeaderInfo>;
    items: Partial<ProductItem>[];
  };
}

// Custom Theme Configuration
export interface CustomTheme {
  name: string;
  colors: {
    bg: string;
    surface: string;
    sidebarBg?: string; // Added for decoupling
    sidebarText?: string; // Added for decoupling
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    inputBg: string;
  };
  layout: {
    borderRadius: string; // '0px', '8px', '16px'
  }
}

export const DEFAULT_CUSTOM_THEME: CustomTheme = {
  name: 'My Custom Theme',
  colors: {
    bg: '#f3f4f6', // gray-100
    surface: '#ffffff', // white
    sidebarBg: '#ffffff', // default to white
    sidebarText: '#1f2937', // default to gray-800
    text: '#1f2937', // gray-800
    textSecondary: '#6b7280', // gray-500
    border: '#e5e7eb', // gray-200
    accent: '#3b82f6', // blue-500
    inputBg: '#ffffff'
  },
  layout: {
    borderRadius: '0.75rem' // 12px
  }
};

// 2. 复杂结构类型
export interface HeaderInfo {
  sellerNameCn: string;
  sellerName: string;
  sellerAddress: string;
  sellerUscc: string;
  sellerCustomsCode: string;
  invoiceNo: string;
  contractNo: string;
  invoiceDate: string;
  loadingPort: string;
  tradeCountry: string;
  dischargePort: string;
  destinationCountry: string;
  incoterms: string;
  paymentMethod: string;
  currency: string;
  buyerName: string;
  buyerAddress: string;
  transportMethod: string;
  // Fix: Removed '?' from object literal properties
  exportDate: string;
  declarationDate: string;
  taxExemptionNature: string;
  exchangeRateTargetToCny: number | string;
  oceanFreight: number | string;
  insurance: number | string;
  isRmbCalculation?: boolean;
  fxItems?: FXItem[];
  costItems?: CostItem[];
  extraExpenses?: ExtraExpense[];
  agencyFeeRate?: number | string;
  minAgencyFee?: number | string;
  exAgencyFee?: number | string;
  exLumpSum?: number | string;
  exOceanRMB?: number | string;
  exCertFee?: number | string;
  exDomesticExpress?: number | string;
  exIntlExpress?: number | string;
  exInsuranceRMB?: number | string;
  exCommissionRMB?: number | string;
  exBuyingDocs?: number | string;
  remarks?: RemarkItem[];
  lastExchangeRateFetchDate?: string;
  // 新增：知识库字段
  customsKnowledge?: string;
  // 新增: 海关报关单的唛头及备注字段
  customsMarks?: string; // Correctly typed as string

  // 提单专有字段
  vesselName?: string;
  voyageNo?: string;
  placeOfReceipt?: string;
  placeOfDelivery?: string;
  blNo?: string;
  notifyParty?: string;
  containerNo?: string;
  sealNo?: string;
  shippedOnBoardDate?: string;
  blReleaseType?: 'ORIGINAL' | 'TELEX' | 'WAYBILL';
  freightType?: 'PREPAID' | 'COLLECT';

  // 结算单专有备注
  settlementRemark?: string;
}

// 支持最多10个状态
export type ProjectStatus = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8' | 'S9' | 'S10' | 'TODO' | 'DOING' | 'DONE' | 'REVIEW' | 'ARCHIVE';

export interface InvoiceProject {
  id: string;
  headerInfo: HeaderInfo;
  settlementInfo: HeaderInfo;
  productItems: ProductItem[];
  status: ProjectStatus;
  updatedAt: string;
  tags?: string[];
}

// 3. 初始常量
export const INITIAL_HEADER: HeaderInfo = {
  sellerNameCn: "",
  sellerName: "",
  sellerAddress: "",
  sellerUscc: "",
  sellerCustomsCode: "",
  invoiceNo: "",
  contractNo: "",
  invoiceDate: new Date().toISOString().split('T')[0],
  loadingPort: "SHANGHAI, CHINA",
  tradeCountry: "",
  dischargePort: "",
  destinationCountry: "",
  incoterms: "FOB",
  paymentMethod: "T/T",
  currency: "USD",
  buyerName: "",
  buyerAddress: "",
  transportMethod: "海运",
  // Fix: Removed '?' from object literal properties
  exportDate: "",
  declarationDate: "",
  taxExemptionNature: "",
  exchangeRateTargetToCny: "",
  oceanFreight: "",
  insurance: "",
  isRmbCalculation: false,
  fxItems: [],
  costItems: [],
  extraExpenses: [],
  remarks: [
    { id: "remark-1", text: "运输：" },
    { id: "remark-2", text: "资金：" },
    { id: "remark-3", text: "供应商：" },
  ],
  agencyFeeRate: "0.01",
  minAgencyFee: "500",
  customsKnowledge: "", // 初始化
  customsMarks: "", // 初始化
  vesselName: "",
  voyageNo: "",
  placeOfReceipt: "",
  placeOfDelivery: "",
  notifyParty: "",
  containerNo: "",
  sealNo: "",
  shippedOnBoardDate: "",
  blReleaseType: "TELEX",
  freightType: "COLLECT",
  settlementRemark: "" // 初始化
};

export const INITIAL_PRODUCT: ProductItem = {
  id: "1",
  cnName: "",
  enName: "",
  hsCode: "",
  quantity: "",
  unit: "",
  unitPrice: "",
  totalPrice: "",
  purchaseTotalPriceRMB: "",
  declarationElements: "",
  grossWeight: "",
  netWeight: "",
  cartonCount: "",
  packageType: "",
  volume: "",
  origin: "",
  originCountry: "CHINA (CHN)",
  vatRate: 13,
  taxRefundRate: 13,
};

export const createInitialProductWithUniqueId = (): ProductItem => {
  return { ...INITIAL_PRODUCT, id: Date.now().toString() + Math.random().toString().slice(2, 6) };
};
