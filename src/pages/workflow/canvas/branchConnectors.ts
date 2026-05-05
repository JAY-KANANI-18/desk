type BranchConnectorLike = {
  id?: string;
  name?: string;
  data?: {
    conditions?: unknown[];
    isElse?: boolean;
  };
};

function normalizeConnectorName(name: string | undefined) {
  return (name ?? "").trim().toLowerCase();
}

export function isElseBranchConnector<T extends BranchConnectorLike>(
  connector: T,
  index?: number,
  connectors?: T[],
) {
  const name = normalizeConnectorName(connector.name);

  if (connector.data?.isElse === true || name === "else") {
    return true;
  }

  const isLegacyDefaultBranchPath =
    connectors &&
    typeof index === "number" &&
    connectors.length > 1 &&
    index === connectors.length - 1 &&
    name === "branch path" &&
    (connector.data?.conditions?.length ?? 0) === 0;

  return Boolean(isLegacyDefaultBranchPath);
}

export function orderBranchConnectors<T extends BranchConnectorLike>(
  connectors: T[],
) {
  const branches: T[] = [];
  const elseConnectors: T[] = [];

  connectors.forEach((connector, index) => {
    if (isElseBranchConnector(connector, index, connectors)) {
      elseConnectors.push(connector);
    } else {
      branches.push(connector);
    }
  });

  return [...branches, ...elseConnectors];
}

export function getBranchConnectorDisplayName<T extends BranchConnectorLike>(
  connector: T,
  index: number,
  connectors: T[],
) {
  if (isElseBranchConnector(connector, index, connectors)) {
    return "Else";
  }

  return connector.name || `Branch ${index + 1}`;
}
