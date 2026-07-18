import { type AppLocale } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ToolEntry {
  name: string;
  tagline: string;
  description: string;
}

export interface PrincipleEntry {
  title: string;
  text: string;
  reference?: string;
}

export interface WisdomSection {
  id: string;
  title: string;
  eyebrow: string;
  icon: string; // lucide icon name
  intro: string;
  entries: PrincipleEntry[];
}

export interface FinancialWisdomContent {
  toolsSection: {
    title: string;
    intro: string;
    tools: ToolEntry[];
    closingNote: string;
  };
  additionalSystems: {
    title: string;
    entries: PrincipleEntry[];
  };
  sections: WisdomSection[];
}

/* ------------------------------------------------------------------ */
/*  English content                                                    */
/* ------------------------------------------------------------------ */

const ENGLISH_CONTENT: FinancialWisdomContent = {
  toolsSection: {
    title: "Money-tracking tools and apps",
    intro:
      "Apps can track, categorize, and chart spending. None is magic — pick what you'll actually open each week.",
    tools: [
      {
        name: "YNAB",
        tagline: "You Need A Budget",
        description:
          "Zero-based budgeting: every dollar gets a job. Syncs across devices, with goals and teaching built in. Paid subscription.",
      },
      {
        name: "Rocket Money",
        tagline: "Subscriptions and bills",
        description:
          "Finds subscriptions, watches your credit score, and can help negotiate bills.",
      },
      {
        name: "Empower",
        tagline: "Budget plus investing",
        description:
          "Budgeting, investments, and retirement in one view.",
      },
      {
        name: "EveryDollar",
        tagline: "Dave Ramsey's Baby Steps",
        description:
          "Zero-based budgeting in Ramsey's system. Free with manual entry; paid connects to your bank.",
      },
      {
        name: "GoodBudget",
        tagline: "Digital envelopes",
        description:
          "Virtual envelopes by category — spend against each one, like cash in jars.",
      },
      {
        name: "Tiller",
        tagline: "Automated spreadsheets",
        description:
          "Drops transactions into Google Sheets or Excel so you keep full control of formulas.",
      },
      {
        name: "Simplifi, Monarch Money & PocketGuard",
        tagline: "Dashboards and forecasts",
        description:
          "Auto-import, charts, and forecasts — each with its own price and audience.",
      },
    ],
    closingNote:
      "Pen and paper still work. What matters is a system that fits how you live. Automating minimum payments and savings cuts missed due dates and turns the plan into habit.",
  },
  additionalSystems: {
    title: "Additional budgeting systems",
    entries: [
      {
        title: "Calendar budgeting",
        text: "Marking paydays, bills and savings transfers on a calendar with different colors helps visualize cash flow and avoid overdrafts. A visual timeline of money in and out.",
      },
      {
        title: "Values-based budgeting",
        text: "Spending and investing in ways that align with personal values — supporting ethical companies, replacing items with sustainable alternatives, donating to local charities and reviewing investment portfolios for socially responsible funds.",
      },
      {
        title: "The 60% solution",
        text: "Allocating about 60% of income to essentials and the rest to savings and discretionary spending. This idea underlies the 60/30/10 rule and works well for higher cost-of-living areas.",
      },
    ],
  },
  sections: [
    {
      id: "biblical",
      title: "Biblical and Christian principles",
      eyebrow: "Stewardship",
      icon: "book-open",
      intro:
        "In Scripture, money is something you steward, not something you own. Plan, give, stay out of needless debt, and be content.",
      entries: [
        {
          title: "Know where you stand",
          text: "A budget keeps impulse spending in check. Know what you have, then decide.",
          reference: "Proverbs 27:23",
        },
        {
          title: "Tithe faithfully (10%)",
          text: "Setting aside the first tenth supports the church and trains the heart. Faith-based plans like the 5 Jars give God the first portion.",
          reference: "Malachi 3:10",
        },
        {
          title: "Avoid unnecessary borrowing",
          text: "Borrow for things that hold or grow in value; skip high-interest consumer debt. The borrower becomes servant to the lender.",
          reference: "Proverbs 22:7",
        },
        {
          title: "Save before spending",
          text: "Put something aside for emergencies and the long haul so you don't lean on credit. The wise store up for later.",
          reference: "Proverbs 21:20",
        },
        {
          title: "Give generously",
          text: "It is more blessed to give than to receive. Generosity reflects God's provision — it isn't an afterthought.",
          reference: "Acts 20:35",
        },
        {
          title: "Trust God, not wealth",
          text: "Wealth doesn't last. Seek God's kingdom first; needs follow. Security is in God, not in riches.",
          reference: "1 Timothy 6:17",
        },
        {
          title: "Everything is God's gift",
          text: "The earth is the Lord's. Believers steward money and possessions; they don't ultimately own them.",
          reference: "Psalm 24:1",
        },
        {
          title: "Live within your means",
          text: "Plan, save, and don't pile up things you don't need. Guard against greed.",
          reference: "Luke 12:15",
        },
        {
          title: "Seek wise counsel and be content",
          text: "Ask trusted people. Contentment and trust in God keep reckless money decisions at bay.",
          reference: "Proverbs 15:22",
        },
        {
          title: "Be diligent and plan ahead",
          text: "Hard work and planning underwrite budgeting, saving, and emergencies. Lazy hands make for poverty.",
          reference: "Proverbs 10:4",
        },
        {
          title: "Honor God in money decisions",
          text: "Acknowledge God in all your ways. Trusting Him lines up faith and money.",
          reference: "Proverbs 3:6",
        },
      ],
    },
    {
      id: "jewish",
      title: "Jewish budgeting and financial ethics",
      eyebrow: "Tzedakah & ethics",
      icon: "star",
      intro:
        "Jewish teaching treats money with Torah, rabbinic care, and responsibility to the community — give, lend with compassion, and steward with discipline.",
      entries: [
        {
          title: "Tzedakah as sacred duty",
          text: "In Jewish law, tzedakah (charitable giving) is not optional generosity but a sacred obligation. One should set aside a percentage of income based on last year's earnings and avoid giving beyond one's means. Comparing the tzedakah amount to other budget items ensures caring for others remains a core priority.",
        },
        {
          title: "Balance self-care and community care",
          text: "Rabbi Hillel taught that one must balance caring for oneself with caring for others. The percentage and amount change as life circumstances change — flexibility is built into the system.",
        },
        {
          title: "Practical budgeting for frum families",
          text: "Make a budget covering all major categories (housing, car, insurance, tuition, etc.), decide priorities and include savings for retirement, celebrations and emergencies. Track spending regularly and record every transaction.",
        },
        {
          title: "Budgeting brings freedom",
          text: "Far from being restrictive, budgeting brings freedom by clarifying opportunity costs and preventing overspending. A family that knows where money goes can make better decisions.",
        },
        {
          title: "The Jewish 5 Jars method",
          text: "A five-jar method aligning finances with biblical and Jewish values: Tithe (10%), Blessing (10%), Investing (20%), Savings (10%), and Spending (50%). Give first, then save, invest, and spend what remains.",
        },
        {
          title: "Interest-free loans (Gemilut Chesed)",
          text: "Jewish tradition regards interest-free loans as a high form of tzedakah. Jews are prohibited from lending to other Jews for interest. Maimonides taught that helping the poor with a loan places them where they can eventually dispense with help.",
        },
        {
          title: "Sabbatical debt release (Shemitah)",
          text: "The Torah prohibits usury and commands debt release during the Sabbatical year. These laws emphasize compassion for borrowers and discourage exploiting the needy.",
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Spanish content                                                    */
/* ------------------------------------------------------------------ */

const SPANISH_CONTENT: FinancialWisdomContent = {
  toolsSection: {
    title: "Herramientas y apps para el dinero",
    intro:
      "Las apps rastrean, categorizan y muestran el gasto. Ninguna es mágica — elige la que de verdad abras cada semana.",
    tools: [
      {
        name: "YNAB",
        tagline: "You Need A Budget",
        description:
          "Presupuesto base cero: cada peso tiene un trabajo. Sincroniza entre dispositivos, con metas y enseñanza. Suscripción de pago.",
      },
      {
        name: "Rocket Money",
        tagline: "Suscripciones y facturas",
        description:
          "Encuentra suscripciones, mira tu puntaje crediticio y puede ayudar a negociar facturas.",
      },
      {
        name: "Empower",
        tagline: "Presupuesto más inversiones",
        description:
          "Presupuesto, inversiones y retiro en una sola vista.",
      },
      {
        name: "EveryDollar",
        tagline: "Los Baby Steps de Dave Ramsey",
        description:
          "Presupuesto base cero al estilo Ramsey. Gratis con entrada manual; de pago se conecta al banco.",
      },
      {
        name: "GoodBudget",
        tagline: "Sobres digitales",
        description:
          "Sobres virtuales por categoría — gasta contra cada uno, como efectivo en frascos.",
      },
      {
        name: "Tiller",
        tagline: "Hojas de cálculo automatizadas",
        description:
          "Lleva las transacciones a Google Sheets o Excel para que tú controles las fórmulas.",
      },
      {
        name: "Simplifi, Monarch Money y PocketGuard",
        tagline: "Paneles y pronósticos",
        description:
          "Importación automática, gráficos y pronósticos — cada una con su precio y público.",
      },
    ],
    closingNote:
      "El papel y el lápiz siguen valiendo. Lo que importa es un sistema que encaje con cómo vives. Automatizar pagos mínimos y ahorros reduce fechas perdidas y convierte el plan en hábito.",
  },
  additionalSystems: {
    title: "Sistemas adicionales de presupuesto",
    entries: [
      {
        title: "Presupuesto de calendario",
        text: "Marcar días de pago, facturas y transferencias de ahorro en un calendario con colores diferentes ayuda a visualizar el flujo de efectivo y evitar sobregiros.",
      },
      {
        title: "Presupuesto basado en valores",
        text: "Gastar e invertir de formas alineadas con valores personales — apoyar empresas éticas, reemplazar productos con alternativas sostenibles, donar a caridades locales y revisar portafolios de inversión por fondos socialmente responsables.",
      },
      {
        title: "La solución del 60%",
        text: "Asignar cerca del 60% del ingreso a lo esencial y el resto a ahorro y gasto discrecional. Esta idea subyace a la regla 60/30/10 y funciona bien para áreas con alto costo de vida.",
      },
    ],
  },
  sections: [
    {
      id: "biblical",
      title: "Principios bíblicos y cristianos",
      eyebrow: "Mayordomía",
      icon: "book-open",
      intro:
        "En la Escritura, el dinero se administra; no se posee. Planifica, da, evita deudas innecesarias y conténtate.",
      entries: [
        {
          title: "Sabe en qué estás",
          text: "Un presupuesto frena el gasto impulsivo. Conoce lo que tienes y decide.",
          reference: "Proverbios 27:23",
        },
        {
          title: "Diezma fielmente (10%)",
          text: "Apartar el primer diezmo sostiene a la iglesia y forma el corazón. Planes como las 5 Jarras dan a Dios la primera porción.",
          reference: "Malaquías 3:10",
        },
        {
          title: "Evita endeudarte innecesariamente",
          text: "Pide prestado para lo que mantiene o gana valor; evita la deuda de consumo con alto interés. El que pide prestado se vuelve siervo del que presta.",
          reference: "Proverbios 22:7",
        },
        {
          title: "Ahorra antes de gastar",
          text: "Aparta algo para emergencias y el largo plazo, para no apoyarte en el crédito. El sabio guarda para después.",
          reference: "Proverbios 21:20",
        },
        {
          title: "Da con generosidad",
          text: "Más bienaventurado es dar que recibir. La generosidad refleja la provisión de Dios — no es un añadido.",
          reference: "Hechos 20:35",
        },
        {
          title: "Confía en Dios, no en las riquezas",
          text: "La riqueza no dura. Busca primero el reino de Dios; lo demás sigue. La seguridad está en Dios, no en las riquezas.",
          reference: "1 Timoteo 6:17",
        },
        {
          title: "Todo es don de Dios",
          text: "De Jehová es la tierra. Los creyentes administran el dinero y las posesiones; no los poseen en última instancia.",
          reference: "Salmo 24:1",
        },
        {
          title: "Vive según tus medios",
          text: "Planifica, ahorra y no acumules lo que no necesitas. Cuídate de la avaricia.",
          reference: "Lucas 12:15",
        },
        {
          title: "Busca consejo sabio y conténtate",
          text: "Pregunta a gente de confianza. El contentamiento y la confianza en Dios frenan las decisiones temerarias con el dinero.",
          reference: "Proverbios 15:22",
        },
        {
          title: "Sé diligente y planifica",
          text: "El trabajo y la planificación sostienen el presupuesto, el ahorro y las emergencias. La mano negligente empobrece.",
          reference: "Proverbios 10:4",
        },
        {
          title: "Honra a Dios en las decisiones de dinero",
          text: "Reconócele en todos tus caminos. Confiar en Él alinea la fe y el dinero.",
          reference: "Proverbios 3:6",
        },
      ],
    },
    {
      id: "jewish",
      title: "Presupuesto y ética financiera judía",
      eyebrow: "Tzedakah y ética",
      icon: "star",
      intro:
        "La enseñanza judía trata el dinero con Torá, cuidado rabínico y responsabilidad comunitaria — dar, prestar con compasión y administrar con disciplina.",
      entries: [
        {
          title: "Tzedakah como deber sagrado",
          text: "En la ley judía, la tzedakah (donación caritativa) no es generosidad opcional sino una obligación sagrada. Se debe apartar un porcentaje del ingreso basado en las ganancias del año anterior y evitar dar más allá de los medios propios.",
        },
        {
          title: "Equilibrar autocuidado y cuidado comunitario",
          text: "El Rabino Hillel enseñó que uno debe equilibrar el cuidado propio con el cuidado de los demás. El porcentaje y monto cambian conforme cambian las circunstancias de vida — la flexibilidad está incorporada en el sistema.",
        },
        {
          title: "Presupuesto práctico para familias observantes",
          text: "Hacer un presupuesto que cubra todas las categorías principales (vivienda, auto, seguros, colegiatura, etc.), decidir prioridades e incluir ahorro para retiro, celebraciones y emergencias. Rastrear gastos regularmente.",
        },
        {
          title: "El presupuesto trae libertad",
          text: "Lejos de ser restrictivo, presupuestar trae libertad al clarificar costos de oportunidad y prevenir el gasto excesivo. Una familia que sabe a dónde va el dinero puede tomar mejores decisiones.",
        },
        {
          title: "El método judío de las 5 Jarras",
          text: "Un método de cinco jarras que alinea las finanzas con valores bíblicos y judíos: Diezmo (10%), Bendición (10%), Inversión (20%), Ahorro (10%) y Gasto (50%). Da primero, luego ahorra, invierte y gasta lo que queda.",
        },
        {
          title: "Préstamos sin interés (Gemilut Chesed)",
          text: "La tradición judía considera los préstamos sin interés como una forma elevada de tzedakah. Está prohibido prestar a otros judíos con interés. Maimónides enseñó que ayudar al pobre con un préstamo lo pone en posición de eventualmente prescindir de ayuda.",
        },
        {
          title: "Liberación de deuda sabática (Shemitah)",
          text: "La Torá prohíbe la usura y ordena la liberación de deudas durante el año sabático. Estas leyes enfatizan compasión hacia los deudores y desalientan la explotación del necesitado.",
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Export                                                              */
/* ------------------------------------------------------------------ */

const CONTENT_BY_LOCALE: Record<AppLocale, FinancialWisdomContent> = {
  en: ENGLISH_CONTENT,
  es: SPANISH_CONTENT,
};

export function getFinancialWisdomContent(
  locale: AppLocale
): FinancialWisdomContent {
  return CONTENT_BY_LOCALE[locale];
}
