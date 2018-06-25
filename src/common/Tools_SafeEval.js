//! BEGIN_MODULE()

//! REPLACE_BY("// Copyright 2015-2018 Claude Petit, licensed under Apache License version 2.0\n", true)
	// doodad-js - Object-oriented programming framework
	// File: Tools_SafeEval.js - SafeEval tools
	// Project home: https://github.com/doodadjs/
	// Author: Claude Petit, Quebec city
	// Contact: doodadjs [at] gmail.com
	// Note: I'm still in alpha-beta stage, so expect to find some bugs or incomplete parts !
	// License: Apache V2
	//
	//	Copyright 2015-2018 Claude Petit
	//
	//	Licensed under the Apache License, Version 2.0 (the "License");
	//	you may not use this file except in compliance with the License.
	//	You may obtain a copy of the License at
	//
	//		http://www.apache.org/licenses/LICENSE-2.0
	//
	//	Unless required by applicable law or agreed to in writing, software
	//	distributed under the License is distributed on an "AS IS" BASIS,
	//	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	//	See the License for the specific language governing permissions and
	//	limitations under the License.
//! END_REPLACE()

//! IF_SET("mjs")
//! ELSE()
	"use strict";
//! END_IF()

exports.add = function add(modules) {
	modules = (modules || {});
	modules['Doodad.Tools.SafeEval'] = {
		version: /*! REPLACE_BY(TO_SOURCE(VERSION(MANIFEST("name")))) */ null /*! END_REPLACE()*/,

		create: function create(root, /*optional*/_options, _shared) {
			//===================================
			// Get namespaces
			//===================================

			const doodad = root.Doodad,
				types = doodad.Types,
				tools = doodad.Tools,
				locale = tools.Locale,
				unicode = tools.Unicode,
				safeEval = tools.SafeEval;

			//===================================
			// Internal
			//===================================

			const __Internal__ = {
				deniedTokensAlways: ['constructor', '__proto__'],
				deniedTokensGlobal: ['eval', 'arguments', 'this', 'var', 'const', 'let'],
				constants: ['true', 'false', 'null', 'undefined', 'NaN', 'Infinity'],
				allDigitsRegEx: /^([0-9]+[.]?[0-9]*([e][-+]?[0-9]+)?|0[xX]([0-9a-fA-F])+|0[bB]([01])+|0[oO]([0-7])+)$/,
				newLineChars: ['\n', '\r', '\u2028', '\u2029'],
			};


			//===================================
			// Native functions
			//===================================

			//tools.complete(_shared.Natives, {
			//});

			__Internal__.validateExpression = function(expression, locals, globals, options) {
				// TODO: Escape sequences
				// TODO: String templates

				const preventAssignment = types.get(options, 'preventAssignment', true),
					allowFunctions = types.get(options, 'allowFunctions', false),  // EXPERIMENTAL
					allowNew = types.get(options, 'allowNew', false),  // EXPERIMENTAL
					allowRegExp = types.get(options, 'allowRegExp', false);  // EXPERIMENTAL
				if (root.DD_ASSERT) {
					root.DD_ASSERT(types.isString(expression), "Invalid expression.");
					root.DD_ASSERT(types.isNothing(locals) || types.isJsObject(locals), "Invalid locals.");
					root.DD_ASSERT(types.isNothing(globals) || types.isArray(globals), "Invalid globals.");
				};

				let prevChr = '',
					isString = false,
					isEscape = false,
					stringChar = null,
					isAssignment = false,
					isComment = false,
					isCommentBlock = false,
					isRegExp = false,
					isRegExpFlags = false,
					isGlobal = true,
					isDot = false,
					lastTokens = [],
					isFunction = false,
					isFunctionArgs = false,
					functionArgs = null,
					level = {name: ''},
					prevLevel = level,
					isShift = false,
					noPrevChr = false;

				const levels = [level];

				//const maxSafeInteger = types.getSafeIntegerBounds().max;

				const pushLevel = function(name) {
					level = {name};
					levels.push(level);
				};

				const popLevel = function(name) {
					prevLevel = level;
					level = levels.pop();
					if (level.name !== name) {
						throw new types.AccessDenied("Invalid expression.");
					};
				};

				const validateTokens = function validateTokens() {
					/* eslint no-cond-assign: "off" */
					let tokenName;
					while (tokenName = lastTokens.shift()) {
						let deniedToken = '';
						if (tools.indexOf(__Internal__.deniedTokensAlways, tokenName) >= 0) {
							// Invalid
							deniedToken = tokenName;
						} else if (isGlobal) {
							if (tools.indexOf(__Internal__.deniedTokensGlobal, tokenName) >= 0) {
								// Invalid
								deniedToken = tokenName;
							} else if (__Internal__.allDigitsRegEx.test(tokenName)) {
								// Valid
							} else if (allowNew && (tokenName === 'new')) {
								// Valid
							} else if (tools.indexOf(__Internal__.constants, tokenName) >= 0) {
								// Valid
							} else if (types.has(locals, tokenName)) {
								// Valid
							} else if (tools.indexOf(globals, tokenName) >= 0) {
								// Valid
							} else if (isFunction && (tools.indexOf(functionArgs, tokenName) >= 0)) {
								// Valid
							} else {
								deniedToken = tokenName;
							};
						};
						if (deniedToken) {
							throw new types.AccessDenied("Access to '~0~' is denied.", [deniedToken]);
						};
					};
					if (tokenName) {
						isGlobal = false;
					};
				};

				const curLocale = locale.getCurrent();

				let chr = unicode.nextChar(expression);

				loopChars: while (chr) {
					if (isString) {
						if (isEscape) {
							// Escaped char
							isEscape = false;
						} else if (chr.chr === '\\') {
							// String escape
							isEscape = true;
						} else if (chr.chr === stringChar) {
							// String closure
							isString = false;
							noPrevChr = true;
							isGlobal = false;
						};
					} else if (isRegExpFlags) {
						if ((chr.codePoint < 97) || (chr.codePoint > 122)) { // 'a', 'z'
							isRegExpFlags = false;
						};
					} else if (isRegExp) {
						// RegExp
						if (isEscape) {
							// Escaped char
							isEscape = false;
						} else if (chr.chr === '\\') {
							// Char escape
							isEscape = true;
						} else if (chr.chr === '/') {
							// RegExp closure
							isRegExp = false;
							isRegExpFlags = true;
							noPrevChr = true;
						};
					} else if (isComment) {
						if (tools.indexOf(__Internal__.newLineChars, chr.chr) >= 0) { // New line
							isComment = false;
							validateTokens();
						};
					} else if (isCommentBlock) {
						// Comment block
						if ((prevChr === '*') && (chr.chr === '/')) {
							// End comment block
							isCommentBlock = false;
							noPrevChr = true;
						};
					} else if (isAssignment && (chr.chr === '>')) {
						// Arrow function
						if (!allowFunctions) {
							throw new types.AccessDenied("Functions are denied.");
						};
						if (isFunction) {
							// For simplicity
							throw new types.AccessDenied("Function in function is denied.");
						};
						isAssignment = false;
						isFunction = true;
						if (prevLevel.name === '(') {
							functionArgs = lastTokens;
							lastTokens = [];
						} else if (lastTokens.length > 0) {
							functionArgs = [lastTokens.pop()];
						} else {
							functionArgs = [];
						};
					} else if ((isAssignment && (chr.chr !== '=')) || (isShift && (chr.chr === '='))) {
						// Assignment
						if (preventAssignment) {
							throw new types.AccessDenied("Assignment is not allowed.");
						};
						validateTokens();
					} else if ((prevChr === '/') && (chr.chr === '/')) {
						// Begin statement comment
						isComment = true;
						noPrevChr = true;
					} else if ((prevChr === '/') && (chr.chr === '*')) {
						// Begin comment block
						isCommentBlock = true;
						noPrevChr = true;
					} else if (isGlobal && (lastTokens.length <= 0) && (prevChr === '/') && (chr.chr !== '/')) {
						// Begin RegExp
						if (!allowRegExp) {
							// For simplicity
							throw new types.AccessDenied("Regular expressions are not allowed.");
						};
						isRegExp = true;
						if (chr.chr === '\\') {
							isEscape = true;
						};
						noPrevChr = true;
					} else if ((chr.chr === ';') || (tools.indexOf(__Internal__.newLineChars, chr.chr) >= 0)) { // End of statement
						validateTokens();
						let hasSemi = false;
						do {
							if (chr.chr === ';') {
								hasSemi = true;
							};
							chr = chr.nextChar();
						} while (chr && ((chr.chr === ';') || (tools.indexOf(__Internal__.newLineChars, chr.chr) >= 0)));
						if (!isDot || hasSemi) {
							isGlobal = true;
						};
						if (hasSemi) {
							prevChr = '';
						};
						continue loopChars;
					} else if (unicode.isSpace(chr.chr, curLocale)) { // Space
						do {
							chr = chr.nextChar();
						} while (chr && unicode.isSpace(chr.chr, curLocale));
						continue loopChars;
					} else if ((chr.chr === '$') || (chr.chr === '_') || unicode.isAlnum(chr.chr, curLocale)) {
						let tokenName = '';
						do {
							// Token
							tokenName += chr.chr;
							chr = chr.nextChar();
						} while (chr && ((chr.chr === '$') || (chr.chr === '_') || unicode.isAlnum(chr.chr, curLocale)));
						if (tokenName === 'function') {
							if (!allowFunctions) {
								throw new types.AccessDenied("Functions are denied.");
							};
							if (isFunction || isFunctionArgs) {
								// For simplicity
								throw new types.AccessDenied("Function in function is denied.");
							};
							isFunctionArgs = true;
						} else if (isFunction && (tokenName === 'return')) {
							// Ignore
						} else {
							lastTokens.push(tokenName);
						};
						prevChr = '';
						continue loopChars;
					} else if (['][', '+[', '-[', '![', '~[', '|[', '&[', '*[', '/['].indexOf(prevChr + chr.chr) >= 0) {
						// JsFuck or whatever non-sense
						throw new types.AccessDenied("Invalid property accessor.");
					} else if (chr.chr === '\\') {
						// For simplicity
						throw new types.AccessDenied("Escape sequences not allowed.");
					} else if (chr.codePoint > 0x7F) {
						// For simplicity
						throw new types.AccessDenied("Invalid character.");
					} else if ((level.name === '{') && (chr.chr === ':')) {
						lastTokens = [];
					} else if ((chr.chr === '"') || (chr.chr === "'")) {
						// Begin String
						validateTokens();
						isString = true;
						stringChar = chr.chr;
					} else if (chr.chr === '`') {
						validateTokens();
						// For simplicity.
						throw new types.AccessDenied("Template strings are denied.");
					} else if (chr.chr === ']') {
						popLevel('[');
						isGlobal = false;
					} else if (chr.chr === '[') {
						if (!isGlobal || (lastTokens.length > 0)) {
							throw new types.AccessDenied("Invalid property accessor.");
						};
						pushLevel('[');
						validateTokens();
					} else if (chr.chr === '{') {
						pushLevel('{');
					} else if (chr.chr === '}') {
						popLevel('{');
						isGlobal = false;
					} else if (chr.chr === '(') {
						validateTokens();
						pushLevel('(');
					} else if (chr.chr === ')') {
						popLevel('(');
						if (isFunctionArgs) {
							isFunction = true;
							functionArgs = lastTokens;
							lastTokens = [];
						};
					} else if (((chr.chr === '+') || (chr.chr === '-')) && (prevChr === chr.chr)) {
						validateTokens();
						// Increment
						if (preventAssignment) {
							throw new types.AccessDenied("Increment operators are not allowed.");
						};
						noPrevChr = true;
					} else if (((chr.chr === '<') || (chr.chr === '>')) && (prevChr === chr.chr)) {
						// Potential shift assignment
						isShift = true;
					} else if ((chr.chr === '=') && ((prevChr !== '>') && (prevChr !== '<') && (prevChr !== '=') && (prevChr !== '!'))) {
						// Potential assignment
						isAssignment = true;
					} else {
						if (chr.chr !== ',') {
							validateTokens();
						};
						isAssignment = false;
						isShift = false;
						if (chr.chr === '.') {
							isDot = true;
							isGlobal = false;
						} else {
							isDot = false;
							isGlobal = true;
						};
					};
					if (noPrevChr) {
						noPrevChr = false;
						prevChr = '';
					} else {
						prevChr = chr.chr;
					};
					chr = chr.nextChar();
				};

				validateTokens();
			};

			__Internal__.createEvalFn = function createEvalFn(locals, globals) {
				root.DD_ASSERT && root.DD_ASSERT(types.isNothing(locals) || types.isObject(locals), "Invalid locals object.");

				if (types.isNothing(globals)) {
					globals = [];
				} else {
					root.DD_ASSERT && root.DD_ASSERT(types.isArray(globals), "Invalid global names array.");
				};

				globals = tools.reduce(globals, function(locals, name) {
					if (name in global) {
						locals[name] = global[name];
					};
					return locals;
				}, {});

				locals = tools.nullObject(globals, locals);

				if (types.isEmpty(locals)) {
					return tools.eval;
				} else {
					return tools.createEval(types.keys(locals)).apply(null, types.values(locals));
				};
			};

			safeEval.ADD('eval', root.DD_DOC(
				//! REPLACE_IF(IS_UNSET('debug'), "null")
					{
						author: "Claude Petit",
						revision: 8,
						params: {
							expression: {
								type: 'string',
								optional: false,
								description: "An expression",
							},
							locals: {
								type: 'object',
								optional: true,
								description: "Local variables.",
							},
							globals: {
								type: 'arrayof(string)',
								optional: true,
								description: "List of allowed global variables.",
							},
							options: {
								type: 'object',
								optional: true,
								description: "Options.",
								/* TODO: Document them somewhere
								preventAssignment: {
									type: 'boolean',
									optional: true,
									description: "If 'true', will prevent assignment operators. Otherwise, it will allow them. Default is 'true'.",
								},
								allowFunctions: {
									type: 'boolean',
									optional: true,
									description: "IMPORTANT: Experimental, please leave it to 'false' (the default), or report bugs... If 'true', will allow function declarations. Otherwise, it will prevent them. Default is 'false'.",
								},
								allowNew: {
									type: 'boolean',
									optional: true,
									description: "IMPORTANT: Experimental, please leave it to 'false' (the default), or report bugs... If 'true', will allow the 'new' operator. Otherwise, it will prevent it. Default is 'false'.",
								},
								allowRegExp: {
									type: 'boolean',
									optional: true,
									description: "IMPORTANT: Experimental, please leave it to 'false' (the default), or report bugs... If 'true', will allow syntactic regular expressions. Otherwise, it will prevent them. Default is 'false'.",
								},
							*/
							},
						},
						returns: 'any',
						description: "Evaluates a Javascript expression with some restrictions.",
					}
				//! END_REPLACE()
				, function safeEval(expression, /*optional*/locals, /*optional*/globals, /*optional*/options) {
					// NOTE: Caller functions should use "safeEvalCached" for performance issues (only when expressions are controlled and limited)

					// Restrict access to locals (locals={...}) and globals (globals=[...]).
					// Prevents access to my local variables and arguments.
					// Optionally prevents assignments and increments

					__Internal__.validateExpression(expression, locals, globals, options);

					const evalFn = __Internal__.createEvalFn(locals, globals);

					return evalFn(expression);
				}));

			__Internal__.symbolCachedSafeEvalFn = types.getSymbol('__SAFE_EVAL_FN__');
			__Internal__.symbolCachedSafeEvalOptions = types.getSymbol('__SAFE_EVAL_OPTIONS__');

			safeEval.ADD('evalCached', root.DD_DOC(
				//! REPLACE_IF(IS_UNSET('debug'), "null")
					{
						author: "Claude Petit",
						revision: 4,
						params: {
							evalCacheObject: {
								type: 'object',
								optional: false,
								description: "An object to use as cache",
							},
							expression: {
								type: 'string',
								optional: false,
								description: "An expression",
							},
							options: {
								type: 'object',
								optional: true,
								description: "Options.",
							},
						},
						returns: 'any',
						description: "Evaluates a Javascript expression with some restrictions, with cache.",
					}
				//! END_REPLACE()
				, function safeEvalCached(evalCacheObject, expression, /*optional*/options) {
					// WARNING: If expressions are not controlled and limited, don't use this function because of memory overhead
					// WARNING: Will always uses the same options for the same cache object

					if (root.DD_ASSERT) {
						root.DD_ASSERT(types.isJsObject(evalCacheObject), "Invalid cache object.");
						root.DD_ASSERT(types.isString(expression), "Invalid expression.");
					};

					let locals = null,
						globals = null;

					let evalFn = evalCacheObject[__Internal__.symbolCachedSafeEvalFn];

					if (evalFn) {
						options = evalCacheObject[__Internal__.symbolCachedSafeEvalOptions];
						locals = types.get(options, 'locals');
						globals = types.get(options, 'globals');
					} else {
						locals = types.freezeObject(types.clone(types.get(options, 'locals')));
						globals = types.freezeObject(types.clone(types.get(options, 'globals')));
						options = types.freezeObject(tools.extend({}, options, {locals, globals}));
						evalFn = __Internal__.createEvalFn(locals, globals);
						types.setAttribute(evalCacheObject, __Internal__.symbolCachedSafeEvalFn, evalFn, {});
						types.setAttribute(evalCacheObject, __Internal__.symbolCachedSafeEvalOptions, options, {});
					};

					expression = tools.trim(expression);

					if ((expression !== __Internal__.symbolCachedSafeEvalFn) && (expression !== __Internal__.symbolCachedSafeEvalOptions)) {
						if ((expression === '__proto__') || (expression === 'constructor')) {
							__Internal__.validateExpression(expression, locals, globals, options);
							return evalFn(expression);
						} else if (types.has(evalCacheObject, expression)) {
							return evalCacheObject[expression];
						} else {
							__Internal__.validateExpression(expression, locals, globals, options);
							const result = evalFn(expression);
							evalCacheObject[expression] = result;
							return result;
						};
					} else {
						__Internal__.validateExpression(expression, locals, globals, options);
					};

					return undefined;
				}));


			//===================================
			// Init
			//===================================
			//return function init(/*optional*/options) {
			//};
		},
	};
	return modules;
};

//! END_MODULE()
