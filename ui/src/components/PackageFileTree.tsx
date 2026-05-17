import { FileTree } from "./FileTree";
import type { FileTreeProps } from "./FileTree";

import { useTranslation } from "react-i18next";
export function PackageFileTree({ wrapLabels = false, ...props }: FileTreeProps) {
  const { t } = useTranslation("common");
  return <FileTree {...props} wrapLabels={wrapLabels} />;
}

export {
  FRONTMATTER_FIELD_LABELS,
  buildFileTree,
  collectAllPaths,
  countFiles,
  parseFrontmatter,
} from "./FileTree";
export type {
  FileTreeBadge,
  FileTreeBadgeVariant,
  FileTreeEmptyState,
  FileTreeErrorState,
  FileTreeNode,
  FileTreeProps,
  FileTreeTone,
  FrontmatterData,
} from "./FileTree";
