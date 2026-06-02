import * as ExcelJS from 'exceljs';
import * as path from 'path';

async function createTestData(): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  // ── Hoja Registro ──────────────────────────────────────────────────────
  const registroSheet = workbook.addWorksheet('Registro');
  registroSheet.columns = [
    { header: 'nombre', key: 'nombre', width: 18 },
    { header: 'apellido', key: 'apellido', width: 18 },
    { header: 'email', key: 'email', width: 36 },
    { header: 'telefono', key: 'telefono', width: 14 },
    { header: 'empresa', key: 'empresa', width: 18 },
    { header: 'contrasena', key: 'contrasena', width: 20 },
    { header: 'confirmacion', key: 'confirmacion', width: 20 },
  ];

  registroSheet.addRow({
    nombre: 'Ana Garcia',
    apellido: 'Perez',
    email: 'anatest_<timestamp>@test.com',
    telefono: '3001234567',
    empresa: 'TechCo SAS',
    contrasena: 'MarketPro@2024!',
    confirmacion: 'MarketPro@2024!',
  });

  registroSheet.addRow({
    nombre: 'Luis Mora',
    apellido: 'Torres',
    email: 'luistest_<timestamp>@test.com',
    telefono: '3117654321',
    empresa: 'MktAgency',
    contrasena: 'Prueba$2024#',
    confirmacion: 'Prueba$2024#',
  });

  // ── Hoja Activacion ───────────────────────────────────────────────────
  const activacionSheet = workbook.addWorksheet('Activacion');
  activacionSheet.columns = [
    { header: 'producto', key: 'producto', width: 14 },
    { header: 'cantidad', key: 'cantidad', width: 10 },
    { header: 'metodo_pago', key: 'metodo_pago', width: 18 },
    { header: 'direccion', key: 'direccion', width: 24 },
    { header: 'ciudad', key: 'ciudad', width: 14 },
    { header: 'pais', key: 'pais', width: 14 },
    { header: 'codigo_postal', key: 'codigo_postal', width: 14 },
    { header: 'numero_confirmacion', key: 'numero_confirmacion', width: 22 },
    { header: 'fecha_activacion', key: 'fecha_activacion', width: 26 },
  ];

  activacionSheet.addRow({
    producto: 'MacBook',
    cantidad: 1,
    metodo_pago: 'Cash On Delivery',
    direccion: 'Calle 10 # 5-20',
    ciudad: 'Bogota',
    pais: 'Colombia',
    codigo_postal: '110111',
    numero_confirmacion: '',
    fecha_activacion: '',
  });

  const outputPath = path.resolve(__dirname, '../test-data/datos_prueba.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`✅ Excel creado en: ${outputPath}`);
}

createTestData().catch(console.error);
