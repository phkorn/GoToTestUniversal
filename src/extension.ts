import * as vscode from 'vscode';
import * as path from 'path';
import { GlobOptions, glob } from 'glob';

const EXTENSION_NAME = 'gototestuniversal';

interface GoToUniversalConfigEntry {
	sourceFolder: string;
	testFolder: string;
	includeParentFolderLevel?: number;
	fileExtensions: string[];
}

const channel = setupOutputChannel();

function setupOutputChannel() {
	const outputChannel = vscode.window.createOutputChannel(EXTENSION_NAME);
	// outputChannel.show();
	return outputChannel;
}

async function findFiles(globPattern: string, targetFolder: string) {
	channel.appendLine(`globPattern ${globPattern}`);
	const globOptions: GlobOptions = {
		cwd: targetFolder,
		absolute: true
	};
	const files = await glob(globPattern, globOptions);
	return files.map(file => file.toString());
}

async function openPeekLocations(currentFile: vscode.Uri, currentPos: vscode.Position, targets: string[]) {
	const locations = targets.map(f => new vscode.Location(
		vscode.Uri.file(f),
		currentPos,
	));
	await vscode.commands.executeCommand(
		'editor.action.peekLocations',
		currentFile,
		new vscode.Position(0, 0),
		locations,
		'goto');
}

export async function activate(context: vscode.ExtensionContext) {
	channel.appendLine('gototestuniversal is active!');

	let disposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.gototest`, async () => {
		const configs = vscode.workspace.getConfiguration('GoToTestUniversal').get<GoToUniversalConfigEntry[]>('config');
		if (!configs || configs.length === 0) {
			vscode.window.showErrorMessage('Could not get configuration');
		}
		const currentFileLocation = vscode.window.activeTextEditor?.document.fileName;
		if (!currentFileLocation) {
			channel.appendLine('No file is currently open');
			vscode.window.showErrorMessage('No file is currently open');
		}
		const workspaceFolders = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath);
		const filePath = path.parse(currentFileLocation!);
		channel.appendLine(`current path: ${filePath.dir}`);

		const targetFolders = workspaceFolders?.filter((folder) => filePath.dir.includes(folder))
		channel.appendLine(`workspace folders: ${workspaceFolders}`);
		channel.appendLine(`workspace targetFolders: ${targetFolders}`);

		if (!targetFolders || targetFolders.length === 0) {
			channel.appendLine('Could not get targetFolder');
			vscode.window.showErrorMessage('Could not get targetFolder');
		}

		const targetFolder = targetFolders![0];
		const targetTestFiles: string[] = [];

		for (const config of configs!) {
			const fileExtensionGlob = config.fileExtensions.length > 1 ? `.{${config.fileExtensions.join(',')}}` : `.${config.fileExtensions[0]}`;

			const exactNameGlobMatches = await findFiles(`${config.testFolder}/**/${filePath.name}*${fileExtensionGlob}`, targetFolder);

			const relativeSource = config.sourceFolder + filePath.dir.split(config.sourceFolder).pop();
			const parentFolders = relativeSource.split(path.sep);
			const parentFoldersSearch = [];
			for (let i = config.includeParentFolderLevel || 0; i > 0; i--) {
				parentFolders.pop();
				parentFoldersSearch.push(parentFolders.slice(parentFolders.length - i, parentFolders.length).join(path.sep));
			}

			parentFoldersSearch.map(file => channel.appendLine(`parentFoldersSearch: ${file}`));

			const parentFolderMatchesMulti = await Promise.all(parentFoldersSearch.map(path => findFiles(`${config.testFolder}/**/${path}/*${fileExtensionGlob}`, targetFolder)));
			const parentFolderMatches = parentFolderMatchesMulti.flat();
			targetTestFiles.push(...exactNameGlobMatches)
			targetTestFiles.push(...parentFolderMatches)
		}

		targetTestFiles.map(file => channel.appendLine(`targetTestFile: ${file}`));
		if (targetTestFiles.length > 0) {
			await openPeekLocations(vscode.Uri.file(currentFileLocation!), new vscode.Position(0, 0), targetTestFiles)
		} else {
			vscode.window.showInformationMessage('No test files found');
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }