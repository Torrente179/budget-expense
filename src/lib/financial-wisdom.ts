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
      "Modern apps automate tracking, categorize expenses and offer analytics. There is no single 'best' tool — the best system depends on your lifestyle and habits.",
    tools: [
      {
        name: "YNAB",
        tagline: "You Need A Budget",
        description:
          "Uses zero-based budgeting and teaches users to assign every dollar a job. Offers syncing across devices, goal setting and educational content. Requires a subscription.",
      },
      {
        name: "Rocket Money",
        tagline: "Track subscriptions and bills",
        description:
          "Helps track subscriptions, monitors credit scores and offers bill-negotiation services.",
      },
      {
        name: "Empower",
        tagline: "Budget meets investing",
        description:
          "Integrates budgeting with investment tracking and retirement planning in a single view.",
      },
      {
        name: "EveryDollar",
        tagline: "Dave Ramsey's Baby Steps",
        description:
          "Based on Dave Ramsey's system using zero-based budgeting. Free version with manual entry, paid version connects to bank accounts.",
      },
      {
        name: "GoodBudget",
        tagline: "Digital envelopes",
        description:
          "Implements the envelope system digitally. Users allocate virtual envelopes to categories and track spending against each one.",
      },
      {
        name: "Tiller",
        tagline: "Automated spreadsheets",
        description:
          "Imports transactions into Google Sheets or Excel so that users retain full control over categories and formulas.",
      },
      {
        name: "Simplifi, Monarch Money & PocketGuard",
        tagline: "Visual dashboards and forecasting",
        description:
          "Various combinations of automatic transaction import, visual dashboards and forecasting. Each has unique subscription costs and target audiences.",
      },
    ],
    closingNote:
      "An NFCC-certified credit counselor noted that many people use pen-and-paper budgeting or apps, but the effectiveness of a system depends on whether it fits your habits. Automating minimum payments and savings reduces missed due dates and turns a budget into a routine.",
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
        "Biblical teachings frame money management as stewardship rather than ownership. These principles emphasize planning, generosity, debt avoidance and contentment.",
      entries: [
        {
          title: "Follow a plan and know your finances",
          text: "Budgeting helps avoid impulsive spending and stay within means. Know the state of your resources and make informed decisions.",
          reference: "Proverbs 27:23",
        },
        {
          title: "Tithe faithfully (10%)",
          text: "Giving 10% of income supports the church and teaches stewardship. Faith-based budgeting frameworks like the 5 Jars dedicate the first portion to God.",
          reference: "Malachi 3:10",
        },
        {
          title: "Avoid unnecessary borrowing",
          text: "Only borrow for items that hold or gain value and avoid high-interest consumer debt. The borrower becomes servant to the lender.",
          reference: "Proverbs 22:7",
        },
        {
          title: "Save before spending",
          text: "Saving at least 10% of income for emergencies and long-term needs prevents reliance on credit. The wise store up for the future.",
          reference: "Proverbs 21:20",
        },
        {
          title: "Give generously",
          text: "It is more blessed to give than to receive. Giving to others brings blessings and reflects God's provision. Generosity is not optional.",
          reference: "Acts 20:35",
        },
        {
          title: "Trust God, not wealth",
          text: "Wealth is temporary. Seeking God's kingdom first ensures needs are met. Trust in God rather than riches for security.",
          reference: "1 Timothy 6:17",
        },
        {
          title: "Everything is God's gift",
          text: "The earth is the Lord's. Believers are stewards of money and possessions, not ultimate owners.",
          reference: "Psalm 24:1",
        },
        {
          title: "Live within your means",
          text: "Christians are urged to plan, save and avoid accumulating unnecessary possessions. Guard against greed.",
          reference: "Luke 12:15",
        },
        {
          title: "Seek wise counsel and be content",
          text: "Seek advice from trusted advisers. Contentment and reliance on God protect against reckless financial decisions.",
          reference: "Proverbs 15:22",
        },
        {
          title: "Be diligent and plan for the future",
          text: "Hard work and planning support budgeting, saving and preparing for emergencies. Lazy hands make for poverty.",
          reference: "Proverbs 10:4",
        },
        {
          title: "Honor God in financial decisions",
          text: "Acknowledge God in all your ways. Trusting God guides wise financial choices and brings alignment between faith and money.",
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
        "Jewish tradition provides profound financial wisdom rooted in Torah law, rabbinic teaching, and communal responsibility. These principles emphasize charitable obligation, debt compassion, and disciplined stewardship.",
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
    title: "Herramientas y apps para rastrear dinero",
    intro:
      "Las apps modernas automatizan el seguimiento, categorizan gastos y ofrecen análisis. No hay una 'mejor' herramienta — el mejor sistema depende de tu estilo de vida y hábitos.",
    tools: [
      {
        name: "YNAB",
        tagline: "You Need A Budget",
        description:
          "Usa presupuesto base cero y enseña a asignar cada peso a un trabajo. Ofrece sincronización entre dispositivos, metas y contenido educativo. Requiere suscripción.",
      },
      {
        name: "Rocket Money",
        tagline: "Rastrea suscripciones y facturas",
        description:
          "Ayuda a rastrear suscripciones, monitorear puntaje crediticio y ofrece servicios de negociación de facturas.",
      },
      {
        name: "Empower",
        tagline: "Presupuesto más inversiones",
        description:
          "Integra presupuesto con seguimiento de inversiones y planificación de retiro en una sola vista.",
      },
      {
        name: "EveryDollar",
        tagline: "Los Baby Steps de Dave Ramsey",
        description:
          "Basado en el sistema de Dave Ramsey con presupuesto base cero. Versión gratuita con entrada manual, versión pagada se conecta a cuentas bancarias.",
      },
      {
        name: "GoodBudget",
        tagline: "Sobres digitales",
        description:
          "Implementa el sistema de sobres de forma digital. Los usuarios asignan sobres virtuales a categorías y rastrean gastos contra cada uno.",
      },
      {
        name: "Tiller",
        tagline: "Hojas de cálculo automatizadas",
        description:
          "Importa transacciones a Google Sheets o Excel para que los usuarios mantengan control total sobre categorías y fórmulas.",
      },
      {
        name: "Simplifi, Monarch Money y PocketGuard",
        tagline: "Paneles visuales y pronósticos",
        description:
          "Combinaciones variadas de importación automática, paneles visuales y pronósticos. Cada una con costos y públicos diferentes.",
      },
    ],
    closingNote:
      "Un asesor certificado del NFCC señaló que muchas personas usan presupuesto en papel o apps, pero la efectividad de un sistema depende de si se adapta a tus hábitos. Automatizar pagos mínimos y ahorros reduce fechas perdidas y convierte el presupuesto en rutina.",
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
        "Las enseñanzas bíblicas enmarcan la administración del dinero como mayordomía en vez de propiedad. Estos principios enfatizan planificación, generosidad, evitar deudas y contentamiento.",
      entries: [
        {
          title: "Sigue un plan y conoce tus finanzas",
          text: "Presupuestar ayuda a evitar gastos impulsivos y mantenerse dentro de los medios. Conoce el estado de tus recursos y toma decisiones informadas.",
          reference: "Proverbios 27:23",
        },
        {
          title: "Diezma fielmente (10%)",
          text: "Dar el 10% del ingreso apoya a la iglesia y enseña mayordomía. Marcos de presupuesto basados en la fe como las 5 Jarras dedican la primera porción a Dios.",
          reference: "Malaquías 3:10",
        },
        {
          title: "Evita endeudarte innecesariamente",
          text: "Solo pide prestado para cosas que mantienen o ganan valor y evita deuda de consumo con alto interés. El que pide prestado se vuelve siervo del que presta.",
          reference: "Proverbios 22:7",
        },
        {
          title: "Ahorra antes de gastar",
          text: "Ahorrar al menos el 10% del ingreso para emergencias y necesidades a largo plazo previene la dependencia del crédito. El sabio guarda para el futuro.",
          reference: "Proverbios 21:20",
        },
        {
          title: "Da con generosidad",
          text: "Más bienaventurado es dar que recibir. Dar a otros trae bendiciones y refleja la provisión de Dios. La generosidad no es opcional.",
          reference: "Hechos 20:35",
        },
        {
          title: "Confía en Dios, no en las riquezas",
          text: "La riqueza es temporal. Buscar primero el reino de Dios asegura que las necesidades sean cubiertas. Confía en Dios más que en las riquezas.",
          reference: "1 Timoteo 6:17",
        },
        {
          title: "Todo es regalo de Dios",
          text: "Del Señor es la tierra. Los creyentes son mayordomos del dinero y las posesiones, no dueños absolutos.",
          reference: "Salmo 24:1",
        },
        {
          title: "Vive dentro de tus medios",
          text: "Los cristianos son exhortados a planificar, ahorrar y evitar acumular posesiones innecesarias. Guárdate de la avaricia.",
          reference: "Lucas 12:15",
        },
        {
          title: "Busca consejo sabio y sé agradecido",
          text: "Busca consejo de asesores de confianza. El contentamiento y la dependencia en Dios protegen contra decisiones financieras temerarias.",
          reference: "Proverbios 15:22",
        },
        {
          title: "Sé diligente y planifica para el futuro",
          text: "El trabajo duro y la planificación apoyan el presupuesto, el ahorro y la preparación para emergencias. Las manos perezosas llevan a la pobreza.",
          reference: "Proverbios 10:4",
        },
        {
          title: "Honra a Dios en decisiones financieras",
          text: "Reconoce a Dios en todos tus caminos. Confiar en Dios guía decisiones financieras sabias y alinea fe con dinero.",
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
        "La tradición judía ofrece sabiduría financiera profunda enraizada en la ley de la Torá, la enseñanza rabínica y la responsabilidad comunitaria. Estos principios enfatizan la obligación caritativa, la compasión ante la deuda y la mayordomía disciplinada.",
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
