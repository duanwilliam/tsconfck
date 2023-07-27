import path from 'path';
import { promises as fs } from 'fs';

/**
 * find the closest tsconfig.json file
 *
 * @param {string} filename - path to file to find tsconfig for (absolute or relative to cwd)
 * @param {TSConfckFindOptions} options - options
 * @returns {Promise<string>} absolute path to closest tsconfig.json
 */
export async function find(filename: string, options?: TSConfckFindOptions) {
	const initialDir = path.dirname(path.resolve(filename));
	const root = options?.root ? path.resolve(options.root) : null;
	let dir = initialDir;
	let filesToSearchFor =
		options?.jsconfig === 'parallel' ? ['tsconfig.json', 'jsconfig.json'] : ['tsconfig.json'];
	while (dir) {
		const config = await filesInDir(dir, filesToSearchFor, options?.tsConfigPaths);
		if (config) {
			return config;
		} else {
			if (root === dir) {
				break;
			}
			const parent = path.dirname(dir);
			if (parent === dir) {
				break;
			} else {
				dir = parent;
			}
		}
	}
	if (options?.jsconfig === true) {
		dir = initialDir;
		filesToSearchFor = ['jsconfig.json'];
		while (dir) {
			const jsconfig = await filesInDir(dir, filesToSearchFor, options?.tsConfigPaths);
			if (jsconfig) {
				return jsconfig;
			} else {
				if (root === dir) {
					break;
				}
				const parent = path.dirname(dir);
				if (parent === dir) {
					break;
				} else {
					dir = parent;
				}
			}
		}
	}
	if (options?.jsconfig) {
		throw new Error(`no tsconfig or jsconfig file found for ${filename}`);
	} else {
		throw new Error(`no tsconfig file found for ${filename}`);
	}
}

async function filesInDir(
	dir: string,
	files: string | string[],
	knownPaths?: Set<string>
): Promise<string | undefined | void> {
	const filesList = Array.isArray(files) ? files : [files];
	const filepaths = filesList.map((filename) => path.join(dir, filename));
	if (knownPaths) {
		return filepaths.find((filepath) => knownPaths.has(filepath));
	}
	for (const filepath of filepaths) {
		try {
			const stat = await fs.stat(filepath);
			if (stat.isFile() || stat.isFIFO()) {
				return filepath;
			}
		} catch (e) {
			// ignore does not exist error
			if (e.code !== 'ENOENT') {
				throw e;
			}
		}
	}
}

export interface TSConfckFindOptions {
	/**
	 * Set of known tsconfig file locations to use instead of scanning the file system
	 *
	 * This is better for performance in projects like vite where find is called frequently but tsconfig locations rarely change
	 * You can use `findAll` to build this
	 */
	tsConfigPaths?: Set<string>;

	/**
	 * project root dir, does not continue scanning outside of this directory.
	 *
	 * Improves performance but may lead to different results from native typescript when no tsconfig is found inside root
	 */
	root?: string;

	/**
	 * return the closest tsconfig file, or jsconfig.json if it exists instead.
	 *
	 * If set to `true`, emulates native `ts.findConfigFile` behavior, which first searches for any tsconfig file,
	 * and then only searches for a jsconfig if no tsconfig was found.
	 *
	 * If set to `"parallel"`, returns the closest tsconfig _or_ jsconfig file that exists.
	 *
	 * For example, given the tree structure
	 *
	 * ```
	 * ~/
	 * ├─ a/
	 * │ 	└─ jsconfig.json
	 * └─ tsconfig.json
	 * ```
	 *
	 * then calling `find` in `~/a` would return:
	 * - `~/tsconfig.json` if `jsconfig = true`
	 * - `~/a/jsconfig.json` if `jsconfig = "parallel"`
	 */
	jsconfig?: boolean | 'parallel';
}
