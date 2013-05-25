"Vorple for Inform 7 Unit Tests" by The Vorple Project.

Release along with the "Vorple" interpreter.

There is a room.


Volume General

Book Actions

Chapter Testing

Testing is an action applying to one topic.
Understand "try [text]" as testing.
 

Chapter Echo

Echoing is an action applying to one topic.
Understand "echo [text]" as echoing.

Carry out echoing:
	say the topic understood.
	

Volume Extensions

Book Core

Include Vorple Core by Juhana Leinonen.
Include Basic Screen Effects by Emily Short.

Carry out testing "core eval":
	execute JavaScript command "window.evalTest = true".

Carry out testing "core escape":
	let test-string be "'test' [line break]\[paragraph break] [']test[']";
	say escaped test-string.

Carry out testing "core escape with line breaks":
	let test-string be "'line[line break]break'";
	say escaped test-string using "-" as line breaks.
	
Carry out testing "core char input":
	say "Pausing..";
	pause the game;
	say "Done."


Book Notifications

Include Vorple Notifications by Juhana Leinonen.

Carry out testing "notify basic":
	show notification "test".

Carry out testing "notify clear":
	hide notifications.
	
Carry out testing "notify alert":
	show alert "parchment alert test".

Carry out testing "notify bottom left":
	show notification "test" at bottom left.
	
Carry out testing "notify change default":
	set default notification position to top left;
	show notification "test".


Book Tooltips

Include Vorple Tooltips by Juhana Leinonen.

When play begins:
	say "testing";
	place text "Hello" with tooltip reading "test".

