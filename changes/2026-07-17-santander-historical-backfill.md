# Backfill histórico ago-2024 → ago-2025 desde Santander

## Summary

Segunda fase de la reconciliación del 2026-07-17: se importaron los 13 meses de historial
previos al inicio de la app (2024-08-07 → 2025-08-31, 1.075 movimientos del export oficial
de Santander) que nunca existieron en Fintonic. La app ahora cubre la historia completa de
la cuenta: ago-2024 → jul-2026.

## Product Changes

- Gastos: 1.188 → 2.158 filas (+970). Ingresos: 103 → 208 (+105).
- Clasificación: reglas del pipeline + 2 pasadas de refinamiento por patrón de comercio
  (314 filas reclasificadas): SD/HD/Supercor/minimarkets → Groceries; Telefónica/via-móvil
  → Utilities; Kraftwerk gym → Shopping; gasolineras (E.S., BP, Combuscol), Titsa, Transys,
  Mutua Madrileña auto → Transportation; "Transfer to Federica … arriendo" → Housing;
  Domiciliación impuesto → Taxes; hostelería España + Cali (Colombia) → Food & Dining;
  ropa (Lefties, Springfield, Massimo Dutti, Primark) → Shopping; zoo/parques → Entertainment.
- Quedan 172 filas en Other: ATM, Bizums P2P (convención existente) y comercios ilegibles.
- Corrección de datos preexistentes: Niko Motobike (3 filas) → Transportation y
  Nirvana Gym (2 filas) → Shopping (estaban en Food & Dining).
- Tercera pasada sobre TODO el histórico de Other (incl. datos pre-existentes de Fintonic):
  109 filas más reclasificadas una a una (hostelería Cali/Tenerife → Food & Dining ×59;
  ropa/retail → Shopping ×14; Carulla/Éxito/Superdino → Groceries ×10; gasolineras/taller →
  Transportation ×8; Iberia/JetSmart/World2Fly → Travel ×6; y Taxes, Entertainment,
  Subscriptions, Education, Donations, Healthcare, Housing). Other queda en 108 filas
  (€4.819): ATM ×13, Bizums P2P ×66, transferencias a personas, y 21 comercios/comisiones
  genuinamente ambiguos.
- Renta real de Rincón de la Victoria (confirmado por el usuario): €300 transferencia a
  Hafsa + €250 efectivo del cajero al día siguiente. Los tres retiros de €250 (19-may,
  17-jun, 16-jul) y las tres transferencias a Hafsa → Housing (€550/mes).

## Data Model

Sin cambios de esquema. SQL en `supabase/imports/2026-07-17-santander-historical-backfill.sql`.

## Validation

- Totales mensuales BD vs banco para los 13 meses nuevos: **Δ = €0,00 en todos** (gastos e
  ingresos), verificado contra el export con continuidad de saldo.
- Totales de dos años: 2.158 gastos €52.138,84 / 208 ingresos €52.336,54.
- Desvíos residuales solo en meses previos y explicados: P2P "No computable" excluidos por
  convención (se anulan casi por completo) + desfases fecha valor/operación en bordes de mes.
