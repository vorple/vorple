Vorple Core (for Z-Machine only) by The Vorple Project begins here.

Chapter JavaScript evaluation

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

To eval (javascript code - indexed text):
	if Vorple is supported:
		open JavaScript channel;
		say "[javascript code]";
		close JavaScript channel.
		
To queue code (javascript code - indexed text):
	if Vorple is supported:
		eval "vorple.parser._evalqueue.push(function(){[javascript code]})".

To open HTML channel: (- @output_stream 6 streambuf; -).
To close HTML channel: (- @output_stream( -6 ); -).

To say element (element - indexed text) with/-- class/classes (class - indexed text):
	if Vorple is supported:
		open HTML channel;
		say "[element] [class]";
		close HTML channel.
   
To say div (class - indexed text):
	say element "div" class class.
	
To say span (class - indexed text):
	say element "span" class class.
	
To decide which indexed text is unique identifier:
	let id be indexed text;
	let id be "id";
	repeat with X running from 1 to 3:
		let rnd be a random number from 1000 to 9999;
		let id be "[id][rnd]";
	decide on id.

		
To display Vorple method (code - indexed text) in a/an/the/-- element (elem - indexed text) with class/classes (class - indexed text):
	let id be unique identifier;
	say element elem class "[id] [class]";
	eval "$( '.[id]' ).html([code])".

To display Vorple method (code - indexed text) in a/an/the/-- element with class/classes (class - indexed text):
	display Vorple method code in an element "span" with class class.
		
To display Vorple method (code - indexed text):
	display Vorple method code in an element with class "".
	
To place text/-- (content - indexed text) inside/in a/an/the/-- element with class/classes (class - indexed text):
	eval "$( '.[class]' ).html('[escaped content]')".
	
To display (content - indexed text) inside/in a/an/the/-- element (elem - indexed text) with class/classes (class - indexed text):
	let id be unique identifier;
	say element elem class "[id] [class]";
	eval "$( '.[id]' ).html('[content]')".
	
To display (content - indexed text) inside/in a/an/the/-- element with class/classes (class - indexed text):
	display content inside an element "span" with class class.
	
To say (content - indexed text) inside/in a/an/the/-- (elem - indexed text) element with class/classes (class - indexed text):
	display content inside element elem with class class;
	if Vorple is not supported:
		say content.

To say (content - indexed text) inside/in a/an/the/-- element with class/classes (class - indexed text):
	display content inside element with class class;
	if Vorple is not supported:
		say content.

To say transient text/-- (content - indexed text):
	say content inside element with class "transient".

To (vorple-phrase - phrase) or/with/but fall/-- back/fallback with/to (fallback - phrase):
	(- if( IsJS() ) {vorple-phrase} } else {fallback}; -).

To (vorple-phrase - phrase) without a/-- fallback:
	(- if( IsJS() ) {vorple-phrase} }; -)
	
	
Chapter Turn types

To mark the/-- current action (type - text):
	eval "vorple.parser.setTurnType('[type]');".

Before printing a parser error:
	mark the current action "error";
	make no decision.

Include (-
[ Perform_Undo;
#ifdef PREVENT_UNDO; L__M(##Miscellany, 70); return; #endif;
if (turns == 1) { L__M(##Miscellany, 11); return; }
if (undo_flag == 0) { L__M(##Miscellany, 6); return; }
if (undo_flag == 1) { L__M(##Miscellany, 7); return; }
if( isJS() ) {
	@output_stream 5 streambuf;
	print "vorple.parser.setTurnType('undo')";
	@output_stream( -5 );
}
if (VM_Undo() == 0) L__M(##Miscellany, 7);
];
-) instead of "Perform Undo" in "OutOfWorld.i6t".
	
To decide whether current action is out of world:
     (- meta -)
    
First specific action-processing rule:
	if current action is out of world:
		mark the current action "meta".


Chapter Escaping

To decide which indexed text is escaped (string - indexed text):
	decide on escaped string using "" as line breaks.

To decide which indexed text is escaped (string - indexed text) using (lb - text) as line breaks:
	let safe-string be indexed text;
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
		say span "vorple-version";
		eval "$( '.vorple-version' ).html( vorple.core.version+'.'+vorple.core.release );";
		say paragraph break.
	
Vorple Core ends here.


---- DOCUMENTATION ----

The Vorple Core extension defines some of the basic structure that's needed for Vorple to communicate with the story file. 

Those authors who are not familiar with JavaScript or who wish to just use the basic Vorple features can read only the first two chapters (Vorple setup and fallback phrases). The rest of this documentation handles more advanced usage.


Chapter: Vorple setup

Every Vorple story project must include at least one Vorple extension and the custom web interpreter.

	*: Include Vorple Core by The Vorple Project.
	Release along with the "Vorple" interpreter.

The Vorple interpreter must be installed to Inform. Installation instructions can be found in http://vorple-if.com and chapter 23.11. of Writing with Inform.

All standard Vorple extensions already have the "Include Vorple Core" line, so it's not necessary to add it to the story project if at least one of the other extensions are used.


Chapter: Fallback phrases

Even though with Vorple we can accomplish many things that are just impossible to do with traditional interpreters, it's always a good idea to make the story playable text-only as well if at all possible. There are a lot of players to whom a web interpreter or Vorple's features aren't accessible, and it's the Right Thing To Do to not exclude people if it's possible to include them.

A story file can detect if it's being run on an interpreter that supports Vorple (or more specifically, on an interpreter that supports the Z-Machine v. 1.2 draft). The same story file can therefore be run on both the Vorple web interpreter and other interpreters that have text-only features and display substitute content if necessary. We can test for Vorple's presence with "if Vorple is supported":

	Instead of going north:
		if Vorple is supported:
			play mp3 sound file "marching_band.mp3";
		otherwise:
			say "A marching band crossing the street blocks your way."

(The above example uses the Multimedia extension.)

The say phrase in the above example is called a "fallback" and it's displayed only on normal non-Vorple interpreters.

When the fallback consists of only one phrase (most commonly a say-phrase like in the example), we can use a shorthand "... or fall back with ...":

	Instead of going north:
		play mp3 sound file "marching_band.mp3" or fall back with say "A marching band crossing the street blocks your way."

Sometimes a phrase already includes a default fallback method. For example, in the Notifications extension displaying a notification will automatically show the same text in a normal interpreter as plain text. We can override that behavior by using the technique described above:

	show notification "Click on your inventory items to examine them more closely" or fall back with say "Type EXAMINE followed by an inventory item's name to examine them more closely."

If we want to suppress the default fallback method completely, we can use "...without a fallback" modifier. This is a shorthand for "...or fall back with do nothing."

	show notification "Welcome to Vorple-enhanced [story title]!" without a fallback.

Note that most Vorple-specific phrases already do nothing if Vorple isn't supported and can be safely used without extra modifiers. Those that do have a default fallback are described in their documentation.


Chapter: Embedding HTML elements

We can embed simple HTML elements into story text with some helper phrases.

	say element "article";
	say element "h1" with class "title";
	say div "inventory transient";
	say span "name";

The previous example generates this markup:

	<article></article>
	<h1 class="title"></h1>
	<div class="inventory transient"></div>
	<span class="name"></span>

The elements are always created empty and with a closing tag. Content can be added to them with these phrases:

	place "An exciting story" in the element "title";
	display "Story so far:" in a "h2" element with class "subtitle";
	display "Anonymous Adventurer" in an element with class "name";

The "place" phrase will use an existing element(s) with the given class, overwriting previous content. The "display" phrases create new elements. The default element, if not otherwise specified, is span.

The "transient" class is special: if an element has that class, it will fade out at the start of the next turn. Transient text can be created easily with:

	say transient text "All happiness fades."


Chapter: Evaluating JavaScript expressions

The story file breaks out of the Z-Machine sandbox by having the web browser running the interpreter evaluate JavaScript expressions. An "eval" phrase is provided to do just this:

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

To escape a string we can preface it with "escaped":

	To greet (name - text):
		eval "alert( 'Hello [escaped name]!' )".

Now the string becomes:

	alert( "Hello William \"Bill\" O\'Malley!" )

By default newlines are removed. If we want to preserve them, or turn them into for example HTML line breaks:

	To greet (name - text):
		let safe name be escaped name using "\n" as line breaks;
		eval "alert( 'Hello [safe name]!' )".

