"use strict";
const vscode = acquireVsCodeApi();

import { provideVSCodeDesignSystem, vsCodeButton, vsCodeTag, vsCodePanelTab, vsCodePanelView, vsCodePanels } from "@vscode/webview-ui-toolkit";
provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeTag(), vsCodePanelTab(), vsCodePanelView(), vsCodePanels());

window.addEventListener("load", main);
function main() {
	const installButton = document.getElementById("installButton");
	installButton.addEventListener("click", installButtonClick);

	const markdownDiv = document.getElementById("markdownDiv");
	const markdownPath = markdownDiv.getAttribute("data-markdown-path");

	const nameElement = document.getElementById("packageId");
	const repoSource = nameElement.getAttribute("data-repo-source");
	console.log(nameElement);
	console.log(repoSource);

	// if directory path, extract it from the attribute
	if (repoSource !== null && repoSource.length > 0) {
		var md = window.markdownit();
		var result = md.render(markdownPath);
		markdownDiv.innerHTML = result;
	}
	else {
		markdownDiv.innerHTML = "# TODO: Add API source README";	
	}

	// if API repository get the URI and read it

	// fetch(markdownPath)
	// 	.then((response) => 
	// 	{
	// 		const body = response.text();
	// 		console.log(body);
	// 	})
	// 	.then((data) => {
	// 		const md = window.markdownit({
	// 			html: true,
	// 			linkify: true,
	// 			typographer: true,
	// 		});
	// 		console.log(data);
	// 		const html = md.render(data);
	// 		const markdown = document.getElementById("markdownDiv");
	// 		console.log(html);
	// 		markdown.innerHTML = html;
	// 	});
}

/**
 * @param {MouseEvent} event
 */
function installButtonClick(event) {
	const id = event.target.getAttribute("data-extension");
	const location = event.target.getAttribute("data-package-location");
	vscode.postMessage({
		command: 'install',
		id: id,
		location: location
	});
	
}
