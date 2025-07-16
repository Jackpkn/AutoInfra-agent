import {
  InfrastructureRecommendations,
  CostEstimate,
  ResourceRequirements,
  CostOptimizedRecommendation,
  CloudProvider,
} from '../types';

/**
 * Interface for calculating infrastructure costs
 */
export interface CostCalculator {
  /**
   * Calculates cost estimates for infrastructure recommendations
   */
  calculateCosts(
    recommendations: InfrastructureRecommendations,
    providers: CloudProvider[]
  ): Promise<CostEstimate[]>;

  /**
   * Calculates cost for a specific cloud provider
   */
  calculateProviderCost(
    recommendations: InfrastructureRecommendations,
    provider: CloudProvider,
    region: string
  ): Promise<CostEstimate>;

  /**
   * Optimizes configuration for cost efficiency
   */
  optimizeForCost(
    requirements: ResourceRequirements,
    provider: CloudProvider
  ): Promise<CostOptimizedRecommendation>;

  /**
   * Compares costs across different providers
   */
  compareCosts(
    recommendations: InfrastructureRecommendations,
    providers: CloudProvider[]
  ): Promise<CostEstimate[]>;
}

/**
 * Default implementation of CostCalculator
 */
export class DefaultCostCalculator implements CostCalculator {
  async calculateCosts(
    recommendations: InfrastructureRecommendations,
    providers: CloudProvider[]
  ): Promise<CostEstimate[]> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async calculateProviderCost(
    recommendations: InfrastructureRecommendations,
    provider: CloudProvider,
    region: string
  ): Promise<CostEstimate> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async optimizeForCost(
    requirements: ResourceRequirements,
    provider: CloudProvider
  ): Promise<CostOptimizedRecommendation> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async compareCosts(
    recommendations: InfrastructureRecommendations,
    providers: CloudProvider[]
  ): Promise<CostEstimate[]> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }
}
