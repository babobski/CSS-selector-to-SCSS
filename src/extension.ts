import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('css-selector-to-scss.ConvertSelectorFromClipboard', () => {
		const editor = vscode.window.activeTextEditor;

		vscode.env.clipboard.readText().then((clipText) => {
			if (clipText.length > 0) {
				convertSelectorToSnippet(clipText, () => {});
			}
		});
	});

	context.subscriptions.push(disposable);

	let disposable2 = vscode.commands.registerCommand('css-selector-to-scss.ConvertRuleFromClipboard', async () => {
		const editor = vscode.window.activeTextEditor;

		vscode.env.clipboard.readText().then(async (clipText) => {
			if (clipText.length > 0) {
				let matchResults = [...clipText.matchAll(/^([^{]+){([^}]+)}/gm)];
				if (matchResults.length > 0 && matchResults[0].length === 3) {
					
					let selector = matchResults[0][1].toString().replace(/\s$/, '');
					let values = matchResults[0][2].toString().replace(/(\r|\n|\t|^\s+)/gm, '');

					vscode.env.clipboard.writeText(selector).then(async text => {
						convertSelectorToSnippet(selector, () => {
							let valuesArr = values.replace(/;$/g, '').split(';');
							let snippetString = '';
	
							for (let i = 0; i < valuesArr.length; i++) {
								const val = valuesArr[i];
								snippetString = snippetString + val + ';' + ((valuesArr.length-1) === i ? '' : '\n');
							}
							editor?.insertSnippet(new vscode.SnippetString(snippetString));
						});
					});
				}
			
			}
		});
	});

	context.subscriptions.push(disposable2);
}

// this method is called when your extension is deactivated
export function deactivate() {}

let convertSelectorToSnippet = (clipText: string, callback: (() => void)) => {
	const editor = vscode.window.activeTextEditor;
	// If is multiple lines, only process the first line.
	if (clipText.indexOf(',') !== -1) {
		let lines = clipText.split(',');
		clipText = lines[0];
		vscode.window.showErrorMessage('CSS selector to SCSS only works with single rules. Only processed the first line.');
	}
	// Split on space and : returning all selectors and pseudo elements 
	let cliptextArr = clipText.replace(/\:\:/g, ':').split(/[\s:]+/gm),
		snippetStr = '',
		level = 0,
		// Calculates the leading indent
		snippetPrefix = (level: number) => {
			let output = '';

			for (let e = 0; e < level; e++) {
				output = output + '\t';	
			}
			return output;
		},
		// check if is a Pseudo element
		PseudoPrefix = (selector: string) => {
			const PseudoList = [
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
				'selection',
				'placeholder',
				'placeholder-shown'
			];

			const PseudoStartsWithList = [
				'lang(',
				'not(',
				'nth-child(',
				'nth-last-child(',
				'nth-last-of-type(',
				'nth-of-type(',
			];

			// Check if is pseudo element
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

		// If it is a valid operator prepend it to the next result
		if (clipEl.length === 1 && validOperators.indexOf(clipEl) !== -1) {
			i++;
			snippetStr = snippetStr + snippetPrefix(level) + PseudoPrefix(clipEl) + clipEl + ' ' + PseudoPrefix(cliptextArr[i]) + cliptextArr[i] + ' {\n';
			level++;
			continue;
		}

		// If it contains multiple classes or ids
		const regex = /[#\.][a-z-_]+[#.][a-z-_]+/gi;
		if (regex.test(clipEl)) {
			let transFromItem = clipEl;
			transFromItem = transFromItem.replace(/\#/g, '|#').replace(/\./g, '|.');
			let loopArray = transFromItem.split('|');
			let first = true;
			if (loopArray[0] === '') {
				loopArray.shift();
			}
			
			for (let o = 0; o < loopArray.length; o++) {
				const element = loopArray[o];
				snippetStr = snippetStr + snippetPrefix(level) + (!first ? '&' : '') + element + ' {\n';
				first = false;
				level++;
			}
			continue;
		}
		// Build snippet
		snippetStr = snippetStr + snippetPrefix(level) + PseudoPrefix(clipEl) + clipEl + ' {\n';
	
		level++;
	}

	// Build leading indend for value
	snippetStr = snippetStr + snippetPrefix(level);

	// Add value/final cursor position
	snippetStr = snippetStr + '$0\n';

	let revPrev = level;
	// Build backwards closing tags
	for (let k = 0; k < level; k++) {
		revPrev--;
		snippetStr = snippetStr + snippetPrefix(revPrev) + '}' + (revPrev > 0 ? '\n' : '');
	}
	// Insert the snippet
	editor?.insertSnippet(new vscode.SnippetString(snippetStr)).then(insterted => {
		callback();
	});
};
