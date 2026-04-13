import { describe, it, expect } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { buildDeploymentGroup } from '../lib/deployment-group';
import { TEST_CONFIG, TEST_ENV } from './test-helper';

/**
 * Tests the deployment group builder — the single source of truth for
 * how all stacks are wired together. If the dependency graph changes,
 * snapshots drift, or a cycle is introduced, these tests catch it.
 */
describe('Deployment group', () => {
  const app = new cdk.App();
  const config = TEST_CONFIG;
  const stacks = buildDeploymentGroup(app, config, TEST_ENV);

  describe('snapshots', () => {
    it('StorageStack matches snapshot', () => {
      expect(Template.fromStack(stacks.storage).toJSON()).toMatchSnapshot();
    });

    it('MonitoringStack matches snapshot', () => {
      expect(Template.fromStack(stacks.monitoring).toJSON()).toMatchSnapshot();
    });

    it('NetworkingStack matches snapshot', () => {
      expect(Template.fromStack(stacks.networking).toJSON()).toMatchSnapshot();
    });

    it('DatabaseStack matches snapshot', () => {
      expect(Template.fromStack(stacks.database).toJSON()).toMatchSnapshot();
    });

    it('IamStack matches snapshot', () => {
      expect(Template.fromStack(stacks.iam).toJSON()).toMatchSnapshot();
    });

    it('ComputeStack matches snapshot', () => {
      expect(Template.fromStack(stacks.compute).toJSON()).toMatchSnapshot();
    });
  });

  describe('dependency graph', () => {
    it('synthesizes without dependency cycles', () => {
      expect(() => app.synth()).not.toThrow();
    });

    it('produces all 6 stacks', () => {
      const assembly = app.synth();
      const stackNames = assembly.stacks.map((s) => s.stackName);
      expect(stackNames).toHaveLength(6);
      expect(stackNames).toContain(`${config.appName}-storage-${config.stageName}`);
      expect(stackNames).toContain(`${config.appName}-monitoring-${config.stageName}`);
      expect(stackNames).toContain(`${config.appName}-networking-${config.stageName}`);
      expect(stackNames).toContain(`${config.appName}-database-${config.stageName}`);
      expect(stackNames).toContain(`${config.appName}-iam-${config.stageName}`);
      expect(stackNames).toContain(`${config.appName}-compute-${config.stageName}`);
    });

    it('Database depends on Networking', () => {
      const assembly = app.synth();
      const deps = assembly
        .getStackArtifact(stacks.database.artifactId)
        .dependencies.map((d) => d.id);
      expect(deps).toContain(stacks.networking.artifactId);
    });

    it('IAM depends on Storage, Database, and Monitoring', () => {
      const assembly = app.synth();
      const deps = assembly.getStackArtifact(stacks.iam.artifactId).dependencies.map((d) => d.id);
      expect(deps).toContain(stacks.storage.artifactId);
      expect(deps).toContain(stacks.database.artifactId);
      expect(deps).toContain(stacks.monitoring.artifactId);
    });

    it('Compute depends on Networking, Database, IAM, and Monitoring', () => {
      const assembly = app.synth();
      const deps = assembly
        .getStackArtifact(stacks.compute.artifactId)
        .dependencies.map((d) => d.id);
      expect(deps).toContain(stacks.networking.artifactId);
      expect(deps).toContain(stacks.database.artifactId);
      expect(deps).toContain(stacks.iam.artifactId);
      expect(deps).toContain(stacks.monitoring.artifactId);
    });

    it('independent stacks have no inter-stack dependencies', () => {
      const assembly = app.synth();
      const stackIds = new Set(assembly.stacks.map((s) => s.id));
      const getStackDeps = (stack: cdk.Stack) =>
        assembly.getStackArtifact(stack.artifactId).dependencies.filter((d) => stackIds.has(d.id));

      expect(getStackDeps(stacks.storage)).toHaveLength(0);
      expect(getStackDeps(stacks.monitoring)).toHaveLength(0);
      expect(getStackDeps(stacks.networking)).toHaveLength(0);
    });
  });
});
