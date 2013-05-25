Vorple Screen Effects by Juhana Leinonen begins here.

"Vorple equivalent of Basic Screen Effects by Emily Short. Waiting for a keypress, clearing the screen, aligning, styling and coloring text."

Use authorial modesty.

Include Vorple Core by Juhana Leinonen.


Section 1 - Spacing and Pausing

Include (-

[ KeyPause i; 
	i = VM_KeyChar(); 
	rfalse;
];

[ SPACEPause i;
	while (i ~= 13 or 31 or 32)
	{
		i = VM_KeyChar();	
	}
];

[ GetKey i;
	i = VM_KeyChar(); 
	return i;
];

-)

To clear the/-- Z-machine screen:
	(- VM_ClearScreen(0); -)
	
To clear the/-- screen:
	if Vorple is supported:
		execute JavaScript command "$(vorple.parser._container.top).empty()";
	otherwise:
		clear the Z-machine screen.

To clear only the/-- Z-machine main screen:
	(- VM_ClearScreen(2); -)
	
To clear only the/-- main screen:
	if Vorple is supported:
		clear the screen;
	otherwise:
		clear only the Z-machine main screen.

To clear only the/-- status line:
	(- VM_ClearScreen(1); -).

To wait for any key:
	(- KeyPause(); -)

To wait for the/-- SPACE key:
	(- SPACEPause(); -)

To decide what number is the chosen letter:
	(- GetKey() -)

Pausing the game is an activity.

To pause the/-- game:
	carry out the pausing the game activity.

For pausing the game (this is the standard pausing the game rule):
	say "[paragraph break]Please press SPACE to continue." (A);
	wait for the SPACE key;
	clear the screen.

To center (quote - text) in Z-machine:
	(- CenterPrintComplex({quote}); -);
	
To center (quote - text), fixed letter spacing:
	if Vorple is supported:
		if fixed letter spacing:
			open HTML tag "div" called "centered";
			place an inline element called "monospace" reading quote;
			close HTML tag;
		otherwise:
			place a block level element called "centered" reading quote;			 
	otherwise:
		center quote in Z-machine.
		
To right-align (quote - text):
	place a block level element called "right-aligned" reading quote.
	
	[	
To place a/the/-- blockquote reading (quote - text):
	place a "blockquote" element reading quote.

To hide the/-- last blockquote:
	execute JavaScript command "$('blockquote:last').animate({opacity:0},500).slideUp(500,function(){$(this).remove()}".

To hide all blockquotes:
	execute JavaScript command "$('blockquote').animate({opacity:0},500).slideUp(500,function(){$(this).remove()}".
	]

To center (quote - text) at the/-- row (depth - a number):
	(- CenterPrint({quote}, {depth}); -);
	
To stop the/-- game abruptly:
	(- quit; -)
	
To show the/-- current quotation:
	(- ClearBoxedText(); -);


Include (-

[ CenterPrint str depth i j len;
	font off;
	i = VM_ScreenWidth();
	len = IT_CharacterLength(str);
	if (len > 63) len = 63;
	j = (i-len)/2 - 1;
	VM_MoveCursorInStatusLine(depth, j);
	print (I7_string) str; 
	font on;
];

[ CenterPrintComplex str i j len;
	font off;
	print "^"; 
	i = VM_ScreenWidth();
	len = IT_CharacterLength(str);
	if (len > 63) len = 63;
	j = (i-len)/2 - 1;
	spaces j;
	print (I7_string) str; 
	font on;
];

-)

To decide what number is screen width:
	(- VM_ScreenWidth() -);

To decide what number is screen height:
	(- I7ScreenHeight() -);

Include (-

[ I7ScreenHeight i screen_height;
	i = 0->32;
		  if (screen_height == 0 or 255) screen_height = 18;
		  screen_height = screen_height - 7;
	return screen_height;
];

-)

To deepen the/-- status line to (depth - a number) rows:
	(- DeepStatus({depth}); -);

To move the/-- cursor to (depth - a number):
	(- I7VM_MoveCursorInStatusLine({depth}); -)

To right align the/-- cursor to (depth - a number):
	(- RightAlign({depth}); -)

Include (- 

[ DeepStatus depth i screen_width;
    VM_StatusLineHeight(depth);
    screen_width = VM_ScreenWidth();
    #ifdef TARGET_GLULX;
        VM_ClearScreen(1);
    #ifnot;
        style reverse;
        for (i=1:i<depth+1:i++)
        {
             @set_cursor i 1;
             spaces(screen_width);
        } 
    #endif;
]; 

[ I7VM_MoveCursorInStatusLine depth;
	VM_MoveCursorInStatusLine(depth, 1);
];

[ RightAlign depth screen_width o n;
	screen_width = VM_ScreenWidth(); 
	n = (+ right alignment depth +);
	o = screen_width - n;
	VM_MoveCursorInStatusLine(depth, o);
];

-)

Table of Ordinary Status
left	central	right
"[location]"	""	"[score]/[turn count]" 

Status bar table is a table-name that varies. Status bar table is the Table of Ordinary Status.

To fill the/-- status bar/line with (selected table - a table-name):
	let __n be the number of rows in the selected table;
	deepen status line to __n rows;
	let __index be 1;
	repeat through selected table
	begin;
		move cursor to __index; 
		say "[left entry]";
		center central entry at row __index;
		right align cursor to __index;
		say "[right entry]";
		increase __index by 1;
	end repeat.

Right alignment depth is a number that varies. Right alignment depth is 14.



Chapter 2 - Styles

Vorple style is a kind of value.

cursive,
emphasized,
fantasy,
monospace,
nowrap,
strikethrough,
strong,
transient,
underline,
xx-small,
x-small,
small,
large,
x-large,
xx-large
are Vorple styles.

To say (style - Vorple style) style:
	execute JavaScript command "vorple.parser.openTag('span','[style]')".
	
To say end style:
	execute JavaScript command "vorple.parser.closeTag()".

To say end all styles:
	execute JavaScript command "vorple.parser.closeAllTags()".


Chapter 3 - Colors

Section 1 - Z-machine defaults

To say Z-machine default letters:
	(- @set_colour 1 1; -)

To say Z-machine red letters:
	(- @set_colour 3 0; -)

To say Z-machine green letters:
	(- @set_colour 4 0; -)

To say Z-machine yellow letters:
	(- @set_colour 5 0; -)

To say Z-machine blue letters:
	(- @set_colour 6 0; -)

To say Z-machine magenta letters:
	(- @set_colour 7 0; -)

To say Z-machine cyan letters:
	(- @set_colour 8 0; -)

To say Z-machine white letters:
	(- @set_colour 9 0; -)

To say Z-machine black letters:
	(- @set_colour 2 0; -)

To turn the/-- Z-machine background black:
	(- @set_colour 0 2; -);

To turn the/-- Z-machine background red:
	(- @set_colour 0 3; -);

To turn the/-- Z-machine background green:
	(- @set_colour 0 4; -);

To turn the/-- Z-machine background yellow:
	(- @set_colour 0 5; -);

To turn the/-- Z-machine background blue:
	(- @set_colour 0 6; -);

To turn the/-- Z-machine background magenta:
	(- @set_colour 0 7; -);

To turn the/-- Z-machine background cyan:
	(- @set_colour 0 8; -);

To turn the/-- Z-machine background white:
	(- @set_colour 0 9; -);


Section 2 - Vorple

To say default letters:
	if Vorple is supported:
		say end style;
	otherwise:
		say Z-machine default letters.
	
red-foreground,
green-foreground,
yellow-foreground,
blue-foreground,
magenta-foreground,
cyan-foreground,
white-foreground,
black-foreground,
red-background,
green-background,
yellow-background,
blue-background,
magenta-background,
cyan-background,
white-background,
black-background
are Vorple styles.

To say red letters:
	if Vorple is supported:
		say red-foreground style;
	otherwise:
		say Z-machine red letters.

To say green letters:
	if Vorple is supported:
		say green-foreground style;
	otherwise:
		say Z-machine green letters.

To say yellow letters:
	if Vorple is supported:
		say yellow-foreground style;
	otherwise:
		say Z-machine yellow letters.
	
To say blue letters:
	if Vorple is supported:
		say blue-foreground style;
	otherwise:
		say Z-machine blue letters.
	
To say magenta letters:
	if Vorple is supported:
		say magenta-foreground style;
	otherwise:
		say Z-machine magenta letters.
	
To say cyan letters:
	if Vorple is supported:
		say cyan-foreground style;
	otherwise:
		say Z-machine cyan letters.

To say white letters:
	if Vorple is supported:
		say white-foreground style;
	otherwise:
		say Z-machine white letters.

To say black letters:
	if Vorple is supported:
		say black-foreground style;
	otherwise:
		say Z-machine black letters.	
		
		
To say red background:
	if Vorple is supported:
		say red-background style;
	otherwise:
		turn the Z-machine background red.

To say green background:
	if Vorple is supported:
		say green-background style;
	otherwise:
		turn the Z-machine background green.

To say yellow background:
	if Vorple is supported:
		say yellow-background style;
	otherwise:
		turn the Z-machine background yellow.

To say blue background:
	if Vorple is supported:
		say blue-background style;
	otherwise:
		turn the Z-machine background blue.

To say magenta background:
	if Vorple is supported:
		say magenta-background style;
	otherwise:
		turn the Z-machine background magenta.

To say cyan background:
	if Vorple is supported:
		say cyan-background style;
	otherwise:
		turn the Z-machine background cyan.

To say white background:
	if Vorple is supported:
		say white-background style;
	otherwise:
		turn the Z-machine background white.
		
To say black background:
	if Vorple is supported:
		say black-background style;
	otherwise:
		turn the Z-machine background black.
	

To turn Vorple foreground (color - text):
	execute JavaScript command "$('#vorpleContainer')[bracket]0[close bracket].className=$('#vorpleContainer')[bracket]0[close bracket].className.replace(/\b[bracket]a-z[close bracket]+\-foreground/,'');$('#vorpleContainer').addClass('[color]-foreground')".

To turn Vorple background (color - text):
	execute JavaScript command "$('#vorpleContainer')[bracket]0[close bracket].className=$('#vorpleContainer')[bracket]0[close bracket].className.replace(/\b[bracket]a-z[close bracket]+\-background/,'');$('#vorpleContainer').addClass('[color]-background')".


To turn the/-- foreground red:
	if Vorple is supported:
		turn Vorple foreground "red";
	otherwise:
		say Z-machine red letters.

To turn the/-- foreground green:
	if Vorple is supported:
		turn Vorple foreground "green";
	otherwise:
		say Z-machine green letters.

To turn the/-- foreground yellow:
	if Vorple is supported:
		turn Vorple foreground "yellow";
	otherwise:
		say Z-machine yellow letters.

To turn the/-- foreground blue:
	if Vorple is supported:
		turn Vorple foreground "blue";
	otherwise:
		say Z-machine blue letters.

To turn the/-- foreground magenta:
	if Vorple is supported:
		turn Vorple foreground "magenta";
	otherwise:
		say Z-machine magenta letters.

To turn the/-- foreground cyan:
	if Vorple is supported:
		turn Vorple foreground "cyan";
	otherwise:
		say Z-machine cyan letters.

To turn the/-- foreground white:
	if Vorple is supported:
		turn Vorple foreground "white";
	otherwise:
		say Z-machine white letters.

To turn the/-- foreground black:
	if Vorple is supported:
		turn Vorple foreground "black";
	otherwise:
		say Z-machine black letters.
		


To turn the/-- background red:
	if Vorple is supported:
		turn Vorple background "red";
	otherwise:
		turn the Z-machine background red.

To turn the/-- background green:
	if Vorple is supported:
		turn Vorple background "green";
	otherwise:
		turn the Z-machine background green.

To turn the/-- background yellow:
	if Vorple is supported:
		turn Vorple background "yellow";
	otherwise:
		turn the Z-machine background yellow.

To turn the/-- background blue:
	if Vorple is supported:
		turn Vorple background "blue";
	otherwise:
		turn the Z-machine background blue.

To turn the/-- background magenta:
	if Vorple is supported:
		turn Vorple background "magenta";
	otherwise:
		turn the Z-machine background magenta.

To turn the/-- background cyan:
	if Vorple is supported:
		turn Vorple background "cyan";
	otherwise:
		turn the Z-machine background cyan.

To turn the/-- background white:
	if Vorple is supported:
		turn Vorple background "white";
	otherwise:
		turn the Z-machine background white.
		
To turn the/-- background black:
	if Vorple is supported:
		turn Vorple background "black";
	otherwise:
		turn the Z-machine background black.

	

Chapter Disabling Basic Screen Effects (for use with Basic Screen Effects by Emily Short)

Section 1 - Spacing and Pausing (in place of Section 1 - Spacing and Pausing in Basic Screen Effects by Emily Short)

[do nothing]

Section 2 (in place of Section 2 (for Z-machine only) in Basic Screen Effects by Emily Short)

[do nothing]


Vorple Screen Effects ends here.

---- DOCUMENTATION ----

Vorple Screen Effects duplicates in Vorple the effects provided by Basic Screen Effects by Emily Short and adds a couple of new ones.


Chapter: Differences with Basic Screen Effects

The following phrases work identically in both offline and online interpreters. See the documentation of Basic Screen Effects for more information.

	clear the screen;
	wait for any key;
	wait for the SPACE key;
	pause the game;
	stop game abruptly;

The following phrases are available but behave slightly different:

	center (text);
	(color) letters;
	turn the background (color);

Vorple doesn't have a status line so any phrases related to changing or displaying the status line do not do anything (except in offline interpreters). The phrase "clear only the main screen" does the same as "clear the screen".

And finally, these phrases not found in Basic Screen Effects have been added:

	right-align (text);
	turn the foreground (color);
	(color) background;
	
In addition a mechanism for styling text beyond the Z-machine colors, italics and bold text is added.


Chapter: Text styles

The following styles are provided with the extension:

	cursive
	emphasized
	fantasy
	monospace
	nowrap
	strikethrough
	strong
	transient
	underline
	
The "cursive" style displays text in a font resembling cursive writing, "fantasy" uses a decorative font resembling handwriting and "monospace" is a fixed width font (corresponding to Inform's [fixed letter spacing]). The actual font used depends on the web browser, operating system, and user preferences. 

"Emphasized" and "strong" are usually (but not guaranteed to be) italic and bold text respectively.

The "nowrap" style does not allow line breaks inside the style. It's mostly used when displaying numbers that use space as a separator. For example, we don't want the text "The suitcase contains a statue worth 100 000 dollars" to be split between "100" and "000":

    The suitcase contains a statue worth 100
    000 dollars.
    
If we add the "nowrap" style ("The suitcase contains a statue worth [nowrap style]100 000[end style] dollars.") the number is guaranteed to stay on the same line:

    The suitcase contains a statue worth 
    100 000 dollars. 

We should take care not to apply the nowrap style to very long pieces of text. If the text is longer than the normal line width it overflows beyond the normal text area. 

The transient style does not change the text's appearance, but the all transient text will fade out and disappear at the start of the next turn.
	
The following styles can be used to change the font size, proportional to the default font:

	xx-small
	x-small
	small
	large
	x-large
	xx-large
	
New styles can be added if a CSS file with corresponding style instructions is supplied with the story.

	Release along with style sheet "emotions.css".
	angry is a Vorple style.
	
	When play begins:
		say "You are feeling [angry style]especially furious[end style] today!".
		
The "emotions.css" file:

	.angry {
		color: red;
		font-size: larger;
		font-weight: bold;
	}
	
The style's name is applied to the text as a class, so it should always be one word only. Pay attention to the capitalization of the style's name when defining it: Inform 7 is case-insensitive, but CSS styles are not, so if you define the style as "Angry is a Vorple style", the corresponding CSS rule must also be for ".Angry".



Chapter: Colors

Styles for eight colors (red, green, yellow, blue, magenta, cyan, white and black) are provided as foreground and background colors. They correspond to the equivalent Z-machine colors.

The basic set of colors can be used like Z-machine colors provided in Basic Screen Effects. 

	say "A [green letters]frog[default letters] jumps into the [blue letters]pond[default letters].";
	
The coloring will work both in Vorple and in offline interpreters.

Background colors work a bit differently. In Z-machine there's no way to change the background of something that's already been printed so if we want to change the interpreter's background color we have to clear the screen right after changing the background color. This is not necessary in Vorple, so the phrase "turn the background (color)" takes effect immediately. For changing the background color of a shorter piece of text, "[(color) background]...[end style]" can be used.  

To recap:

	say "a [green letters]frog[default letters]";  
	
will print "frog" in green text in both Vorple and Z-machine

	say "a [green background]frog[default letters]";  
	
will print "frog" with a green background in both Vorple and Z-machine, and

	turn the background green;
	
will turn the whole screen's background green in Vorple, and the background of text from then on in Z-machine. 


Chapter: Centering and aligning text

Offline interpreters can't center variable width text, but for web browsers it's not a problem. By default "center (text)" does not change the font style. Saying "center (text), fixed letter spacing" is more similar to the original effect.

We can also show text aligned right:

	right-align "Over here!";

This will only work online. In offline interpreters the text will be left-aligned.

Vorple Screen Effects ends here.
