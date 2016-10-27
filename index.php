<!DOCTYPE html>
<!--
 -
 -  Copyright (c) 2009, Conan Albrecht <conan@warp.byu.edu>
 -
 -  This program is free software: you can redistribute it and/or modify
 -  it under the terms of the GNU  General Public License as published by
 -  the Free Software Foundation, either version 3 of the License, or
 -  (at your option) any later version.
 -
 -  This program is distributed in the hope that it will be useful,
 -  but WITHOUT ANY WARRANTY; without even the implied warranty of
 -  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 -  GNU General Public License for more details.
 -
 -  You should have received a copy of the GNU General Public License
 -  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 -
 -->
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
<title>JS Jeopardy!</title>
<link rel="stylesheet" href="dialog2-blue.css" type="text/css" media="screen" />
<link rel="stylesheet" href="dialog2-black.css" type="text/css" media="screen" />
<link rel="stylesheet" href="fonts/stylesheet.css" type="text/css" media="screen" />
<link rel="stylesheet" href="jeopardy.css" type="text/css" media="screen" />
<link rel="stylesheet" href="thickbox.css" type="text/css" media="screen" />
<script type="text/javascript" src="jquery.js"></script>
<script type="text/javascript" src="thickbox.js"></script>
<script type="text/javascript" src="jeopardy.js"></script>
<script type="text/javascript">
  /** Starts the main function in the jeopardy.js file */
  $(document).ready(function() {
    main();
  });
</script>
</head>

<body>
<table class="main"><tr>
<td class="mainleft"><!-- start of left side of main table -->
  <div>&nbsp;</div>
  <div>&nbsp;</div>
  <div id="players">
  </div>
  <div>&nbsp;</div>
  <div>&nbsp;</div>
  <div>&nbsp;</div>
  <div id="finaljeopardydiv">
  </div>
  
</td><td class="mainright" align="top"><!-- start of right side of main table -->
  <div id="griddiv">
  </div>
</td>
</tr></table>

<div class="credits">JS Jeopardy!  Copyright (c) 2009 <a target="_blank" style="color:#FFFFCC" href="http://warp.byu.edu">Conan C. Albrecht</a>.  Released under the <a target="_blank" style="color:#FFFFCC" href="http://www.fsf.org/licensing/">GNU General Public License</a>.</div>


<!-- Hidden content for editing players -->
<div id="editPlayerWindow" class="editPlayerWindow" style="display:none;">
<div>&nbsp;</div>
<div align="center">
<input type="hidden" id="editplayerindex">
<table border=0 cellspacing=15 cellpadding=5><tr>
  <td class="editPlayerWindow">Player Name:</td>
  <td><input type="text" size="20" id="editplayername"></td>
</tr><tr>
  <td class="editPlayerWindow">Score:</td>
  <td><input type="text" size="20" id="editplayerscore"></td>
</tr></table>
</div>
<div align="right">
  <input type="button" value="&nbsp;&nbsp;Delete&nbsp;&nbsp;" onclick="deletePlayer()">
  <input type="button" value="&nbsp;&nbsp;Save&nbsp;&nbsp;" onclick="savePlayer()">
</div>
<div>&nbsp;</div>
<div>&nbsp;</div>
<div>&nbsp;</div>
<div align="center">
  <input type="button" value="&nbsp;&nbsp;Add Before&nbsp;&nbsp;" onclick="addPlayerBefore()">
  &nbsp;&nbsp;
  <input type="button" value="&nbsp;&nbsp;Add After&nbsp;&nbsp;" onclick="addPlayerAfter()">
</div>
</div>


<!-- Hidden content shown when the user clicks an answer in the grid -->
<div id="questionWindow" style="display:none;">
<div id="questionplayers"></div>
<div id="popuptext" class="popuptext" onclick="toggleAnswer()">Answer</div>
</div>


<!-- Hidden content shown at the beginning of the game -->
<div id="setupWindow" style="display:none;" class="setupWindow">
<div class="setupWindow" align="center"><h1>JS Jeopardy!</h1></div>
<div>&nbsp;</div>
<p class="setupWindow">Welcome to JS Jeopardy!  This is a free, online game for teachers within the classroom (K-12, College), presenters in any setting, or individuals wanting a fun "flash card system" to review concepts.  The program allows custom questions and answers that you specify (it doesn't come preloaded).  Games are not saved on the server, but are temporary within your browser window, so be sure to save your question files separately.</p>
  
<p class="setupWindow">Begin by entering delimited text data into the following text box.  Enter your answers and questions on the lines following the header line, in the format specified.  <i>These lines can be created most easily in a spreadsheet program like Microsoft Excel (then exported to CSV) or in a text editor and then pasted here.</i>  If you'd like to see an example, <a href="index.html#"  style="color:#FFFFCC" onclick="setupExampleData()">click here to populate the box with example data</a>.</p>
<p class="setupWindow" align="center"><textarea id="setupdata" rows="10" cols="90"><?php
	include "data.csv";
?>
</textarea></p>
<p class="setupWindow">Next, select the number of players in this game.  Once the game is started, you can add or remove players, change player names, or adjust player scores by clicking a player box on the game board.<p>
<p class="setupWindow" align="center">Number of Players:
  <select id="setupnumplayers">
      <option>1</option>
      <option>2</option>
      <option>3</option>
      <option selected>4</option>
      <option>5</option>
    </select>
</p>
<p class="setupWindow">Read below for more detailed instructions on playing and administering the game setup. Enjoy the game!</p>
<p class="setupWindow hasButton" align="center"><input style="margin-top: 40px" type="image" src="jeopardy-5309b90c30961.png" value="Play Jeopardy!" onclick="loadGame()"></p>
<div class="setupWindow">&nbsp;</div>
<div class="setupWindow">&nbsp;</div>
<h3 class="setupWindow">Instructions and Notes:</h3>
<p class="setupWindow">
<ul class="setupWindow">
  <li>This game should normally be run by a teacher, presenter, etc., on a central projector that everyone sees.  This game is not a standalone version of Jeopardy that runs itself.  It is meant as a teaching tool.
  <li>You need to be running a modern browser, such as Firefox 3+, Safari 3+, Chrome, or IE 7+. Be sure your browser is updated.  I test it most on Safari since that's my primary browser right now.
  <li>The game runs one answer board and final jeopardy.  If you need a second answer board (for double jeopardy, for example), open two browser windows and set up a game in each.  Final jeopardy can have multiple questions if you like.
  <li><i><b>If you close your browser window (or experience a browser crash), go to another site, or refresh this page, your game will be lost.</b></i>  Be sure to save your question files separately from this game!
  <li>You can have as many categories and questions as you want.  Questions in special category "Final Jeopardy" are shown on the left side of the page (games usually only have one of these).
  <li>Once the game begins, click a blue answer box to show the answer.  Click the correct or incorrect icons when users provide the right or wrong question.  Upon a correct question, the amount is added to the user's score and the dialog closes.  Upon an incorrect question, the amount is deducted from the user's score.
  <li>The answer dialog only shows the answer.  If you want to see the question (which is, um, the answer in this game :), click the answer text.  This toggles between the answer and question.
  <li>An easy way to close the answer popup box is to click anywhere on the screen behind it.
  <li>To show a previously-answered question on the grid, click the empty spot where it used to be.  It will reappear.  This is useful if you accidentally click an answer box.
  <li>To adjust a player's name or score, click the player's box.  This allows you to fix scores when you accidentally click the wrong icon in the answer dialog.
  <li>To add a new player to the game, click a player's box and use the "Add After" or "Add Before" buttons.  You can add or remove players throughout the game.
  <li>At the end of the game, click the Final Jeopardy item(s) under the list of players.  When players get this question right or wrong, the dialog does not close.  This allows you to set the wager for each team and impact their score accordingly.
  <li>To start the game over, refresh the page.  You'll be taken back to this setup page.
  <li>This game may run inside your browser, but it does not need a web server or web access.  You can simply place the files on your hard drive, open your browser, select "File | Open...", and load the index.html page to start the game.
  <li>If you are wondering, JS stands for "JavaScript" Jeopardy.  This game is entirely written in Javascript, so hence the name.
  <li>If you download this game to your computer, you can run it even when you are not connected to the Internet.  Download the application from my software page at <a target="_blank" href="http://warp.byu.edu">http://warp.byu.edu</a>.
</ul>
</p>
</div>

<div id="sounds">
	<audio id="fill-in">
		<source src="sounds/jboardfill.wav" />
	</audio>
	
	<audio id="correct">
		<source src="sounds/j64-ringin.wav" />
	</audio>
	
	<audio id="incorrect">
		<source src="sounds/Wrong-answer-sound-effect.mp3" />
	</audio>
	
	<audio id="jeopardy-theme">
		<source src="sounds/Jeopardy-theme-song.mp3" />
	</audio>
</div>
</body>
</html> 