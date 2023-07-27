import path from 'path';
import { loadTS } from './util.js';

/**
 * find the closest tsconfig.json file using native ts.findConfigFile
 *
 * You must have `typescript` installed to use this
 *
 * @param {string} filename - path to file to find tsconfig for (absolute or relative to cwd)
 * @param {boolean} [jsconfig] - try to find the closest jsconfig.json file if no tsconfig.json file exists
 * @returns {Promise<string>} absolute path to closest tsconfig.json
 */
export async function findNative(filename: string, jsconfig: boolean = false): Promise<string> {
	const ts = await loadTS();
	const { findConfigFile, sys } = ts;
	const tsconfigFile = findConfigFile(path.dirname(path.resolve(filename)), sys.fileExists);

	if (tsconfigFile) {
		return tsconfigFile;
	}

	if (!jsconfig) {
		throw new Error(`no tsconfig file found for ${filename}`);
	}

	const jsconfigFile = findConfigFile(
		path.dirname(path.resolve(filename)),
		sys.fileExists,
		'jsconfig.json'
	);
	if (!jsconfigFile) {
		throw new Error(`no tsconfig or jsconfig file found for ${filename}`);
	}
	return jsconfigFile;
}
