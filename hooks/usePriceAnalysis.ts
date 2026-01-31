
import { useMemo } from 'react';
import { InvoiceProject } from '../types';

export interface PriceAnalysisResult {
  isOutlier: boolean;
  avg: string;
  min: string;
  max: string;
  deviation: string;
  type: 'high' | 'low';
}

export const usePriceAnalysis = (allProjects: InvoiceProject[], currentCurrency: string) => {
  /**
   * 构建分类历史价格映射表
   * 键格式: "品名|币种" (CNY 代表人民币折算模式)
   */
  const historyMap = useMemo(() => {
    const map = new Map<string, number[]>();
    
    allProjects.forEach(p => {
      const isHistRmbMode = !!p.headerInfo.isRmbCalculation;
      const histRefCurrency = isHistRmbMode ? 'CNY' : (p.headerInfo.currency || 'USD').toUpperCase();
      
      p.productItems.forEach(item => {
        if (!item.cnName) return;
        
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

  const checkPrice = (cnName: string, currentPrice: number, isRmbMode: boolean): PriceAnalysisResult | null => {
    if (!cnName || isNaN(currentPrice) || currentPrice <= 0) return null;
    
    const checkCurrency = isRmbMode ? 'CNY' : (currentCurrency || 'USD').toUpperCase();
    const key = `${cnName.trim()}|${checkCurrency}`;
    const history = historyMap.get(key);
    
    // 至少需要 3 个历史数据点才能建立可靠的基准
    if (!history || history.length < 3) return null; 

    const sum = history.reduce((a, b) => a + b, 0);
    const avg = sum / history.length;
    
    if (avg === 0) return null;

    // 阈值：30% 偏离度
    const deviationRatio = (currentPrice - avg) / avg;
    const isHigh = deviationRatio > 0.3; 
    const isLow = deviationRatio < -0.3; 
    
    if (!isHigh && !isLow) return null;

    return {
      isOutlier: true,
      avg: avg.toFixed(4),
      min: Math.min(...history).toFixed(4),
      max: Math.max(...history).toFixed(4),
      deviation: (Math.abs(deviationRatio) * 100).toFixed(0),
      type: isHigh ? 'high' : 'low'
    };
  };

  return { checkPrice };
};
