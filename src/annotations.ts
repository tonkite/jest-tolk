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

export interface TestAnnotations {
  runs?: number;
  scope?: string;
  gasLimit?: number;
  skip?: boolean;
  todo?: boolean;
}

export function extractAnnotationsFromDocBlock(
  docBlock: string,
): TestAnnotations {
  const annotations: TestAnnotations = {};
  const lines = docBlock.split('\n');

  for (const line of lines) {
    let matches;

    if ((matches = line.match(/@runs\s+(-?\d+)/))) {
      annotations.runs = parseInt(matches[1]);
    }

    if ((matches = line.match(/@scope\s+(.+)/))) {
      annotations.scope = matches[1];
    }

    if ((matches = line.match(/@gasLimit\s+(\d+)/))) {
      annotations.gasLimit = parseInt(matches[1]);
    }

    if ((matches = line.match(/@skip/))) {
      annotations.skip = true;
    }

    if ((matches = line.match(/@todo/))) {
      annotations.todo = true;
    }
  }

  return annotations;
}
