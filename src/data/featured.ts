/**
 * Editorial layer over the live GitHub repositories.
 *
 * The repo list itself comes live from the GitHub API at build time; this file
 * adds human curation on top — taglines, the metrics worth bragging about,
 * categories (which drive colour + size in the constellation) and a hand-picked
 * gallery of *real* output artefacts. Data / ML work is weighted highest, per
 * the site's focus.
 */

export type Category = 'data-ml' | 'systems' | 'web' | 'algorithms' | 'research';

export const CATEGORY_META: Record<Category, { label: string; short: string }> = {
  'data-ml': { label: 'Data & Machine Learning', short: 'Data / ML' },
  systems: { label: 'Distributed & Systems', short: 'Systems' },
  web: { label: 'Full-stack', short: 'Web' },
  algorithms: { label: 'Algorithms & Structures', short: 'Algorithms' },
  research: { label: 'Research & Writing', short: 'Research' },
};

export interface Metric {
  value: string;
  label: string;
}

export interface GalleryItem {
  src: string;
  alt: string;
  caption: string;
}

export interface FeaturedMeta {
  category: Category;
  /** Constellation node weight (1–10); higher = larger + more central. */
  weight: number;
  /** Shown in the curated work grid (vs. only in the full repo list). */
  featured: boolean;
  tagline: string;
  blurb?: string;
  stack: string[];
  metrics?: Metric[];
  gallery?: GalleryItem[];
}

/** Keyed by the exact GitHub repository name. */
export const FEATURED: Record<string, FeaturedMeta> = {
  Temp_Hum_Prediction_Model: {
    category: 'data-ml',
    weight: 10,
    featured: true,
    tagline: 'Time-series forecasting on wireless-sensor-network data',
    blurb:
      'An end-to-end forecasting pipeline over a wireless-sensor-network dataset, predicting temperature, humidity and light from correlated environmental signals with SARIMAX and ML baselines, validated across rolling folds.',
    stack: ['Python', 'pandas', 'scikit-learn', 'SARIMAX', 'Jupyter'],
    metrics: [
      { value: '3', label: 'sensor targets' },
      { value: '6×', label: 'cross-validation folds' },
      { value: 'WSN', label: 'IoT time-series' },
    ],
    gallery: [
      {
        src: '/projects/temp-hum/raw_timeseries.webp',
        alt: 'Raw multi-sensor time series',
        caption: 'Raw multi-sensor signal over the full capture window.',
      },
      {
        src: '/projects/temp-hum/corr_heatmap.webp',
        alt: 'Pearson correlation heatmap between sensors',
        caption: 'Cross-sensor Pearson correlation: the basis for feature selection.',
      },
      {
        src: '/projects/temp-hum/temp_summary.webp',
        alt: 'Temperature prediction vs. ground truth',
        caption: 'Temperature: prediction vs. ground truth across folds.',
      },
      {
        src: '/projects/temp-hum/humidity_summary.webp',
        alt: 'Humidity prediction vs. ground truth',
        caption: 'Humidity: prediction vs. ground truth across folds.',
      },
    ],
  },
  'TFIDF-Search-Engine': {
    category: 'data-ml',
    weight: 9,
    featured: true,
    tagline: 'Information retrieval & clustering over a medical corpus',
    blurb:
      'A complete vector-space search engine: inverted index, stemming and cosine ranking with Raw / Logarithmic / Augmented TF-IDF schemes, then KMeans & agglomerative clustering with TF-IDF and sentence-transformer embeddings.',
    stack: ['Python', 'scikit-learn', 'NumPy', 'Sentence-Transformers'],
    metrics: [
      { value: '1,239', label: 'articles indexed' },
      { value: '0.267', label: 'mean average precision' },
      { value: '270', label: 'grid-search runs' },
    ],
  },
  'Hotel-Booking-Data-Analysis-and-Visualization': {
    category: 'data-ml',
    weight: 8,
    featured: true,
    tagline: 'Exploratory analytics on 119K hotel bookings',
    blurb:
      'End-to-end exploratory data analysis surfacing the strongest cancellation predictors and seasonal revenue patterns across a large real-world booking dataset.',
    stack: ['Python', 'pandas', 'Matplotlib', 'seaborn'],
    metrics: [
      { value: '119,390', label: 'bookings analysed' },
      { value: 'EDA', label: 'end-to-end' },
    ],
  },
  Distributed_Systems: {
    category: 'systems',
    weight: 9,
    featured: true,
    tagline: 'Chord & Pastry distributed hash-table engine',
    blurb:
      'A from-scratch DHT engine implementing the Chord and Pastry protocols with parallel data ingestion, simulated at scale and validated for correctness under heavy node churn.',
    stack: ['Python', 'Distributed systems', 'Concurrency'],
    metrics: [
      { value: '946K', label: 'records ingested' },
      { value: '300+', label: 'simulated nodes' },
      { value: 'O(log N)', label: 'routing under 50% failure' },
    ],
  },
  Thesis_Managment_Website: {
    category: 'web',
    weight: 6,
    featured: true,
    tagline: 'Role-based academic thesis platform',
    blurb:
      'A full thesis-lifecycle platform with role-based access, database audit-log triggers and a public JSON / XML REST endpoint.',
    stack: ['PHP', 'MySQL', 'REST'],
    metrics: [
      { value: 'RBAC', label: 'role-based access' },
      { value: 'JSON/XML', label: 'public REST API' },
    ],
  },
  quadtrees: {
    category: 'algorithms',
    weight: 4,
    featured: false,
    tagline: 'Quadtree spatial index',
    stack: ['Python'],
  },
  rtrees: {
    category: 'algorithms',
    weight: 4,
    featured: false,
    tagline: 'R-tree spatial index',
    stack: ['Python'],
  },
  'Sorting-Algorithms-Cpp': {
    category: 'algorithms',
    weight: 5,
    featured: false,
    tagline: 'Sorting & search algorithm benchmarks',
    stack: ['C++'],
  },
  'SQL-Database': {
    category: 'systems',
    weight: 3,
    featured: false,
    tagline: 'Job-applications relational database',
    stack: ['MySQL'],
  },
  'Latex-Project-About-AI-Ethics': {
    category: 'research',
    weight: 2,
    featured: false,
    tagline: 'Essay on AI ethics',
    stack: ['LaTeX'],
  },
};

const LANGUAGE_CATEGORY: Record<string, Category> = {
  'Jupyter Notebook': 'data-ml',
  Python: 'data-ml',
  'C++': 'algorithms',
  C: 'algorithms',
  PHP: 'web',
  HTML: 'web',
  JavaScript: 'web',
  TypeScript: 'web',
  TeX: 'research',
};

/** Resolve a category for any repo, even one without curated metadata. */
export function categoryFor(name: string, language: string | null): Category {
  return (
    FEATURED[name]?.category ?? (language ? LANGUAGE_CATEGORY[language] : undefined) ?? 'systems'
  );
}

/** Constellation weight for any repo. */
export function weightFor(name: string, stars: number): number {
  return FEATURED[name]?.weight ?? Math.min(6, 2 + stars);
}
