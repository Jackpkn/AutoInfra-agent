import { CloudProvider, ResourceSpec } from "./common";

// Infrastructure recommendation interfaces

export interface InfrastructureRecommendations {
  compute: ComputeRecommendation;
  storage: StorageRecommendation;
  networking: NetworkingRecommendation;
  scaling: ScalingRecommendation;
  monitoring: MonitoringRecommendation;
}

export interface ComputeRecommendation {
  instanceType: string;
  cpu: ResourceSpec;
  memory: ResourceSpec;
  alternatives: AlternativeRecommendation[];
  reasoning: string;
}

export interface AlternativeRecommendation {
  instanceType: string;
  cpu: ResourceSpec;
  memory: ResourceSpec;
  costDifference: number;
  performanceDifference: number;
  useCase: string;
}

export interface StorageRecommendation {
  type: "ssd" | "hdd" | "network";
  size: ResourceSpec;
  iops: number;
  backup: BackupRecommendation;
  alternatives: StorageAlternative[];
}

export interface BackupRecommendation {
  enabled: boolean;
  frequency: string;
  retention: string;
  crossRegion: boolean;
}

export interface StorageAlternative {
  type: string;
  size: ResourceSpec;
  costDifference: number;
  performanceImpact: string;
}

export interface NetworkingRecommendation {
  loadBalancer: LoadBalancerRecommendation;
  cdn: CDNRecommendation;
  vpc: VPCRecommendation;
}

export interface LoadBalancerRecommendation {
  type: "application" | "network" | "classic";
  features: string[];
  healthCheck: HealthCheckConfig;
}

export interface HealthCheckConfig {
  path: string;
  interval: number;
  timeout: number;
  healthyThreshold: number;
  unhealthyThreshold: number;
}

export interface CDNRecommendation {
  enabled: boolean;
  provider: string;
  cachePolicy: CachePolicy;
  origins: string[];
}

export interface CachePolicy {
  ttl: number;
  cacheableContent: string[];
  compressionEnabled: boolean;
}

export interface VPCRecommendation {
  cidr: string;
  subnets: SubnetRecommendation[];
  securityGroups: SecurityGroupRecommendation[];
}

export interface SubnetRecommendation {
  type: "public" | "private";
  cidr: string;
  availabilityZone: string;
}

export interface SecurityGroupRecommendation {
  name: string;
  rules: SecurityRule[];
}

export interface SecurityRule {
  type: "ingress" | "egress";
  protocol: string;
  port: number | string;
  source: string;
  description: string;
}

export interface ScalingRecommendation {
  autoScaling: AutoScalingRecommendation;
  loadTesting: LoadTestingRecommendation;
  monitoring: ScalingMonitoringRecommendation;
}

export interface AutoScalingRecommendation {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  targetMetrics: ScalingMetric[];
  cooldownPeriod: number;
}

export interface ScalingMetric {
  name: string;
  targetValue: number;
  unit: string;
}

export interface LoadTestingRecommendation {
  tools: string[];
  scenarios: LoadTestScenario[];
  metrics: string[];
}

export interface LoadTestScenario {
  name: string;
  users: number;
  duration: string;
  rampUp: string;
}

export interface ScalingMonitoringRecommendation {
  metrics: string[];
  alerts: AlertRecommendation[];
  dashboards: string[];
}

export interface AlertRecommendation {
  name: string;
  condition: string;
  threshold: number;
  severity: "low" | "medium" | "high" | "critical";
}

export interface MonitoringRecommendation {
  logging: LoggingRecommendation;
  metrics: MetricsRecommendation;
  tracing: TracingRecommendation;
  alerting: AlertingRecommendation;
}

export interface LoggingRecommendation {
  level: string;
  format: string;
  retention: string;
  aggregation: boolean;
  tools: string[];
}

export interface MetricsRecommendation {
  collection: MetricsCollection;
  storage: MetricsStorage;
  visualization: MetricsVisualization;
}

export interface MetricsCollection {
  interval: number;
  metrics: string[];
  customMetrics: CustomMetric[];
}

export interface CustomMetric {
  name: string;
  type: "counter" | "gauge" | "histogram";
  description: string;
  labels: string[];
}

export interface MetricsStorage {
  retention: string;
  compression: boolean;
  downsampling: DownsamplingConfig[];
}

export interface DownsamplingConfig {
  resolution: string;
  retention: string;
  aggregation: string;
}

export interface MetricsVisualization {
  dashboards: DashboardRecommendation[];
  alerts: string[];
}

export interface DashboardRecommendation {
  name: string;
  panels: PanelRecommendation[];
  refresh: string;
}

export interface PanelRecommendation {
  title: string;
  type: "graph" | "table" | "stat" | "gauge";
  metrics: string[];
}

export interface TracingRecommendation {
  enabled: boolean;
  samplingRate: number;
  tools: string[];
  instrumentation: InstrumentationRecommendation[];
}

export interface InstrumentationRecommendation {
  library: string;
  automatic: boolean;
  configuration: Record<string, any>;
}

export interface AlertingRecommendation {
  channels: AlertChannel[];
  rules: AlertRule[];
  escalation: EscalationPolicy;
}

export interface AlertChannel {
  type: "email" | "slack" | "pagerduty" | "webhook";
  configuration: Record<string, any>;
}

export interface AlertRule {
  name: string;
  condition: string;
  severity: string;
  channels: string[];
}

export interface EscalationPolicy {
  levels: EscalationLevel[];
  timeout: number;
}

export interface EscalationLevel {
  level: number;
  channels: string[];
  delay: number;
}

export interface CostEstimate {
  provider: CloudProvider;
  region: string;
  monthlyEstimate: number;
  breakdown: CostBreakdown;
  assumptions: string[];
}

export interface CostBreakdown {
  compute: number;
  storage: number;
  network: number;
  services: number;
  support?: number;
}

export interface CostOptimizedRecommendation {
  totalSavings: number;
  optimizations: CostOptimization[];
  tradeoffs: string[];
}

export interface CostOptimization {
  type: string;
  description: string;
  savings: number;
  impact: string;
}

export interface PerformanceOptimizedRecommendation {
  improvements: PerformanceImprovement[];
  benchmarks: PerformanceBenchmark[];
  monitoring: string[];
}

export interface PerformanceImprovement {
  area: string;
  description: string;
  expectedGain: string;
  implementation: string;
}

export interface PerformanceBenchmark {
  metric: string;
  baseline: number;
  target: number;
  unit: string;
}
