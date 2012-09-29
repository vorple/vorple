Tooltips by The Vorple Project begins here.

Include Vorple Core by The Vorple Project.

To say (txt - indexed text) with a/-- tooltip (tip - indexed text):
	let id be unique identifier;
	display txt inside element with class id;
	queue code "vorple.tooltip.show('.[id]','[escaped tip]')".

To show tooltip (tip - indexed text) on/at the/-- element with class/classes (classes - indexed text):
	queue code "vorple.tooltip.show('.[classes]','[escaped tip]')".

To show tooltip (tip - indexed text) on/at the/-- last element with class/classes (classes - indexed text):
	queue code "vorple.tooltip.show('.[classes]:last','[escaped tip]')".

To show tooltip (tip - indexed text) on/at the/-- prompt:
	queue code "vorple.tooltip.show('input','[escaped tip]')".

Tooltips ends here.


---- DOCUMENTATION ----


The Tooltips extension lets the story display small notifications above target elements on the story.

Text with a tooltip can be created with:

	say "examine" with tooltip "You can also use the short form X";

The tooltip is displayed after a short delay and it's hidden again after another delay.

We can also tag story text and display a tooltip on it later:

	display "examine" in element with class "hint";
	show tooltip "You can also use the short form X" on the element with class "hint";

Sometimes we have multiple elements with the same class on the screen and we want to show the hint on only one of them, usually the last one so that there's a better chance of the reader to notice it. It can be done by adding "last" to the phrase:

	show tooltip "You can also use the short form X" on the last element with class "hint";

A tooltip can be placed on the prompt (handy for giving a hint on how to play to people who aren't familiar with interactive fiction):

	When play begins:
		show tooltip "Type something here!" on the prompt.
