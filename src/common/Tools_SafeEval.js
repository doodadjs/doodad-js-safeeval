//! REPLACE_BY("// Copyright 2016 Claude Petit, licensed under Apache License version 2.0\n")
// dOOdad - Object-oriented programming framework
// File: Tools_SafeEval.js - SafeEval tools
// Project home: https://sourceforge.net/projects/doodad-js/
// Trunk: svn checkout svn://svn.code.sf.net/p/doodad-js/code/trunk doodad-js-code
// Author: Claude Petit, Quebec city
// Contact: doodadjs [at] gmail.com
// Note: I'm still in alpha-beta stage, so expect to find some bugs or incomplete parts !
// License: Apache V2
//
//	Copyright 2016 Claude Petit
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

(function(initSafeEval) {
	var global = this;
	
	var exports = {};
	if (typeof process === 'object') {
		module.exports = exports;
	};
	
	exports.add = function add(DD_MODULES) {
		DD_MODULES = (DD_MODULES || {});
		DD_MODULES['Doodad.Tools.SafeEval'] = {
			type: null,
			version: '0.2.0a',
			namespaces: null,
			dependencies: [
				{
					name: 'Doodad.Types', 
					version: '2.2.0',
				},
				{
					name: 'Doodad.Tools', 
					version: '2.2.0',
				},
				{
					name: 'Doodad.Tools.Locale',
					version: '2.0.0',
				}, 
				{
					name: 'Doodad.Tools.Unicode',
					version: '0.3.0',
				}, 
			],
			exports: exports,
			
			create: function create(root, /*optional*/_options) {
				"use strict";

				//===================================
				// Get namespaces
				//===================================
					
				var doodad = root.Doodad,
					types = doodad.Types,
					tools = doodad.Tools,
					locale = tools.Locale,
					unicode = tools.Unicode,
					safeEval = tools.SafeEval;
					
				//===================================
				// Internal
				//===================================
					
				var __Internal__ = {
				};
				
				
				//===================================
				// Options
				//===================================
					
				//__Internal__.oldSetOptions = safeEval.setOptions;
				//safeEval.setOptions = function setOptions(/*paramarray*/) {
				//};
				
				//safeEval.setOptions({
				//}, _options);
				

				//===================================
				// Native functions
				//===================================
					
				//var __Natives__ = {
				//};
				
				
				__Internal__.validateExpression = function(expression, locals, globals, /*optional*/preventAssignment) {
					// TODO: Escape sequences
					// TODO: String templates
					
					var prevChr = '',
						isString = false,
						isEscape = false,
						stringChar = null,
						isAssignment = false,
						isComment = false,
						isCommentBlock = false,
						escapeSeq = '',
						tokenName = '',
						isGlobal = true,
						isDot = false;
						
					function validateToken() {
						if (tokenName) {
							if (isGlobal) {
								if (tools.indexOf(safeEval.deniedTokens, tokenName) >= 0) {
									throw new types.AccessDenied("Access to '~0~' is denied.", [tokenName]);
								} else if (safeEval.allDigitsRegEx.test(tokenName)) {
									// Valid
								} else if (tools.indexOf(safeEval.constants, tokenName) >= 0) {
									// Valid
								} else if (types.hasKey(locals, tokenName)) {
									// Valid
								} else if (tools.indexOf(globals, tokenName) >= 0) {
									// Valid
								} else {
									throw new types.AccessDenied("Access to '~0~' is denied.", [tokenName]);
								};
							};
							tokenName = '';
						};
					};

					var curLocale = locale.getCurrent();
					
					var chr = unicode.nextChar(expression);
					while (chr) {
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
							};
						} else if (isCommentBlock) {
							// Comment block
							if ((prevChr === '*') && (chr.chr === '/')) {
								// End comment block
								isCommentBlock = false;
							};
						} else if (isAssignment && (chr.chr !== '=')) {
							// Assignment
							if (preventAssignment) {
								throw new types.AccessDenied("Assignment is not allowed.");
							};
						} else if ((chr.chr === ';') || (chr.chr === '\n') || (chr.chr === '\r')) {
							if (isComment && (chr.chr === ';')) {
							} else {
								isComment = false;
								validateToken();
								if (!isDot || (chr.chr === ';')) {
									isGlobal = true;
								};
							};
						} else if (isComment) {
							// Statement comment
						} else if (chr.chr === '\\') {
							// For simplicity
							throw new types.AccessDenied("Escape sequences not allowed.");
						} else if ((chr.chr === '$') || (chr.chr === '_') || unicode.isAlnum(chr.chr, curLocale)) {
							// Token
							tokenName += chr.chr;
						} else if (chr.codePoint > 0x7F) {
							throw new types.AccessDenied("Invalid character.");
						} else if (chr.chr === ':') {
							tokenName = '';
						} else {
							validateToken();
							isDot = false;
							isGlobal = true;
							if (unicode.isSpace(chr.chr, curLocale)) {
								// Space
							} else if ((prevChr === '/') && (chr.chr === '/')) {
								// Begin statement comment
								isComment = true;
							} else if ((prevChr === '/') && (chr.chr === '*')) {
								// Begin comment block
								isCommentBlock = true;
							} else {
								// Operational chars
								isAssignment = false;
								
								if ((chr.chr === '"') || (chr.chr === "'")) {
									// Begin String
									isString = true;
									stringChar = chr.chr;
								} else if (chr.chr === '`') {
									// For simplicity.
									throw new types.AccessDenied("Template strings are denied.");
								} else if ((chr.chr === '+') || (chr.chr === '-')) {
									if (prevChr === chr.chr) {
										// Increment
										if (preventAssignment) {
											throw new types.AccessDenied("Increment operators are not allowed.");
										};
									};
								} else if ((chr.chr === '=') && ((prevChr !== '=') && (prevChr !== '!'))) {
									// Potential assignment
									isAssignment = true
								} else if (chr.chr === '.') {
									isDot = true;
									isGlobal = false;
								};
							};
						};
						prevChr = chr.chr;
						chr = chr.nextChar();
					};
					
					validateToken();
				};
				
				__Internal__.createEvalFn = function createEvalFn(locals, globals) {
						root.DD_ASSERT && root.DD_ASSERT(types.isNothing(locals) || types.isObject(locals), "Invalid locals object.");

						if (types.isNothing(globals)) {
							globals = [];
						} else {
							root.DD_ASSERT && root.DD_ASSERT(types.isArray(globals), "Invalid global names array.");
						};
						
						globals = tools.reduce(globals, function(locals, name) {
							locals[name] = ((name in global) ? global[name] : types.eval(name));
							return locals;
						}, {});
						
						locals = types.extend({}, globals, locals);
						
						if (types.isEmpty(locals)) {
							return types.evalStrict;
						} else {
							return safeEval.createStrictEval(types.keys(locals)).apply(null, types.values(locals));
						};
				};
				
				safeEval.eval = root.DD_DOC(
					//! REPLACE_BY("null")
					{
							author: "Claude Petit",
							revision: 5,
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
							},
							returns: 'any',
							description: "Evaluates a Javascript expression with some restrictions.",
					}
					//! END_REPLACE()
					, function safeEval(expression, /*optional*/locals, /*optional*/globals, /*optional*/preventAssignment) {
						// NOTE: Caller functions should use "safeEvalCached" for performance issues (only when expressions are controlled and limited)
						
						// Restrict access to locals (locals={...}) and globals (globals=[...]).
						// Prevents access to my local variables and arguments.
						// Optionally prevents assignments and increments
						
						if (types.isNothing(preventAssignment)) {
							preventAssignment = true;
						};
						
						if (preventAssignment) {
							__Internal__.validateExpression(expression, locals, globals, preventAssignment);
						};
						
						if (root.DD_ASSERT) {
							root.DD_ASSERT(types.isString(expression), "Invalid expression.");
						};
						
						var evalFn = __Internal__.createEvalFn(locals, globals);
						
						return evalFn(expression);
					});
				
				safeEval.evalCached = root.DD_DOC(
					//! REPLACE_BY("null")
					{
							author: "Claude Petit",
							revision: 2,
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
							},
							returns: 'any',
							description: "Evaluates a Javascript expression with some restrictions, with cache.",
					}
					//! END_REPLACE()
					, function safeEvalCached(evalCacheObject, expression, /*optional*/locals, /*optional*/globals, /*optional*/preventAssignment) {
						// WARNING: If expressions are not controlled and limited, don't use this function because of memory overhead
						// WARNING: Always use same options for the same cache object
						
						root.DD_ASSERT && root.DD_ASSERT(types.isObject(evalCacheObject), "Invalid cache object.");
						root.DD_ASSERT && root.DD_ASSERT(types.isString(expression), "Invalid expression.");
						
						expression = tools.trim(expression);

						if (types.isNothing(preventAssignment)) {
							preventAssignment = true;
						};
						
						if (preventAssignment) {
							__Internal__.validateExpression(expression, locals, globals, preventAssignment);
						};
						
						var evalFn = evalCacheObject.__SAFE_EVAL__;
						if (!evalFn) {
							evalCacheObject.__SAFE_EVAL__ = evalFn = __Internal__.createEvalFn(locals, globals);
						};
						
						if (expression === '__SAFE_EVAL__') {
							return evalFn(expression);
						} else if (types.hasKey(evalCacheObject, expression)) {
							return evalCacheObject[expression];
						} else {
							return evalCacheObject[expression] = evalFn(expression);
						};
					});
					
				initSafeEval.call(safeEval);


				//===================================
				// Init
				//===================================
				//return function init(/*optional*/options) {
				//};
			},
		};
		
		return DD_MODULES;
	};
	
	if (typeof process !== 'object') {
		// <PRB> export/import are not yet supported in browsers
		global.DD_MODULES = exports.add(global.DD_MODULES);
	};

}).call((typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this),

	/*initSafeEval*/
	(function() {
		// WARNING: Do not declare any variable and parameter inside this function. Also you must avoid the use of variables.

		this.deniedTokens       = ['eval', 'arguments', 'this'];
		this.constants          = ['true', 'false', 'null', 'undefined', 'NaN', 'Infinity'];
		this.allDigitsRegEx     = /^([0-9]+[.]?[0-9]*([e][-+]?[0-9]+)?|0[xX]([0-9a-fA-F])+|0[bB]([01])+|0[oO]([0-7])+)$/;
//IE8		this.oldEval            = (typeof eval("(function(){})") !== 'function'),
//IE8		this.createEval         = (this.oldEval ? 
		this.createEval         = 
//IE8									// Old engines
//IE8									function(/*locals*/) {
//IE8										var result;
//IE8										eval('result=' +
//IE8											"(function(" + Array.prototype.join.call(arguments[0], ',') + ") {" +
//IE8												"return function(/*expression*/) {" +
//IE8													"return eval(arguments[0]);" +
//IE8												"};" +
//IE8											"})"
//IE8										);
//IE8										return result;
//IE8									}
//IE8								:
									// Recent engines
									function(/*locals*/) {
										return eval(
											"(function(" + Array.prototype.join.call(arguments[0], ',') + ") {" +
												"return function(/*expression*/) {" +
													"return eval(arguments[0]);" +
												"};" +
											"})"
										);
									}
//IE8								);
//IE8		this.createStrictEval   = (this.oldEval ? 
		this.createStrictEval   = 
//IE8									// Old engines
//IE8									// NOTE: There is no strict mode with old engines
//IE8									this.createEval
//IE8								:
									// Recent engines
									function(/*locals*/) {
										return eval(
											"(function(" + Array.prototype.join.call(arguments[0], ',') + ") {" +
												"return function(/*expression*/) {" +
													'"use strict";' +
													"return eval(arguments[0]);" +
												"};" +
											"})"
										);
									}
//IE8								);
	})
);