/**
 * reset-excel.ts
 * Limpia las columnas de SALIDA del Excel para poder demostrar
 * el ciclo completo: antes (vacío) → ejecutar tests → después (escrito).
 *
 * Uso: npx ts-node scripts/reset-excel.ts
 */
import * as ExcelJS from 'exceljs';
import * as path from 'path';

const FILE = path.resolve(__dirname, '../test-data/datos_prueba.xlsx');

async function resetOutputColumns(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(FILE);

  const activacion = workbook.getWorksheet('Activacion');
  if (!activacion) throw new Error('Hoja "Activacion" no encontrada');

  // Buscar los índices de las columnas de salida por nombre en la fila de headers
  const outputColumns = ['numero_confirmacion', 'fecha_activacion'];
  const headerRow = activacion.getRow(1);

  outputColumns.forEach((colName) => {
    let colIndex = -1;
    headerRow.eachCell((cell, idx) => {
      if (String(cell.value).trim() === colName) colIndex = idx;
    });
    if (colIndex > 0) {
      activacion.getRow(2).getCell(colIndex).value = '';
    }
  });

  await workbook.xlsx.writeFile(FILE);
  console.log('Excel reseteado — columnas de salida vacias:');
  console.log('  numero_confirmacion -> ""');
  console.log('  fecha_activacion    -> ""');
  console.log('');
  console.log('Ahora puedes mostrar el Excel vacio y luego correr: npm test');
}

resetOutputColumns().catch(console.error);
