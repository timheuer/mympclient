import axios from "axios";
import * as vscode from "vscode";
import { Ext } from "./extensionData";
import { ExtensionPackage } from "./extensionPackage";
import { AppConstants, flattenUrl, getExtensionSource, getPrerelease } from "./utils";

export class ApiPrivateExtensionProvider implements vscode.TreeDataProvider<ExtensionPackage> {
	
	getTreeItem(element: ExtensionPackage): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return new ExtensionView(element);
	}

	getChildren(element?: ExtensionPackage | undefined): vscode.ProviderResult<ExtensionPackage[]> {
		return this.getExtensionData();
	}

	async getExtensionData(): Promise<ExtensionPackage[]> {
		let url = getExtensionSource();

		if (url === undefined || url === "") {
			return [];
		}

		const prerelease = getPrerelease();
		url = flattenUrl(`${url}extension?prerelease=${prerelease}`);
		
		try
		{
			const res = await axios.get<Ext[]>(url);

			if (res.status !== axios.HttpStatusCode.Ok) {
				return [];
			}

			let responseData = res.data;
			let uniqueExtensions = responseData.reduce((acc: Ext[], curr: Ext) => {
				if (acc.find((p) => p.identifier === curr.identifier)) {
					return acc;
				}
				return [...acc, curr];
			}, []);

			const localExtensions = uniqueExtensions.map(
				(p) => new ExtensionPackage(p.identifier, p.version, p.extensions)
			);

			return localExtensions;
		} catch (error) {
			// problem with the API source
			vscode.window.showErrorMessage(`There was a problem connecting to ${url}, please re-validate the source or remove from settings`);
			return [];
		}
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
		this.description = `v${extension.version}`;
		this.tooltip = extension.description;
		this.iconPath = new vscode.ThemeIcon("extensions");
		this.command = {
			command: AppConstants.commandSelect,
			title: "",
			arguments: [extension],
		};
	}
}
