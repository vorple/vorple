Vorple Core (for Z-Machine only) by Juhana Leinonen begins here.

"Core functionality of Vorple, including JavaScript evaluation, HTML elements and turn type marking."

Chapter JavaScript evaluation

Use authorial modesty.

Include (-

! eval() stream
! Currently only for Z-Machine
! by Dannii

Constant HDR_SPECREVISION  $32;

Global gg_mainwin = 0;
Array gg_event --> 4;

Array streambuf buffer 200;

[ Version;
	! Print the version number
	print HDR_SPECREVISION->0, ".", HDR_SPECREVISION->1;
];

[ Gestalt zid gid arg val;

	! Check a gestalt value
	#Ifdef TARGET_ZCODE;
		@"EXT:30S" zid arg -> val;
	#Ifnot; ! TARGET_GLULX
		@gestalt gid arg val;
	#Endif; ! TARGET_
	
	return val;
];


[ PrintBuffer addr i len;
	len = addr-->0;
	addr = addr + 2;
	for (i=0: i < len: i++) print (char) addr->i;
];

[ IsZ12 val ;
	#Ifdef TARGET_ZCODE;
		! Check we're in a 1.2 version interpreter
		val = HDR_SPECREVISION-->0;
		if (val < $0102) rfalse;
	#Endif; ! TARGET_ZCODE
	rtrue;
];

[ IsJS val ;
	! Checking for eval() stream support
	if ( IsZ12() == false || Gestalt($30, 0, 0) == 0 ) rfalse;
	
	rtrue;
];

[ IsHTML val ;
	! Checking for HTML stream support
	if ( IsZ12() == false || Gestalt($31, 0, 0) == 0 ) rfalse;
	
	rtrue;
];

Global vorpleSupported; 

-) after "Definitions.i6t".

To set Vorple support status:
	(- vorpleSupported = ( IsJs() && IsHTML() ); -);

First startup rule (this is the check whether Vorple is supported rule):
	set Vorple support status.

To decide whether Vorple/JavaScript is supported/available: (- (vorpleSupported) -).

To decide whether Vorple/JavaScript is not supported/available:
	if Vorple is supported, decide no;
	decide yes.

To decide whether Vorple/JavaScript is unsupported/unavailable:
	decide on whether or not Vorple is not supported.
	
To open JavaScript channel: (- @output_stream 5 streambuf; -).
To close JavaScript channel: (- @output_stream( -5 ); -).

To eval/evaluate code/-- (javascript code - text):
	if Vorple is supported:
		open JavaScript channel;
		say "[javascript code]";
		close JavaScript channel.
		
To queue code (javascript code - text):
	if Vorple is supported:
		eval "vorple.parser._evalqueue.push(function(){[javascript code]})".

To open HTML channel: (- @output_stream 6 streambuf; -).
To close HTML channel: (- @output_stream( -6 ); -).

To display an/-- element (element - text) called (classes - text):
	if Vorple is supported:
		open HTML channel;
		say "[element] [classes]";
		close HTML channel.

To display an/-- element (name - text):
	display element name called "".
   
To display a/-- block element/-- called (classes - text):
	display element "div" called classes.
	
To display an/-- inline element/-- called (classes - text):
	display element "span" called classes.
	
To decide which text is unique identifier:
	let id be "id";
	repeat with X running from 1 to 3:
		let rnd be a random number from 1000 to 9999;
		let id be "[id][rnd]";
	decide on id.
		
To display Vorple method (code - text) in a/an/the/-- element (elem - text) called (class - text):
	let id be unique identifier;
	display element elem called "[id] [class]";
	eval "$( '.[id]' ).html([code])".

To display Vorple method (code - text) in a/-- block element/-- called (class - text):
	display Vorple method code in element "div" called class.

To display Vorple method (code - text) in an/-- inline/-- element called (class - text):
	display Vorple method code in element "span" called class.
		
To display Vorple method (code - text):
	display Vorple method code in an inline element called "".
	
To place text/-- (content - text) inside/in a/an/the/-- element called (class - text):
	eval "$( '.[class]' ).html('[escaped content]')".
	
To display (content - text) inside/in a/an/the/-- element (elem - text) called (class - text):
	let id be unique identifier;
	display element elem called "[id] [class]";
	eval "$( '.[id]' ).html('[content]')";
	if Vorple is not supported:
		say content.
	
To display (content - text) inside/in a/an/the/-- inline/-- element called (class - text):
	display content inside an element "span" called class.

To display (content - text) inside/in a/an/the/-- block element called (class - text):
	display content inside an element "div" called class.
	
To display transient text/-- (content - text):
	display content inside element called "transient".


Chapter Fallback

To (vorple-phrase - phrase) or/with/but fall/-- back/fallback with/to (fallback - phrase):
	(- if( IsJS() ) {vorple-phrase} } else {fallback}; -).

To (vorple-phrase - phrase) without a/-- fallback:
	(- if( IsJS() ) {vorple-phrase} }; -)
	
	
Chapter Turn types

To mark the/-- current action (type - text):
	eval "vorple.parser.setTurnType('[type]')".

Before printing a parser error (this is the mark parser errors for Vorple rule):
	mark the current action "error";
	make no decision.

Include (-
[ Perform_Undo;
#ifdef PREVENT_UNDO; IMMEDIATELY_UNDO_RM('A'); new_line; return; #endif;
if (turns == 1) { IMMEDIATELY_UNDO_RM('B'); new_line; return; }
if (undo_flag == 0) { IMMEDIATELY_UNDO_RM('C'); new_line; return; }
if (undo_flag == 1) { IMMEDIATELY_UNDO_RM('D'); new_line; return; }
if( isJS() ) {
	@output_stream 5 streambuf;
	print "vorple.parser.setTurnType('undo')";
	@output_stream( -5 );
}
if (VM_Undo() == 0) { IMMEDIATELY_UNDO_RM('A'); new_line; }
];
-) instead of "Perform Undo" in "OutOfWorld.i6t".
	
To decide whether current action is out of world:
     (- meta -)
    
First specific action-processing rule (this is the mark out of world actions for Vorple rule):
	if current action is out of world:
		mark the current action "meta".


Chapter Escaping

To decide which text is escaped (string - text):
	decide on escaped string using "" as line breaks.

To decide which text is escaped (string - text) using (lb - text) as line breaks:
	let safe-string be text;
	repeat with X running from 1 to number of characters in string:
		let char be character number X in string;
		if char is "'" or char is "[apostrophe]" or char is "\":
			now safe-string is "[safe-string]\";
		if char is "[line break]":
			now safe-string is "[safe-string][lb]";
		otherwise:
			now safe-string is "[safe-string][char]";
	decide on safe-string.


Chapter Element positions

[This value is used by other extensions.]
An element position is a kind of value. Element positions are top left, top center, top right, left top, right top, left center, center left, screen center, right center, center right, left bottom, right bottom, bottom left, bottom center, bottom right, top banner, and bottom banner.

			
Chapter Credits

First after printing the banner text (this is the display Vorple credits rule):
	if Vorple is supported:
		say "Vorple version ";
		display inline element called "vorple-version";
		eval "$( '.vorple-version' ).html( vorple.core.version+'.'+vorple.core.release );";
		say paragraph break.
	
Vorple Core ends here.


---- DOCUMENTATION ----

The Vorple Core extension defines some of the basic structure that's needed for Vorple to communicate with the story file. 

Authors who are not familiar with JavaScript or who wish to just use the basic Vorple features can read only the first two chapters (Vorple setup and fallback phrases). The rest of this documentation handles more advanced usage.


Chapter: Vorple setup

Every Vorple story must include at least one Vorple extension and the custom web interpreter.

	*: Include Vorple Core by Juhana Leinonen.
	Release along with the "Vorple" interpreter.

All standard Vorple extensions already have the "Include Vorple Core" line, so it's not necessary to add it to the story project if at least one of the other extensions are used.

At the moment Vorple supports Z-machine only,


Chapter: Fallback phrases

Even though with Vorple we can accomplish many things that are just impossible to do with traditional interpreters, it's always a good idea to make the story playable text-only as well if at all possible. There are a lot of players to whom a web interpreter or Vorple's features aren't accessible, and it's the Right Thing To Do to not exclude people if it's possible to include them.

A story file can detect if it's being run on an interpreter that supports Vorple (or more specifically, on an interpreter that supports the Z-machine v. 1.2 draft). The same story file can therefore be run on both the Vorple web interpreter and other interpreters that have text-only features and display substitute content if necessary. We can test for Vorple's presence with "if Vorple is supported":

	Instead of going north:
		if Vorple is supported:
			play sound file "marching_band.mp3";
		otherwise:
			say "A marching band crossing the street blocks your way."

(The above example uses the Multimedia extension.)

The say phrase in the above example is called a "fallback" and it's displayed only on normal non-Vorple interpreters.

When the fallback consists of only one phrase (most commonly a say-phrase like in the example), we can use a shorthand "... or fall back with ...":

	Instead of going north:
		play sound file "marching_band.mp3" or fall back with say "A marching band crossing the street blocks your way."

Sometimes a phrase already includes a default fallback. For example, in the Notifications extension displaying a notification will automatically show the same text in a normal interpreter as plain text. We can override that behavior by using the technique described above:

	show notification "Click on your inventory items to examine them more closely" or fall back with say "Type EXAMINE followed by an inventory item's name to examine them more closely."

If we want to suppress the default fallback completely, we can use "...without a fallback" modifier. This is equivalent to "...or fall back with do nothing."

	show notification "Welcome to Vorple-enhanced [story title]!" without a fallback.

Most Vorple-specific phrases already do nothing if Vorple isn't supported and can be safely used without extra modifiers. Those that do have a default fallback are described in their documentation.


Chapter: Custom JavaScript and CSS

Vorple tries to load a JavaScript file called "vorple.custom.js" and a CSS file called "vorple.custom.css" if they exist. They can contain any custom JavaScript code or CSS rules needed by the project.

Place the files in the project's Resources directory (just like any other file that should be released with the story) and use the following phrases to include them:   

	*: Release along with a file of "Custom JavaScript" called "vorple.custom.js".
	Release along with a file of "Custom CSS" called "vorple.custom.css".
	
Note that the file names must be exactly like this. The interpreter won't try to load anything else.


Chapter: Embedding HTML elements

We can embed simple HTML elements into story text with some helper phrases.

	display element "article";
	display element "h1" called "title";
	display block element called "inventory transient";
	display inline element called "name";

The previous example generates this markup:

	<article></article>
	<h1 class="title"></h1>
	<div class="inventory transient"></div>
	<span class="name"></span>

The elements are always created empty and with a closing tag. Content can be added to them with these phrases:

	place "An exciting story" in the element called "title";
	display "Story so far:" in element "h2" called "subtitle";
	display "Anonymous Adventurer" in an element called "name";

The "place" phrase will use an existing element(s) with the given class, overwriting previous content. The "display" phrases create new elements. The default element, if not otherwise specified, is <span>.

The "transient" class is special: if an element has that class, it will fade out at the start of the next turn. Transient text can be created easily with:

	display transient text "All happiness fades."


Chapter: Evaluating JavaScript expressions

The story file breaks out of the Z-Machine sandbox by having the web browser evaluate JavaScript expressions. An "eval" phrase is provided to do just this:

	eval "alert('Hello World!')";

At the moment there are no safeguards against invalid or potentially malicious JavaScript. If an illegal JavaScript expression is evaluated, the browser will display an error message in the console and the interpreter will halt.

JavaScript expressions can also be postponed to be evaluated only after the turn has completed and all the text has been displayed to the reader.

	queue code "alert('Hello World!')";

The expressions are evaluated in the same order they were added to the queue and the queue is emptied right after evaluation.


Chapter: Escaping strings

When evaluating JavaScript expressions, quotation marks must often be exactly right. Inform formats quotes according to literary standards which doesn't necessarily work together with JavaScript. Consider the following example:

	To greet (name - text):
		eval "alert( 'Hello [name]!' )".

	When play begins:
		greet "William 'Bill' O'Malley".

The string being evaluated will be 
	
	alert( "Hello William "Bill" O'Malley!" )

which will cause an error because of unescaped double quotes. Changing the string delimiters to single quotes wouldn't help since there's an unescaped single quote as well inside the string.

To escape text we can preface it with "escaped":

	To greet (name - text):
		eval "alert( 'Hello [escaped name]!' )".

Now the string becomes:

	alert( "Hello William \"Bill\" O\'Malley!" )

By default newlines are removed. If we want to preserve them, or turn them into for example HTML line breaks:

	To greet (name - text):
		let safe name be escaped name using "\n" as line breaks;
		eval "alert( 'Hello [safe name]!' )".
		

Example: ** Scrambled Eggs - Hints that are initially shown obscured and revealed on request

The system works by wrapping scrambled hints in named elements. Their contents can then be later replaced with unscrambled text.

	
	*: Include Vorple Core by Juhana Leinonen.
	Release along with the "Vorple" interpreter.
	
	
	Chapter World
	
	Kitchen is a room. "Your task is to find a frying pan!"
	The table is a fixed in place supporter in the kitchen.
	The frying pan is on the table. 
	
	After taking the frying pan:
		end the story finally saying "You found the pan!"
	
	After looking for the first time:
		say "(Type HINTS to get help.)".
	
	
	Chapter Hints
	
	Table of Hints
	hint	revealed (truth state)
	"The table is relevant."	false
	"Have you looked on the table?"	false 
	"The pan is on the table."	false
	
	Requesting hints is an action out of world.
	Understand "hint" and "hints" as requesting hints.
	 
	Carry out requesting hints (this is the un-meta hint requesting rule):
		mark the current action "normal".
		
	Carry out requesting hints (this is the scramble hints rule):
		let the alphabet be { "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z" };
		let row number be 1;
		repeat through table of hints:
			let scrambled hint be "";
			say "[row number]) ";
			if revealed entry is true:
				now scrambled hint is hint entry;
			otherwise:
				repeat with index running from 1 to the number of characters in hint entry:
					if character number index in hint entry is " ":
						now scrambled hint is "[scrambled hint] ";
					otherwise:
						let rnd be a random number between 1 and the number of entries in the alphabet;
						now scrambled hint is "[scrambled hint][entry rnd in the alphabet]";
			display scrambled hint in an element called "hint-[row number]";
			say line break;
			increment row number;
		say "[line break](Type REVEAL # where # is the number of the hint you want to unscramble.)".
		
	Revealing hint is an action out of world applying to one number.
	Understand "reveal [number]" as revealing hint.
	
	Check revealing hint (this is the check boundaries rule):
		if the number understood is less than 1 or the number understood is greater than the number of rows in the table of hints:
			say "Please choose a number between 1 and [number of rows in table of hints]." instead.
	
	Carry out revealing hint when Vorple is not supported (this is the unscrambling fallback rule):
		choose row number understood in the table of hints;
		say "[hint entry][line break]".
		
	Carry out revealing hint (this is the change past transcript rule):
		choose row number understood in the table of hints;
		place hint entry in the element called "hint-[number understood]".
		
	Test me with "hints/reveal 1/reveal 2/reveal 3".


Example: *** Sprechen Sie Deutsch - Passing data from the browser to the story file

We check what language the reader's browser is set to and offer a translated version of the story if one is available. The "window.navigator.language" JavaScript variable holds a language code, e.g. "de" or "en-GB". Except in Internet Explorer, but we'll keep the example simple this time. 

A  function in the Vorple JavaScript library called vorple.parser.sendCommand() can be used to trigger commands from outside the actual prompt. The first parameter is the command to send; in this case it passes the language code to the story file. With {hideCommand:true} as the second parameter we specify that the command should not be visible to the player. We can use vorple.parser.sendSilentCommand() when neither the command nor the output should be visible.

(Strictly speaking the {hideCommand:true} parameter isn't necessary, because out of world actions' commands are never shown on screen.)

The grammar for a command used only for data passing should begin with two underscores. Vorple will strip the underscores from the reader's command if they try to enter them into the prompt manually which prevents "cheating".

	*: Include Vorple Core by Juhana Leinonen.
	Release along with the "Vorple" interpreter.
	
	There is a room.
	
	When play begins (this is the query browser language rule):
		eval "if(window.navigator.language) { vorple.parser.sendCommand('__lang '+window.navigator.language, {hideCommand:true}) }".
		
	Checking browser language is an action out of world applying to one topic.
	Understand "__lang [text]" as checking browser language.
	
	Report checking browser language when the topic understood matches the text "de":
			say "If you would prefer the German version, you can find it from ..."
		

Example: **** The Sum of Human Knowledge - Retrieving and displaying data from a third party service

Here we set up an encyclopedia that can be used to query articles from Wikipedia. The actual querying code is a bit longer so it's placed in the vorple.custom.js file, which can be downloaded from http://vorple-if.com/vorple/doc/inform7/examples/vorple.custom.js . 

	*: Include Vorple Core by Juhana Leinonen.
	Release along with the "Vorple" interpreter.
	Release along with a file of "Custom JavaScript" called "vorple.custom.js".
	
	Library is a room. "The shelves are filled with volumes of an encyclopedia. You can look up any topic you want."
	
	Looking up is an action applying to one topic.
	Understand "look up [text]" as looking up.
	
	Carry out looking up:
		display a block element called "dictionary-entry";
		eval "wikipedia_query('[escaped topic understood]')" or fall back to say "You find the correct volume and learn about [topic understood].".
		
