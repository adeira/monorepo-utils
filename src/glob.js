// @flow

import util from 'util';
import _glob from 'glob';
import { invariant, isObject } from '@adeira/js';

type GlobPattern = string;

type GlobOptions = $ReadOnly<{
  cwd?: string,
  root?: string,
  dot?: boolean,
  nomount?: boolean,
  mark?: boolean,
  nosort?: boolean,
  stat?: boolean,
  silent?: boolean,
  strict?: boolean,
  cache?: { [path: string]: boolean | 'DIR' | 'FILE' | $ReadOnlyArray<string> },
  statCache?: { [path: string]: false | { isDirectory(): boolean } | void },
  symlinks?: { [path: string]: boolean | void },
  realpathCache?: { [path: string]: string },
  sync?: boolean,
  nounique?: boolean,
  nonull?: boolean,
  debug?: boolean,
  nobrace?: boolean,
  noglobstar?: boolean,
  noext?: boolean,
  nocase?: boolean,
  matchBase?: any,
  nodir?: boolean,
  ignore?: string | $ReadOnlyArray<string>,
  follow?: boolean,
  realpath?: boolean,
  nonegate?: boolean,
  nocomment?: boolean,
  absolute?: boolean,
}>;

type GlobCallback = (error: null | Error, filenames: $ReadOnlyArray<string>) => void;

function isWindowsPath(globPattern: GlobPattern): boolean %checks {
  return /^[a-z]:\\/i.test(globPattern);
}

function isValidRoot(globPattern: GlobPattern, options?: GlobOptions): boolean %checks {
  return !(globPattern.startsWith('/') && options?.root === undefined);
}

function validateInputs(globPattern: GlobPattern, options?: GlobOptions): void {
  // Only forward slashes must be used, but we cannot disallow backslash since
  // escaping is still allowed. See: https://github.com/isaacs/node-glob#windows
  invariant(
    !isWindowsPath(globPattern),
    `Your glob patterns looks like absolute Windows path but this is not allowed. Glob doesn't accept paths but glob patterns instead. Invalid pattern: ${globPattern}`,
  );

  invariant(
    isValidRoot(globPattern, options),
    `Your glob pattern starts from root but you didn't define any root in glob options. Invalid pattern: ${globPattern}`,
  );
}

type GlobWithCallback = {
  (GlobPattern, GlobCallback): void,
  (GlobPattern, GlobOptions, GlobCallback): void,
  ...
};

/**
 * This `glob` wrapper adds additional checks and Flow types. It tries to solve
 * common problem with using `path.join` for glob patterns which is wrong
 * because there glob patterns are not paths (see windows incompatibility).
 *
 * See: https://github.com/isaacs/node-glob
 *
 * Don't use this function directly Use `globSync` or `globAsync` instead.
 */
export const glob: GlobWithCallback = (globPattern, options, callback) => {
  validateInputs(globPattern, isObject(options) ? options : undefined);

  if (typeof options === 'function') {
    invariant(callback === undefined, 'Glob function accepts only one callback.');
    return _glob(globPattern, options);
  }

  return _glob(
    globPattern,
    {
      ignore: ['**/node_modules/**'],
      ...options,
    },
    callback,
  );
};

export function globSync(globPattern: GlobPattern, options?: GlobOptions): $ReadOnlyArray<string> {
  validateInputs(globPattern, options);
  return _glob.sync(globPattern, {
    ignore: ['**/node_modules/**'],
    ...options,
  });
}

export function globAsync(
  globPattern: GlobPattern,
  options?: GlobOptions,
): Promise<$ReadOnlyArray<string>> {
  return util.promisify(glob)(globPattern, options);
}
