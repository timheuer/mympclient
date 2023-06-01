"use strict";
const vscode = acquireVsCodeApi();

import { provideVSCodeDesignSystem, vsCodeButton, vsCodeTag, vsCodePanelTab, vsCodePanelView, vsCodePanels } from "@vscode/webview-ui-toolkit";
import { moveSyntheticComments } from "typescript";
provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeTag(), vsCodePanelTab(), vsCodePanelView(), vsCodePanels());

window.addEventListener("load", main);
function main() {
	const installButton = document.getElementById("installButton");
	installButton.addEventListener("click", installButtonClick);

	const markdownDiv = document.getElementById("markdownDiv");
	const markdownPath = markdownDiv.getAttribute("data-markdown-path");
	const markdownPathUri = markdownDiv.getAttribute("data-markdown-relativepath");

	const nameElement = document.getElementById("packageId");
	const repoSourceType = installButton.getAttribute("data-extension-sourcetype");
	const repoSource = nameElement.getAttribute("data-repo-source");
	console.log(nameElement);
	console.log(repoSourceType);
	console.log(repoSource);

	// if directory path, extract it from the attribute
	if (repoSourceType !== null && repoSourceType === "Directory") {
		var md = window.markdownit();
		md.options.html = true;
		var result = md.render(markdownPath);
		markdownDiv.innerHTML = result;
	}
	else { // API Resource
		fetch(markdownPathUri)
			.then(response => response.text())
			.then(data => {
				var md = window.markdownit();
				md.options.html = true;
				var result = md.render(data.toString());
				markdownDiv.innerHTML = result; 
			});
	}
}

/**
 * @param {MouseEvent} event
 */
function installButtonClick(event) {
	const id = event.target.getAttribute("data-extension");
	const location = event.target.getAttribute("data-package-location");
	const sourceType = event.target.getAttribute("data-extension-sourcetype");
	const version = event.target.getAttribute("data-extension-version");
	const target = event.target.getAttribute("data-extension-target");
	vscode.postMessage({
		command: 'install',
		id: id,
		location: location,
		sourceType: sourceType,
		version: version,
		target: target
	});
	
}
