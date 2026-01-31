
import { useMemo } from 'react';
import { HeaderInfo } from '../types';

export const sNum = (val: any) => {
  const n = parseFloat(String(val));
  return isNaN(n) ? 0 : n;
};

export const useSettlementCalculations = (header: HeaderInfo) => {
  return useMemo(() => {
    const actualFxItems = (header.fxItems || []).filter(item => sNum(item.amount) > 0 || sNum(item.rate) > 0);
    const totalFXRevenue = actualFxItems.reduce((sum, item) => sum + (sNum(item.amount) * sNum(item.rate)), 0);
    
    const actualCostItems = (header.costItems || []).filter(item => sNum(item.amount) > 0 || sNum(item.taxRefundRate) > 0 || item.supplierName);
    const totalPurchaseCost = actualCostItems.reduce((sum, item) => sum + sNum(item.amount), 0);

    const totalTaxRefund = actualCostItems.reduce((sum, item) => {
       const cost = sNum(item.amount);
       const refundRate = sNum(item.taxRefundRate) / 100;
       // Default VAT rate is 13% if not specified or zero/empty (though 0 is valid for exempt, we treat undefined/empty as default)
       // To support 0% VAT specifically, we check for undefined or empty string.
       const vatRateVal = (item.vatRate !== undefined && item.vatRate !== '') ? sNum(item.vatRate) : 13;
       const vatRate = vatRateVal / 100;
       
       return sum + (cost / (1 + vatRate) * refundRate);
    }, 0);

    const calculatedAgencyFee = totalFXRevenue * sNum(header.agencyFeeRate);
    const minAgencyFee = sNum(header.minAgencyFee);
    const finalAgencyFee = (calculatedAgencyFee === 0 && minAgencyFee === 0) ? 0 : Math.max(calculatedAgencyFee, minAgencyFee);
    
    const stampDuty = (totalFXRevenue + totalPurchaseCost) * 0.0003;
    const calculableExtraExpenses = (header.extraExpenses || []).filter(ex => sNum(ex.amount) > 0 || ex.name);
    const extraExpensesTotal = calculableExtraExpenses.reduce((sum, ex) => sum + sNum(ex.amount), 0);

    const totalExpenses = finalAgencyFee + 
                          sNum(header.exLumpSum) + 
                          sNum(header.exOceanRMB) + 
                          sNum(header.exCertFee) + 
                          sNum(header.exDomesticExpress) + 
                          sNum(header.exIntlExpress) + 
                          sNum(header.exInsuranceRMB) + 
                          sNum(header.exCommissionRMB) + 
                          sNum(header.exBuyingDocs) + 
                          extraExpensesTotal +
                          stampDuty;

    const grossProfit = totalFXRevenue + totalTaxRefund - totalPurchaseCost - totalExpenses;

    return { 
        totalFXRevenue, 
        totalPurchaseCost, 
        totalTaxRefund, 
        finalAgencyFee, 
        stampDuty, 
        totalExpenses, 
        grossProfit,
        validFXItems: actualFxItems,
        validCostItems: actualCostItems,
        calculableExtraExpenses
    };
  }, [header]);
};
