import { ArchitectureType, ResourceRange } from './common';

// Analysis result interfaces

export interface AnalysisResult {
  techStack: TechStackInfo;
  dependencies: DependencyInfo;
  architecture: ArchitectureInfo;
  buildRequirements: BuildRequirements;
  runtimeRequirements: RuntimeRequirements;
}

export interface TechStackInfo {
  language: string;
  framework: string;
  runtime: RuntimeInfo;
  buildTool: string;
  packageManager: string;
  testFramework?: string;
}

export interface RuntimeInfo {
  name: string;
  version: string;
  minVersion?: string;
  maxVersion?: string;
}

export interface DependencyInfo {
  databases: DatabaseDependency[];
  caches: CacheDependency[];
  messageQueues: MessageQueueDependency[];
  externalServices: ExternalServiceDependency[];
  internalServices: InternalServiceDependency[];
}

export interface DatabaseDependency {
  type: 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'sqlite';
  version?: string;
  connectionString?: string;
  features: string[];
}

export interface CacheDependency {
  type: 'redis' | 'memcached' | 'in-memory';
  version?: string;
  configuration: Record<string, any>;
}

export interface MessageQueueDependency {
  type: 'rabbitmq' | 'kafka' | 'sqs' | 'pubsub';
  version?: string;
  topics?: string[];
  configuration: Record<string, any>;
}

export interface ExternalServiceDependency {
  name: string;
  type: 'rest-api' | 'graphql' | 'grpc' | 'websocket';
  endpoint?: string;
  authentication?: AuthenticationInfo;
}

export interface InternalServiceDependency {
  name: string;
  type: 'microservice' | 'library' | 'shared-database';
  communicationMethod: 'http' | 'grpc' | 'message-queue';
}

export interface AuthenticationInfo {
  type: 'bearer' | 'basic' | 'oauth2' | 'api-key';
  configuration: Record<string, any>;
}

export interface ArchitectureInfo {
  type: ArchitectureType;
  services: ServiceInfo[];
  communicationPatterns: CommunicationPattern[];
  dataFlow: DataFlowInfo;
}

export interface ServiceInfo {
  name: string;
  type: 'api' | 'worker' | 'database' | 'cache' | 'queue';
  entryPoints: string[];
  dependencies: string[];
  exposedPorts: number[];
}

export interface CommunicationPattern {
  from: string;
  to: string;
  type: 'synchronous' | 'asynchronous' | 'event-driven';
  protocol: string;
}

export interface DataFlowInfo {
  dataSources: string[];
  dataStores: string[];
  dataTransformations: DataTransformation[];
}

export interface DataTransformation {
  input: string;
  output: string;
  type: 'etl' | 'stream' | 'batch';
}

export interface BuildRequirements {
  buildTool: string;
  buildSteps: BuildStep[];
  artifacts: BuildArtifact[];
  dependencies: string[];
}

export interface BuildStep {
  name: string;
  command: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
}

export interface BuildArtifact {
  name: string;
  path: string;
  type: 'executable' | 'library' | 'archive' | 'image';
}

export interface RuntimeRequirements {
  runtime: RuntimeInfo;
  environmentVariables: Record<string, string>;
  systemDependencies: string[];
  resourceRequirements: ResourceRequirements;
}

export interface ResourceRequirements {
  cpu: ResourceRange;
  memory: ResourceRange;
  storage: StorageRequirements;
  network: NetworkRequirements;
  scalability: ScalabilityRequirements;
}

export interface StorageRequirements {
  persistent: boolean;
  size: ResourceRange;
  type: 'ssd' | 'hdd' | 'network';
  backup: boolean;
}

export interface NetworkRequirements {
  inbound: PortRequirement[];
  outbound: PortRequirement[];
  bandwidth: ResourceRange;
}

export interface PortRequirement {
  port: number;
  protocol: 'tcp' | 'udp' | 'http' | 'https';
  public: boolean;
}

export interface ScalabilityRequirements {
  expectedLoad: LoadProfile;
  scalingTriggers: ScalingTrigger[];
  maxInstances: number;
  minInstances: number;
}

export interface LoadProfile {
  requestsPerSecond: ResourceRange;
  concurrentUsers: ResourceRange;
  dataVolume: ResourceRange;
  peakHours?: string[];
}

export interface ScalingTrigger {
  metric: 'cpu' | 'memory' | 'requests' | 'queue-length';
  threshold: number;
  action: 'scale-up' | 'scale-down';
}
