import type { Locale } from "@/lib/site-content";

type Detail = { intro: string; items: string[] };

export const extra: Record<Locale, {
  viewAll: string; readMore: string; latest: string; relatedServices: string; allServices: string; bookThis: string; readingBack: string;
  published: string; otherArticles: string; noArticles: string; breadcrumbServices: string;
  contact: { info: string; text: string; email: string; phone: string; whatsapp: string; address: string; viaForm: string; response: string };
  careers: { title: string; intro: string; points: string[] };
  booking: { title: string; points: string[]; payTitle: string; payText: string };
  search: { submit: string; hint: string };
  gallery: { title: string; description: string; empty: string };
  details: Record<string, Detail>;
}> = {
  ar: {
    viewAll: "عرض الكل", readMore: "قراءة المقال", latest: "آخر المقالات", relatedServices: "خدمات أخرى", allServices: "جميع الخدمات", bookThis: "احجز استشارة في هذا المجال", readingBack: "العودة إلى المدونة",
    published: "نُشر في", otherArticles: "مقالات أخرى", noArticles: "لا توجد مقالات منشورة حالياً.", breadcrumbServices: "الخدمات",
    contact: { info: "معلومات التواصل", text: "اختاروا الوسيلة الأنسب لكم. نردّ على الرسائل بالعربية أو الفرنسية.", email: "البريد الإلكتروني", phone: "الهاتف", whatsapp: "واتساب", address: "العنوان", viaForm: "يُرسَل طلبكم عبر النموذج وسنعود إليكم.", response: "نعمل على الرد في أقرب وقت ممكن. للحالات المستعجلة اذكروا ذلك في رسالتكم." },
    careers: { title: "لماذا الانضمام إلى المكتب؟", intro: "نبحث عن أشخاص يشاركوننا قيم الدقة والنزاهة والإصغاء. نرحب بالترشحات التلقائية للتدريب والتعاون.", points: ["العمل على ملفات متنوعة في مجالات الأعمال والعقار والأسرة", "تأطير مهني قائم على الدقة والسرية", "بيئة عمل ثنائية اللغة: العربية والفرنسية", "تطوير مستمر للمهارات القانونية والمهنية"] },
    booking: { title: "كيف تتم العملية؟", points: ["تملؤون معلومات الطلب وتختارون الصيغة المناسبة", "تدفعون بالدينار التونسي بوسيلة دفع تونسية عبر بوابة آمنة", "يراجع المكتب الطلب ويؤكد الموعد", "تتم الاستشارة بالعربية أو الفرنسية، عن بعد أو في المكتب"], payTitle: "الدفع بالدينار التونسي", payText: "بطاقة بنكية أو e-Dinar أو محفظة Konnect. لا تُحفظ بيانات البطاقة في هذا الموقع." },
    search: { submit: "بحث", hint: "اكتبوا كلمة مثل: عقار، عقود، شركات، أسرة…" },
    gallery: { title: "معرض الصور", description: "صور يختارها المكتب لتقديم فضائه وأنشطته.", empty: "لا توجد صور منشورة حالياً." },
    details: {
      corporate: { intro: "مرافقة قانونية مستمرة للشركات والمستثمرين ورواد الأعمال، من التأسيس إلى التطوير.", items: [] },
      individual: { intro: "مرافقة واضحة للأفراد في ملفاتهم ومعاملاتهم القانونية اليومية والنزاعية.", items: [] },
      commercial: { intro: "يساعدكم المكتب على تنظيم نشاطكم التجاري وحماية علاقاتكم التعاقدية والمالية.", items: ["تأسيس الشركات واختيار الشكل القانوني المناسب", "عقود التوزيع والتوريد والشراكة", "تحصيل الديون ومتابعة النزاعات التجارية", "الاستشارات اليومية لأصحاب المشاريع"] },
      family: { intro: "مرافقة إنسانية تحترم خصوصية كل عائلة وتحمي مصلحة أفرادها، وفق القانون التونسي.", items: ["الزواج والطلاق وآثارهما", "الحضانة والنفقة وزيارة الأبناء", "الإرث وتقسيم التركات", "الاتفاقات الودية والصلح"] },
      property: { intro: "تأمين معاملاتكم العقارية وحماية حقوقكم قبل التوقيع وبعده.", items: ["مراجعة عقود البيع والكراء والوعد بالبيع", "التثبت من الوضعية العقارية والوثائق", "نزاعات الملكية والحدود والإخلاء", "مرافقة المستثمرين والباعثين العقاريين"] },
      employment: { intro: "توضيح الحقوق والالتزامات بين الأجراء والمؤسسات وتقديم حلول متوازنة.", items: ["عقود الشغل وتنظيم العلاقة المهنية", "الفصل والتعويضات والحقوق الاجتماعية", "النزاعات الفردية والجماعية", "المرافقة القانونية للمؤسسات في الموارد البشرية"] },
      criminal: { intro: "دفاع مسؤول يحترم قرينة البراءة والإجراءات، مع متابعة دقيقة لكل مرحلة.", items: ["المرافقة أثناء الأبحاث والتحقيق", "الدفاع أمام المحاكم الجزائية", "الشكايات والتتبعات", "الطعون والإجراءات اللاحقة"] },
      contracts: { intro: "صياغة دقيقة تستبق المخاطر وتحفظ حقوق جميع الأطراف.", items: ["صياغة العقود ومراجعتها قبل التوقيع", "الاتفاقيات الخاصة والملاحق", "الإنذارات والمراسلات القانونية", "استشارات قانونية مكتوبة"] },
    },
  },
  fr: {
    viewAll: "Voir tout", readMore: "Lire l’article", latest: "Derniers articles", relatedServices: "Autres services", allServices: "Tous les services", bookThis: "Réserver une consultation sur ce sujet", readingBack: "Retour au journal",
    published: "Publié le", otherArticles: "Autres articles", noArticles: "Aucun article publié pour le moment.", breadcrumbServices: "Services",
    contact: { info: "Coordonnées", text: "Choisissez le moyen qui vous convient. Nous répondons en français ou en arabe.", email: "E-mail", phone: "Téléphone", whatsapp: "WhatsApp", address: "Adresse", viaForm: "Votre demande est transmise via le formulaire et nous vous répondons.", response: "Nous répondons dans les meilleurs délais. En cas d’urgence, précisez-le dans votre message." },
    careers: { title: "Pourquoi rejoindre le cabinet ?", intro: "Nous recherchons des personnes qui partagent nos valeurs de rigueur, d’intégrité et d’écoute. Les candidatures spontanées pour un stage ou une collaboration sont les bienvenues.", points: ["Des dossiers variés : affaires, immobilier, famille", "Un encadrement fondé sur la précision et la confidentialité", "Un environnement bilingue : français et arabe", "Un développement continu des compétences juridiques"] },
    booking: { title: "Comment ça se passe ?", points: ["Vous renseignez votre demande et choisissez un format", "Vous réglez en dinars tunisiens via une passerelle sécurisée", "Le cabinet examine la demande et confirme le rendez-vous", "La consultation se déroule en français ou en arabe, à distance ou au cabinet"], payTitle: "Paiement en dinars tunisiens", payText: "Carte bancaire, e-Dinar ou wallet Konnect. Aucune donnée de carte n’est conservée sur ce site." },
    search: { submit: "Rechercher", hint: "Essayez : immobilier, contrats, société, famille…" },
    gallery: { title: "Galerie", description: "Une sélection d’images du cabinet, de ses espaces et de ses activités.", empty: "Aucune image publiée pour le moment." },
    details: {
      corporate: { intro: "Un accompagnement juridique continu pour les entreprises, investisseurs et entrepreneurs, de la création au développement.", items: [] },
      individual: { intro: "Un accompagnement clair pour les particuliers dans leurs démarches et leurs litiges.", items: [] },
      commercial: { intro: "Le cabinet vous aide à organiser votre activité et à protéger vos relations contractuelles et financières.", items: ["Création de sociétés et choix de la forme juridique", "Contrats de distribution, d’approvisionnement et de partenariat", "Recouvrement de créances et litiges commerciaux", "Conseil au quotidien pour les porteurs de projet"] },
      family: { intro: "Un accompagnement humain, respectueux de chaque famille et de l’intérêt de chacun, selon le droit tunisien.", items: ["Mariage, divorce et leurs effets", "Garde, pension alimentaire et droit de visite", "Successions et partage", "Accords amiables et médiation"] },
      property: { intro: "Sécuriser vos opérations immobilières et protéger vos droits avant et après la signature.", items: ["Revue des contrats de vente, de bail et promesses de vente", "Vérification de la situation foncière et des documents", "Litiges de propriété, de limites et d’expulsion", "Accompagnement des investisseurs et promoteurs"] },
      employment: { intro: "Clarifier les droits et obligations entre salariés et entreprises et proposer des solutions équilibrées.", items: ["Contrats de travail et organisation des relations professionnelles", "Licenciement, indemnités et droits sociaux", "Litiges individuels et collectifs", "Conseil aux entreprises en ressources humaines"] },
      criminal: { intro: "Une défense responsable, respectueuse de la présomption d’innocence et des procédures, avec un suivi rigoureux.", items: ["Assistance pendant l’enquête et l’instruction", "Défense devant les juridictions pénales", "Plaintes et poursuites", "Recours et suites de procédure"] },
      contracts: { intro: "Une rédaction précise pour anticiper les risques et préserver les droits de chaque partie.", items: ["Rédaction et revue de contrats avant signature", "Accords particuliers et avenants", "Mises en demeure et courriers juridiques", "Consultations juridiques écrites"] },
    },
  },
};
