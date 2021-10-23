// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('css-selector-to-scss.ConvertFromClipboard', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const editor = vscode.window.activeTextEditor;

		vscode.env.clipboard.readText().then((clipText) => {
			if (clipText.length > 0) {
				if (clipText.indexOf(',') !== -1) {
					let lines = clipText.split(',');

					clipText = lines[0];
					vscode.window.showErrorMessage('CSS selector to SCSS only works with single rules. Only processed the first line.');
				}
				let cliptextArr = clipText.split(/[\s:]+/gm);
				let snippetStr = '';
				let level = 0;
				let snippetPrefix = (level: number) => {
					let output = '';

					for (let e = 0; e < level; e++) {
						output = output + '\t';
						
					}

					return output;
				};

				let PseudoPrefix = (selector: string) => {
					const PseudoList = [
						':after',
						':before',
						'active',
						'checked',
						'disabled',
						'empty',
						'enabled',
						'first-child',
						'first-of-type',
						'focus',
						'hover',
						'in-range',
						'invalid',
						'last-child',
						'last-of-type',
						'link',
						'only-of-type',
						'only-child',
						'optional',
						'out-of-range',
						'read-only',
						'read-write',
						'required',
						'root',
						'target',
						'valid',
						'visited'
					];

					const PseudoListDouble = [
						'after',
						'before',
						'first-letter',
						'first-line',
						'marker',
						'selection'
					];

					const PseudoStartsWithList = [
						'lang(',
						'not(',
						'nth-child(',
						'nth-last-child(',
						'nth-last-of-type(',
						'nth-of-type(',
					];

					if (PseudoList.indexOf(selector) !== -1) {
						return '&:';
					}

					if (PseudoListDouble.indexOf(selector) !== -1) {
						return '&::';
					}

					for (let i = 0; i < PseudoStartsWithList.length; i++) {
						const element = PseudoStartsWithList[i];
						if (selector.indexOf(element) === 0) {
							return '&:';
						}
					}

					return '';
				};

				const validOperators = [
					'+',
					'>',
					'~'
				];

				
				for (let i = 0; i < cliptextArr.length; i++) {
					const clipEl = cliptextArr[i];

					if (level === 0) {
						snippetStr = PseudoPrefix(clipEl) + clipEl + ' {\n';
					} else {
						if (clipEl.length === 1 && validOperators.indexOf(clipEl) !== -1) {
							i++;
							snippetStr = snippetStr + snippetPrefix(level) + PseudoPrefix(clipEl) + clipEl + ' ' + PseudoPrefix(cliptextArr[i]) + cliptextArr[i] + ' {\n';
							level++;
							continue;
						}
						snippetStr = snippetStr + snippetPrefix(level) + PseudoPrefix(clipEl) + clipEl + ' {\n';
					}
					level++;
				}

				for (let w = 0; w < level; w++) {
					snippetStr = snippetStr + '\t';
				}

				snippetStr = snippetStr + '$0\n';

				let revPrev = level;

				for (let k = 0; k < level; k++) {
					revPrev--;
					snippetStr = snippetStr + snippetPrefix(revPrev) + '}' + (revPrev > 0 ? '\n' : '');
				}
				editor?.insertSnippet(new vscode.SnippetString(snippetStr));
			}
		});
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
