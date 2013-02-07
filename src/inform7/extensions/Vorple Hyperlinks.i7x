Vorple Hyperlinks (for Z-Machine only) by Juhana Leinonen begins here.

"Hyperlinks that either open a web site or execute a parser command."

Include Vorple Basics by Juhana Leinonen.

Use authorial modesty.


Chapter Hyperlinks

To display (txt - indexed text) linking to url (url - indexed text), in the same window:
	let id be unique identifier;
	display txt inside element "a" called id;
	eval "$('.[id]').attr('href','[escaped url]')";
	if not in the same window:
		eval "$('.[id]').attr('target','_blank')";
	if Vorple is not supported:
		say txt.

To display (txt - indexed text) linking to a/the/-- command (command - indexed text), without showing the command and/or without showing the response:
	let id be unique identifier;
	let classes be indexed text;
	let classes be "[id] command";
	if without showing the command:
		let classes be "[classes] hideCommand";
	if without showing the response:
		let classes be "[classes] hideResponse";
	display txt inside element "a" called classes;
	eval "$('.[id]').attr('href','[escaped command]')";
	if Vorple is not supported:
		say txt.

Vorple Hyperlinks ends here.


---- DOCUMENTATION ----

Chapter: Links

A hyperlink can link to either a web URL or clicking on it can trigger a command that's sent to the parser. 

Hyperlinks open web pages in new browser windows. The URLs should include the "http://" (or "https://") prefix.

	display "Vorple web page" linking to url "http://vorple-if.com";

The link can be opened in the same window by passing an option:

	display "Vorple web page" linking to url "http://vorple-if.com", in the same window;

Links to commands by default work just as if they would have been typed on the prompt.

	display "door" linking to command "open door";

Options "without showing the command" and "without showing the response" do exactly that: run the command but don't show it or the story's response.

	display "my stuff" linking to command "inventory", without showing the command;
	display "super secret" linking to command "__toggle_secrets", without showing the command and without showing the response;

Suppressing both the command and the response is useful if the command triggers something only in the user interface or sends information to the story file that shouldn't give feedback to the reader.

If the story is run in a normal interpreter, the link description text is displayed but not the URL (and of course the links won't work).


Example: * Click to Learn More - Hyperlinks to external web pages, email links and action links, with fallback if Vorple is not available.

Email links ("mailto:") open an external mail program with the address pre-filled.

Note how we mark the action "normal" - otherwise the out of world action would be shown in a notification instead of in the normal story flow.


	*: Include Vorple Hyperlinks by Juhana Leinonen.
	Release along with the "Vorple" interpreter.

	Lounge is a room.

	Getting information is an action out of world.
	Understand "about" and "info" as getting information.

	Carry out getting information:
		say "This fine story has been made possible by ";
		display "Vorple" linking to url "http://vorple-if.com" or fall back to say "Vorple (vorple-if.com)";
		say ". Please contact us at ";
		display "if@example.com" linking to url "mailto:if@example.com";
		say ".";
		mark the current action "normal".

	After looking for the first time:
		say "[italic type]Type ";
		display "ABOUT" linking to command "about";
		say " for more information.[roman type][line break]".


