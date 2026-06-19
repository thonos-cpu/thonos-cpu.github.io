export const profileFallback = {
  login: "thonos-cpu",
  name: "Athanasios Tasis",
  avatarUrl: "https://avatars.githubusercontent.com/u/164523469?v=4",
  bio: "Software Engineer · Data Engineering · Distributed Systems · AI/ML",
  location: "Greece",
  publicRepos: 13,
  followers: 0,
  htmlUrl: "https://github.com/thonos-cpu",
};

export const repositoriesFallback = [
  {
    id: 1115354583,
    name: "Distributed_Systems",
    description: "A Chord-inspired distributed hash table with replication and performance benchmarking.",
    language: "Python",
    stars: 0,
    forks: 0,
    updatedAt: "2026-01-01T00:00:00Z",
    cloneUrl: "https://github.com/thonos-cpu/Distributed_Systems.git",
    htmlUrl: "https://github.com/thonos-cpu/Distributed_Systems",
    topics: ["distributed-systems", "dht", "consistent-hashing"],
    archived: false,
  },
  {
    id: 1139887331,
    name: "TFIDF-Search-Engine",
    description: "Information retrieval over 1,239 medical documents with ranking, evaluation and clustering.",
    language: "Python",
    stars: 0,
    forks: 0,
    updatedAt: "2026-01-01T00:00:00Z",
    cloneUrl: "https://github.com/thonos-cpu/TFIDF-Search-Engine.git",
    htmlUrl: "https://github.com/thonos-cpu/TFIDF-Search-Engine",
    topics: ["information-retrieval", "tf-idf", "machine-learning"],
    archived: false,
  },
  {
    id: 990574584,
    name: "Vehicle_Rental_App",
    description: "A full software-engineering project for vehicle rental workflows.",
    language: "Java",
    stars: 0,
    forks: 0,
    updatedAt: "2025-06-01T00:00:00Z",
    cloneUrl: "https://github.com/thonos-cpu/Vehicle_Rental_App.git",
    htmlUrl: "https://github.com/thonos-cpu/Vehicle_Rental_App",
    topics: ["software-engineering"],
    archived: false,
  },
  {
    id: 936624493,
    name: "quadtrees",
    description: "3D spatial indexing with Octree, MinHash and locality-sensitive hashing.",
    language: "Python",
    stars: 0,
    forks: 0,
    updatedAt: "2025-03-01T00:00:00Z",
    cloneUrl: "https://github.com/thonos-cpu/quadtrees.git",
    htmlUrl: "https://github.com/thonos-cpu/quadtrees",
    topics: ["octree", "minhash", "spatial-indexing"],
    archived: false,
  },
  {
    id: 936630341,
    name: "rtrees",
    description: "R-Tree spatial indexing paired with MinHash and LSH similarity search.",
    language: "Python",
    stars: 0,
    forks: 0,
    updatedAt: "2025-03-01T00:00:00Z",
    cloneUrl: "https://github.com/thonos-cpu/rtrees.git",
    htmlUrl: "https://github.com/thonos-cpu/rtrees",
    topics: ["r-tree", "lsh", "spatial-indexing"],
    archived: false,
  },
] as const;

export const projectDetails: Record<string, { summary: string; facts: string[]; readme: string }> = {
  Distributed_Systems: {
    summary: "A decentralized key-value store built around a Chord-style ring, consistent hashing, replication and measured routing behavior.",
    facts: ["O(log N) lookup target", "xxhash64 key distribution", "Multiprocessing ingestion", "Replication strategies"],
    readme: "Distributed Hash Table\n\nA ring-based distributed system for storing and retrieving key-value pairs without centralized coordination. The implementation explores consistent hashing, node membership, routing, replication and performance benchmarking.",
  },
  "TFIDF-Search-Engine": {
    summary: "A complete information-retrieval study over the Cystic Fibrosis medical literature collection.",
    facts: ["1,239 documents", "270+ tuned configurations", "Custom TF-IDF", "MAP and F1 evaluation"],
    readme: "Information Retrieval System for Medical Document Analysis\n\nProcesses 1,239 medical research articles using custom TF-IDF weighting, cosine similarity, hyperparameter search and clustering. It evaluates retrieval quality with Precision, Recall, F1 and Mean Average Precision.",
  },
  quadtrees: {
    summary: "A 3D spatial search system combining an Octree with approximate text similarity.",
    facts: ["3D range queries", "MinHash signatures", "LSH retrieval", "Plotly visualization"],
    readme: "3D Spatial Indexing with Octree & MinHash\n\nIndexes multidimensional review data in an Octree, supports bounded spatial queries, and uses MinHash with LSH to find textually similar records.",
  },
  rtrees: {
    summary: "A balanced spatial index for multidimensional review data with fast similarity search.",
    facts: ["Bounding-box queries", "Dynamic node splitting", "MinHash + LSH", "Measured query latency"],
    readme: "R-Tree Spatial Indexing with MinHash & LSH\n\nOrganizes multidimensional records in nested bounding boxes and combines spatial filtering with approximate text similarity.",
  },
};

export const thanosKnowledge = `
Athanasios Tasis is a software engineer focused on data engineering, distributed systems, AI/ML, scientific computing and high-performance computing.
He is a Data Analysis Intern with the ALICE Collaboration at GSI Helmholtz Centre in Darmstadt (2026-present), processing detector datasets with ROOT, RDataFrame, HPC environments, Lustre and Slurm.
He studies Computer Engineering and Informatics at the University of Patras in an MEng program (2021-2027).
Notable work includes a Chord-based distributed hash table, a TF-IDF search engine over 1,239 medical documents, R-Tree and Octree spatial indexes with MinHash/LSH, hotel booking analysis, and academic workflow software.
His public GitHub is https://github.com/thonos-cpu and his email is athanasios@tasis.info.
Repositories are cloned with: git clone https://github.com/thonos-cpu/REPOSITORY_NAME.git
`.trim();
