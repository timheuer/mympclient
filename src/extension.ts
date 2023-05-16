import * as vscode from "vscode";
import { ApiPrivateExtensionProvider } from "./apiPrivateExtensionProvider";
import { log } from "console";
import { ExtensionDetailsPanel } from "./extensionDetailsPanel";
import { ExtensionPackage } from "./extensionPackage";
import { AppConstants, installExtension } from "./utils";
import { DirectoryPrivateExtensionProvider } from "./directoryPrivateExtensionProvider";
import revealInOS from "./revealInOS";

export function activate(context: vscode.ExtensionContext) {
	const apiExtensionDataProvider = new ApiPrivateExtensionProvider();
	const directoryDataProvider = new DirectoryPrivateExtensionProvider();
	vscode.window.registerTreeDataProvider(AppConstants.treeViewId, apiExtensionDataProvider);
	vscode.window.registerTreeDataProvider(AppConstants.directoryTreeViewId, directoryDataProvider);

	let addApiSource = vscode.commands.registerCommand(AppConstants.commandAddSource, async () => {
		vscode.window
			.showInputBox({
				placeHolder: "Enter the repository URL",
			})
			.then(async (url) => {
				if (url) {
					// get the existing source and add to it
					let existing = await vscode.workspace.getConfiguration("").get(AppConstants.configSource) as string[];

					existing.includes(url) ? vscode.window.showInformationMessage(`Source ${url} already exists`) :	existing.push(url);

					await vscode.workspace
						.getConfiguration("")
						.update(AppConstants.configSource, existing, vscode.ConfigurationTarget.Global);
						apiExtensionDataProvider.refresh();

					vscode.window.showInformationMessage(`Added API source ${url} to My Marketplace`);
				}
			});
	});

	let addDirSource = vscode.commands.registerCommand(AppConstants.commandAddDirSource, async () => {
		vscode.window
			.showInputBox({
				placeHolder: "Enter the directory path",
			})
			.then(async (url) => {
				if (url) {					
					// get the existing source and add to it
					let existing = await vscode.workspace.getConfiguration("").get(AppConstants.directoryConfigSource) as string[];
					
					existing.includes(url) ? vscode.window.showInformationMessage(`Source ${url} already exists`) :	existing.push(url);

					await vscode.workspace
						.getConfiguration("")
						.update(AppConstants.directoryConfigSource, existing, vscode.ConfigurationTarget.Global);
						directoryDataProvider.refresh();
					
					vscode.window.showInformationMessage(`Added directory source ${url} to My Marketplace`);
				}
			});
	});

	let enablePrerelease = vscode.commands.registerCommand(AppConstants.commandPrerelease, async () => {
		await vscode.workspace
			.getConfiguration("")
			.update(
				AppConstants.configPrerelease,
				!vscode.workspace.getConfiguration("").get(AppConstants.configPrerelease),
				vscode.ConfigurationTarget.Global
			);
		apiExtensionDataProvider.refresh();
	});

	vscode.commands.registerCommand(AppConstants.commandRefresh, () => apiExtensionDataProvider.refresh());
	vscode.commands.registerCommand(AppConstants.commandRefreshDir, () => directoryDataProvider.refresh());
	vscode.commands.registerCommand(AppConstants.commandRevealInOs, revealInOS);

	vscode.commands.registerCommand(AppConstants.commandSelect, (item: ExtensionPackage) => {
		log(`Selected ${item.identifier} - v${item.version}...`);
		ExtensionDetailsPanel.createOrShow(item, context.extensionUri);
		ExtensionDetailsPanel.currentPanel?.update(item);
	});

	vscode.commands.registerCommand(AppConstants.commandInstall, async (id: string, location: string, ctx: vscode.ExtensionContext) => {
		await installExtension(id, location, context);
	});

	context.subscriptions.push(addApiSource);
	context.subscriptions.push(addDirSource);
	context.subscriptions.push(enablePrerelease);

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(ExtensionDetailsPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				// Reset the webview options so we use latest uri for `localResourceRoots`.
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
				ExtensionDetailsPanel.revive(webviewPanel, context.extensionUri);
			},
		});
	}

	vscode.workspace.onDidChangeConfiguration((e) => {
		if (e.affectsConfiguration(AppConstants.configPrerelease)) {
			apiExtensionDataProvider.refresh();
		}
	});
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media"), vscode.Uri.joinPath(extensionUri, "out")]
	};
}

// This method is called when your extension is deactivated
export function deactivate() {}
