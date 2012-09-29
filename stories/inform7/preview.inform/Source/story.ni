"Vorple Preview" by The Vorple Project

Volume Setup

[The extensions and the "Release along.." line must always be present. Each extension includes the Vorple Core extension automatically.]
Include Hypertext by The Vorple Project.
Include Multimedia by The Vorple Project.
Include Notifications by The Vorple Project.
Include Tooltips by The Vorple Project.
Release along with the "Vorple" interpreter.

Release along with the source text.

[Make sure our custom CSS and JavaScript files are released with the interpreter.]
Release along with a file of "Custom CSS" called "vorple.custom.css".
Release along with a file of "Custom JavaScript" called "vorple.custom.js".


Volume Vorple Extensions

Book Core
	
Chapter Named elements

[The ingress is placed in a named element that has a special styling defined in vorple.custom.css]
When play begins (this is the show ingress rule):
	display "A preview of Vorple, an Interactive Fiction user interface library" inside element "div" with class "ingress";
	say "A ray of sunlight wakens you from your nap. You get up from the sofa, shake off the remaining traces of sleep and take a look around."
	

Chapter Custom JavaScript

[Here we run some custom JavaScript that has been defined in the ]
Instead of examining the Pacman clock when Vorple is supported:
	display image "alarmclock.png" in an element with class "alarmclock";
	eval "vorple.preview.createClock()".
	

Chapter Changing content

Switching to imperial units is an action out of world.
Understand "imperial" as switching to imperial units.

Carry out switching to imperial units when the thermometer is metric:
	show tooltip "Notice how the previously displayed units changed" at the last element with class "temperature";
	now the thermometer is imperial;
	place text "61 degrees Fahrenheit" inside element with class "temperature";
	place text "13 ft/s" inside element with class "windspeed".
	
Report switching to imperial units:
	say "Switched to imperial units."

Switching to metric units is an action out of world.
Understand "metric" as switching to metric units.

Carry out switching to metric units when the thermometer is imperial:
	now the thermometer is metric;
	place text "16 degrees Celcius" inside element with class "temperature";
	place text "4 m/s" inside element with class "windspeed".
	
Report switching to metric units:
	say "Switched to metric units."
	

Chapter Dialogs

Showing about is an action out of world.
Understand "about" and "info" as showing about.

Carry out showing about:
	say "This is a preview of Vorple for Parchment. It demonstrates the Vorple library running on the Parchment web interpreter. The Z8 story file has been created with Inform 7.";
	mark the current action "dialog".

Crediting is an action out of world.
Understand "credits" as crediting.

Carry out crediting:
	try requesting the story file version;
	say "[bold type]Vorple[roman type] by Juhana Leinonen (MIT license)[line break]
[bold type]IF introduction video[roman type] by Jason McIntosh[line break]
[bold type]Music video[roman type] by MC Frontalot, directed by Jason Scott[line break]
[bold type]Pacman clock picture[roman type] by puck-man (CC-NC-SA)[line break]
[bold type]Lamp picture[roman type] by Juhana Leinonen (CC-BY)[line break]";
	mark the current action "dialog".
	 
Tipping is an action out of world.
Understand "tip" and "tips" as tipping.

Carry out tipping:
	say "Try to examine the objects: painting, clock, thermometer, lamp, and television.

See what happens if you type in a command the parser doesn't understand.

Try some out of world actions like VERSION or BRIEF.

Undo a command.";
	[A special note that's shown only in "normal" interpreters]
	if Vorple is not supported:
		say "[line break](Unfortunately in this non-Vorple version those things do absolutely nothing special.)";
	mark the current action "dialog".
	

Book Hypertext

Chapter Links

After looking for the first time (this is the show the getting started information rule):
	say "Type ";
	display "about" linking to command "about";
	say " or ";
	display "credits" linking to command "credits";
	say " for information, or ";
	display "tips" linking to command "tips";
	say " for some things to try.";
	continue the action.
	
After examining the thermometer for the first time (this is the show thermometer help rule):
	say "[italic type]Type ";
	display "imperial" linking to command "imperial";
	say " to switch to imperial units and ";
	display "metric" linking to command "metric";
	say " to switch back to metric units.[roman type]".
	

Book Multimedia

Part Images

Chapter Including images

[Note that only the filename is used when we refer to the images later.]
Release along with a file of "TV screen" called "tvscreen.png",
a file of "Lamp" called "lamp.png",
a file of "Tea Party" called "teaparty.png",
a file of "Alarm clock" called "alarmclock.png",
a file of "Logo" called "logo-300.png".


Chapter Preloading

[Preloading the images makes sure they appear immediately when they are requested.]
When play begins (this is the preload images rule):
	preload images { "tvscreen.png", "lamp.png", "teaparty.png", "alarmclock.png" }.

[Since the logo is displayed immediately as the play begins, there's no additional benefit in preloading it.]
First when play begins (this is the show logo rule):
	display image "logo-300.png", centered;


Chapter Displaying

Instead of examining the painting when Vorple is supported:
	display image "teaparty.png", centered.

[If an image "floats", text is wrapped around it.]	
Instead of examining the brass lamp when Vorple is supported:
	display image "lamp.png", floating right.


Part YouTube videos

Chapter Playing

[Here we choose a YouTube video depending on which channel the TV has been set to. You can also see the fallback that's used if the story file is played in an interpreter that doesn't support Vorple.

We also need to put in some custom JavaScript/jQuery code that will remove any video that's already playing.]
To watch tv:
	let YouTube id be some text;
	if the channel is documentary:
		now the YouTube id is "GifZWBxBDn8";
	otherwise:
		now the YouTube id is "4nigRT2KmCE";
	eval "$('.youtube').remove()";
	play a YouTube video YouTube id or fall back to say "You watch the television for a while."


Book Tooltips

Chapter Displaying

[See also the code for the thermometer in the "changing content" chapter above]

When play begins (this is the show the prompt hint rule):
	show tooltip "Type the commands here!" at the prompt.


Volume Story

Book World

Living room is a room. "There's a television by the wall opposite the sofa. A painting is hanging on the wall. Through the window you see a thermometer and a brass lamp. A Pacman clock shows the time."

Instead of going:
	say "There's no going back now." instead.

Check taking scenery:
	say "Better leave it be." instead.


Book Items

Chapter Clock

The Pacman clock is scenery in the living room. The description is "The Pacman clock shows the current time."
Understand "time" as the Pacman clock.


Chapter Lamp

The brass lamp is scenery in the living room. The description is "A brass lamp hangs outside."
Understand "lantern" as the brass lamp.


Chapter Painting

The painting is scenery in the living room. The description is "The painting depicts a tea party in a garden."
Understand "picture" as the painting.


Chapter Sofa

The sofa is scenery in the living room. The description is "There's nothing special about the sofa."

Before doing anything when the noun is the sofa or the second noun is the sofa:
	say the description of the sofa;
	say line break;
	stop the action.
	

Chapter Television

The television is scenery in the living room.  The description is "You get only two channels: the documentary channel and the music channel."
Understand "tv" and "video" as the television.

A channel is a part of the television. The channel can be documentary or music. The channel is documentary.

Before examining the television when Vorple is supported:
	watch tv.
	
Instead of switching on the television:
	try examining the television.
	
Instead of switching off the television:
	say "You turn the television off.";
	eval "$('.youtube').remove()".

Changing the channel to is an action applying to one topic.
Understand the command "watch" as something new.
Understand "watch [text]" and "change channel to [text]" as changing the channel to.

Instead of changing the channel to "doc/documentary":
	now the channel is documentary;
	watch tv.
	
Instead of changing the channel to "music":
	now the channel is music;
	watch tv.

Check changing the channel to:
	say "There's no such channel." instead.


Chapter Thermometer

The thermometer is scenery in the living room. The description is "The thermometer shows that the outside temperature is [outside temperature]. Being a highly sophisticated device it also shows the wind speed, [wind speed]."
Understand "temperature" and "wind" and "speed" as the thermometer.

The thermometer can be imperial or metric. The thermometer is metric.

To say outside temperature:
	say "[if the thermometer is imperial]61 degrees Fahrenheit[otherwise]16 degrees Celcius" inside element with class "temperature".

To say wind speed:
	say "[if the thermometer is imperial]13 ft/s[otherwise]4 m/s" inside element with class "windspeed".

