//! BEGIN_MODULE()

//! REPLACE_BY("// Copyright 2015-2018 Claude Petit, licensed under Apache License version 2.0\n", true)
// doodad-js - Object-oriented programming framework
// File: Unit_Tools_SafeEval.js - Unit testing module file
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

exports.add = function add(modules) {
	modules = (modules || {});
	modules['Doodad.Test.Tools.SafeEval'] = {
		version: /*! REPLACE_BY(TO_SOURCE(VERSION(MANIFEST("name")))) */ null /*! END_REPLACE()*/,
		type: 'TestModule',
		dependencies: ['Doodad.Test.Tools'],

		// Unit
		priority: null,
			
		proto: {
			run: function run(root, /*optional*/options) {
				"use strict";

				const doodad = root.Doodad,
					types = doodad.Types,
					tools = doodad.Tools,
					namespaces = doodad.Namespaces,
					test = doodad.Test,
					unit = test.Tools.SafeEval,
					io = doodad.IO,
					safeEval = tools.SafeEval;

					
				if (!options) {
					options = {};
				};
					
				
				test.runCommand(safeEval.eval, "Doodad.Tools.SafeEval.eval", function(command, options) {
					const hasA = types.has(global, 'a'),
						a = global.a,
						hasB = types.has(global, 'b'),
						b = global.b;

					global.a = 1;
					global.b = 2;

					const stream = test.getOutput(),
						html = types._instanceof(stream, io.HtmlOutputStream);
						
					if (html) {
						command.chain(function() {
							stream.openElement({tag: 'div', attrs: {"class": 'allowed'}});
						});
					};

					command.runStep(1, {},				/**/ "1");
					command.runStep(0.1, {},			/**/ "0.1");
					command.runStep(0.1, {},			/**/ ".1");
					command.runStep(1, {},				/**/ "+1");
					command.runStep(-1, {},			    /**/ "-1");
					command.runStep(-1, {},			    /**/ "+-1");
					command.runStep(-1, {},			    /**/ "-+1");
					command.runStep('hello', {},		/**/ "'hello'");
					command.runStep("hello 'sir'", {},	/**/ "'hello \\'sir\\''");
					command.runStep('a=1', {},			/**/ "'a=1'");
					command.runStep("a=1,'b=2'", {},	/**/ "'a=1,\\'b=2\\''");
					command.runStep(1, {},				/**/ "a", null, ['a']);
					command.runStep(1, {},				/**/ "(a)", null, ['a']);
					command.runStep(true, {},			/**/ "a==1", null, ['a']);
					command.runStep(true, {},			/**/ "a == 1", null, ['a']);
					command.runStep(true, {},			/**/ "a== 1", null, ['a']);
					command.runStep(true, {},			/**/ "a ==1", null, ['a']);
					command.runStep(true, {},			/**/ "a  ==1", null, ['a']);
					command.runStep(true, {},			/**/ "a  ==  1", null, ['a']);
					command.runStep(false, {},			/**/ "a!=1", null, ['a']);
					command.runStep(true, {},			/**/ "a===1", null, ['a']);
					command.runStep(false, {},			/**/ "a!==1", null, ['a']);
					command.runStep(2, {},				/**/ "a+1", null, ['a']);
					command.runStep(2, {},				/**/ "1+1");
					command.runStep(2, {},				/**/ "1 + 1");
					command.runStep(2, {},				/**/ "1 +1");
					command.runStep(2, {},				/**/ "1+ 1");
					command.runStep(2, {},				/**/ "1+(1)");
					command.runStep(2, {},				/**/ "(1+1)");
					command.runStep(true, {},			/**/ "(1+1)==2");
					command.runStep(true, {},			/**/ "(1+1)===2");
					command.runStep(true, {},			/**/ "true");  // true is a constant, not a globsl
					command.runStep(false, {},			/**/ "!true");
					command.runStep(true, {},			/**/ "true && !false");
					command.runStep('hello;', {},		/**/ "'hello;'");
					command.runStep('var', {},			/**/ "'var'");
					command.runStep(Date, {mode: 'is'}, /**/ "new Date", null, ['Date'], {allowNew: true});
					command.runStep(Date, {mode: 'is'}, /**/ "new Date()", null, ['Date'], {allowNew: true});
					command.runStep(1, {},				/**/ "value", {value: 1});
					command.runStep(16, {},			/**/ "0x10");
					command.runStep(17, {},			/**/ "0x10+1");
					command.runStep(17, {},			/**/ "0x10 + 1");
					command.runStep(2, {note: "May fail under MS Internet Explorer, Safari and Nodejs because binary number constants are not supported."},				/**/ "0b10");  // Firefox Nightly
					command.runStep(8, {note: "May fail under MS Internet Explorer, Safari and Nodejs because octal number constants are not supported."},				/**/ "0o10");  // Firefox Nightly

					command.runStep(1, {},				/**/ "/*eval*/a", null, ['a']);
					command.runStep(1, {},				/**/ "/*a=1*/a", null, ['a']);
					command.runStep(1, {},				/**/ "a/*a=1*/", null, ['a']);
					command.runStep(1, {},				/**/ "a//a=1", null, ['a']);

					command.runStep(global.RegExp, {mode: 'isinstance'}, /**/ "/hello/", null, null, {allowRegExp: true});
					command.runStep(global.RegExp, {mode: 'isinstance'}, /**/ "/hello/g", null, null, {allowRegExp: true});
					command.runStep(global.RegExp, {mode: 'isinstance'}, /**/ "/\\./g", null, null, {allowRegExp: true});
					command.runStep(global.RegExp, {mode: 'isinstance'}, /**/ "/\\//g", null, null, {allowRegExp: true});
					command.runStep(NaN, {},			/**/ "/hello/*/*hello*/1", null, null, {allowRegExp: true});
					command.runStep(NaN, {},			/**/ "/\\//*/*hello*/1", null, null, {allowRegExp: true});
						
					if (html) {
						command.chain(function() {
							stream.closeElement();
							stream.openElement({tag: 'div', attrs: {"class": 'denied'}});
						});
					};

					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a=1", null, ['a']);   // assignment denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a='hello'", null, ['a']);   // assignment denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a=+1", null, ['a']);   // assignment denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a=-1", null, ['a']);   // assignment denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a=b", null, ['a','b']);   // assignment denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a=1;", null, ['a']);   // assignment denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "(a)=1", null, ['a']); // assignment denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a = 1", null, ['a']); // assignment denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a= 1", null, ['a']);  // assignment denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a =1", null, ['a']);  // assignment denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a=  1", null, ['a']); // assignment denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a  =1", null, ['a']); // assignment denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a+=1", null, ['a']);  // assignment denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a+='hello'", null, ['a']);   // assignment denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a++", null, ['a']);   // incrementation denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a--", null, ['a']);   // incrementation denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a ++", null, ['a']);   // incrementation denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "++a", null, ['a']);   // incrementation denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "--a", null, ['a']);   // incrementation denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "++ a", null, ['a']);   // incrementation denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "this");  // local variables of safeEval are denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "expression");  // local variables of safeEval are denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "eval('1')");   // eval is denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "window"); // window is denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a"); // 'a' is denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "document"); // 'document' is denied

					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "`Hi !`");  // Templates are denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "`Hi ${'you'} !`");  // Templates are denied
							
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "/*comment*/eval");  // eval is denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "eval/*comment*/");  // eval is denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "eval//comment");  // eval is denied

					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "/hello/");  // RegExp are denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "/hello/*/*hello*/a", null, null, {allowRegExp: true}); // Access to "a" denied
					command.runStep(types.AccessDenied, {mode: 'isinstance'},  /**/ "a=/hello/", null, ['a'], {allowRegExp: true}); // assignment denied
						
					if (html) {
						command.chain(function() {
							stream.closeElement();
						});
					};

					command.chain(function() {
						if (hasA) {
							global.a = a;
						} else {
							delete global.a;
						};
						
						if (hasB) {
							global.b = b;
						} else {
							delete global.b;
						};
					});
				});
				
			},
		},
	};
	return modules;
};

//! END_MODULE()