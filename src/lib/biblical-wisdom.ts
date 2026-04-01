import { type AppLocale } from "@/lib/utils";

export interface BiblicalPassage {
  reference: string;
  takeaway: string;
  practice: string;
}

export interface BiblicalTheme {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  actions: string[];
  passages: BiblicalPassage[];
}

export interface BibleTranslationSource {
  code: string;
  name: string;
  link: string;
  notice: string;
}

export interface BiblicalWisdomContent {
  themes: BiblicalTheme[];
  translations: BibleTranslationSource[];
}

const ENGLISH_THEMES: BiblicalTheme[] = [
  {
    slug: "administracion-de-bienes",
    title: "Stewardship of resources",
    eyebrow: "Stewardship",
    summary:
      "Scripture presents money, possessions, and capacity as entrusted resources. The goal is not accumulation for its own sake, but faithful management with clarity and purpose.",
    actions: [
      "Set a monthly plan before spending starts.",
      "Separate essentials, generosity, and optional desires.",
      "Review decisions honestly instead of reactively.",
    ],
    passages: [
      {
        reference: "Luke 16:10-11",
        takeaway:
          "Faithfulness in small decisions prepares the heart for greater responsibility.",
        practice:
          "Treat small expenses as character decisions rather than harmless exceptions.",
      },
      {
        reference: "1 Corinthians 4:2",
        takeaway:
          "Stewards are measured by faithfulness before appearance, speed, or improvisation.",
        practice:
          "Judge the month by steady obedience and consistency, not only by visible wins.",
      },
    ],
  },
  {
    slug: "trabajo-y-tiempo-sabio",
    title: "Work and wise time",
    eyebrow: "Calling",
    summary:
      "Money and time are tied together. Biblical wisdom calls for diligent work, clear priorities, and resistance to frantic busyness that drains judgment.",
    actions: [
      "Protect clear hours for deep work.",
      "Watch for impulse spending driven by fatigue or distraction.",
      "Tie financial goals to repeatable weekly habits.",
    ],
    passages: [
      {
        reference: "Proverbs 21:5",
        takeaway:
          "Diligent plans tend toward abundance, while hurried decisions create avoidable pressure.",
        practice:
          "Budget ahead of time instead of reacting after money is already committed.",
      },
      {
        reference: "Ephesians 5:15-16",
        takeaway:
          "Wisdom redeems time because it recognizes both spiritual and practical value.",
        practice:
          "Review where your energy is being spent before it starts weakening your financial decisions.",
      },
    ],
  },
  {
    slug: "generosidad-y-ayuda-al-pobre",
    title: "Generosity and care for the poor",
    eyebrow: "Compassion",
    summary:
      "Biblical stewardship is never only self-protection. Generosity toward those in need is part of the right use of resources, not an afterthought.",
    actions: [
      "Reserve a realistic amount for mercy and practical help.",
      "Give intentionally, not only from leftovers.",
      "Look for concrete ways to lighten someone else’s burden.",
    ],
    passages: [
      {
        reference: "Proverbs 19:17",
        takeaway:
          "Serving the poor is a way of honoring God with what has been entrusted to you.",
        practice:
          "Include a giving category in your monthly plan, even if it starts small.",
      },
      {
        reference: "Deuteronomy 15:7-8",
        takeaway:
          "Hardness of heart has no place in an economy shaped by God’s character.",
        practice:
          "Practice a prompt but prudent response when you encounter a real need.",
      },
    ],
  },
  {
    slug: "ofrenda-y-donacion",
    title: "Offering and giving",
    eyebrow: "Giving",
    summary:
      "Giving should not be treated as a leftover line item. Biblical offering flows from gratitude, order, and willingness rather than pressure or religious performance.",
    actions: [
      "Decide ahead of time what you plan to give.",
      "Distinguish regular support from exceptional help.",
      "Check whether your generosity reflects gratitude or inertia.",
    ],
    passages: [
      {
        reference: "2 Corinthians 9:6-8",
        takeaway:
          "Disciplined generosity grows out of a willing and trusting heart.",
        practice:
          "Schedule your giving with the same seriousness as fixed expenses.",
      },
      {
        reference: "1 Chronicles 29:14",
        takeaway:
          "Everything comes from God, so giving is a response to grace rather than a display of self-importance.",
        practice:
          "Use gratitude as the filter before each act of giving.",
      },
    ],
  },
  {
    slug: "contentamiento-y-deuda",
    title: "Contentment and debt",
    eyebrow: "Freedom",
    summary:
      "Scripture calls for a life that is not inwardly enslaved to money. Contentment protects against impulsive consumption, and debt requires sober honesty rather than denial.",
    actions: [
      "Identify purchases driven by comparison or anxiety.",
      "Create a simple route for reducing outstanding obligations.",
      "Celebrate quiet progress instead of chasing status.",
    ],
    passages: [
      {
        reference: "Hebrews 13:5",
        takeaway:
          "Contentment breaks the pressure to keep acquiring in order to feel secure.",
        practice:
          "Before buying, ask whether the decision is driven by need, service, or image.",
      },
      {
        reference: "Proverbs 22:7",
        takeaway:
          "Debt creates dependency and should be met with clarity rather than elegant excuses.",
        practice:
          "Prioritize costly obligations before expanding your lifestyle.",
      },
    ],
  },
  {
    slug: "consejo-planeacion-e-integridad",
    title: "Counsel, planning, and integrity",
    eyebrow: "Discernment",
    summary:
      "Biblical financial wisdom values planning and honest counsel. An economy of integrity avoids manipulation, self-deception, and opaque decision-making.",
    actions: [
      "Review each month with real numbers instead of vague impressions.",
      "Seek counsel when a major decision is larger than your own clarity.",
      "Keep records clean enough to review without confusion.",
    ],
    passages: [
      {
        reference: "Proverbs 15:22",
        takeaway:
          "Plans mature more wisely when they receive faithful and competent counsel.",
        practice:
          "Ask for a second opinion before committing to large or long-term expenses.",
      },
      {
        reference: "Proverbs 11:1",
        takeaway:
          "Integrity also shows up in fair measures, clear books, and honest reporting.",
        practice:
          "Make sure your numbers can be reviewed without shame or ambiguity.",
      },
    ],
  },
];

const SPANISH_THEMES: BiblicalTheme[] = [
  {
    slug: "administracion-de-bienes",
    title: "Administración de bienes",
    eyebrow: "Mayordomía",
    summary:
      "La Biblia presenta los recursos como una responsabilidad confiada por Dios. La meta no es acumular sin propósito, sino administrar con fidelidad y claridad.",
    actions: [
      "Define un plan mensual antes de gastar.",
      "Separa lo esencial, lo generoso y lo opcional.",
      "Revisa tus decisiones con honestidad, no con culpa.",
    ],
    passages: [
      {
        reference: "Lucas 16:10-11",
        takeaway:
          "La fidelidad con lo pequeño prepara el corazón para responsabilidades mayores.",
        practice:
          "Trata cada gasto pequeño como una decisión de carácter, no como una excepción.",
      },
      {
        reference: "1 Corintios 4:2",
        takeaway:
          "Al mayordomo se le pide fidelidad antes que apariencia o improvisación.",
        practice:
          "Mide tu mes por constancia y obediencia, no solo por resultados visibles.",
      },
    ],
  },
  {
    slug: "trabajo-y-tiempo-sabio",
    title: "Trabajo y tiempo sabio",
    eyebrow: "Vocación",
    summary:
      "El dinero y el tiempo están unidos. La sabiduría bíblica llama a trabajar con diligencia, evitar la prisa vacía y dar valor a cada jornada.",
    actions: [
      "Asigna horas claras para trabajo profundo.",
      "Evita compras impulsivas nacidas del cansancio o la distracción.",
      "Relaciona tus metas financieras con hábitos semanales concretos.",
    ],
    passages: [
      {
        reference: "Proverbios 21:5",
        takeaway:
          "Los planes diligentes tienden a la abundancia; la prisa sin dirección produce escasez.",
        practice:
          "Presupuesta con anticipación y no después de haber comprometido el dinero.",
      },
      {
        reference: "Efesios 5:15-16",
        takeaway:
          "La sabiduría redime el tiempo porque reconoce su valor espiritual y práctico.",
        practice:
          "Revisa en qué ocupaciones se te va la energía que después afecta tus finanzas.",
      },
    ],
  },
  {
    slug: "generosidad-y-ayuda-al-pobre",
    title: "Generosidad y ayuda al pobre",
    eyebrow: "Compasión",
    summary:
      "La administración bíblica nunca se limita a la autoprotección. La generosidad hacia el necesitado es parte del uso recto de los bienes.",
    actions: [
      "Reserva un monto realista para misericordia y ayuda.",
      "Da con intención, no solo cuando sobra.",
      "Busca oportunidades concretas para aliviar cargas ajenas.",
    ],
    passages: [
      {
        reference: "Proverbios 19:17",
        takeaway:
          "Servir al pobre es una forma de honrar a Dios con lo que se entrega.",
        practice:
          "Incluye una categoría de ayuda en tu plan mensual, aunque sea pequeña.",
      },
      {
        reference: "Deuteronomio 15:7-8",
        takeaway:
          "La dureza del corazón es incompatible con una economía guiada por Dios.",
        practice:
          "Practica una respuesta rápida y prudente cuando veas una necesidad real.",
      },
    ],
  },
  {
    slug: "ofrenda-y-donacion",
    title: "Ofrenda y donación",
    eyebrow: "Entrega",
    summary:
      "Dar no es un residuo del presupuesto. La ofrenda bíblica nace de gratitud, orden y disposición voluntaria, no de presión religiosa.",
    actions: [
      "Decide por adelantado cuánto vas a dar.",
      "Distingue entre apoyo continuo y ayuda extraordinaria.",
      "Revisa si tu generosidad refleja gratitud o simple inercia.",
    ],
    passages: [
      {
        reference: "2 Corintios 9:6-8",
        takeaway:
          "La generosidad disciplinada fluye de un corazón dispuesto y confiado.",
        practice:
          "Programa tus donaciones con la misma seriedad que tus pagos fijos.",
      },
      {
        reference: "1 Crónicas 29:14",
        takeaway:
          "Todo proviene de Dios; dar es responder a lo recibido, no presumir mérito propio.",
        practice:
          "Usa la gratitud como filtro antes de cada acto de entrega.",
      },
    ],
  },
  {
    slug: "contentamiento-y-deuda",
    title: "Contentamiento y deuda",
    eyebrow: "Libertad",
    summary:
      "La Biblia llama a vivir sin esclavitud interior al dinero. El contentamiento protege del consumo impulsivo y la deuda exige prudencia, no negación.",
    actions: [
      "Identifica compras que nacen de comparación o ansiedad.",
      "Traza una ruta simple para reducir obligaciones pendientes.",
      "Celebra progreso sobrio en vez de perseguir estatus.",
    ],
    passages: [
      {
        reference: "Hebreos 13:5",
        takeaway:
          "El contentamiento rompe la presión constante de querer más para sentirse seguro.",
        practice:
          "Antes de comprar, pregúntate si respondes a necesidad, servicio o deseo de imagen.",
      },
      {
        reference: "Proverbios 22:7",
        takeaway:
          "La deuda crea dependencia y requiere decisiones claras, no excusas elegantes.",
        practice:
          "Prioriza pagar compromisos costosos antes de ampliar tu nivel de vida.",
      },
    ],
  },
  {
    slug: "consejo-planeacion-e-integridad",
    title: "Consejo, planeación e integridad",
    eyebrow: "Discernimiento",
    summary:
      "La sabiduría financiera bíblica valora la planeación y el consejo honesto. Una economía íntegra evita la manipulación, el autoengaño y las decisiones opacas.",
    actions: [
      "Haz una revisión mensual con cifras reales.",
      "Pide consejo cuando una decisión importante te supere.",
      "Mantén tus registros limpios y comprensibles.",
    ],
    passages: [
      {
        reference: "Proverbios 15:22",
        takeaway:
          "Los planes maduran mejor cuando reciben consejo fiel y competente.",
        practice:
          "Busca una segunda opinión antes de comprometerte con gastos grandes o de largo plazo.",
      },
      {
        reference: "Proverbios 11:1",
        takeaway:
          "La integridad también se expresa en medidas justas, cuentas claras y trato recto.",
        practice:
          "Haz que tus números puedan ser revisados sin vergüenza ni confusión.",
      },
    ],
  },
];

const ENGLISH_TRANSLATIONS: BibleTranslationSource[] = [
  {
    code: "ESV",
    name: "English Standard Version",
    link: "https://www.esv.org/",
    notice:
      "Use the official ESV text as one of the English reference families for the wisdom themes and verse lookups.",
  },
  {
    code: "NIV",
    name: "New International Version",
    link: "https://www.thenivbible.com/",
    notice:
      "Use the official NIV text as the second English reference family for reading, comparison, and study.",
  },
];

const SPANISH_TRANSLATIONS: BibleTranslationSource[] = [
  {
    code: "NBLA",
    name: "Nueva Biblia de las Américas",
    link: "https://www.NuevaBiblia.com",
    notice:
      "Usa la NBLA como una de las referencias principales en español para estos temas y pasajes.",
  },
  {
    code: "NVI",
    name: "Nueva Versión Internacional",
    link: "https://www.biblica.com/bible/nvi/",
    notice:
      "Usa la NVI como la segunda referencia principal en español para contraste, lectura y estudio.",
  },
];

const BIBLICAL_WISDOM_BY_LOCALE: Record<AppLocale, BiblicalWisdomContent> = {
  en: {
    themes: ENGLISH_THEMES,
    translations: ENGLISH_TRANSLATIONS,
  },
  es: {
    themes: SPANISH_THEMES,
    translations: SPANISH_TRANSLATIONS,
  },
};

export function getBiblicalWisdomContent(locale: AppLocale): BiblicalWisdomContent {
  return BIBLICAL_WISDOM_BY_LOCALE[locale];
}
