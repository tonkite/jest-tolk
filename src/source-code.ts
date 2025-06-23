/**
 * Copyright 2024 Scaleton Labs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Parser from 'web-tree-sitter';
import { loadTolk } from '@tonkite/tree-sitter-tolk';

export interface GetMethodDeclaration {
  docBlock?: string;
  methodId?: number;
  methodName: string;
  parameters: { name: string; type: string }[];
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

    const parameters = node.children
      .find(c => c.type === 'parameter_list')!
      .children.filter(c => c.type === 'parameter_declaration')
      .map(parameter => ({
        name: parameter.childForFieldName('name')!.text,
        type: parameter.childForFieldName('type')!.text,
      }));

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
      parameters,
    });
  }

  return methods;
}
