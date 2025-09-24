import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from './utils';

export interface ExportData {
  insights: {
    totalSpent: number;
    totalIncome: number;
    netSavings: number;
    avgDailySpending: number;
    topSpendingCategory: string;
    budgetPerformance: number;
  };
  spendingTrends: Array<{
    date: string;
    spending: number;
    income: number;
    netFlow: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  budgetComparison: Array<{
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
    status: 'over' | 'under' | 'on_track';
  }>;
  timeframe: string;
  generatedAt: string;
  userName?: string;
  userEmail?: string;
}

/**
 * Generate PDF report from analytics data
 */
export const generatePDFReport = (data: ExportData): void => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.text('MoneyQuestV3 Financial Report', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.text(`Generated: ${data.generatedAt}`, 20, yPosition);
  yPosition += 5;
  doc.text(`Period: ${data.timeframe}`, 20, yPosition);
  yPosition += 15;

  if (data.userName && data.userEmail) {
    doc.text(`User: ${data.userName} (${data.userEmail})`, 20, yPosition);
    yPosition += 15;
  }

  // Financial Summary
  doc.setFontSize(16);
  doc.text('Financial Summary', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  const summaryData = [
    ['Total Spent:', formatCurrency(data.insights.totalSpent)],
    ['Total Income:', formatCurrency(data.insights.totalIncome)],
    ['Net Savings:', formatCurrency(data.insights.netSavings)],
    ['Avg Daily Spending:', formatCurrency(data.insights.avgDailySpending)],
    ['Top Category:', data.insights.topSpendingCategory],
    ['Budget Performance:', `${data.insights.budgetPerformance.toFixed(1)}%`]
  ];

  summaryData.forEach(([label, value]) => {
    doc.text(label, 20, yPosition);
    doc.text(value, 100, yPosition);
    yPosition += 7;
  });

  yPosition += 10;

  // Category Breakdown
  if (data.categoryBreakdown.length > 0) {
    doc.setFontSize(16);
    doc.text('Spending by Category', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text('Category', 20, yPosition);
    doc.text('Amount', 80, yPosition);
    doc.text('Percentage', 130, yPosition);
    yPosition += 7;

    // Draw line
    doc.line(20, yPosition - 2, 180, yPosition - 2);
    yPosition += 2;

    data.categoryBreakdown.slice(0, 10).forEach((category) => {
      doc.text(category.category, 20, yPosition);
      doc.text(formatCurrency(category.amount), 80, yPosition);
      doc.text(`${category.percentage.toFixed(1)}%`, 130, yPosition);
      yPosition += 6;
    });

    yPosition += 10;
  }

  // Budget Performance
  if (data.budgetComparison.length > 0) {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.text('Budget vs Actual', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text('Category', 20, yPosition);
    doc.text('Budgeted', 80, yPosition);
    doc.text('Actual', 120, yPosition);
    doc.text('Status', 160, yPosition);
    yPosition += 7;

    // Draw line
    doc.line(20, yPosition - 2, 180, yPosition - 2);
    yPosition += 2;

    data.budgetComparison.forEach((budget) => {
      doc.text(budget.category, 20, yPosition);
      doc.text(formatCurrency(budget.budgeted), 80, yPosition);
      doc.text(formatCurrency(budget.actual), 120, yPosition);

      // Color code status
      if (budget.status === 'over') {
        doc.setTextColor(220, 38, 38); // Red
      } else if (budget.status === 'under') {
        doc.setTextColor(34, 197, 94); // Green
      } else {
        doc.setTextColor(59, 130, 246); // Blue
      }

      doc.text(budget.status.replace('_', ' '), 160, yPosition);
      doc.setTextColor(0, 0, 0); // Reset to black

      yPosition += 6;

      // Check for page break
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, 170, 285);
    doc.text('MoneyQuestV3 - Personal Finance Management', 20, 285);
  }

  // Download the PDF
  const fileName = `MoneyQuest_Report_${data.timeframe}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

/**
 * Generate Excel report from analytics data
 */
export const generateExcelReport = (data: ExportData): void => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['MoneyQuestV3 Financial Report'],
    [],
    ['Generated:', data.generatedAt],
    ['Period:', data.timeframe],
    ['User:', data.userEmail || 'N/A'],
    [],
    ['FINANCIAL SUMMARY'],
    ['Total Spent', data.insights.totalSpent],
    ['Total Income', data.insights.totalIncome],
    ['Net Savings', data.insights.netSavings],
    ['Average Daily Spending', data.insights.avgDailySpending],
    ['Top Spending Category', data.insights.topSpendingCategory],
    ['Budget Performance (%)', data.insights.budgetPerformance],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  // Format the summary sheet
  summarySheet['!cols'] = [
    { wch: 25 }, // Column A width
    { wch: 20 }  // Column B width
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Spending Trends sheet
  if (data.spendingTrends.length > 0) {
    const trendsData = [
      ['Date', 'Spending', 'Income', 'Net Flow'],
      ...data.spendingTrends.map(trend => [
        trend.date,
        trend.spending,
        trend.income,
        trend.netFlow
      ])
    ];

    const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
    trendsSheet['!cols'] = [
      { wch: 15 }, // Date
      { wch: 12 }, // Spending
      { wch: 12 }, // Income
      { wch: 12 }  // Net Flow
    ];

    XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Spending Trends');
  }

  // Category Breakdown sheet
  if (data.categoryBreakdown.length > 0) {
    const categoryData = [
      ['Category', 'Amount', 'Percentage'],
      ...data.categoryBreakdown.map(cat => [
        cat.category,
        cat.amount,
        cat.percentage / 100 // Excel percentage format
      ])
    ];

    const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
    categorySheet['!cols'] = [
      { wch: 20 }, // Category
      { wch: 15 }, // Amount
      { wch: 12 }  // Percentage
    ];

    // Format percentage column
    const range = XLSX.utils.decode_range(categorySheet['!ref'] || 'A1');
    for (let i = 1; i <= range.e.r; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: i, c: 2 });
      if (categorySheet[cellRef]) {
        categorySheet[cellRef].t = 'n';
        categorySheet[cellRef].z = '0.0%';
      }
    }

    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Categories');
  }

  // Budget Comparison sheet
  if (data.budgetComparison.length > 0) {
    const budgetData = [
      ['Category', 'Budgeted', 'Actual', 'Variance', 'Status'],
      ...data.budgetComparison.map(budget => [
        budget.category,
        budget.budgeted,
        budget.actual,
        budget.variance,
        budget.status.replace('_', ' ')
      ])
    ];

    const budgetSheet = XLSX.utils.aoa_to_sheet(budgetData);
    budgetSheet['!cols'] = [
      { wch: 20 }, // Category
      { wch: 12 }, // Budgeted
      { wch: 12 }, // Actual
      { wch: 12 }, // Variance
      { wch: 12 }  // Status
    ];

    XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Budget vs Actual');
  }

  // Generate and download the file
  const fileName = `MoneyQuest_Data_${data.timeframe}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Prepare export data from analytics state
 */
export const prepareExportData = (
  insights: any,
  spendingTrends: any[],
  categoryBreakdown: any[],
  budgetComparison: any[],
  timeframe: string,
  userName?: string,
  userEmail?: string
): ExportData => {
  return {
    insights,
    spendingTrends,
    categoryBreakdown,
    budgetComparison,
    timeframe,
    generatedAt: new Date().toLocaleString(),
    userName,
    userEmail
  };
};

/**
 * Export analytics data as CSV (simple fallback)
 */
export const generateCSVExport = (data: ExportData): void => {
  const csvContent: string[] = [];

  // Header
  csvContent.push('MoneyQuestV3 Financial Report');
  csvContent.push(`Generated: ${data.generatedAt}`);
  csvContent.push(`Period: ${data.timeframe}`);
  csvContent.push('');

  // Summary
  csvContent.push('FINANCIAL SUMMARY');
  csvContent.push(`Total Spent,${data.insights.totalSpent}`);
  csvContent.push(`Total Income,${data.insights.totalIncome}`);
  csvContent.push(`Net Savings,${data.insights.netSavings}`);
  csvContent.push(`Average Daily Spending,${data.insights.avgDailySpending}`);
  csvContent.push(`Top Category,${data.insights.topSpendingCategory}`);
  csvContent.push(`Budget Performance,${data.insights.budgetPerformance}%`);
  csvContent.push('');

  // Categories
  if (data.categoryBreakdown.length > 0) {
    csvContent.push('SPENDING BY CATEGORY');
    csvContent.push('Category,Amount,Percentage');
    data.categoryBreakdown.forEach(cat => {
      csvContent.push(`${cat.category},${cat.amount},${cat.percentage}%`);
    });
    csvContent.push('');
  }

  // Budget data
  if (data.budgetComparison.length > 0) {
    csvContent.push('BUDGET VS ACTUAL');
    csvContent.push('Category,Budgeted,Actual,Variance,Status');
    data.budgetComparison.forEach(budget => {
      csvContent.push(`${budget.category},${budget.budgeted},${budget.actual},${budget.variance},${budget.status}`);
    });
  }

  // Create and download the file
  const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `MoneyQuest_Export_${data.timeframe}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};