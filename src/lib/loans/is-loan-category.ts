/** True when a category name is the Loan / Préstamo category. */
export function isLoanCategoryName(name: string): boolean {
  const key = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  return key === "loan" || key === "prestamo";
}
