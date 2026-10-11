export type Snapshot = {
  commitSha: string;
};

export type SourceFile = {
  id: string;
  path: string;
};

export type AnalysisScope = {
  completeness: "partial" | "complete";
  description: string;
  limitations: string[];
};

export type DependencyEdge = {
  id: string;
  from: SourceFile["id"];
  to: SourceFile["id"];
  kind: "import" | "re-export";
  typeOnly: boolean;
  specifier: string;
  sourceLine: number;
};

export type InputPackage = {
  schemaVersion: 1;
  repository: string;
  base: Snapshot;
  head: Snapshot;
  files: SourceFile[];
  edges: DependencyEdge[];
  scope: AnalysisScope;
  warnings: string[];
};

export function checkInput(input: unknown): InputPackage {
  const data = expectObject(input, "input");

  if (data.schemaVersion !== 1) {
    throw new Error("schemaVersion: version 1 is expected");
  }

  const repository = expectNonEmptyString(data.repository, "repository");
  let repositoryUrl: URL;
  try {
    repositoryUrl = new URL(repository);
  } catch {
    throw new Error("repository: a valid HTTP(S) URL is expected");
  }
  if (!["http:", "https:"].includes(repositoryUrl.protocol)) {
    throw new Error("repository: a valid HTTP(S) URL is expected");
  }

  const base = checkSnapshot(data.base, "base");
  const head = checkSnapshot(data.head, "head");

  const fileIds = new Set<string>();
  const files = Array.from(expectArray(data.files, "files"), (value, index) => {
    const field = `files[${index}]`;
    const file = expectObject(value, field);
    const id = expectNonEmptyString(file.id, `${field}.id`);
    const path = expectNonEmptyString(file.path, `${field}.path`);

    // Repository paths use forward slashes and stay inside the repository.
    if (
      path.startsWith("/") ||
      path.includes("\\") ||
      /^[a-z]:/i.test(path) ||
      path.split("/").includes("..") ||
      path.includes("\0") ||
      path === "."
    ) {
      throw new Error(
        `${field}.path: a relative repository file path is expected`,
      );
    }
    if (fileIds.has(id)) {
      throw new Error(`${field}.id: duplicate file ID "${id}"`);
    }
    fileIds.add(id);
    return { id, path };
  });

  const edgeIds = new Set<string>();
  const edges: DependencyEdge[] = Array.from(
    expectArray(data.edges, "edges"),
    (value, index) => {
      const field = `edges[${index}]`;
      const edge = expectObject(value, field);
      const id = expectNonEmptyString(edge.id, `${field}.id`);
      const from = expectNonEmptyString(edge.from, `${field}.from`);
      const to = expectNonEmptyString(edge.to, `${field}.to`);
      const specifier = expectNonEmptyString(
        edge.specifier,
        `${field}.specifier`,
      );
      const kind = edge.kind;
      const typeOnly = edge.typeOnly;
      const sourceLine = edge.sourceLine;

      if (kind !== "import" && kind !== "re-export") {
        throw new Error(`${field}.kind: "import" or "re-export" is expected`);
      }
      if (typeof typeOnly !== "boolean") {
        throw new Error(`${field}.typeOnly: a boolean is expected`);
      }
      if (
        typeof sourceLine !== "number" ||
        !Number.isSafeInteger(sourceLine) ||
        sourceLine < 1
      ) {
        throw new Error(
          `${field}.sourceLine: a positive safe integer is expected`,
        );
      }
      if (edgeIds.has(id)) {
        throw new Error(`${field}.id: duplicate edge ID "${id}"`);
      }
      edgeIds.add(id);
      for (const [name, fileId] of [
        ["from", from],
        ["to", to],
      ] as const) {
        if (!fileIds.has(fileId)) {
          throw new Error(
            `${field}.${name}: file ID "${fileId}" is not in files`,
          );
        }
      }

      return { id, from, to, kind, typeOnly, specifier, sourceLine };
    },
  );

  const scope = expectObject(data.scope, "scope");
  const completeness = scope.completeness;
  if (completeness !== "partial" && completeness !== "complete") {
    throw new Error('scope.completeness: "partial" or "complete" is expected');
  }

  return {
    schemaVersion: 1,
    repository,
    base,
    head,
    files,
    edges,
    scope: {
      completeness,
      description: expectNonEmptyString(scope.description, "scope.description"),
      limitations: expectStringArray(scope.limitations, "scope.limitations"),
    },
    warnings: expectStringArray(data.warnings, "warnings"),
  };
}

// These helpers narrow unknown values; they do not assert the whole package type.
function expectObject(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${field}: an object is expected`);
  }
  return value as Record<string, unknown>;
}

function expectNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field}: a non-empty string is expected`);
  }
  return value;
}

function expectArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${field}: an array is expected`);
  }
  return value;
}

function expectStringArray(value: unknown, field: string): string[] {
  return Array.from(expectArray(value, field), (item, index) => {
    if (typeof item !== "string") {
      throw new Error(`${field}[${index}]: a string is expected`);
    }
    return item;
  });
}

function checkSnapshot(value: unknown, field: string): Snapshot {
  const snapshot = expectObject(value, field);
  const commitSha = expectNonEmptyString(
    snapshot.commitSha,
    `${field}.commitSha`,
  );
  if (!/^[0-9a-f]{40}$/i.test(commitSha)) {
    throw new Error(
      `${field}.commitSha: a full 40-character Git SHA is expected`,
    );
  }
  return { commitSha };
}
