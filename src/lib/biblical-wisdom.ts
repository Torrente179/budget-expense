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

export const biblicalThemes: BiblicalTheme[] = [
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

export const nblaAttribution =
  "Escrituras tomadas de la Nueva Biblia de las Américas (NBLA), Copyright © 2005 por The Lockman Foundation. Usadas con permiso.";

export const nblaLink = "https://www.NuevaBiblia.com";
