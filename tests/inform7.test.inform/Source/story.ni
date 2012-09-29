"Vorple for Inform 7 Unit Tests" by The Vorple Project.

Release along with the "Recording Vorple" interpreter.

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

Include Vorple Core by The Vorple Project.

Carry out testing "core eval":
	eval "window.evalTest = true".
	
Carry out testing "core escape":
	let test-string be "'test' [line break]\[paragraph break] [']test[']";
	say escaped test-string.

Carry out testing "core escape with line breaks":
	let test-string be "'line[line break]break'";
	say escaped test-string using "-" as line breaks.
	

Book Multimedia

Include Multimedia by The Vorple Project.


Part Images


Book Notifications

Include Notifications by The Vorple Project.

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

[
Book Persistent Storage

Include Persistent Storage by The Vorple Project.

Printing a cookie is an action applying to one topic.
Understand "print cookie [text]" as printing a cookie.

Carry out printing a cookie:
	say persistent text topic understood.
	
Removing a cookie is an action applying to one topic.
Understand "remove cookie [text]" as removing a cookie.

Carry out removing a cookie:
	remove persistent text topic understood.
]

Book Tooltips

Include Tooltips by The Vorple Project.

When play begins:
	say "testing";
	say "Hello" with tooltip "test".

