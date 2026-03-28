/**
 * KisanSat bilingual translations — English + Pakistani Urdu
 * All Urdu is authentic, simple, farmer-friendly Pakistani Urdu.
 */

export const translations = {
  // ── Navbar ──────────────────────────────────────────────
  nav: {
    home: { en: "Home", ur: "ہوم" },
    dashboard: { en: "Dashboard", ur: "ڈیش بورڈ" },
    howItWorks: { en: "How It Works", ur: "یہ کیسے کام کرتا ہے" },
    about: { en: "About", ur: "تعارف" },
    getStarted: { en: "Get Started", ur: "شروع کریں" },
    brand: { en: "KisanSat", ur: "کسان سیٹ" },
  },

  // ── Hero ────────────────────────────────────────────────
  hero: {
    badge: {
      en: "Powered by NASA Prithvi-EO-2.0",
      ur: "ناسا پرتھوی-EO-2.0 سے تقویت یافتہ",
    },
    subtitle: {
      en: "NASA satellite intelligence meets multi-agent AI to fight food insecurity affecting 11 million Pakistanis with real-time crop advisories.",
      ur: "ناسا سیٹلائٹ ٹیکنالوجی اور AI کی مدد سے 1 کروڑ 10 لاکھ پاکستانی کسانوں کو فصل کی حقیقی وقت مشاورت فراہم کرنا۔",
    },
    urduTagline: {
      en: "کسان سیٹ",
      ur: "کسان سیٹ — مستقبل کی کھیتی",
    },
    ctaPrimary: { en: "Get Crop Advisory", ur: "فصل مشاورت حاصل کریں" },
    ctaSecondary: { en: "How it works", ur: "یہ کیسے کام کرتا ہے" },
    stats: {
      foodInsecure: { en: "Food Insecure", ur: "غذائی عدم تحفظ" },
      aiAgents: { en: "AI Agents", ur: "AI ایجنٹس" },
      hectaresLost: { en: "Hectares Lost", ur: "ہیکٹر تباہ" },
    },
  },

  // ── Why KisanSat ────────────────────────────────────────
  why: {
    badge: { en: "The Problem", ur: "مسئلہ" },
    title: { en: "Why KisanSat?", ur: "کسان سیٹ کیوں؟" },
    subtitle: {
      en: "11 million Pakistanis face food insecurity. NASA monitors every inch of Pakistan's farmland from space — but this data never reaches the farmers who need it most.",
      ur: "1 کروڑ 10 لاکھ پاکستانی غذائی عدم تحفظ کا شکار ہیں۔ ناسا پاکستان کی ہر زمین کو خلا سے دیکھتا ہے — لیکن یہ ڈیٹا کسانوں تک نہیں پہنچتا۔",
    },
    cards: [
      {
        title: { en: "Cropland Destroyed", ur: "فصلوں کی زمین تباہ" },
        description: {
          en: "In the 2022 Pakistan floods, 1.1 million hectares of cropland were destroyed — assessed using Sentinel-1, Sentinel-2, and GPM satellite data.",
          ur: "2022 کے سیلاب میں 11 لاکھ ہیکٹر فصلوں کی زمین تباہ ہوئی — سیٹلائٹ ڈیٹا سے تصدیق شدہ۔",
        },
      },
      {
        title: { en: "Food Insecure", ur: "غذائی عدم تحفظ" },
        description: {
          en: "11 million people across 68 flood-affected districts in Balochistan, Sindh, and KPK face acute food insecurity at crisis levels.",
          ur: "بلوچستان، سندھ اور خیبرپختونخوا کے 68 اضلاع میں 1 کروڑ 10 لاکھ لوگ شدید غذائی بحران کا شکار ہیں۔",
        },
      },
      {
        title: { en: "People Affected", ur: "متاثرہ لوگ" },
        description: {
          en: "33 million people were affected by the 2022 floods — with 88% cotton and 80% rice production lost across Pakistan.",
          ur: "2022 کے سیلاب سے 3 کروڑ 30 لاکھ لوگ متاثر ہوئے — 88 فیصد کپاس اور 80 فیصد چاول کی پیداوار تباہ ہو گئی۔",
        },
      },
    ],
  },

  // ── How It Works ────────────────────────────────────────
  how: {
    badge: { en: "Simple Process", ur: "آسان طریقہ" },
    title: { en: "How It Works", ur: "یہ کیسے کام کرتا ہے" },
    subtitle: {
      en: "From farm location to actionable advisory in under 60 seconds.",
      ur: "کھیت کے مقام سے عملی مشاورت تک، 60 سیکنڈ سے بھی کم وقت میں۔",
    },
    steps: [
      {
        title: { en: "Enter Your Location", ur: "اپنا مقام درج کریں" },
        description: {
          en: "Drop a pin on the map or enter coordinates. Select your crop type and growing season for tailored analysis.",
          ur: "نقشے پر اپنا مقام منتخب کریں یا کوآرڈینیٹ درج کریں۔ فصل کی قسم اور موسم منتخب کریں۔",
        },
      },
      {
        title: { en: "6 AI Agents Analyze", ur: "6 AI ایجنٹ تجزیہ کریں" },
        description: {
          en: "Our multi-agent pipeline processes NASA satellite data, weather forecasts, soil health, pest risks, and market prices in parallel.",
          ur: "ہمارے AI ایجنٹ بیک وقت ناسا سیٹلائٹ ڈیٹا، موسم، مٹی کی صحت، کیڑوں کے خطرات اور منڈی کی قیمتوں کا تجزیہ کرتے ہیں۔",
        },
      },
      {
        title: { en: "Get Crop Advisory", ur: "فصل مشاورت حاصل کریں" },
        description: {
          en: "Receive a comprehensive bilingual advisory with specific actions for irrigation, fertilizer, pest management, and market timing.",
          ur: "آبپاشی، کھاد، کیڑے مار دوا اور منڈی کے وقت کے بارے میں مکمل دو زبانی مشاورت حاصل کریں۔",
        },
      },
    ],
  },

  // ── Agent Pipeline ──────────────────────────────────────
  pipeline: {
    badge: { en: "Multi-Agent Architecture", ur: "ملٹی ایجنٹ فن تعمیر" },
    title: { en: "6 AI Agents Working in Concert", ur: "6 AI ایجنٹ مل کر کام کرتے ہیں" },
    subtitle: {
      en: "A LangGraph-orchestrated pipeline where specialized agents analyze satellite data, weather, soil, pest, and market conditions in parallel to generate comprehensive crop advisories.",
      ur: "LangGraph کے ذریعے چلایا جانے والا پائپ لائن جہاں مخصوص ایجنٹ بیک وقت سیٹلائٹ ڈیٹا، موسم، مٹی، کیڑے اور منڈی کا تجزیہ کرتے ہیں۔",
    },
    agents: {
      supervisor: {
        name: { en: "Supervisor", ur: "نگران" },
        description: {
          en: "Orchestrates the pipeline and routes tasks to specialized agents",
          ur: "پائپ لائن کو چلاتا ہے اور کام مخصوص ایجنٹس کو بھیجتا ہے",
        },
      },
      weather: {
        name: { en: "Weather Agent", ur: "موسم ایجنٹ" },
        description: {
          en: "Analyzes atmospheric data, forecasts, and climate risk patterns",
          ur: "موسمی ڈیٹا، پیش گوئی اور آب و ہوا کے خطرات کا تجزیہ کرتا ہے",
        },
      },
      soil: {
        name: { en: "Soil & Crop Agent", ur: "مٹی اور فصل ایجنٹ" },
        description: {
          en: "Processes satellite imagery for soil health and crop status via Prithvi-EO",
          ur: "Prithvi-EO سے مٹی کی صحت اور فصل کی حالت کا جائزہ لیتا ہے",
        },
      },
      pest: {
        name: { en: "Pest & Disease Agent", ur: "کیڑے اور بیماری ایجنٹ" },
        description: {
          en: "Detects crop diseases using EfficientNet and correlates with weather risk",
          ur: "EfficientNet سے فصل کی بیماریاں پہچانتا ہے اور موسمی خطرے سے ملاتا ہے",
        },
      },
      market: {
        name: { en: "Market Agent", ur: "منڈی ایجنٹ" },
        description: {
          en: "Tracks commodity prices and forecasts market trends with LSTM models",
          ur: "اجناس کی قیمتیں ٹریک کرتا ہے اور LSTM ماڈلز سے منڈی کا رجحان بتاتا ہے",
        },
      },
      advisory: {
        name: { en: "Advisory Agent", ur: "مشاورت ایجنٹ" },
        description: {
          en: "Synthesizes all agent outputs into actionable bilingual crop advisories",
          ur: "تمام ایجنٹس کے نتائج کو ملا کر دو زبانی فصل مشاورت بناتا ہے",
        },
      },
    },
    phases: {
      orchestration: { en: "Orchestration", ur: "انتظام" },
      parallelIngestion: { en: "Parallel Data Ingestion", ur: "بیک وقت ڈیٹا حصول" },
      parallelAnalysis: { en: "Parallel Analysis", ur: "بیک وقت تجزیہ" },
      synthesis: { en: "Synthesis", ur: "ترکیب" },
      parallel: { en: "parallel", ur: "بیک وقت" },
      output: { en: "Bilingual Crop Advisory Output", ur: "دو زبانی فصل مشاورت" },
    },
  },

  // ── Tech Stack ──────────────────────────────────────────
  tech: {
    badge: { en: "Technology", ur: "ٹیکنالوجی" },
    title: { en: "Built With Best-in-Class", ur: "بہترین ٹیکنالوجی سے بنایا گیا" },
    subtitle: {
      en: "Combining NASA Earth observation, foundation AI models, and modern infrastructure for production-grade agricultural intelligence.",
      ur: "ناسا ارتھ آبزرویشن، AI ماڈلز اور جدید انفراسٹرکچر کا امتزاج — زرعی ذہانت کے لیے۔",
    },
  },

  // ── CTA ─────────────────────────────────────────────────
  cta: {
    urduLine: { en: "ابھی شروع کریں", ur: "ابھی شروع کریں" },
    title: { en: "Start Growing Smarter", ur: "ہوشیاری سے کاشت شروع کریں" },
    subtitle: {
      en: "Get satellite-powered crop advisories for your farm in minutes",
      ur: "منٹوں میں اپنے کھیت کے لیے سیٹلائٹ سے چلنے والی فصل مشاورت حاصل کریں",
    },
    ctaPrimary: { en: "Get Crop Advisory", ur: "فصل مشاورت حاصل کریں" },
    ctaSecondary: { en: "View Demo", ur: "ڈیمو دیکھیں" },
    disclaimer: {
      en: "AI advisory tool. Consult local agricultural extension services for critical decisions.",
      ur: "AI مشاورتی ٹول۔ اہم فیصلوں کے لیے مقامی زرعی ادارے سے رابطہ کریں۔",
    },
  },

  // ── Powered By ──────────────────────────────────────────
  powered: {
    title: { en: "Powered By", ur: "تقویت یافتہ" },
    subtitle: {
      en: "Built on world-class technology and real NASA satellite data",
      ur: "عالمی معیار کی ٹیکنالوجی اور ناسا سیٹلائٹ ڈیٹا پر مبنی",
    },
  },

  // ── Dashboard Preview ───────────────────────────────────
  dashPreview: {
    badge: { en: "Live Dashboard", ur: "لائیو ڈیش بورڈ" },
    title: { en: "See It In Action", ur: "عمل میں دیکھیں" },
    subtitle: {
      en: "Watch 6 AI agents analyze satellite data in real-time",
      ur: "دیکھیں کہ 6 AI ایجنٹ حقیقی وقت میں سیٹلائٹ ڈیٹا کا تجزیہ کیسے کرتے ہیں",
    },
  },

  // ── Footer ──────────────────────────────────────────────
  footer: {
    tagline: {
      en: "Multi-agent satellite intelligence for precision agriculture across Pakistan.",
      ur: "پاکستان بھر میں درست زراعت کے لیے ملٹی ایجنٹ سیٹلائٹ ذہانت۔",
    },
    urduTagline: {
      en: "کسان سیٹ — مستقبل کی کھیتی",
      ur: "کسان سیٹ — مستقبل کی کھیتی",
    },
    product: { en: "Product", ur: "پروڈکٹ" },
    technology: { en: "Technology", ur: "ٹیکنالوجی" },
    project: { en: "Project", ur: "پروجیکٹ" },
    builtBy: {
      en: "Built by Team Mustaqbil for AI Mustaqbil 2.0 Hackathon",
      ur: "ٹیم مستقبل نے AI مستقبل 2.0 ہیکاتھون کے لیے بنایا",
    },
    disclaimer: {
      en: "AI advisory tool. Consult local agricultural extension services for critical decisions.",
      ur: "AI مشاورتی ٹول۔ اہم فیصلوں کے لیے مقامی زرعی ادارے سے رابطہ کریں۔",
    },
  },

  // ── Dashboard (app) ─────────────────────────────────────
  dashboard: {
    title: { en: "Crop Advisory", ur: "فصل مشاورت" },
    titleLabel: { en: "Dashboard", ur: "ڈیش بورڈ" },
    subtitle: {
      en: "Select your farm location and crop to receive AI-powered advisory",
      ur: "اپنے کھیت کا مقام اور فصل منتخب کریں اور AI مشاورت حاصل کریں",
    },
    farmLocation: { en: "Farm Location", ur: "کھیت کا مقام" },
    latitude: { en: "Latitude", ur: "عرض البلد" },
    longitude: { en: "Longitude", ur: "طول البلد" },
    province: { en: "Province", ur: "صوبہ" },
    city: { en: "City / Village", ur: "شہر / گاؤں" },
    selectCity: { en: "Select city or village", ur: "شہر یا گاؤں منتخب کریں" },
    cropType: { en: "Crop Type", ur: "فصل کی قسم" },
    getCropAdvisory: { en: "Get Crop Advisory", ur: "فصل مشاورت حاصل کریں" },
    processing: { en: "Processing...", ur: "جاری ہے..." },
    selectLocation: { en: "Select a Location", ur: "مقام منتخب کریں" },
    agentPipeline: { en: "Agent Pipeline", ur: "ایجنٹ پائپ لائن" },
    weather: { en: "Weather", ur: "موسم" },
    soilNdvi: { en: "Soil & NDVI", ur: "مٹی اور NDVI" },
    pestDisease: { en: "Pest & Disease", ur: "کیڑے اور بیماری" },
    marketPrices: { en: "Market Prices", ur: "منڈی کی قیمتیں" },
    cropAdvisory: { en: "Crop Advisory", ur: "فصل مشاورت" },
    temperature: { en: "Temperature", ur: "درجہ حرارت" },
    humidity: { en: "Humidity", ur: "نمی" },
    rainfall: { en: "Rainfall", ur: "بارش" },
    windSpeed: { en: "Wind Speed", ur: "ہوا کی رفتار" },
    moisture: { en: "Moisture", ur: "نمی" },
    organic: { en: "Organic", ur: "نامیاتی" },
    ndviTrend: { en: "NDVI Trend", ur: "NDVI رجحان" },
    recommendedActions: { en: "Recommended Actions", ur: "تجویز کردہ اقدامات" },
    waiting: { en: "Awaiting satellite scan coordinates", ur: "سیٹلائٹ اسکین کوآرڈینیٹ کا انتظار" },
    waitingSub: {
      en: "Select a location and crop type to activate the 6-agent AI pipeline",
      ur: "6 ایجنٹ AI پائپ لائن کو فعال کرنے کے لیے مقام اور فصل منتخب کریں",
    },
    clickMap: {
      en: "Click on the map to select your farm location",
      ur: "اپنے کھیت کا مقام منتخب کرنے کے لیے نقشے پر کلک کریں",
    },
    live: { en: "LIVE", ur: "لائیو" },
    running: { en: "Running", ur: "چل رہا ہے" },
    done: { en: "Done", ur: "مکمل" },
    waiting_status: { en: "Waiting", ur: "انتظار" },
    error: { en: "Error", ur: "خرابی" },
  },
} as const;

/** Helper type for accessing translations */
export type TranslationKey = keyof typeof translations;
