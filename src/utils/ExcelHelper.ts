import * as ExcelJS from 'exceljs';
import * as path from 'path';

const DATA_FILE = path.resolve(__dirname, '../../test-data/datos_prueba.xlsx');

export class ExcelHelper {
  private readonly filePath: string;

  constructor(filePath: string = DATA_FILE) {
    this.filePath = filePath;
  }

  async readRow(sheetName: string, rowIndex: number): Promise<Record<string, string>> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.filePath);

    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) throw new Error(`Hoja "${sheetName}" no encontrada en ${this.filePath}`);

    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell) => {
      headers.push(String(cell.value ?? '').trim());
    });

    const dataRow = sheet.getRow(rowIndex + 1);
    const result: Record<string, string> = {};
    const timestamp = String(Date.now());

    headers.forEach((header, index) => {
      const cell = dataRow.getCell(index + 1);
      const raw = String(cell.value ?? '').trim();
      result[header] = raw.replace(/<timestamp>/g, timestamp);
    });

    return result;
  }

  async writeResult(
    sheetName: string,
    rowIndex: number,
    column: string,
    value: string,
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.filePath);

    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) throw new Error(`Hoja "${sheetName}" no encontrada en ${this.filePath}`);

    const headerRow = sheet.getRow(1);
    let colNumber = -1;
    headerRow.eachCell((cell, colIdx) => {
      if (String(cell.value ?? '').trim() === column) {
        colNumber = colIdx;
      }
    });

    if (colNumber === -1) {
      const lastCol = (headerRow.cellCount ?? 0) + 1;
      sheet.getRow(1).getCell(lastCol).value = column;
      colNumber = lastCol;
    }

    sheet.getRow(rowIndex + 1).getCell(colNumber).value = value;
    await workbook.xlsx.writeFile(this.filePath);
  }
}
