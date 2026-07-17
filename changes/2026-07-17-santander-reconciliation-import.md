# Reconciliación completa contra export directo de Santander

## Summary

Se reconcilió la base de datos de la app contra el export oficial de Banco Santander
(`export_excel 2.xlsx`, 2.376 movimientos, ago-2024 → 17-jul-2026, continuidad de saldo
verificada sin huecos). Se detectó que la fuente anterior (Fintonic) había perdido 55
transacciones reales, y que la app tenía además tres brechas de importación. Se importaron
251 movimientos faltantes (246 vía pipeline + 5 residuales directos) con clasificación de
categorías según las reglas existentes.

## Product Changes

- Gastos: 951 → 1.188 filas. Ingresos: 83 → 103 filas.
- Brechas cerradas:
  - Semana 22–29 abr 2026 (nunca importada) + salario Nium €1.436,52 del 28-abr.
  - Movimientos que Fintonic perdió (abr–jun), no repuestos manualmente.
  - Todo el período 9-jun → 17-jul-2026 (108 + 73 movimientos).
  - Se completó sep-2025 hacia atrás (1–9 sep, 40 movimientos, incl. salario Nium €716,44).
- Clasificación: reglas del pipeline + 16 refinamientos manuales (gasolineras → Transportation,
  SD/supermercados → Groceries, multa DGT → Taxes, Wise "salud madre" → Healthcare, resto
  hostelería → Food & Dining). ATM y Bizums P2P quedan en Other según convención existente.
- Se preservaron las 10 entradas manuales de efectivo sin contraparte bancaria.
- Confirmado: el ingreso Nium €1.164,25 (27-may) es real (Fintonic lo había perdido).

## Data Model

Sin cambios de esquema. SQL de importación en `supabase/imports/2026-07-17-santander-reconciliation.sql`
(usa el generador `scripts/generate_santander_import.py` con dedup previo importe+fecha±3d
uno-a-uno contra la BD, sobre CSV sintético de solo-faltantes).

## Validation

- Match fila a fila BD ↔ Santander (importe + fecha ±3d): 1.296/1.301 movimientos del banco
  reflejados; los 11 restantes son P2P "No computable" que el pipeline excluye a propósito
  (mayormente pares que se anulan; neto +€39,21).
- Conteo por comercio+importe (sin fechas) para los residuales de importes repetidos:
  5 faltantes reales insertados (€14,40).
- Totales mensuales post-import alineados con Santander (diferencias ≤ ~€100/mes por
  desfase fecha valor/operación en bordes de mes).
- `needs_review`: 0.
