import { ExtensionView } from './directoryPrivateExtensionProvider';
import path = require('path');
import { ExtensionPackage } from './extensionPackage';

/**
 * Command to reveal solution/project/folder/file in OS' file Explorer
 * The user can right click on a solution/project/folder/file node context menu
 */
export default async function revealInOS(context: ExtensionView) {
    const uri = (context as unknown as ExtensionPackage).filePath;
	if (uri) {
		const fs = require('fs');
		try {
			// file/directory is valid
			await fs.promises.access(uri);
			openExplorer(uri);
		} catch (error) {
			// file/directory is invalid
			return;
		}
	}
}

function openExplorer(uri: string) {
	var cmd = '';
	const platform = require('os').platform().toLowerCase().replace(/[0-9]/g, '').replace('darwin', 'macos');
	switch (platform) {
		case 'win':
			cmd = 'explorer';
			break;
		case 'linux':
			cmd = 'xdg-open';
			break;
		case 'macos':
			cmd = 'open';
			break;
	}

	const process = require('child_process');
	let p: { on: (arg0: string, arg1: (err: any) => void) => void; kill: () => void };

    if (platform === 'win') {
        p = process.spawn(cmd, ['/e,/select,', uri]);
    } else if (platform === 'macos') {
        p = process.spawn(cmd, ['-R', uri]);
    } else {
        p = process.spawn(cmd, [path.dirname(uri)]);
    }

	p.on('error', (err: any) => {
		//logger.log(`Error executing Reveal In Explorer for ${uri} ${err}`)
		p.kill();
		return;
	});
}