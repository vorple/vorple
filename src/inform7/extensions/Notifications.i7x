Notifications (for Z-Machine only) by The Vorple Project begins here.

Include Vorple Core by The Vorple Project.


Chapter Locations

An element position has some text called noty name. 

The noty name of top banner is "top".
The noty name of bottom banner is "bottom".
The noty name of top left is "topLeft".
The noty name of top center is "topCenter".
The noty name of top right is "topRight".
The noty name of center left is "centerLeft".
The noty name of screen center is "center".
The noty name of center right is "centerRight".
The noty name of bottom left is "bottomLeft".
The noty name of bottom center is "bottomCenter".
The noty name of bottom right is "bottomRight".


Chapter Vorple wrappers

To show notification (msg - indexed text):
	eval "vorple.notify.show('[escaped msg]')";
	add msg to the displayed notifications.

To hide all/-- notifications:
	eval "vorple.notify.closeAll()".

To show notification (msg - indexed text) at/in (pos - element position):
	eval "vorple.notify.show('[escaped msg]',{layout:'[noty name of pos]'})";
	add msg to the displayed notifications.

To show alert (msg - indexed text):
	eval "vorple.notify.alert('[escaped msg]')";
	add msg to the displayed notifications.

To set the/-- default notification position to (pos - element position):
	eval "vorple.notify.defaults.layout='[noty name of pos]'".


Chapter Fallback

Displayed notifications is a list of indexed text that varies.

Before reading a command (this is the print notifications fallback rule):
	if Vorple is not supported:
		repeat with note running through displayed notifications:
			say "[italic type][bracket][note][close bracket][roman type][paragraph break]".

Before reading a command (this is the empty displayed notifications list rule):
	truncate displayed notifications to 0 entries.


Notifications ends here.


---- DOCUMENTATION ----

Notifications are messages that show briefly on the screen and then fade away. A notification can be displayed simply with:

	show notification "Hello World!";


Chapter: Positioning

There are 11 possibilities for positioning notifications: top banner, bottom banner, top left, top center, top right, center left, center, center right, bottom left, bottom center, and bottom right. The default position is bottom right. It can be changed individually:

	show notification "Up here!" in top banner;

...or globally:

	*: When play begins:
		set the default notification position to top banner.


Chapter: Alerts

An alert is a notification that comes with an "OK" button that must be clicked to dismiss the notification. It's always in the middle of the screen.

	When play begins:
		show alert "If you need assistance, type HELP at the prompt."


Chapter: Clearing notifications

Multiple notifications are shown on the screen at the same time; a new notification in the same position pushes the old notification down (or up) if it hasn't had time to clear away yet. Sometimes you might want to make sure that the old notifications are cleared before showing new ones. All notifications currently on the screen can be removed with:

	hide notifications;


Chapter: Fallback

If Vorple isn't available, the fallback is to display the notifications at the end of turn as plain text. The feature can be overridden or disabled like any Vorple fallbacks:

	show notification "Click on your inventory items to examine them more closely" or fall back with say "Type EXAMINE followed by an inventory item's name to examine them more closely.";
	show notification "Welcome to Vorple-enhanced [story title]!" without a fallback;

The default fallback can also be turned off completely:

	*: The print notifications fallback rule is not listed in any rulebook.


Example: * How To I - Showing small tips to new players who might not be familiar with the standard IF conventions.

	*: Include Notifications by The Vorple Project.  
	Release along with the "Vorple" interpreter.

	Lab is a room. "You're in a fancy laboratory."
	Corridor is north of lab.

	A test tube is in the lab.
	A trolley is in the lab. It is pushable between rooms.

	When play begins:
		show notification "Type LOOK (or just L) to see the room description again".

	After taking something for the first time:
		show notification "Type INVENTORY (or just I) to see a list of what you're carrying";
	continue the action.

	After examining the trolley for the first time:
		show notification "You can push the trolley between rooms by commanding PUSH TROLLEY followed by a compass direction".

	After reading a command when the player's command includes "examine":
		show notification "Tip: You can abbreviate EXAMINE to just X".
			
	Test me with "take test tube/examine test tube/x trolley".


Example: ** Score Notifications - A visual notification when the player is awarded points.

We'll create a rule that will show the score change as Vorple notification, or use the original score notification rule if the game is being played in a non-Vorple interpreter.

	*: Include Notifications by The Vorple Project.
	Release along with the "Vorple" interpreter.

	To say score notification message:
		(- NotifyTheScore(); -).

	This is the enhanced notify score changes rule:
		if Vorple is supported:
			show notification "[score notification message]" at top center;
		otherwise:
			follow the notify score changes rule.
	
	The notify plain score changes rule is listed instead of the notify score changes rule in the turn sequence rulebook.


