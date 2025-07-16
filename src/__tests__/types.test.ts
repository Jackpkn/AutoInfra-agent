import { describe, it, expect } from 'vitest';
import { 
  ImportanceScore, 
  FileType, 
  CloudProvider,
  CICDPlatform,
  ArchitectureType 
} from '../types/common';

describe('Type Definitions', () => {
  it('should have correct FileType values', () => {
    const fileTypes: FileType[] = [
      'package',
      'config', 
      'source',
      'test',
      'documentation',
      'asset',
      'build',
      'schema'
    ];
    
    expect(fileTypes).toHaveLength(8);
    expect(fileTypes).toContain('package');
    expect(fileTypes).toContain('source');
  });

  it('should create ImportanceScore correctly', () => {
    const score: ImportanceScore = {
      score: 85,
      reasons: ['Contains package.json', 'Entry point detected'],
      category: 'critical'
    };
    
    expect(score.score).toBe(85);
    expect(score.category).toBe('critical');
    expect(score.reasons).toHaveLength(2);
  });

  it('should have correct CloudProvider values', () => {
    const providers: CloudProvider[] = ['aws', 'gcp', 'azure'];
    
    expect(providers).toHaveLength(3);
    expect(providers).toContain('aws');
  });

  it('should have correct CICDPlatform values', () => {
    const platforms: CICDPlatform[] = [
      'github-actions',
      'gitlab-ci', 
      'jenkins',
      'azure-devops'
    ];
    
    expect(platforms).toHaveLength(4);
    expect(platforms).toContain('github-actions');
  });

  it('should have correct ArchitectureType values', () => {
    const types: ArchitectureType[] = ['monolith', 'microservices', 'serverless'];
    
    expect(types).toHaveLength(3);
    expect(types).toContain('microservices');
  });
});