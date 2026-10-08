import ExcelJS from 'exceljs';
import XlsxPopulate from 'xlsx-populate/browser/xlsx-populate.min.js';
import saveAs from 'file-saver';

export const parseFile = async (file) => {
  if (file.name.toLowerCase().endsWith('.pdf')) {
    return parsePDFRaw(file);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(arrayBuffer);
        
        if (wb.worksheets.length === 0) {
          throw new Error("File Excel tidak memiliki lembar kerja (sheet).");
        }

        const sheetsData = [];

        wb.worksheets.forEach(worksheet => {
          const rawData = [];
          worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            const rowData = [];
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              while (rowData.length < colNumber - 1) rowData.push('');
              let cellStr = '';
              if (cell.value !== null && cell.value !== undefined) {
                if (typeof cell.value === 'object') {
                  if (cell.value.richText) cellStr = cell.value.richText.map(t => t.text).join('');
                  else if (cell.value.result !== undefined) cellStr = cell.value.result.toString();
                  else cellStr = cell.value.toString();
                } else {
                  cellStr = cell.value.toString();
                }
              }
              rowData.push(cellStr);
            });
            rawData[rowNumber - 1] = rowData; 
          });

          for (let i = 0; i < rawData.length; i++) {
            if (!rawData[i]) rawData[i] = [];
          }

          const allRows = rawData;
          let headerRowIndex = -1;
          let lastMeaningfulCol = -1;

          for (let i = 0; i < Math.min(30, allRows.length); i++) {
            const row = allRows[i] || [];
            for (let c = 0; c < row.length; c++) {
              const val = (row[c] || '').toString().toLowerCase();
              if (val.includes('nama barang') || val.includes('nama bahan') || val.includes('keterangan')) {
                headerRowIndex = i;
                
                for (let k = row.length - 1; k >= 0; k--) {
                  if ((row[k] || '').toString().trim() !== '') {
                    lastMeaningfulCol = k;
                    break;
                  }
                }
                break;
              }
            }
            if (headerRowIndex !== -1) break;
          }

          let dataStartRow = headerRowIndex !== -1 ? headerRowIndex + 1 : -1;
          let dataEndRow = dataStartRow;

          if (headerRowIndex !== -1) {
            for (let i = headerRowIndex + 1; i < allRows.length; i++) {
              const row = allRows[i] || [];
              const firstCell = (row[0] || '').toString().toLowerCase();
              const secondCell = (row[1] || '').toString().toLowerCase();
              if (firstCell.includes('total') || secondCell.includes('total')) {
                dataEndRow = i;
                break;
              }
              if (firstCell.trim() !== '' || (row[2] || '').toString().trim() !== '') {
                dataEndRow = i + 1;
              }
            }
          }

          let researcherName = '';
          const nameCell = worksheet.getCell('D8');
          if (nameCell && nameCell.value) {
            let n = '';
            if (typeof nameCell.value === 'object') {
              if (nameCell.value.richText) n = nameCell.value.richText.map(t => t.text).join('');
              else n = nameCell.value.toString();
            } else {
              n = nameCell.value.toString();
            }
            researcherName = n.trim();
          }

          sheetsData.push({
            sheetId: worksheet.id,
            sheetName: worksheet.name,
            type: 'structured',
            headers: headerRowIndex !== -1 ? allRows[headerRowIndex].slice(0, lastMeaningfulCol + 1) : [],
            data: headerRowIndex !== -1 ? allRows.slice(dataStartRow, dataEndRow).map(r => {
              const trimmed = r.slice(0, lastMeaningfulCol + 1);
              while (trimmed.length < lastMeaningfulCol + 1) trimmed.push('');
              return trimmed;
            }) : [],
            colCount: headerRowIndex !== -1 ? lastMeaningfulCol + 1 : 0,
            researcherName,
            headerRowIndex,
            dataStartRow,
            dataEndRow,
            lastMeaningfulCol: lastMeaningfulCol + 1, 
            allRows,
          });
        });

        resolve({
          rawBuffer: arrayBuffer,
          sheets: sheetsData
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

const parsePDFRaw = async (file) => {
  throw new Error("Maaf, pemrosesan file PDF belum didukung secara penuh untuk saat ini. Mohon unggah dokumen pengajuan dalam format Excel (.xlsx atau .xls) agar format dan tabelnya dapat dibaca dengan presisi.");
};

export const exportToExcel = async (filesData, extraColumns) => {
  // Option 3 Logic: We only expect ONE unified file with multiple sheets.
  // If the user uploads multiple files, we still process them independently and output a zip,
  // but if they follow instructions, they upload exactly 1 file with multiple sheets.
  
  if (filesData.length === 0) return;
  
  let outputWorkbook = null;
  const usedSheetNames = new Set();

  const getUniqueSheetName = (name) => {
    let safe = name.replace(/[\\/*?[\]:]/g, '').substring(0, 31) || 'Sheet';
    let candidate = safe;
    let counter = 2;
    while (usedSheetNames.has(candidate)) {
      candidate = safe.substring(0, 28) + ` (${counter})`;
      counter++;
    }
    usedSheetNames.add(candidate);
    return candidate;
  };

  const uniqueBuffers = new Set(filesData.map(f => f.parsed.rawBuffer));
  const isMultiple = uniqueBuffers.size > 1;

  if (isMultiple) {
    // If they uploaded multiple files, we use ExcelJS to merge them into ONE file.
    // WARNING: This completely destroys Picture in Cell (richData) images for all files.
    for (const fileEntry of filesData) {
      const { parsed, filename: srcFilename } = fileEntry;

      if (parsed.type === 'structured' && parsed.rawBuffer) {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(parsed.rawBuffer);
        
        const ws = wb.worksheets[0];
        const { headerRowIndex, lastMeaningfulCol } = parsed;
        const extraColNames = extraColumns.map(c => c.name);

        if (headerRowIndex >= 0) {
          const exHeaderRow = headerRowIndex + 1;
          const exLastCol = lastMeaningfulCol;

          const headerRow = ws.getRow(exHeaderRow);
          for (let ec = 0; ec < extraColNames.length; ec++) {
            const colNumber = exLastCol + 1 + ec;
            const cell = headerRow.getCell(colNumber);
            cell.value = extraColNames[ec];
            
            const prevCell = headerRow.getCell(exLastCol);
            if (prevCell.style) {
              cell.style = JSON.parse(JSON.stringify(prevCell.style));
            }
          }

          let dataEndRow = exHeaderRow;
          for (let i = exHeaderRow + 1; i <= ws.rowCount; i++) {
            const row = ws.getRow(i);
            const firstCell = (row.getCell(1).value || row.getCell(2).value || '').toString().trim().toUpperCase();
            if (firstCell.includes('TOTAL')) {
              dataEndRow = i;
              break;
            }
            if (firstCell !== '' || row.getCell(3).value) {
              dataEndRow = i + 1;
            }
          }

          for (let r = exHeaderRow + 1; r < dataEndRow; r++) {
            const row = ws.getRow(r);
            for (let ec = 0; ec < extraColNames.length; ec++) {
              const colNumber = exLastCol + 1 + ec;
              const cell = row.getCell(colNumber);
              const prevCell = row.getCell(exLastCol);
              
              if (prevCell.style) {
                cell.style = JSON.parse(JSON.stringify(prevCell.style));
              }
              
              const editedRow = parsed.allRows[r - 1] || [];
              const editedVal = editedRow[colNumber - 1]; 
              if (editedVal !== undefined && editedVal !== '') {
                cell.value = editedVal;
              }
            }
          }
        }

        let sheetLabel = parsed.researcherName || '';
        if (!sheetLabel) {
          const parts = srcFilename.replace(/\.[^.]+$/, '').split(/[_\-]/);
          sheetLabel = parts.length > 1 ? parts[1].trim() : parts[0].trim();
        }
        const nameParts = sheetLabel.split(' ').filter(Boolean);
        const cleaned = nameParts.filter(p => !p.match(/^(dr|prof|ir|m\.?|s\.?|st|mt|m\.eng|m\.si|m\.sc|drs|ph\.d)\.?,?$/i));
        if (cleaned.length > 0) sheetLabel = cleaned.join(' ');
        
        const uniqueName = getUniqueSheetName(sheetLabel);
        
        if (!outputWorkbook) {
          outputWorkbook = wb;
          outputWorkbook.worksheets[0].name = uniqueName;
        } else {
          const newWs = outputWorkbook.addWorksheet(uniqueName);
          
          if (ws.columns) {
            newWs.columns = ws.columns.map(c => ({
              width: c.width,
              style: c.style,
              hidden: c.hidden
            }));
          }

          ws.eachRow({ includeEmpty: true }, (row, rowNum) => {
            const outRow = newWs.getRow(rowNum);
            outRow.height = row.height;
            outRow.hidden = row.hidden;
            
            row.eachCell({ includeEmpty: true }, (cell, colNum) => {
              const outCell = outRow.getCell(colNum);
              outCell.value = cell.value;
              outCell.style = cell.style;
            });
          });

          if (ws._merges) {
            Object.values(ws._merges).forEach(merge => {
              newWs.mergeCells(merge);
            });
          }

          ws.getImages().forEach(img => {
            const image = wb.getImage(img.imageId);
            if (!image || !image.buffer) return;
            const newImageId = outputWorkbook.addImage({
              buffer: image.buffer,
              extension: image.extension,
            });
            const safeRange = {
              tl: { col: img.range.tl?.col, row: img.range.tl?.row },
              ext: img.range.ext,
              editAs: img.range.editAs
            };
            if (img.range.br && img.range.br.col !== undefined) {
              safeRange.br = { col: img.range.br.col, row: img.range.br.row };
            }
            newWs.addImage(newImageId, safeRange);
          });

          newWs.pageSetup = ws.pageSetup;
          newWs.views = ws.views;
        }
      }
    }

    if (!outputWorkbook) {
      outputWorkbook = new ExcelJS.Workbook();
      outputWorkbook.addWorksheet('Kosong').getCell('A1').value = 'Tidak ada data';
    }

    const outName = `RPD_Final_Gabungan_${filesData.length}_Peneliti.xlsx`;
    const buffer = await outputWorkbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), outName);

  } else {
    // SINGLE FILE - Multiple Sheets Processing
    const fileEntry = filesData[0];
    const { parsed, filename: srcFilename } = fileEntry;
    
    // We modify the original file's buffer exactly as it is using xlsx-populate!
    const wb = await XlsxPopulate.fromDataAsync(parsed.rawBuffer);
    const extraColNames = extraColumns.map(c => c.name);

    for (const sheetObj of parsed.sheets) {
      if (sheetObj.type === 'structured' && sheetObj.headerRowIndex >= 0) {
        const ws = wb.sheet(sheetObj.sheetName);
        if (ws) {
          const exHeaderRow = sheetObj.headerRowIndex + 1;
          const exLastCol = sheetObj.lastMeaningfulCol;

          for (let ec = 0; ec < extraColNames.length; ec++) {
            const colNumber = exLastCol + 1 + ec;
            const cell = ws.row(exHeaderRow).cell(colNumber);
            cell.value(extraColNames[ec]);
            
            const prevCell = ws.row(exHeaderRow).cell(exLastCol);
            const styleKeys = ['bold', 'italic', 'underline', 'strikethrough', 'fontSize', 'fontFamily', 'fontColor', 'horizontalAlignment', 'verticalAlignment', 'wrapText', 'fill', 'border', 'numberFormat'];
            styleKeys.forEach(k => {
              const v = prevCell.style(k);
              if (v !== undefined) cell.style(k, v);
            });
          }

          for (let r = exHeaderRow + 1; r <= sheetObj.dataEndRow; r++) {
            for (let ec = 0; ec < extraColNames.length; ec++) {
              const colNumber = exLastCol + 1 + ec;
              const cell = ws.row(r).cell(colNumber);
              const styleKeys = ['bold', 'italic', 'underline', 'strikethrough', 'fontSize', 'fontFamily', 'fontColor', 'horizontalAlignment', 'verticalAlignment', 'wrapText', 'fill', 'border', 'numberFormat'];
              styleKeys.forEach(k => {
                const v = prevCell.style(k);
                if (v !== undefined) cell.style(k, v);
              });
              
              const editedRow = sheetObj.allRows[r - 1] || [];
              const editedVal = editedRow[colNumber - 1]; 
              if (editedVal !== undefined && editedVal !== '') {
                cell.value(editedVal);
              }
            }
          }
        }
      }
    }

    const buffer = await wb.outputAsync();
    let outName = `RPD_Final_${srcFilename}`;
    if (!outName.toLowerCase().endsWith('.xlsx')) outName += '.xlsx';
    saveAs(new Blob([buffer]), outName);
  }
};
