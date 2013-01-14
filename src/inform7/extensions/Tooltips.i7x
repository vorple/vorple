Tooltips (for Z-Machine only) by Juhana Leinonen begins here.

Include Vorple Core by Juhana Leinonen.

Use authorial modesty.

To say (txt - text) with a/-- tooltip (tip - text):
	let id be unique identifier;
	display txt inside element called id;
	queue code "vorple.tooltip.show('.[id]','[escaped tip]')".

To show tooltip (tip - text) on/at the/-- element called (class - text):
	queue code "vorple.tooltip.show('.[class]','[escaped tip]')".

To show tooltip (tip - text) on/at the/-- last element called (class - text):
	queue code "vorple.tooltip.show('.[class]:last','[escaped tip]')".

To show tooltip (tip - text) on/at the/-- prompt:
	queue code "vorple.tooltip.show('input','[escaped tip]')".

Tooltips ends here.


---- DOCUMENTATION ----


The Tooltips extension lets the story display small notifications above target elements on the story.

Text with a tooltip can be created with:

	say "examine" with tooltip "You can also use the short form X";

The tooltip is displayed after a short delay and it's hidden again after another delay.

We can also tag story text and display a tooltip on it later:

	display "examine" in element called "hint";
	show tooltip "You can also use the short form X" on the element called "hint";

Sometimes we have multiple elements with the same class on the screen and we want to show the hint on only one of them, usually the last one so that there's a better chance of the reader to notice it. It can be done by adding "last" to the phrase:

	show tooltip "You can also use the short form X" on the last element called "hint";

A tooltip can be placed on the prompt (handy for giving a hint on how to play to people who aren't familiar with interactive fiction):

	When play begins:
		show tooltip "Type something here!" on the prompt.
		

Example: * How To II - More tips to new players who might not be familiar with standard IF conventions.

We'll show a tooltip on the prompt to direct the player to use the keyboard, hint about what kind of commands to use if the first command they try is an error and direct their attention to parts of items. 

Parser errors are automatically given the class "parserError" which we can use.

	*: Include Tooltips by Juhana Leinonen.  
	Release along with the "Vorple" interpreter.
	
	The bedroom is a room.
	
	The wardrobe is openable closed fixed in place container in the bedroom.
	
	Instead of examining the wardrobe when the wardrobe is closed:
		say "The wardrobe is ";
		display "closed" in an inline element called "wardrobe-closed";
		say ".";
		show tooltip "You can OPEN WARDROBE to see what's inside." on the last element called "wardrobe-closed".
		
	The jacket is a wearable thing in the wardrobe.
	
	Rule for printing the name of the jacket when the jacket is in the wardrobe:
		display "jacket" in an inline element called "jacket-name";
		show tooltip "The jacket is something you can TAKE or WEAR." on the last element called "jacket-name".
	
	When play begins (this is the show prompt hint rule):
		show tooltip "Type a command to play" on the prompt.
		
	Rule for printing a parser error (this is the show parser error hint rule):
		show tooltip "Try to for example EXAMINE things you see or take INVENTORY." on the last element called "parserError".
		
	
