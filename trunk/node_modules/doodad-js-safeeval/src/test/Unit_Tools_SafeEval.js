//! REPLACE_BY("// Copyright 2016 Claude Petit, licensed under Apache License version 2.0\n", true)
// dOOdad - Object-oriented programming framework
// File: Unit_Tools_SafeEval.js - Unit testing module file
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

(function() {
	var global = this;

	var exports = {};
	
	//! BEGIN_REMOVE()
	if ((typeof process === 'object') && (typeof module === 'object')) {
	//! END_REMOVE()
		//! IF_DEF("serverSide")
			module.exports = exports;
		//! END_IF()
	//! BEGIN_REMOVE()
	};
	//! END_REMOVE()
	
	exports.add = function add(DD_MODULES) {
		DD_MODULES = (DD_MODULES || {});
		DD_MODULES['Doodad.Test.Tools.SafeEval'] = {
			type: 'TestModule',
			version: '0d',
			dependencies: ['Doodad.Test.Tools'],

			// Unit
			priority: null,
			
			proto: {
				run: function run(entry, /*optional*/options) {
					"use strict";

					var root = entry.root,
						doodad = root.Doodad,
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
					
					
					global.a = 1;
					global.b = 2;

					var stream = test.getOutput(),
						html = (stream instanceof io.HtmlOutputStream);
					
					var command = test.prepareCommand(safeEval.eval, "Doodad.Tools.SafeEval.eval");
					
					if (html) {
						stream.openElement({tag: 'div', attrs: 'class="allowed"'});
					};
					command.run(1, {},				/**/ "1");
					command.run(0.1, {},			/**/ "0.1");
					command.run(0.1, {},			/**/ ".1");
					command.run(1, {},				/**/ "+1");
					command.run(-1, {},			/**/ "-1");
					command.run(-1, {},			/**/ "+-1");
					command.run(-1, {},			/**/ "-+1");
					command.run('hello', {},		/**/ "'hello'");
					command.run("hello 'sir'", {},	/**/ "'hello \\'sir\\''");
					command.run('a=1', {},			/**/ "'a=1'");
					command.run("a=1,'b=2'", {},	/**/ "'a=1,\\'b=2\\''");
					command.run(1, {},				/**/ "a", null, ['a']);
					command.run(1, {},				/**/ "(a)", null, ['a']);
					command.run(true, {},			/**/ "a==1", null, ['a']);
					command.run(true, {},			/**/ "a == 1", null, ['a']);
					command.run(true, {},			/**/ "a== 1", null, ['a']);
					command.run(true, {},			/**/ "a ==1", null, ['a']);
					command.run(true, {},			/**/ "a  ==1", null, ['a']);
					command.run(true, {},			/**/ "a  ==  1", null, ['a']);
					command.run(false, {},			/**/ "a!=1", null, ['a']);
					command.run(true, {},			/**/ "a===1", null, ['a']);
					command.run(false, {},			/**/ "a!==1", null, ['a']);
					command.run(2, {},				/**/ "a+1", null, ['a']);
					command.run(2, {},				/**/ "1+1");
					command.run(2, {},				/**/ "1 + 1");
					command.run(2, {},				/**/ "1 +1");
					command.run(2, {},				/**/ "1+ 1");
					command.run(2, {},				/**/ "1+(1)");
					command.run(2, {},				/**/ "(1+1)");
					command.run(true, {},			/**/ "(1+1)==2");
					command.run(true, {},			/**/ "(1+1)===2");
					command.run(true, {},			/**/ "true");  // true is a constant, not a globsl
					command.run(false, {},			/**/ "!true");
					command.run(true, {},			/**/ "true && !false");
					command.run('hello;', {},		/**/ "'hello;'");
					command.run('var', {},			/**/ "'var'");
					command.run(Date, {mode: 'is'}, /**/ "new Date", null, ['new', 'Date']);
					command.run(Date, {mode: 'is'}, /**/ "new Date()", null, ['new', 'Date']);
					command.run(1, {},				/**/ "value", {value: 1});
					command.run(16, {},			/**/ "0x10");
					command.run(17, {},			/**/ "0x10+1");
					command.run(17, {},			/**/ "0x10 + 1");
					command.run(2, {note: "May fail under MS Internet Explorer, Safari and Nodejs because binary number constants are not supported."},				/**/ "0b10");  // Firefox Nightly
					command.run(8, {note: "May fail under MS Internet Explorer, Safari and Nodejs because octal number constants are not supported."},				/**/ "0o10");  // Firefox Nightly

					command.run(1, {},				/**/ "/*eval*/a", null, ['a']);
					command.run(1, {},				/**/ "/*a=1*/a", null, ['a']);
					command.run(1, {},				/**/ "a/*a=1*/", null, ['a']);
					command.run(1, {},				/**/ "a//a=1", null, ['a']);
					
					if (html) {
						stream.closeElement();
						stream.openElement({tag: 'div', attrs: 'class="denied"'});
					};
					command.run(types.AccessDenied, {mode: 'isinstance'}, /**/ "a=1", null, ['a']);   // assignment denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "a='hello'", null, ['a']);   // assignment denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "a=+1", null, ['a']);   // assignment denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "a=-1", null, ['a']);   // assignment denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "a=b", null, ['a','b']);   // assignment denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "a=1;", null, ['a']);   // assignment denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "(a)=1", null, ['a']); // assignment denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "a = 1", null, ['a']); // assignment denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "a= 1", null, ['a']);  // assignment denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "a =1", null, ['a']);  // assignment denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "a=  1", null, ['a']); // assignment denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "a  =1", null, ['a']); // assignment denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "a+=1", null, ['a']);  // assignment denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "a+='hello'", null, ['a']);   // assignment denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "a++", null, ['a']);   // incrementation denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "a--", null, ['a']);   // incrementation denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "a ++", null, ['a']);   // incrementation denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "++a", null, ['a']);   // incrementation denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "--a", null, ['a']);   // incrementation denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "++ a", null, ['a']);   // incrementation denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "this");  // local variables of safeEval are denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "expression");  // local variables of safeEval are denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "eval('1')");   // eval is denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "window"); // window is denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "a"); // 'a' is denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "document"); // 'document' is denied

					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "`Hi !`");  // Templates are denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "`Hi ${'you'} !`");  // Templates are denied
						
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "/*comment*/eval");  // eval is denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "eval/*comment*/");  // eval is denied
					command.run(types.AccessDenied, {mode: 'isinstance'},  /**/ "eval//comment");  // eval is denied
					
					if (html) {
						stream.closeElement();
					};
					
					command.end();
					
				},
			},
		};
		
		return DD_MODULES;
	};
	
	//! BEGIN_REMOVE()
	if ((typeof process !== 'object') || (typeof module !== 'object')) {
	//! END_REMOVE()
		//! IF_UNDEF("serverSide")
			// <PRB> export/import are not yet supported in browsers
			global.DD_MODULES = exports.add(global.DD_MODULES);
		//! END_IF()
	//! BEGIN_REMOVE()
	};
	//! END_REMOVE()
}).call(
	//! BEGIN_REMOVE()
	(typeof window !== 'undefined') ? window : ((typeof global !== 'undefined') ? global : this)
	//! END_REMOVE()
	//! IF_DEF("serverSide")
	//! 	INJECT("global")
	//! ELSE()
	//! 	INJECT("window")
	//! END_IF()
);