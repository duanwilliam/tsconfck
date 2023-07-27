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
	while (dir) {
		const config = await fileInDir(dir, 'tsconfig.json', options?.tsConfigPaths);
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
	if (options?.jsconfig) {
		dir = initialDir;
		while (dir) {
			const jsconfig = await fileInDir(dir, 'jsconfig.json', options?.tsConfigPaths);
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

async function fileInDir(
	dir: string,
	filename: string,
	knownPaths?: Set<string>
): Promise<string | undefined | void> {
	const filepath = path.join(dir, filename);
	if (knownPaths) {
		if (knownPaths.has(filepath)) {
			return filepath;
		}
	}
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
	 * return the closest tsconfig file if it exists, or otherwise jsconfig.json if it exists.
	 */
	jsconfig?: boolean;
}
