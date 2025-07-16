import { describe, it, expect } from 'vitest';
import { AutoInfraAgent } from '../index';

describe('AutoInfraAgent', () => {
  it('should initialize correctly', async () => {
    const agent = new AutoInfraAgent();
    
    expect(agent.isInitialized()).toBe(false);
    
    await agent.initialize();
    
    expect(agent.isInitialized()).toBe(true);
  });

  it('should not reinitialize if already initialized', async () => {
    const agent = new AutoInfraAgent();
    
    await agent.initialize();
    expect(agent.isInitialized()).toBe(true);
    
    // Should not throw or change state
    await agent.initialize();
    expect(agent.isInitialized()).toBe(true);
  });
});