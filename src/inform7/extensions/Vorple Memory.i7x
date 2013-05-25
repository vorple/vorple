Vorple Memory (for Z-Machine only) by Juhana Leinonen begins here.

"Saving short strings of texts across Vorple play sessions."

Include Vorple Core by Juhana Leinonen.
Use authorial modesty.

Table of Browser Cookies
name (text)	data (text)
with 20 blank rows

Writing persistent text is an action out of world applying to one topic.
Understand "__set_cookie [text]" as writing persistent text.

Check writing persistent text (this is the check for invalid cookie writing input rule):
	let the cookie be text;
	let the cookie be the topic understood;
	if the cookie matches the text "=":
		do nothing;
	otherwise:
		say "[bold type]*** Run-time error in the Vorple Memory extension: trying to set a cookie with no name-value pair ***" instead.

Carry out writing persistent text:
	let name be text;
	let data be text;
	if the topic understood matches the regular expression ".*=":
		let name be the text matching regular expression;
		replace the text "=" in name with "";
	if the topic understood matches the regular expression "=.*":
		let data be the text matching regular expression;
		replace the text "=" in data with "";
	write persistent text data called name.

To write persistent text (cookie data - text) called (cookie name - text):
	if there is a data corresponding to a name of cookie name in the Table of Browser Cookies:
		choose the row with name of cookie name in the Table of Browser Cookies;
		now the data entry is "[cookie data]";
	otherwise:
		choose a blank row in the Table of Browser Cookies;
		now the name entry is cookie name;
		now the data entry is cookie data;
	execute JavaScript command "vorple.cookie.write('[cookie name]', '[escaped cookie data]')".		

To decide which text is persistent text (cookie name - text):
	if persistent text cookie name exists:
		decide on "[data corresponding to a name of cookie name in the Table of Browser Cookies]";
	otherwise:
		decide on "".

To decide whether persistent text (cookie name - text) exists:
	if there is a data corresponding to a name of cookie name in the Table of Browser Cookies:
		decide yes;
	decide no.

To remove persistent text (cookie name - text):
	if there is a data corresponding to a name of cookie name in the Table of Browser Cookies:
		choose the row with a name of cookie name in the Table of Browser Cookies;
		blank out the whole row;
	execute JavaScript command "vorple.cookie.remove('[cookie name]')".


Chapter Skipping startup

[We need to give Vorple time to push existing cookies to the story file so normal startup must be postponed.]
When play hasn't begun yet is a rulebook.

The when play hasn't begun yet stage rule is listed before the when play begins stage rule in the startup rulebook.

This is the when play hasn't begun yet stage rule:
	follow the when play hasn't begun yet rules.

When play begins:
	say "Play begins."

To permit out-of-sequence commands:
	(- EarlyInTurnSequence = true; -).

When play hasn't begun yet:
	permit out-of-sequence commands;
	follow parse command rule;
	follow generate action rule;
	say "There.";



[The when play begins stage rule is not listed in the startup rulebook.]

[
The display banner rule is not listed in the startup rulebook.
The initial room description rule is not listed in the startup rulebook.


Running the startup is an action applying to nothing.
Understand "__run_startup" as running the startup.

Carry out running the startup (this is the postponed when-play-begins rule):
	follow the when play begins stage rule.

Carry out running the startup (this is the postponed display banner rule):
	follow the display banner rule.

Carry out running the startup (this is the postponed initial-room-description rule):
	say "ok";
	follow the initial room description rule.

[

This is the run startup normally in non-Vorple interpreters rule:
	if Vorple is not supported:
		follow the when play begins stage rule;
		follow the display banner rule;
		follow the initial room description rule.


The run startup normally in non-Vorple interpreters rule is listed instead of the when play begins stage rule in the startup rulebook.

]
This is the retrieve existing cookies rule:
	execute JavaScript command "[first time]var list=vorple.cookie.list();for(var i=0;i<list.length;++i ){vorple.parser.sendSilentCommand('__set_cookie '+list[bracket]i[close bracket]+'='+vorple.cookie.read(list[bracket]i[close bracket]));} vorple.parser.sendCommand('__run_startup',{hideCommand:true});[only]".

[
The retrieve existing cookies rule is listed last in the startup rulebook.
]
]

Chapter Converting numbers

[taken from the Guncho Mockup extension (www.guncho.com)]
To decide which number is numeric/numerical value of (T - text):
	let S be 1;
	let L be the number of characters in T;
	if L is 0, decide on 0;
	let negated be false;
	if character number 1 in T is "-" begin;
		let negated be true;
		let S be 2;
	end if;
	let result be 0;
	repeat with N running from S to L begin;
		let C be character number N in T;
		let D be 0;
		if C is "1" begin; let D be 1; otherwise if C is "2"; let D be 2;
		otherwise if C is "3"; let D be 3; otherwise if C is "4"; let D be 4;
		otherwise if C is "5"; let D be 5; otherwise if C is "6"; let D be 6;
		otherwise if C is "7"; let D be 7; otherwise if C is "8"; let D be 8;
		otherwise if C is "9"; let D be 9; otherwise if C is "0"; let D be 0;
		otherwise; decide on 0; end if;
		let result be (result * 10) + D;
	end repeat;
	if negated is true, let result be 0 - result;
	decide on result.


Chapter String to list conversion

To decide which list of text is (input - text) converted to a/-- list:
	let buffer be text;
	let result be a list of text;
	repeat with X running from 1 to number of characters in input:
		let char be character number X in input;
		if char is "{" or char is "}":
			do nothing;
		otherwise if char is ",":
			now buffer is buffer trimmed;
			add buffer to result;
			now buffer is "";
		otherwise:
			now buffer is "[buffer][char]";
	if buffer is not "":
		add buffer to result;
	decide on result.

To decide which text is (input - text) trimmed:
	replace the regular expression "(^\s*)|(\s*$)" in input with "";
	decide on input. 

Vorple Memory ends here.


---- DOCUMENTATION ----

Persistent Storage lets the author store and retrieve short strings of text between play sessions in the Vorple interpreter. The information is stored as browser cookies.

Please read the "Limitations" chapter for important information!


Chapter: Usage

Text can be stored using the following syntax:

	write persistent text "content" called "name";

The name should contain only alphabetical characters, numbers and underscores. Spaces are not allowed.

The text can be retrieved with 

	persistent text "name"

If there is no text already saved by that name, an empty text ("") will be returned. To check whether the data has been set at all:

	if persistent text "name" exists: 
		...

Unused data can be unset:

	remove persistent text "name";

Removing text is essentially setting it to an empty text so we can't store empty text. In other words we can't make a difference between persistent text that's value is "" and persistent text that doesn't exist.


Chapter: Saving lists

Oftentimes it's useful to save a list to a single entry of persistent text. That can be done by using the "list of values in brace notation" syntax:

	let musketeers be { "Athos", "Porthos", "Aramis" };
	write persistent text "[musketeers in brace notation]" called "musketeers";

In case the data is not a list, just list the contents separated by commas:

	write persistent text "[strength of player],[wisdom of player],[hit points of player]";

The data can be split back to a list using "text converted to list":

	let musketeers be persistent text "musketeers" converted to list;


Chapter: Converting text to a number

All persistent data is stored as text. If we want to retrieve data and treat it as a number, we must first convert it. In other words, in Inform's point of view the text "10" is not the same as number 10; you can't say "10"+2 because you would be trying to add the number 2 to a string of text.

Text can be converted to a number with the "numeric value of" phrase.

	let age today be the numeric value of persistent text "age";
	let age next year be age today + 2;


Chapter: Changes to the startup rulebook

Vorple needs time to send the previously stored data from the browser to the story file, and it can do it only by sending 'normal' commands silently through the prompt. The extension must postpone the normal startup of the story, including the "when play begins" rules, displaying the banner, and showing the initial room description. After the information has been sent to the story, the extension runs the rules that were suppressed during the actual startup. 

Usually if you want to stop the story from printing the banner or the room description when the story starts you might remove the corresponding rules ("display banner rule" and "initial room description rule") from the startup rulebook. This no longer works because Persistent Storage has already removed those rules and runs them manually later.

If you want to suppress the banner, you need to add this line to your source text:

	*: The postponed display banner rule is not listed in any rulebook.

If you don't want to show the initial room description, add this line:

	*: The postponed initial room description rule is not listed in any rulebook.


Chapter: Limitations

Usually cookies don't work when browsing local files, so you have to upload the release files to a server or use a local server for the extension to work at all.

To ensure maximum compatibility with different web browsers, the number of cookies the story can store is limited to a maximum of 20, including other cookies that may already be present in the same domain. For this reason it's best to try to use as few cookies as possible.

The sum of characters in the stored text's name and its content must not exceed 105 characters. Anything over this will be truncated.

The extension retrieves cookie values from the browser when play begins and keeps track of changes to cookies internally afterwards. Any changes to cookies made outside the story file during the play (e.g. in the user interface using Vorple) will not be updated automatically but must be sent to the story manually.

There's no guarantee that the user's browser keeps the cookies for the full duration of the expiration period, or that the browser accepts them at all. You shouldn't rely on cookies alone for important features.

There is no fallback mechanism for non-Vorple browsers -- it's just not possible to store persistent information on an unaltered Z-machine.


Example: * Welcome Back - Checking if the story is being replayed 

We'll check the existence of a previously saved persistent text. If it doesn't exist, we create it. The text's existence is enough to tell us that the story is being replayed, so it doesn't matter what 

	*: "Welcome Back"

	Include Vorple Memory by Juhana Leinonen.
	Release along with the "Vorple" interpreter.
	
	There is a room.
	
	When play begins (this is the remember returning visitor rule): 
		if persistent text "replay" exists:
			say "Welcome back!";
		otherwise:
			write persistent text "1" called "replay".


Example: ** Achievements - Awarding achievements and remembering what achievements have already been awarded
	
	*: "Achievements"

	Include Vorple Memory by Juhana Leinonen.
	Release along with the "Vorple" interpreter.
	
	
	The Park is a room.
	The shovel is a thing. The gem is a thing.
	The bush is fixed in place thing in the park.
	
	Instead of examining the bush for the first time:
		say "You find a shovel in the bushes!";
		now the player carries the shovel;
		award achievement "shovel".
	
	Digging is an action applying to nothing.
	Understand "dig" as digging.
	
	Check digging when the player is not carrying the shovel:
		say "You need a shovel to dig." instead.
	
	Check digging when the gem is handled:
		say "You've already found the treasure!" instead.
		
	Carry out digging:
		say "You find a huge gem!";
		award achievement "gem";
		now the player is carrying the gem.
	
	
	Table of Achievements
	name	description	awarded
	"shovel"	"finding the shovel"	false
	"gem"	"finding the gem"	false
	"jumping"	"discovering that you can jump"	false
	
	
	Last report jumping for the first time:
		say run paragraph on;
		award achievement "jumping".
	
	To award achievement (achievement - text):
		choose the row with name of achievement in table of achievements;
		if awarded entry is false:
			say "[line break]You have been awarded an achievement in recognition for [description entry]!";
			save achievement status;
			now awarded entry is true.
			
	To save achievement status:
		let awarded achievements be text;
		repeat through the Table of Achievements:
			if awarded entry is true:
				now awarded achievements is "[awarded achievements],[name entry]";
		write persistent text awarded achievements called "achievements". 
		
	
	When play begins (this is the retrieve saved achievement status rule):
		let saved achievements be persistent text "achievements" converted to list;
		repeat with ach running through saved achievements:
			choose the row with name of ach in table of achievements;
			now awarded entry is true.
			
	Listing achievements is an action out of world.
	Understand "achievements" as listing achievements.
	
	Check listing achievements:
		if not there is awarded of true in the Table of Achievements:
			say "You have no achievements yet." instead.
		
	Carry out listing achievements:
		say "You have been awarded the following achievements:[line break]";
		repeat through Table of Achievements:
			if the awarded entry is true:
				say " - [description entry][line break]".
			
	
	
