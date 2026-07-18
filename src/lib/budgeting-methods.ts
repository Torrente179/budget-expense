import { type AppLocale } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BudgetAllocationSlice {
  key: string;
  label: string;
  percent: number;
  color: string;
  icon: string; // lucide icon name
  description: string;
}

export interface BudgetingMethodPrinciple {
  text: string;
  reference?: string; // optional scripture reference
}

export interface BudgetingMethod {
  id: string;
  name: string;
  tagline: string;
  description: string;
  isFaithBased: boolean;
  origin: string;
  slices: BudgetAllocationSlice[];
  principles: BudgetingMethodPrinciple[];
  bestFor: string[];
}

export interface BudgetingMethodsContent {
  methods: BudgetingMethod[];
}

/* ------------------------------------------------------------------ */
/*  English methods                                                    */
/* ------------------------------------------------------------------ */

const ENGLISH_METHODS: BudgetingMethod[] = [
  {
    id: "50-30-20",
    name: "50 / 30 / 20",
    tagline: "Needs, wants, and future",
    description:
      "Split take-home pay three ways: essentials, wants, and savings or debt payoff. Easy to remember; good place to start. (Popularized by Elizabeth Warren.)",
    isFaithBased: false,
    origin: "Elizabeth Warren & Amelia Warren Tyagi, All Your Worth (2005)",
    slices: [
      {
        key: "needs",
        label: "Needs",
        percent: 50,
        color: "#3b82f6",
        icon: "home",
        description: "Housing, food, utilities, insurance, transportation, minimum debt payments",
      },
      {
        key: "wants",
        label: "Wants",
        percent: 30,
        color: "#8b5cf6",
        icon: "sparkles",
        description: "Dining out, entertainment, hobbies, subscriptions, non-essential shopping",
      },
      {
        key: "savings",
        label: "Savings & debt",
        percent: 20,
        color: "#10b981",
        icon: "piggy-bank",
        description: "Emergency fund, retirement, investments, extra debt payments",
      },
    ],
    principles: [
      { text: "Keep essentials below half of income to leave room for flexibility." },
      { text: "Wants are not the enemy — capping them at 30% prevents lifestyle creep." },
      { text: "Automate the 20% savings before spending on wants." },
    ],
    bestFor: [
      "Beginners who want a simple starting framework",
      "People with stable, predictable income",
      "Those who want a quick mental model for spending",
    ],
  },
  {
    id: "60-30-10",
    name: "60 / 30 / 10",
    tagline: "Essentials first, then live and give",
    description:
      "Same idea as 50/30/20, but tighter: 60% for committed costs, 30% for flexible spending, 10% for saving or giving. Useful where rent and bills eat more of the paycheck.",
    isFaithBased: false,
    origin: "Adapted from Richard Jenkins' MSN Money '60% Solution'",
    slices: [
      {
        key: "essentials",
        label: "Essentials",
        percent: 60,
        color: "#3b82f6",
        icon: "shield",
        description: "All committed expenses: rent/mortgage, utilities, groceries, insurance, debt minimums",
      },
      {
        key: "flexible",
        label: "Flexible spending",
        percent: 30,
        color: "#f59e0b",
        icon: "wallet",
        description: "Personal spending, dining, entertainment, clothes, hobbies",
      },
      {
        key: "growth",
        label: "Savings & giving",
        percent: 10,
        color: "#10b981",
        icon: "trending-up",
        description: "Emergency fund, charitable giving, retirement savings, investments",
      },
    ],
    principles: [
      { text: "Essentials can realistically exceed 50% in expensive cities — this method accommodates that." },
      { text: "Even 10% saved consistently builds meaningful wealth over time." },
      { text: "The key is reducing essentials over time rather than accepting 60% permanently." },
    ],
    bestFor: [
      "High cost-of-living areas where 50/30/20 feels too tight",
      "People working on reducing fixed expenses over time",
      "Those who prefer a simple three-bucket system",
    ],
  },
  {
    id: "5-jars",
    name: "5 Jars",
    tagline: "Give first, then save, invest, and spend",
    description:
      "Five jars in order: tithe to God, help others, invest, save, then spend. Giving comes first — not from what's left over.",
    isFaithBased: true,
    origin: "Faith-based budgeting tradition (biblical & Jewish financial ethics)",
    slices: [
      {
        key: "tithe",
        label: "Tithe",
        percent: 10,
        color: "#f59e0b",
        icon: "church",
        description: "Given to God as the firstfruits — an act of gratitude and trust (Malachi 3:10)",
      },
      {
        key: "blessing",
        label: "Blessing & giving",
        percent: 10,
        color: "#ec4899",
        icon: "hand-heart",
        description: "Helping others, tzedakah, community support (Luke 6:38, Proverbs 11:25)",
      },
      {
        key: "investing",
        label: "Investing",
        percent: 20,
        color: "#6366f1",
        icon: "trending-up",
        description: "Long-term growth, entrepreneurship, retirement (Proverbs 21:5, 13:11)",
      },
      {
        key: "savings",
        label: "Savings",
        percent: 10,
        color: "#10b981",
        icon: "piggy-bank",
        description: "Emergency fund, short-term goals (Proverbs 6:6-8)",
      },
      {
        key: "spending",
        label: "Living expenses",
        percent: 50,
        color: "#3b82f6",
        icon: "shopping-cart",
        description: "Responsible daily living and enjoyment (Ecclesiastes 5:18-19)",
      },
    ],
    principles: [
      { text: "Give first — generosity is not what remains after spending, it is the first priority.", reference: "Proverbs 3:9-10" },
      { text: "Store up for the future with diligence, like the ant that prepares in summer.", reference: "Proverbs 6:6-8" },
      { text: "Invest with patience — wealth gained hastily diminishes, but steady work grows.", reference: "Proverbs 13:11" },
      { text: "Enjoy life responsibly — God gives the ability to eat, drink, and find satisfaction in work.", reference: "Ecclesiastes 5:18-19" },
      { text: "Everything belongs to God — believers are stewards, not ultimate owners.", reference: "Psalm 24:1" },
    ],
    bestFor: [
      "Christians and Jewish families seeking faith-aligned finances",
      "Those who want generosity and stewardship at the core of budgeting",
      "Families teaching children intentional money management",
    ],
  },
  {
    id: "zero-based",
    name: "Zero-based",
    tagline: "Every dollar gets a job",
    description:
      "Give every bit of income a job until nothing is left unassigned. Popular in YNAB and EveryDollar. Takes more attention; you always know where money goes.",
    isFaithBased: false,
    origin: "YNAB (You Need A Budget) & Dave Ramsey's EveryDollar",
    slices: [
      {
        key: "giving",
        label: "Giving",
        percent: 10,
        color: "#ec4899",
        icon: "heart",
        description: "Charitable giving, tithing, community support",
      },
      {
        key: "saving",
        label: "Saving",
        percent: 15,
        color: "#10b981",
        icon: "piggy-bank",
        description: "Emergency fund, sinking funds, future goals",
      },
      {
        key: "housing",
        label: "Housing",
        percent: 25,
        color: "#3b82f6",
        icon: "home",
        description: "Rent or mortgage, property taxes, insurance",
      },
      {
        key: "essentials",
        label: "Other essentials",
        percent: 25,
        color: "#06b6d4",
        icon: "shopping-cart",
        description: "Food, transportation, utilities, healthcare",
      },
      {
        key: "lifestyle",
        label: "Lifestyle",
        percent: 15,
        color: "#8b5cf6",
        icon: "sparkles",
        description: "Entertainment, dining, subscriptions, personal spending",
      },
      {
        key: "debt",
        label: "Debt payoff",
        percent: 10,
        color: "#f43f5e",
        icon: "credit-card",
        description: "Extra payments toward loans, credit cards, or other debts",
      },
    ],
    principles: [
      { text: "Assign every dollar a purpose before the month begins." },
      { text: "Adjust categories when life changes — the budget is a living document." },
      { text: "Use past months to improve future plans; review honestly, not reactively.", reference: "Proverbs 27:23" },
    ],
    bestFor: [
      "People who want full control and visibility over every dollar",
      "Those paying off debt with intensity",
      "Households with variable income that changes month to month",
    ],
  },
  {
    id: "pay-yourself-first",
    name: "Pay yourself first",
    tagline: "Save before you spend",
    description:
      "Save and invest first, when income lands. What's left is what you may spend. Wealth grows because saving isn't optional.",
    isFaithBased: false,
    origin: "George S. Clason, The Richest Man in Babylon (1926)",
    slices: [
      {
        key: "savings-investing",
        label: "Savings & investing",
        percent: 20,
        color: "#10b981",
        icon: "vault",
        description: "Retirement accounts, index funds, emergency fund — moved first",
      },
      {
        key: "giving",
        label: "Giving",
        percent: 10,
        color: "#ec4899",
        icon: "hand-heart",
        description: "Tithing, charity, community support",
      },
      {
        key: "living",
        label: "Living expenses",
        percent: 70,
        color: "#3b82f6",
        icon: "wallet",
        description: "All remaining expenses: housing, food, transportation, personal spending",
      },
    ],
    principles: [
      { text: "Automate savings transfers on payday — remove the temptation to spend first." },
      { text: "Treat savings as a fixed bill you pay to your future self." },
      { text: "The wise store up choice food and olive oil, but a fool devours all they have.", reference: "Proverbs 21:20" },
    ],
    bestFor: [
      "People who struggle to save after spending",
      "Those building an emergency fund or retirement nest egg",
      "Anyone who wants wealth-building on autopilot",
    ],
  },
  {
    id: "values-based",
    name: "Values-based",
    tagline: "Spend in alignment with what matters most",
    description:
      "Skip rigid percentages. Name what matters — family, faith, health, community — then put money there first. Intention over formula.",
    isFaithBased: false,
    origin: "Conscious spending philosophy & ethical finance movements",
    slices: [
      {
        key: "core-values",
        label: "Core values",
        percent: 30,
        color: "#f59e0b",
        icon: "heart",
        description: "Spending on what aligns with your deepest priorities: faith, family, health, education",
      },
      {
        key: "necessities",
        label: "Necessities",
        percent: 40,
        color: "#3b82f6",
        icon: "home",
        description: "Essential living costs: housing, food, utilities, transportation",
      },
      {
        key: "generosity",
        label: "Generosity",
        percent: 10,
        color: "#ec4899",
        icon: "hand-heart",
        description: "Supporting ethical companies, local charities, sustainable alternatives",
      },
      {
        key: "future",
        label: "Future self",
        percent: 20,
        color: "#10b981",
        icon: "target",
        description: "Socially responsible investments, savings, skill development",
      },
    ],
    principles: [
      { text: "Review spending monthly to check alignment with stated values — not just amounts." },
      { text: "Replace items with sustainable alternatives where practical." },
      { text: "Guard against greed — life does not consist in the abundance of possessions.", reference: "Luke 12:15" },
    ],
    bestFor: [
      "People motivated by purpose more than percentages",
      "Those interested in ethical and sustainable spending",
      "Anyone seeking intentional alignment between money and meaning",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Spanish methods                                                    */
/* ------------------------------------------------------------------ */

const SPANISH_METHODS: BudgetingMethod[] = [
  {
    id: "50-30-20",
    name: "50 / 30 / 20",
    tagline: "Necesidades, deseos y futuro",
    description:
      "Divide el neto en tres: lo esencial, lo que quieres, y ahorro o deudas. Fácil de recordar; buen punto de partida. (Popularizada por Elizabeth Warren.)",
    isFaithBased: false,
    origin: "Elizabeth Warren y Amelia Warren Tyagi, All Your Worth (2005)",
    slices: [
      {
        key: "needs",
        label: "Necesidades",
        percent: 50,
        color: "#3b82f6",
        icon: "home",
        description: "Vivienda, comida, servicios, seguros, transporte, pagos mínimos de deuda",
      },
      {
        key: "wants",
        label: "Deseos",
        percent: 30,
        color: "#8b5cf6",
        icon: "sparkles",
        description: "Restaurantes, entretenimiento, hobbies, suscripciones, compras no esenciales",
      },
      {
        key: "savings",
        label: "Ahorro y deuda",
        percent: 20,
        color: "#10b981",
        icon: "piggy-bank",
        description: "Fondo de emergencia, jubilación, inversiones, pagos extra de deuda",
      },
    ],
    principles: [
      { text: "Mantén lo esencial por debajo de la mitad del ingreso para dejar margen." },
      { text: "Los deseos no son enemigos — limitarlos al 30% previene la inflación de estilo de vida." },
      { text: "Automatiza el 20% de ahorro antes de gastar en deseos." },
    ],
    bestFor: [
      "Principiantes que buscan un marco sencillo para empezar",
      "Personas con ingresos estables y predecibles",
      "Quienes quieren un modelo mental rápido para gastar",
    ],
  },
  {
    id: "60-30-10",
    name: "60 / 30 / 10",
    tagline: "Lo esencial primero, luego vivir y dar",
    description:
      "Como el 50/30/20, pero más apretado: 60% a costos fijos, 30% a gasto flexible, 10% a ahorrar o dar. Útil donde el alquiler y las facturas se comen más del sueldo.",
    isFaithBased: false,
    origin: "Adaptado de la 'Solución del 60%' de Richard Jenkins en MSN Money",
    slices: [
      {
        key: "essentials",
        label: "Esenciales",
        percent: 60,
        color: "#3b82f6",
        icon: "shield",
        description: "Gastos comprometidos: alquiler/hipoteca, servicios, comida, seguros, deuda mínima",
      },
      {
        key: "flexible",
        label: "Gasto flexible",
        percent: 30,
        color: "#f59e0b",
        icon: "wallet",
        description: "Gasto personal, restaurantes, entretenimiento, ropa, hobbies",
      },
      {
        key: "growth",
        label: "Ahorro y donaciones",
        percent: 10,
        color: "#10b981",
        icon: "trending-up",
        description: "Fondo de emergencia, donaciones, ahorro para jubilación, inversiones",
      },
    ],
    principles: [
      { text: "En ciudades costosas lo esencial puede superar el 50% — este método lo acomoda." },
      { text: "Incluso el 10% ahorrado de forma constante genera riqueza significativa." },
      { text: "La clave es reducir gastos esenciales con el tiempo, no aceptar el 60% como permanente." },
    ],
    bestFor: [
      "Zonas con alto costo de vida donde el 50/30/20 resulta ajustado",
      "Personas que trabajan en reducir gastos fijos a lo largo del tiempo",
      "Quienes prefieren un sistema simple de tres categorías",
    ],
  },
  {
    id: "5-jars",
    name: "5 Jarras",
    tagline: "Da primero, luego ahorra, invierte y gasta",
    description:
      "Cinco jarras en orden: diezmo a Dios, ayuda al prójimo, invertir, ahorrar y luego gastar. Dar va primero — no con lo que sobra.",
    isFaithBased: true,
    origin: "Tradición de presupuesto basado en la fe (ética financiera bíblica y judía)",
    slices: [
      {
        key: "tithe",
        label: "Diezmo",
        percent: 10,
        color: "#f59e0b",
        icon: "church",
        description: "Dado a Dios como primicias — acto de gratitud y confianza (Malaquías 3:10)",
      },
      {
        key: "blessing",
        label: "Bendición y donación",
        percent: 10,
        color: "#ec4899",
        icon: "hand-heart",
        description: "Ayuda al prójimo, tzedakah, apoyo comunitario (Lucas 6:38, Proverbios 11:25)",
      },
      {
        key: "investing",
        label: "Inversión",
        percent: 20,
        color: "#6366f1",
        icon: "trending-up",
        description: "Crecimiento a largo plazo, emprendimiento, jubilación (Proverbios 21:5, 13:11)",
      },
      {
        key: "savings",
        label: "Ahorro",
        percent: 10,
        color: "#10b981",
        icon: "piggy-bank",
        description: "Fondo de emergencia, metas a corto plazo (Proverbios 6:6-8)",
      },
      {
        key: "spending",
        label: "Gastos de vida",
        percent: 50,
        color: "#3b82f6",
        icon: "shopping-cart",
        description: "Vida diaria responsable y disfrute (Eclesiastés 5:18-19)",
      },
    ],
    principles: [
      { text: "Da primero — la generosidad no es lo que queda después de gastar, es la primera prioridad.", reference: "Proverbios 3:9-10" },
      { text: "Guarda para el futuro con diligencia, como la hormiga que se prepara en verano.", reference: "Proverbios 6:6-8" },
      { text: "Invierte con paciencia — la riqueza apresurada disminuye, pero el trabajo constante la multiplica.", reference: "Proverbios 13:11" },
      { text: "Disfruta la vida con responsabilidad — Dios da la capacidad de comer, beber y hallar satisfacción.", reference: "Eclesiastés 5:18-19" },
      { text: "Todo pertenece a Dios — los creyentes son mayordomos, no dueños absolutos.", reference: "Salmo 24:1" },
    ],
    bestFor: [
      "Familias cristianas y judías que buscan finanzas alineadas con la fe",
      "Quienes quieren generosidad y mayordomía como núcleo del presupuesto",
      "Familias enseñando a los hijos el manejo intencional del dinero",
    ],
  },
  {
    id: "zero-based",
    name: "Base cero",
    tagline: "Cada peso tiene un trabajo",
    description:
      "Dale un trabajo a cada unidad de ingreso hasta que no quede nada sin asignar. Popular en YNAB y EveryDollar. Pide más atención; siempre sabes a dónde va el dinero.",
    isFaithBased: false,
    origin: "YNAB (You Need A Budget) y EveryDollar de Dave Ramsey",
    slices: [
      {
        key: "giving",
        label: "Donaciones",
        percent: 10,
        color: "#ec4899",
        icon: "heart",
        description: "Donaciones, diezmo, apoyo comunitario",
      },
      {
        key: "saving",
        label: "Ahorro",
        percent: 15,
        color: "#10b981",
        icon: "piggy-bank",
        description: "Fondo de emergencia, fondos de reserva, metas futuras",
      },
      {
        key: "housing",
        label: "Vivienda",
        percent: 25,
        color: "#3b82f6",
        icon: "home",
        description: "Alquiler o hipoteca, impuestos, seguros del hogar",
      },
      {
        key: "essentials",
        label: "Otros esenciales",
        percent: 25,
        color: "#06b6d4",
        icon: "shopping-cart",
        description: "Comida, transporte, servicios, salud",
      },
      {
        key: "lifestyle",
        label: "Estilo de vida",
        percent: 15,
        color: "#8b5cf6",
        icon: "sparkles",
        description: "Entretenimiento, restaurantes, suscripciones, gasto personal",
      },
      {
        key: "debt",
        label: "Pago de deudas",
        percent: 10,
        color: "#f43f5e",
        icon: "credit-card",
        description: "Pagos extra a préstamos, tarjetas de crédito u otras deudas",
      },
    ],
    principles: [
      { text: "Asigna cada peso un propósito antes de que empiece el mes." },
      { text: "Ajusta categorías cuando la vida cambie — el presupuesto es un documento vivo." },
      { text: "Usa meses anteriores para mejorar planes futuros; revisa con honestidad.", reference: "Proverbios 27:23" },
    ],
    bestFor: [
      "Personas que quieren control y visibilidad total sobre cada peso",
      "Quienes están pagando deudas con intensidad",
      "Hogares con ingreso variable que cambia cada mes",
    ],
  },
  {
    id: "pay-yourself-first",
    name: "Págate primero",
    tagline: "Ahorra antes de gastar",
    description:
      "Ahorra e invierte primero, cuando llega el ingreso. Lo que queda es lo que puedes gastar. La riqueza crece porque ahorrar no es opcional.",
    isFaithBased: false,
    origin: "George S. Clason, El hombre más rico de Babilonia (1926)",
    slices: [
      {
        key: "savings-investing",
        label: "Ahorro e inversión",
        percent: 20,
        color: "#10b981",
        icon: "vault",
        description: "Cuentas de retiro, fondos indexados, fondo de emergencia — se mueven primero",
      },
      {
        key: "giving",
        label: "Donaciones",
        percent: 10,
        color: "#ec4899",
        icon: "hand-heart",
        description: "Diezmo, caridad, apoyo comunitario",
      },
      {
        key: "living",
        label: "Gastos de vida",
        percent: 70,
        color: "#3b82f6",
        icon: "wallet",
        description: "Todos los gastos restantes: vivienda, comida, transporte, gasto personal",
      },
    ],
    principles: [
      { text: "Automatiza las transferencias de ahorro el día de pago — elimina la tentación de gastar primero." },
      { text: "Trata el ahorro como un gasto fijo que le pagas a tu yo futuro." },
      { text: "El sabio guarda provisiones selectas, pero el necio devora todo lo que tiene.", reference: "Proverbios 21:20" },
    ],
    bestFor: [
      "Personas que les cuesta ahorrar después de gastar",
      "Quienes construyen un fondo de emergencia o ahorro para retiro",
      "Cualquiera que quiera construir riqueza en automático",
    ],
  },
  {
    id: "values-based",
    name: "Basado en valores",
    tagline: "Gasta en línea con lo que más importa",
    description:
      "Olvida los porcentajes rígidos. Nombra lo que importa — familia, fe, salud, comunidad — y pon el dinero ahí primero. Intención sobre fórmula.",
    isFaithBased: false,
    origin: "Filosofía de gasto consciente y movimientos de finanzas éticas",
    slices: [
      {
        key: "core-values",
        label: "Valores centrales",
        percent: 30,
        color: "#f59e0b",
        icon: "heart",
        description: "Gasto alineado con las prioridades más profundas: fe, familia, salud, educación",
      },
      {
        key: "necessities",
        label: "Necesidades",
        percent: 40,
        color: "#3b82f6",
        icon: "home",
        description: "Costos esenciales de vida: vivienda, comida, servicios, transporte",
      },
      {
        key: "generosity",
        label: "Generosidad",
        percent: 10,
        color: "#ec4899",
        icon: "hand-heart",
        description: "Apoyar empresas éticas, caridades locales, alternativas sostenibles",
      },
      {
        key: "future",
        label: "Tu futuro",
        percent: 20,
        color: "#10b981",
        icon: "target",
        description: "Inversiones socialmente responsables, ahorro, desarrollo personal",
      },
    ],
    principles: [
      { text: "Revisa el gasto mensual para verificar alineación con valores declarados — no solo montos." },
      { text: "Reemplaza productos con alternativas sostenibles cuando sea práctico." },
      { text: "Cuídate de la avaricia — la vida no consiste en la abundancia de posesiones.", reference: "Lucas 12:15" },
    ],
    bestFor: [
      "Personas motivadas por propósito más que por porcentajes",
      "Quienes se interesan en gasto ético y sostenible",
      "Cualquiera que busque alinear dinero con significado",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Content by locale                                                  */
/* ------------------------------------------------------------------ */

const METHODS_BY_LOCALE: Record<AppLocale, BudgetingMethodsContent> = {
  en: { methods: ENGLISH_METHODS },
  es: { methods: SPANISH_METHODS },
};

export function getBudgetingMethods(locale: AppLocale): BudgetingMethodsContent {
  return METHODS_BY_LOCALE[locale];
}

export function getBudgetingMethodById(
  locale: AppLocale,
  id: string
): BudgetingMethod | undefined {
  return METHODS_BY_LOCALE[locale].methods.find((m) => m.id === id);
}

/** Returns just the method IDs for use as option values */
export function getBudgetingMethodIds(): string[] {
  return ENGLISH_METHODS.map((m) => m.id);
}
