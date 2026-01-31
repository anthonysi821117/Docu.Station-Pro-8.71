
import { useMemo, useCallback } from 'react';
import { InvoiceProject, ProductItem, KnowledgeBase, CustomRule } from '../types';

export interface HealthIssue {
  type: 'critical' | 'warning';
  field: string;
  message: string;
}

export interface HealthReport {
  status: 'healthy' | 'warning' | 'critical';
  issues: HealthIssue[];
}

export interface ItemHealthReport {
  index: number;
  item: ProductItem;
  issues: HealthIssue[];
}

export const useProductHealthCheck = (allProjects: InvoiceProject[], currentCurrency: string, knowledgeBase?: KnowledgeBase, customRules: CustomRule[] = []) => {
  /**
   * 构建历史价格映射表
   * 键格式: "品名|币种"
   * 如果是人民币折算模式下的价格，币种固定为 "CNY"
   */
  const priceHistoryMap = useMemo(() => {
    const map = new Map<string, number[]>();
    
    allProjects.forEach(p => {
      const isHistRmbMode = !!p.headerInfo.isRmbCalculation;
      // 确定历史参考币种：人民币模式视为 CNY，否则取单据原始币种
      const histRefCurrency = isHistRmbMode ? 'CNY' : (p.headerInfo.currency || 'USD').toUpperCase();
      
      p.productItems.forEach(item => {
        if (!item.cnName) return;
        
        // 根据模式取对应的单价
        const price = isHistRmbMode 
          ? parseFloat(String(item.purchaseUnitPriceRMB || 0)) 
          : parseFloat(String(item.unitPrice || 0));
          
        if (isNaN(price) || price <= 0) return;
        
        const key = `${item.cnName.trim()}|${histRefCurrency}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)?.push(price);
      });
    });
    return map;
  }, [allProjects]);

  // Evaluate single custom rule
  const evaluateCustomRule = (rule: CustomRule, item: ProductItem): boolean => {
    const targetVal = item[rule.targetField];
    let compareVal: any = rule.compareValue;

    if (rule.compareMode === 'field') {
        compareVal = item[rule.compareValue as keyof ProductItem];
    }

    const numTarget = parseFloat(String(targetVal));
    const numCompare = parseFloat(String(compareVal));
    const isNumeric = !isNaN(numTarget) && !isNaN(numCompare);

    const strTarget = String(targetVal || '').toLowerCase();
    const strCompare = String(compareVal || '').toLowerCase();

    switch (rule.operator) {
        case 'empty': return !targetVal || targetVal === '';
        case 'not_empty': return !!targetVal && targetVal !== '';
        case 'contains': return strTarget.includes(strCompare);
        case 'not_contains': return !strTarget.includes(strCompare);
        case 'eq': return isNumeric ? numTarget === numCompare : strTarget === strCompare;
        case 'neq': return isNumeric ? numTarget !== numCompare : strTarget !== strCompare;
        case 'gt': return isNumeric && numTarget > numCompare;
        case 'gte': return isNumeric && numTarget >= numCompare;
        case 'lt': return isNumeric && numTarget < numCompare;
        case 'lte': return isNumeric && numTarget <= numCompare;
        default: return false;
    }
  };

  // Single Item Check
  const checkItem = useCallback((item: ProductItem, isRmbMode: boolean): HealthReport => {
    const issues: HealthIssue[] = [];

    // --- A. Critical Logic Checks (Physics) ---
    const gw = parseFloat(String(item.grossWeight)) || 0;
    const nw = parseFloat(String(item.netWeight)) || 0;
    const vol = parseFloat(String(item.volume)) || 0;
    const ctns = parseFloat(String(item.cartonCount)) || 0;

    if (nw > gw) {
      issues.push({ type: 'critical', field: 'weight', message: '物理错误：净重 (N.W) 不能大于毛重 (G.W)' });
    }

    // --- B. Packaging Consistency Checks ---
    const pkgType = (item.packageType || 'CTNS').toUpperCase().trim();
    if (ctns > 0 && pkgType === 'CTNS') {
      const weightPerCtn = gw / ctns;
      const volPerCtn = vol / ctns;
      if (weightPerCtn > 50) {
        issues.push({ 
          type: 'warning', 
          field: 'packageType', 
          message: `包装异常：单箱重约 ${weightPerCtn.toFixed(1)}kg。建议检查是否应为托盘(PLTS)。` 
        });
      }
      if (volPerCtn > 1) {
        issues.push({ 
          type: 'warning', 
          field: 'volume', 
          message: `尺寸异常：单箱体积约 ${volPerCtn.toFixed(2)} CBM。请检查体积小数点。` 
        });
      }
    }

    // --- C. Price Anomaly Checks (Enhanced Currency Matching) ---
    // 确定当前比对基准
    const checkCurrency = isRmbMode ? 'CNY' : (currentCurrency || 'USD').toUpperCase();
    const currentPrice = isRmbMode 
      ? parseFloat(String(item.purchaseUnitPriceRMB || 0)) 
      : parseFloat(String(item.unitPrice || 0));

    if (item.cnName && currentPrice > 0) {
        const key = `${item.cnName.trim()}|${checkCurrency}`;
        const history = priceHistoryMap.get(key);
        
        if (history && history.length >= 3) {
            const sum = history.reduce((a, b) => a + b, 0);
            const avg = sum / history.length;
            const deviation = (currentPrice - avg) / avg;
            
            if (Math.abs(deviation) > 0.3) {
                const percent = (Math.abs(deviation) * 100).toFixed(0);
                const direction = deviation > 0 ? '高' : '低';
                const modeLabel = isRmbMode ? '人民币采购单价' : `${checkCurrency}成交单价`;
                
                issues.push({
                    type: 'warning',
                    field: 'price',
                    message: `价格异常：当前${modeLabel}较历史均价偏${direction} ${percent}% (历史均价: ${avg.toFixed(4)})`
                });
            }
        }
    }

    // --- D. Compliance Checks (Knowledge Base) ---
    if (knowledgeBase && item.hsCode) {
        const cleanHs = item.hsCode.replace(/[^\d]/g, '');
        const rule = knowledgeBase.complianceRules[cleanHs] || 
                     (cleanHs.length > 8 ? knowledgeBase.complianceRules[cleanHs.substring(0, 8)] : null) ||
                     (cleanHs.length > 6 ? knowledgeBase.complianceRules[cleanHs.substring(0, 6)] : null);

        if (rule) {
            if (rule.status === 'banned') {
                issues.push({ 
                    type: 'critical', 
                    field: 'hsCode', 
                    message: `合规禁止：该 HS 编码涉及出口管制 (${rule.note || '禁止出口'})` 
                });
            } else if (rule.taxRefundRate === 0 && rule.status !== 'normal') {
                issues.push({ 
                    type: 'warning', 
                    field: 'hsCode', 
                    message: `退税预警：该编码退税率为 0%，请确认！(${rule.note})` 
                });
            }
        }
    }

    // --- E. Basic Compliance Checks ---
    if (item.hsCode && (!item.declarationElements || item.declarationElements.length < 5)) {
         issues.push({ type: 'warning', field: 'elements', message: '合规提示：有 HS 编码但申报要素似乎不完整' });
    }

    // --- F. Custom User Rules ---
    customRules.forEach(rule => {
        if (!rule.enabled) return;
        try {
            if (evaluateCustomRule(rule, item)) {
                issues.push({
                    type: rule.severity,
                    field: rule.targetField,
                    message: rule.message || `${rule.name}: 自定义校验失败`
                });
            }
        } catch (e) {
            console.error("Error evaluating rule:", rule, e);
        }
    });

    let status: HealthReport['status'] = 'healthy';
    if (issues.some(i => i.type === 'critical')) status = 'critical';
    else if (issues.length > 0) status = 'warning';

    return { status, issues };
  }, [priceHistoryMap, knowledgeBase, customRules, currentCurrency]);

  // Scan All Items
  const checkAll = useCallback((items: ProductItem[], isRmbMode: boolean): ItemHealthReport[] => {
    const report: ItemHealthReport[] = [];
    items.forEach((item, index) => {
        if (!item.cnName && !item.enName && !item.totalPrice) return;
        const result = checkItem(item, isRmbMode);
        if (result.status !== 'healthy') {
            report.push({ index, item, issues: result.issues });
        }
    });
    return report;
  }, [checkItem]);

  return { checkItem, checkAll };
};
