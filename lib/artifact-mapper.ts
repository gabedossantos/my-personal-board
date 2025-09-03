import type { Prisma } from '@prisma/client';

// Local type mirror to avoid cross-project imports
export type DomainArtifact = {
  type: string;
  chartType: string;
  title: string;
  description: string;
  data: unknown;
  config?: unknown;
};

export function toCreateArtifactInput(a: DomainArtifact) {
  return {
    artifactType: a.type,
    chartType: a.chartType,
    title: a.title,
    description: a.description,
    data: a.data as unknown as Prisma.JsonValue,
    config: a.config as unknown as Prisma.JsonValue | undefined,
  };
}
