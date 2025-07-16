import { FileType, ImportanceScore } from "./common";

// Codebase input and indexing interfaces

export interface CodebaseInput {
  files: FileEntry[];
  metadata: CodebaseMetadata;
  preferences?: UserPreferences;
}

export interface FileEntry {
  path: string;
  content: string;
  size: number;
  type: FileType;
}

export interface CodebaseMetadata {
  name: string;
  description?: string;
  repository?: RepositoryInfo;
  existingInfra?: ExistingInfrastructure;
}

export interface RepositoryInfo {
  url: string;
  branch: string;
  provider: "github" | "gitlab" | "bitbucket";
  accessToken?: string;
}

export interface ExistingInfrastructure {
  hasDocker: boolean;
  hasKubernetes: boolean;
  hasCICD: boolean;
  cloudProvider?: string;
}

export interface UserPreferences {
  targetPlatform?: string;
  cloudProvider?: string;
  costOptimization: boolean;
  securityFocus: boolean;
  performanceOptimization: boolean;
}

export interface CodebaseIndex {
  fileIndex: FileIndexEntry[];
  priorityFiles: PriorityFileMap;
  astCache: Map<string, AST>;
  dependencyGraph: DependencyGraph;
  statistics: CodebaseStatistics;
}

export interface FileIndexEntry {
  path: string;
  type: FileType;
  size: number;
  importance: ImportanceScore;
  language?: string;
  lastModified: Date;
}

export interface PriorityFileMap {
  packageFiles: string[];
  configFiles: string[];
  entryPoints: string[];
  schemas: string[];
  dockerFiles: string[];
  cicdFiles: string[];
}

export interface AST {
  type: string;
  body: any[];
  sourceType: string;
  // Simplified AST representation
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface DependencyNode {
  id: string;
  type: "file" | "package" | "service";
  name: string;
  metadata: Record<string, any>;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: "import" | "dependency" | "service-call";
  weight: number;
}

export interface CodebaseStatistics {
  totalFiles: number;
  totalSize: number;
  languageDistribution: Record<string, number>;
  fileTypeDistribution: Record<FileType, number>;
  complexityScore: number;
}
