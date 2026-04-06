// src/components/pos/ReceiptPrint.tsx
import { useRef } from 'react';
import type { InvoiceItem, PaymentMethod } from '@/types';
import type { Transaction } from '@/api/transaction';
import { useSettingsQuery } from '@/hooks/api/useSettings';

interface ReceiptPrintProps {
  transaction: Transaction | null;
  items: InvoiceItem[];
  customerName: string;
  customerId?: string;
  subtotal: number;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  due: number;
  cashierName?: string;
  onPrintComplete?: () => void;
}

export function useReceiptPrint() {
  const printIframeRef = useRef<HTMLIFrameElement | null>(null);
 const { data: settings } = useSettingsQuery();
  const printReceipt = (data: ReceiptPrintProps) => {
    const {
      transaction,
      items,
      customerName,
      customerId,
      subtotal,
      discountAmount,
      discountType,
      discountValue,
      total,
      paymentMethod,
      amountPaid,
      due,
      cashierName,
      onPrintComplete
    } = data;

    // Get settings - in a real implementation, you'd need to pass settings or fetch them
    // For now, we'll use a fallback or you can pass settings as a parameter
    const currencySymbol = settings?.currency; // Default fallback
    
    const now = new Date();
    const dateTime = now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const changeAmount = amountPaid > total ? amountPaid - total : 0;
    const paidAmount = amountPaid;
    const dueAmount = due;

   const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${transaction?.transactionNumber || 'Transaction'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', 'Monaco', monospace;
      font-size: 10.5px;
      width: 72mm;
      margin: 0 auto;
      padding: 4mm 3mm;
      background: white;
      line-height: 1.25;
    }
    .receipt { width: 100%; }

    .header { 
      text-align: center; 
      margin-bottom: 6px; 
      padding-bottom: 5px; 
      border-bottom: 1.5px solid #000; 
    }
    .store-name { 
      font-size: 15px; 
      font-weight: bold; 
      letter-spacing: 1.2px; 
      margin-bottom: 3px;
    }
    .store-info { 
      font-size: 9px; 
      line-height: 1.3; 
      color: #333; 
    }

    .transaction-info { 
      margin: 7px 0 8px 0; 
    }
    .transaction-info p { 
      margin: 2px 0; 
      font-size: 10px;
    }
    .transaction-info strong { font-weight: bold; }

    .items-table { 
      width: 100%; 
      margin: 7px 0; 
      border-collapse: collapse; 
    }
    .items-table th {
      font-size: 10px;
      padding: 4px 0 5px 0;
      border-bottom: 1.5px solid #000;
      text-align: center;
      font-weight: bold;
    }
    .items-table td {
      padding: 4px 2px;
      border-bottom: 1px dotted #ccc;
      vertical-align: top;
    }

    .item-name-col { text-align: left; width: 46%; }
    .item-qty-col { text-align: center; width: 12%; }
    .item-price-col { text-align: right; width: 18%; }
    .item-total-col { text-align: right; width: 24%; }

    .item-name {
      font-size: 10px;
      line-height: 1.3;
      word-wrap: break-word;
      white-space: normal;
    }
    .item-discount {
      display: inline-block;
      font-size: 8px;
      color: #d32f2f;
      background: #fff0f0;
      padding: 1px 4px;
      border-radius: 2px;
      margin-top: 2px;
    }

    .item-qty, .item-price, .item-total {
      font-size: 10px;
      font-family: 'Courier New', monospace;
    }
    .item-total { font-weight: 600; }

    .totals { 
      margin: 8px 0 6px 0; 
      padding-top: 6px; 
      border-top: 1.5px solid #000; 
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      font-size: 10px;
    }
    .totals-row.total {
      font-size: 11.5px;
      font-weight: bold;
      margin-top: 7px;
      padding-top: 6px;
      border-top: 1.5px solid #000;
    }
    .totals-row .value { 
      font-weight: 600; 
      font-family: 'Courier New', monospace; 
    }

    .payment-info {
      margin: 8px 0;
      padding: 6px 0;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
    }
    .payment-info .totals-row { margin: 3px 0; }

    .thankyou { 
      text-align: center; 
      font-size: 11px; 
      font-weight: bold; 
      margin: 8px 0 5px 0; 
      letter-spacing: 0.8px;
    }

    .footer { 
      text-align: center; 
      margin-top: 8px; 
      padding-top: 6px; 
      border-top: 1px solid #000; 
      font-size: 8.2px; 
      color: #555; 
      line-height: 1.35;
    }

    .void-badge {
      color: #d32f2f;
      font-weight: bold;
      font-size: 11px;
      background: #fff0f0;
      padding: 3px 7px;
      display: inline-block;
      margin: 4px 0;
    }

    @media print {
      body { margin: 0; padding: 3mm; }
      @page { margin: 0; size: auto; }
      .item-discount, .void-badge { 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="store-name">AUTOPOS</div>
      <div class="store-info">123 Business Street</div>
      <div class="store-info">Tel: (555) 123-4567</div>
    
    </div>

    <div class="transaction-info">
      <p><strong>Receipt #:</strong> ${transaction?.transactionNumber || transaction?.id?.slice(-8) || 'N/A'}</p>
      <p><strong>Date:</strong> ${dateTime}</p>
      <p><strong>Cashier:</strong> ${cashierName || 'Staff'}</p>
      ${transaction?.status === 'void' ? '<p><span class="void-badge">** VOIDED TRANSACTION **</span></p>' : ''}
      <p><strong>Customer:</strong> ${(customerName || 'Walk-in Customer').substring(0, 28)}</p>
      ${customerId ? `<p><strong>Customer ID:</strong> ${String(customerId).slice(-8)}</p>` : ''}
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th class="item-name-col">Item</th>
          <th class="item-qty-col">Qty</th>
          <th class="item-price-col">Price</th>
          <th class="item-total-col">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => {
          const hasDiscount = item.discount > 0;
          const discountedPrice = item.unitPrice * (1 - (item.discount || 0) / 100);
          return `
            <tr>
              <td class="item-name-col">
                <div class="item-name">
                  ${item.name.substring(0, 32)}
                  ${hasDiscount ? `<div class="item-discount">-${item.discount}% (${currencySymbol}${discountedPrice.toFixed(2)})</div>` : ''}
                </div>
              </td>
              <td class="item-qty-col"><div class="item-qty">${item.quantity}</div></td>
              <td class="item-price-col"><div class="item-price">${(item.unitPrice || 0).toFixed(2)}</div></td>
              <td class="item-total-col"><div class="item-total">${(item.total || 0).toFixed(2)}</div></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span class="label">Subtotal</span>
        <span class="value">${currencySymbol} ${subtotal.toFixed(2)}</span>
      </div>
      ${discountAmount > 0 ? `
        <div class="totals-row">
          <span class="label">Discount</span>
          <span class="value" style="color:#d32f2f;">${currencySymbol} -${discountAmount.toFixed(2)}</span>
        </div>
      ` : ''}
      <div class="totals-row total">
        <span class="label">TOTAL</span>
        <span class="value">${currencySymbol} ${total.toFixed(2)}</span>
      </div>
    </div>

    <div class="payment-info">
      <div class="totals-row">
        <span class="label">Payment Method</span>
        <span class="value" style="text-transform:uppercase;">${paymentMethod}</span>
      </div>
      <div class="totals-row">
        <span class="label">Amount Paid</span>
        <span class="value">${currencySymbol} ${paidAmount.toFixed(2)}</span>
      </div>
      ${changeAmount > 0 ? `
        <div class="totals-row">
          <span class="label">Change</span>
          <span class="value" style="color:#2e7d32;">${currencySymbol} ${changeAmount.toFixed(2)}</span>
        </div>
      ` : ''}
      ${dueAmount > 0 ? `
        <div class="totals-row">
          <span class="label">Due</span>
          <span class="value" style="color:#d32f2f;">${currencySymbol} ${dueAmount.toFixed(2)}</span>
        </div>
      ` : ''}
    </div>

    <div class="thankyou">THANK YOU FOR YOUR BUSINESS!</div>

    <div class="footer">
      <div>No refunds without receipt • Return within 7 days</div>
      <div>www.autopos.com</div>
      <div style="margin-top: 4px;">** Computer Generated Receipt **</div>
    </div>
  </div>
</body>
</html>
`;

    // Create iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(receiptHTML);
      iframeDoc.close();

      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      iframe.contentWindow?.addEventListener('afterprint', () => {
        document.body.removeChild(iframe);
        if (onPrintComplete) onPrintComplete();
      }, { once: true });
    }
  };

  return { printReceipt };
}