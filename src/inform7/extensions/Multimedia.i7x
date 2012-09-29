Multimedia (for Z-Machine only) by The Vorple Project begins here.

Include Vorple Core by The Vorple Project.


Chapter Images

To display image (file - indexed text) in a/an/-- element with class (classes - indexed text):
	display Vorple method "vorple.media.image('[file]')" in an element "div" with class "[classes] vorple-image".

To display image (file - indexed text), centered, aligned left, aligned right, floating left or floating right:
	let the alignment class be "";
	if centered, let the alignment class be "centered";
	if aligned left, let the alignment class be "left-aligned";
	if aligned right, let the alignment class be "right-aligned";
	if floating left, let the alignment class be "left-floating";
	if floating right, let the alignment class be "right-floating";
	display image file in an element with class alignment class.

To preload image (file - indexed text):
	eval "vorple.media.preloadImage('[file]');".
	
To preload images (image-list - list of indexed text):
	repeat with X running through image-list:
		preload image "[X]".


Chapter Audio

To play mp3 sound file/-- (file - indexed text):
	eval "vorple.media.playSound({'mp3':'[file]'});".

To play ogg sound file/-- (file - indexed text):
	eval "vorple.media.playSound({'ogg':'[file]'});".

To play mp3 sound file/-- (mp3 - indexed text) with an/-- ogg alternative (ogg - indexed text):
	eval "vorple.media.playSound({'mp3':'[mp3]','ogg':'[ogg]'});".

To play mp3 music file/-- (file - indexed text):
	eval "vorple.media.playMusic({'mp3':'[file]'});".

To play ogg music file/-- (file - indexed text):
	eval "vorple.media.playMusic({'ogg':'[file]'});".

To play mp3 music file/-- (mp3 - indexed text) with an/-- ogg alternative (ogg - indexed text):
	eval "vorple.media.playMusic({'mp3':'[mp3]','ogg':'[ogg]'});".

To stop music:
	eval "vorple.media.stopMusic();".


Chapter Video

To play a/the/-- YouTube video (id - text):
	display Vorple method "vorple.media.youtube('[id]',{width:600})" in an element "div" with class "youtube".
	
Multimedia ends here.


---- DOCUMENTATION ----


Chapter: Directories

The media files should be placed to the following directories in the project folder:

	Release/media/image
	Release/media/audio
	Release/media/music

You should first release the project once (with the 'release along with the "Vorple" interpreter' line) so that the Release directory is created. Then create the subdirectories and place the media files there.


Chapter: Images

Images can be displayed using the "display image" command:

	display image "pic.jpg";

By default the image is displayed aligned left. The position can be changed by giving it as a parameter:

	display image "pic.jpg", centered;

The possible values are centered, aligned left, aligned right, floating left or floating right. Text is wrapped around floating images.

Images should be in either jpg, png or gif formats.


Section: Preloading images

Images can be preloaded either individually or as a list:

	preload image "pic.jpg";
	preload images { "pic1.jpg", "pic2.png" };

Preloading images makes them appear immediately when they are needed. Otherwise the images are loaded only when they are first displayed which may take some time with slower connections.


Chapter: Audio

There are two types of audio: sound effects and music. The main difference is that multiple sound effects can be played at the same time (and as background music is playing). Starting to play new music will stop the old music track. 

When playing audio you must specify the format (mp3 or ogg):

	play mp3 sound file "bang.mp3";
	play ogg sound file "whistle.ogg";
	play mp3 music file "horns.mp3";
	play ogg music file "dance.ogg";

For maximum compatibility with different browsers you can supply audio in both formats:

	play mp3 sound file "crash.mp3" with ogg alternative "crash.ogg";
	play mp3 music file "choir.mp3" with ogg alternative "choir.ogg";

In this case if the browser can't play the mp3 version, it will play the ogg version instead. The sound files should therefore be identical except for the format.


Chapter: YouTube videos

We can play YouTube videos with:

	play YouTube video "9d4Fu90ubmA";

The string of numbers and letters is the id of the video we want to show. The id can be seen in the browser's address bar when viewing the video in YouTube, for example "http://www.youtube.com/watch?v=9d4Fu90ubmA".
	
