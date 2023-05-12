import * as vscode from "vscode";
import { IExtension, Convert } from "./extensionData";
import { ExtensionPackage } from "./extensionPackage";
import { AppConstants, getDirectoryExtensionSource } from "./utils";
import * as fs from 'fs';
import path = require('path');
import AdmZip = require('adm-zip');

export class DirectoryPrivateExtensionProvider implements vscode.TreeDataProvider<ExtensionPackage> {
	
	getTreeItem(element: ExtensionPackage): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return new ExtensionView(element);
	}

	getChildren(element?: ExtensionPackage | undefined): vscode.ProviderResult<ExtensionPackage[]> {
		return this.getExtensionData();
	}

	async getExtensionData(): Promise<ExtensionPackage[]> {
		let dir = getDirectoryExtensionSource();

		if (dir === undefined || dir.length < 1 ) {
			return [];
		}

		const extensionFilter = '.vsix';
		const extensionInfos = new Array<ExtensionPackage>();

        for await (const element of dir)
        {
            const files = await fs.promises.readdir(element);

            const filteredFiles = files.filter(function (file) {
                const ext = path.extname(file);
                return ext === extensionFilter;
            });
    
            filteredFiles.forEach(function (file) {
                const filePath = path.join(element, file);
                const zip = new AdmZip(filePath);
                const packageJson = zip.readAsText('extension/package.json');

				const pkg = Convert.toPackage(packageJson);
				const readme = zip.readAsText('extension/README.md');

				let exts: IExtension[] = [pkg];
				
				let newp = new ExtensionPackage(`${pkg.publisher}-${pkg.name}`, pkg.version, exts);
				newp.source = element;
				newp.readmeContent = readme;
				extensionInfos.push(newp);
            }); 
        };

		return extensionInfos;
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	private _onDidChangeTreeData: vscode.EventEmitter<ExtensionPackage | undefined | null | void> =
		new vscode.EventEmitter<ExtensionPackage | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<ExtensionPackage | undefined | null | void> =
		this._onDidChangeTreeData.event;
}

class ExtensionView extends vscode.TreeItem {
	constructor(public readonly extension: ExtensionPackage) {
		super(extension.displayName, vscode.TreeItemCollapsibleState.None);
		this.id = extension.identifier;
		this.description = `v${extension.version} - ${extension.source}`;
		this.tooltip = extension.description;
		this.iconPath = new vscode.ThemeIcon("extensions");
		this.command = {
			command: AppConstants.commandSelect,
			title: "",
			arguments: [extension],
		};
	}
}
