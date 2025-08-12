import type { DomainArtifact } from "@gabe/types";
import { Prisma } from "@prisma/client";

// Local copy to avoid cross-project rootDir issues.
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
