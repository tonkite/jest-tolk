import Parser from 'web-tree-sitter';
import { loadTolk } from '@tonkite/tree-sitter-tolk';

export interface GetMethodDeclaration {
  docBlock?: string;
  methodId?: number;
  methodName: string;
}

export function extractDocBlock(node: Parser.SyntaxNode): string | null {
  if (node.type !== 'comment') {
    return null;
  }

  if (!node.previousSibling) {
    return node.text;
  }

  // NOTE: It's a comment of another statement.
  if (node.previousSibling.endPosition.row === node.startPosition.row) {
    return null;
  }

  const previous = extractDocBlock(node.previousSibling);

  return previous ? previous + '\n' + node.text : node.text;
}

export async function extractGetMethods(
  sourceCode: string,
): Promise<GetMethodDeclaration[]> {
  await Parser.init();
  const parser = new Parser();

  parser.setLanguage(await loadTolk());

  const { rootNode } = parser.parse(sourceCode);

  const methods: GetMethodDeclaration[] = [];

  for (const node of rootNode.children) {
    if (node.type !== 'get_method_declaration') {
      continue;
    }

    const annotations =
      node.children
        .find((child) => child.type === 'annotation_list')
        ?.children.filter((child) => child.type === 'annotation') ?? [];

    const methodId = annotations
      .find((annotation) => annotation.child(1)?.text === 'method_id')
      ?.child(3)?.text;
    const methodName = node.childForFieldName('name')?.text;

    const docBlock = node.previousSibling
      ? extractDocBlock(node.previousSibling)?.replace(/(^|\n)(\/\/\s*)/g, '$1')
      : null;

    methods.push({
      methodId: methodId
        ? parseInt(
            methodId.replace(/^0x/, ''),
            methodId.startsWith('0x') ? 16 : 10,
          )
        : undefined,
      methodName: methodName!,
      docBlock: docBlock ?? undefined,
    });
  }

  return methods;
}
