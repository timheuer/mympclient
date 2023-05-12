import * as vscode from "vscode";
import { IExtension, Convert } from "./extensionData";
import { ExtensionPackage } from "./extensionPackage";
import { AppConstants, getDirectoryExtensionSource } from "./utils";
import * as fs from 'fs';
import path = require('path');
import AdmZip = require('adm-zip');
import xml2js = require('xml2js');

export class DirectoryPrivateExtensionProvider implements vscode.TreeDataProvider<ExtensionPackage> {
	
	getTreeItem(element: ExtensionPackage): vscode.TreeItem | Thenable<vscode.TreeItem> {
		// check to see if the tree item is already enabled
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
			try{
				const files = await fs.promises.readdir(element);

				const filteredFiles = files.filter(function (file) {
					const ext = path.extname(file);
					return ext === extensionFilter;
				});
		
				filteredFiles.forEach(async function (file) {
					const filePath = path.join(element, file);
					const zip = new AdmZip(filePath);
					const parser = new xml2js.Parser({ explicitArray: false });
					const manifestXml = zip.readAsText('extension.vsixmanifest');
					const manifest = await parser.parseStringPromise(manifestXml);
					const jsonManifest = zip.readAsText('extension/package.json');
					const pkg = Convert.toPackage(jsonManifest);

					pkg.target = "neutral";
					const detailsAsset = manifest.PackageManifest.Assets.Asset.find((asset: any) => asset.$.Type === "Microsoft.VisualStudio.Services.Content.Details");
					if (detailsAsset !== undefined) {
						pkg.relativeReadmePath = detailsAsset.$.Path;
					}
					const metadataIcon = manifest.PackageManifest.Metadata.Icon;
					let dataUri = '';
					if (metadataIcon !== undefined) {
						const iconData = zip.readFile(metadataIcon) as Buffer;					
						const base64Icon = Buffer.from(iconData).toString('base64');
						dataUri = `data:image/png;base64,${base64Icon}`;
					}
					const readme = zip.readAsText(pkg.relativeReadmePath);
					if (manifest.PackageManifest.Metadata.Identity.$.TargetPlatform !== undefined) {
						pkg.target = manifest.PackageManifest.Metadata.Identity.$.TargetPlatform;
					}

					pkg.location = filePath;
					pkg.publisher = manifest.PackageManifest.Metadata.Identity.$.Publisher;
					pkg.description = manifest.PackageManifest.Metadata.Description._;
					pkg.displayName = manifest.PackageManifest.Metadata.DisplayName;

					let exts: IExtension[] = [pkg];
					
					let newp = new ExtensionPackage(`${pkg.publisher}.${pkg.name}`, pkg.version, exts);
					newp.source = element;
					newp.readmeContent = readme;
					newp.base64Icon = dataUri;
					extensionInfos.push(newp);
				}); 
			}
			catch(err){
				console.log(err);
				vscode.window.showErrorMessage(`There was a problem adding ${element} to the sources, please verify source`);
			}
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
		this.id = `${extension.identifier}-${extension.mainExtension.extension.target}-${extension.version}`;
		this.description = `v${extension.version} ${(extension.mainExtension.extension.target === "neutral" ? "" : `(${extension.mainExtension.extension.target}) `)}- ${extension.source}`;
		this.tooltip = extension.description;
		this.iconPath = new vscode.ThemeIcon("extensions");
		this.command = {
			command: AppConstants.commandSelect,
			title: "",
			arguments: [extension],
		};
	}
}
