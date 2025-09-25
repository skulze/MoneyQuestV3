import { createWorker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface ParsedReceipt {
  merchant: string;
  amount: number;
  date: string;
  items: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
  rawText: string;
  confidence: number;
}

class OCRService {
  private worker: Tesseract.Worker | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔍 Initializing OCR engine...');
      this.worker = await createWorker('eng');

      // Configure Tesseract for better receipt reading with more characters
      await this.worker.setParameters({
        'tessedit_char_whitelist': '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,$/:-#%*()&@+ ',
        'tessedit_pageseg_mode': '4', // Assume single column of text of variable sizes
        'preserve_interword_spaces': '1',
        'tessedit_create_hocr': '1', // Enable detailed position data
        'textord_min_linesize': '1.25', // Minimum line size (helps with small numbers)
        'textord_tabfind_find_tables': '1', // Enable table detection for receipt columns
        'textord_tablefind_good_width': '3', // Better column detection
        'textord_tabfind_show_vlines': '1' // Show vertical lines for debugging
      });

      this.isInitialized = true;
      console.log('✅ OCR engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OCR engine:', error);
      throw new Error('Failed to initialize OCR engine');
    }
  }

  private async preprocessImage(imageFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Add padding around the image to prevent edge cropping
        const padding = 20;
        canvas.width = img.width + (padding * 2);
        canvas.height = img.height + (padding * 2);

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw original image with padding
        ctx.drawImage(img, padding, padding);

        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Convert to grayscale and increase contrast (more aggressive for small text)
        for (let i = 0; i < data.length; i += 4) {
          const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);

          // More aggressive contrast enhancement for small numbers
          const contrast = 2.0; // Increased from 1.5
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          let enhanced = factor * (gray - 128) + 128;

          // Apply threshold to make small text more distinct
          if (enhanced < 128) {
            enhanced = Math.max(0, enhanced * 0.7); // Make dark areas darker
          } else {
            enhanced = Math.min(255, enhanced * 1.2); // Make light areas lighter
          }

          data[i] = enhanced;     // Red
          data[i + 1] = enhanced; // Green
          data[i + 2] = enhanced; // Blue
          // Alpha stays the same
        }

        // Put the processed image data back
        ctx.putImageData(imageData, 0, 0);

        // Convert to data URL
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(imageFile);
    });
  }

  private reconstructAlignedText(ocrData: any): string {
    if (!ocrData.lines || ocrData.lines.length === 0) {
      return ocrData.text || '';
    }

    console.log('🔧 Reconstructing aligned text from', ocrData.lines.length, 'lines');

    const lines: string[] = [];

    for (const line of ocrData.lines) {
      if (!line.words || line.words.length === 0) continue;

      // Sort words by x position (left to right)
      const sortedWords = [...line.words].sort((a, b) => a.bbox.x0 - b.bbox.x0);

      let lineText = '';
      let lastX = 0;

      for (let i = 0; i < sortedWords.length; i++) {
        const word = sortedWords[i];
        const wordText = word.text.trim();

        if (wordText.length === 0) continue;

        // Calculate spacing needed based on x-position
        const currentX = word.bbox.x0;
        const wordWidth = word.bbox.x1 - word.bbox.x0;

        if (i > 0) {
          // Calculate gap between this word and previous word
          const gap = currentX - lastX;
          const avgCharWidth = 10; // Approximate character width
          const spacesNeeded = Math.max(1, Math.floor(gap / avgCharWidth));

          // Add appropriate spacing (but cap it to prevent excessive spacing)
          lineText += ' '.repeat(Math.min(spacesNeeded, 20));
        }

        lineText += wordText;
        lastX = word.bbox.x1;
      }

      if (lineText.trim().length > 0) {
        lines.push(lineText);
      }
    }

    const reconstructedText = lines.join('\n');
    console.log('✅ Reconstructed text with alignment:', reconstructedText.substring(0, 200) + '...');
    return reconstructedText;
  }

  async processReceiptImage(imageFile: File): Promise<OCRResult> {
    if (!this.worker || !this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('📄 Preprocessing receipt image...');
      const preprocessedImage = await this.preprocessImage(imageFile);

      console.log('🔍 Processing receipt image with OCR...');
      const result = await this.worker!.recognize(preprocessedImage);

      console.log('✅ OCR completed', {
        confidence: result.data.confidence,
        textLength: result.data.text.length,
        wordsFound: result.data.words?.length || 0
      });

      // Reconstruct text with better alignment using word positions
      const alignedText = this.reconstructAlignedText(result.data);

      return {
        text: alignedText,
        confidence: result.data.confidence
      };
    } catch (error) {
      console.error('❌ OCR processing failed:', error);
      throw new Error('Failed to process image with OCR');
    }
  }

  parseReceiptText(ocrText: string, confidence: number): ParsedReceipt {
    console.log('🔍 Parsing receipt text...');
    console.log('Raw OCR text:', ocrText);

    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Extract merchant name (usually first or second line)
    const merchant = this.extractMerchant(lines);

    // Extract line items FIRST (including tax)
    const items = this.extractItems(lines);

    // Extract total amount using the new rule
    const amount = this.extractValidatedTotal(lines, items);

    // Extract date
    const date = this.extractDate(lines);

    const parsed: ParsedReceipt = {
      merchant,
      amount,
      date,
      items,
      rawText: ocrText,
      confidence: Math.max(confidence * 0.8, 60) // Adjust confidence for parsing uncertainty
    };

    console.log('✅ Receipt parsed successfully:', parsed);
    return parsed;
  }

  private extractMerchant(lines: string[]): string {
    // Common merchant patterns to look for
    const merchantPatterns = [
      /^([A-Za-z\s&'.-]{3,40})$/,
      /^([A-Z\s&'.-]{3,40})\s+STORE/,
      /^([A-Z\s&'.-]{3,40})\s+MARKET/,
      /^([A-Z\s&'.-]{3,40})\s+INC/
    ];

    // Look for merchant name in first 7 lines
    for (let i = 0; i < Math.min(7, lines.length); i++) {
      const line = lines[i].trim();

      // Skip obviously non-merchant lines
      if (line.match(/^\d+/) || line.includes('RECEIPT') || line.includes('INVOICE') ||
          line.includes('#') || line.includes('TEL') || line.includes('WWW') ||
          line.includes('@') || line.includes('.COM') || line.includes('STREET') ||
          line.includes('AVE') || line.includes('BLVD') || line.includes('RD') ||
          line.length < 3 || line.length > 50) {
        continue;
      }

      // Try merchant patterns
      for (const pattern of merchantPatterns) {
        const match = line.match(pattern);
        if (match) {
          return match[1].trim().toUpperCase();
        }
      }

      // If no pattern matches but line looks like merchant name
      if (line.match(/^[A-Za-z\s&'.-]+$/) && line.length >= 3 && line.length <= 40) {
        // Check if it's not a common non-merchant word
        const nonMerchantWords = ['THANK', 'YOU', 'VISIT', 'AGAIN', 'CUSTOMER', 'COPY'];
        if (!nonMerchantWords.some(word => line.includes(word))) {
          return line.toUpperCase();
        }
      }
    }

    return 'UNKNOWN MERCHANT';
  }

  private extractValidatedTotal(lines: string[], items: Array<{ name: string; price: number; quantity?: number }>): number {
    console.log('🔍 Looking for total that matches item sum...');

    // Calculate expected total from items
    const itemsTotal = items.reduce((sum, item) => sum + item.price, 0);
    console.log(`Items sum to: $${itemsTotal.toFixed(2)}`);

    // Look specifically for "Total" followed by dollar amount
    const totalPatterns = [
      /TOTAL\s+[$]?(\d+\.\d{2})/i,           // "TOTAL $12.34"
      /TOTAL\s*:\s*[$]?(\d+\.\d{2})/i,      // "TOTAL: $12.34"
      /TOTAL.*?[$](\d+\.\d{2})/i,           // "TOTAL xxx $12.34"
    ];

    const foundTotals: Array<{ amount: number; line: string }> = [];

    // Find all potential totals
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      for (const pattern of totalPatterns) {
        const match = line.match(pattern);
        if (match) {
          const amount = parseFloat(match[1]);
          if (!isNaN(amount) && amount > 0) {
            foundTotals.push({ amount, line });
            console.log(`Found potential total: $${amount} in "${line}"`);
          }
        }
      }
    }

    // If we have items, try to match total to items sum
    if (itemsTotal > 0 && foundTotals.length > 0) {
      console.log('Validating totals against items sum...');

      for (const total of foundTotals) {
        const difference = Math.abs(total.amount - itemsTotal);
        console.log(`Total $${total.amount} vs Items $${itemsTotal.toFixed(2)} - difference: $${difference.toFixed(2)}`);

        // Allow small rounding differences (±$0.05)
        if (difference <= 0.05) {
          console.log(`✅ Found matching total: $${total.amount}`);
          return total.amount;
        }
      }

      // If no exact match, look for closest total that's reasonable
      const sortedByCloseness = foundTotals.sort((a, b) =>
        Math.abs(a.amount - itemsTotal) - Math.abs(b.amount - itemsTotal)
      );

      const closest = sortedByCloseness[0];
      if (closest && Math.abs(closest.amount - itemsTotal) <= itemsTotal * 0.1) { // Within 10%
        console.log(`⚠️ Using closest total: $${closest.amount} (${Math.abs(closest.amount - itemsTotal).toFixed(2)} difference)`);
        return closest.amount;
      }
    }

    // Fallback: use any "Total" we found
    if (foundTotals.length > 0) {
      console.log(`⚠️ Using first total found: $${foundTotals[0].amount}`);
      return foundTotals[0].amount;
    }

    // Final fallback: use items sum if we have items
    if (itemsTotal > 0) {
      console.log(`⚠️ No total found, using items sum: $${itemsTotal.toFixed(2)}`);
      return itemsTotal;
    }

    // Last resort: use old method
    console.log('⚠️ Falling back to old total extraction method');
    return this.extractTotalAmount(lines);
  }

  private extractTotalAmount(lines: string[]): number {
    // Enhanced total amount patterns
    const totalPatterns = [
      /TOTAL.*?[$]?(\d+\.?\d{2})/i,
      /AMOUNT\s+DUE.*?[$]?(\d+\.?\d{2})/i,
      /BALANCE.*?[$]?(\d+\.?\d{2})/i,
      /GRAND\s+TOTAL.*?[$]?(\d+\.?\d{2})/i,
      /FINAL\s+TOTAL.*?[$]?(\d+\.?\d{2})/i,
      /[$](\d+\.\d{2})\s*$/, // Line ending with currency amount
      /(\d+\.\d{2})\s*TOTAL/i,
      /TOTAL\s+[$]?(\d+\.\d{2})/i,
      /[$]\s*(\d+\.\d{2})\s*TOTAL/i
    ];

    console.log('🔍 Looking for total amount in lines:', lines.slice(-10));

    // Search from bottom up as totals are usually at the end
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 15); i--) {
      const line = lines[i].trim();

      if (line.length === 0) continue;

      console.log(`Checking line ${i}: "${line}"`);

      for (const pattern of totalPatterns) {
        const match = line.match(pattern);
        if (match) {
          const amount = parseFloat(match[1]);
          console.log(`Found potential total: ${amount} from pattern: ${pattern}`);
          if (!isNaN(amount) && amount > 0 && amount < 10000) {
            console.log(`✅ Using total amount: ${amount}`);
            return amount;
          }
        }
      }
    }

    console.log('⚠️ No clear total found, looking for largest amount');

    // If no clear total found, look for largest reasonable amount
    const amounts: number[] = [];
    lines.forEach((line, index) => {
      // Look for money amounts: $X.XX or X.XX
      const matches = line.match(/[$]?(\d+\.\d{2})/g) || [];
      matches.forEach(match => {
        const amount = parseFloat(match.replace('$', ''));
        if (!isNaN(amount) && amount > 0 && amount < 10000) {
          console.log(`Found amount ${amount} on line ${index}: "${line}"`);
          amounts.push(amount);
        }
      });
    });

    const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
    console.log(`Using largest amount found: ${maxAmount}`);
    return maxAmount;
  }

  private extractDate(lines: string[]): string {
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
      /(\d{1,2}-\d{1,2}-\d{2,4})/,
      /(\d{4}-\d{2}-\d{2})/,
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec).*?(\d{1,2}),?\s*(\d{4})/i
    ];

    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          try {
            // Try to parse and normalize the date
            const dateStr = match[0];
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
            }
          } catch (e) {
            continue;
          }
        }
      }
    }

    // Default to today if no date found
    return new Date().toISOString().split('T')[0];
  }

  private extractItems(lines: string[]): Array<{ name: string; price: number; quantity?: number }> {
    const items: Array<{ name: string; price: number; quantity?: number }> = [];

    console.log('🔍 Extracting items from lines...');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) continue;

      // Enhanced item patterns
      const itemPatterns = [
        /^(\d+)\s+(.+?)\s+[$]?(\d+\.\d{2})$/,        // "2 BANANAS $3.99"
        /^(\d+)\s+(.+?)\s+(\d+\.\d{2})\s*$/,         // "2 BANANAS 3.99"
        /^(.+?)\s{2,}[$]?(\d+\.\d{2})$/,             // "BANANAS    $3.99" (multiple spaces)
        /^(.+?)\s+[$](\d+\.\d{2})$/,                 // "BANANAS $3.99"
        /^(.+?)\s+(\d+\.\d{2})\s*$/,                 // "BANANAS 3.99"
        /^(.{3,30}?)\s+(\d{1,3}\.\d{2})$/            // Generic: name followed by price
      ];

      for (const pattern of itemPatterns) {
        const match = line.match(pattern);
        if (match) {
          let quantity: number | undefined;
          let name: string;
          let price: number;

          if (match.length === 4) {
            // Pattern with quantity
            quantity = parseInt(match[1]);
            name = match[2].trim();
            price = parseFloat(match[3]);
          } else {
            // Pattern without quantity
            name = match[1].trim();
            price = parseFloat(match[2]);
          }

          // Check if this is a tax item (include it!)
          const isTaxItem = /TAX|HST|GST|PST|VAT/i.test(name) || /TAX|HST|GST|PST|VAT/i.test(line);

          // Enhanced filtering for non-item lines (but allow tax items)
          const excludePatterns = [
            /TOTAL|SUBTOTAL|CHANGE|BALANCE|RECEIPT|STORE|THANK|VISIT|AGAIN|CUSTOMER|COPY/i,
            /^(SUB|GRAND|FINAL)/i,
            /PAYMENT|CASH|CREDIT|DEBIT|CARD/i,
            /^(DATE|TIME|CLERK|CASHIER)/i,
            /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // Date patterns
            /^\d{2}:\d{2}/, // Time patterns
          ];

          const shouldExclude = !isTaxItem && (
            excludePatterns.some(pattern => pattern.test(name)) ||
            excludePatterns.some(pattern => pattern.test(line))
          );

          if (name && !shouldExclude &&
              name.length >= 2 && name.length <= 50 &&
              price > 0 && price <= 1000 &&
              !name.match(/^\d+$/) && // Not just numbers
              name.match(/[A-Za-z]/)  // Contains at least one letter
          ) {

            const itemType = isTaxItem ? ' [TAX]' : '';
            console.log(`✅ Found item: "${name}" - $${price}` + (quantity ? ` (qty: ${quantity})` : '') + itemType);

            items.push({
              name: name.toUpperCase(),
              price,
              quantity
            });
          }
          break;
        }
      }
    }

    console.log(`Found ${items.length} items total`);
    return items;
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      console.log('🧹 OCR engine cleaned up');
    }
  }
}

// Export singleton instance
export const ocrService = new OCRService();