/********************************************************************************
 *
 *  Copyright (c) 2009, Conan Albrecht <conan@warp.byu.edu>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *********************************************************************************
 *
 *  JS Jeopardy! is a simple Jeopardy game meant for teachers, presenters, and
 *  others.  It is written in pure JavaScript, so it doesn't require a web 
 *  server, although it can be run from one.
 *  
 *  Installation:
 *    1. Unzip the distribution to a directory on your computer.
 *    2. Populate the data.txt file with categories, questions, and answers.
 *       The first row is always ignored (it's a header).  Any questions in
 *       the special category "Final Jeopardy" are shown on the side of the
 *       screen.
 *    3. Load index.html into your browser by selecting File | Open from 
 *       your browser's menu.  The board should load.
 *    4. To customize the background, save a new graphic to wallpaper.jpg.
 *    5. To customize the colors and/or fonts, modify the jeopardy.css file.
 *  
 *  Instructions:
 *    See the index.html page (near the bottom) for a detailed set of
 *    instructions.
 *   
 *  Note that if you leave the page, refresh the page, or crash your browser,
 *  your game is lost.  That's the breaks with client-side web. :P
 *
 *  Enjoy!
 * 
 *********************************************************************************
 *                                CHANGELOG
 * 
 * 2009-04-09 First version up and running.  Tested in Safari and Firefox.
 *            How sweet is Firebug for debugging!
 * 2009-04-13 Made changes for IE.  After a frustrating afternoon of debugging
 *            with little support from IE, it now works there too. :)
 * 2009-05-13 Fixed a small loadingAnimation.gif bug.
 *            Added an alert if the user doesn't specify any questions.
 *
 *********************************************************************************/
 
/** The version number of this game */
var VERSION = '0.12'; 
 
/** The current question being shown */
var currentquestion = null;

/** Holds all categories and questions */
var categories = [];

/** Holds the player information */
var players = [];


/////////////////////////////////////////////////////////////////////////////////////
//   DELIMITED TEXT READING FUNCTIONS
//

/** A few Javascript additions to mimic Java string methods */
String.prototype.trim = function() { return (this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, "")) }
String.prototype.startsWith = function(str) { return (this.match("^"+str)==str) }
String.prototype.endsWith = function(str)  {return (this.match(str+"$")==str) }
String.prototype.replaceAll = function(orig, repl) { var temp = this; while (temp.indexOf(orig) >= 0) { temp = temp.replace(orig, repl); } return temp; }

/** Checks the given field to see if it ends with a qualifier. */
function isEndQualifier(field, qualifier) {
    var qualifiers = qualifier;
    var numQualifiers = 0;
    while (field.endsWith(qualifiers)) {
        numQualifiers++;
        qualifiers += qualifier;
    }//while
    return numQualifiers % 2 == 1;
}//isEndQualifier

/** Converts delimited text (CSV, TSV) to a two dimensional array */
function convert_csv(csv_text, delimiter, qualifier) {
  delimiter = delimiter === undefined ? '\t' : delimiter;
  qualifier = qualifier === undefined ? '"' : qualifier;
  csv_text = csv_text.replaceAll("\r\n", "\n").replaceAll("\r", "\n"); // convert all files to Unix-style line endings
  var data = [];
  var doublequalifier = qualifier + qualifier;
  var lines = csv_text.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var record = [];
    var fields = line.split(delimiter);
    var combofield = null;
    for (var j = 0; j < fields.length; j++) {
      var field = fields[j];
      if (combofield == null) { // we're not in quotes at the moment
        if (field.startsWith(qualifier) && isEndQualifier(field, qualifier)) { 
          // if the field starts and ends with a qualifier, remove the qualifiers and add the field
          field = field.substr(qualifier.length, field.length - (qualifier.length*2)); // take off the qualifier
          field = field.replaceAll(doublequalifier, qualifier); // for any qualifiers within the text that were doubled
          record[record.length] = field;
            
        }else if (field.startsWith(qualifier)) { 
          // if the field starts with a qualifier but doesn't end with one, we have to start quotes mode
          combofield = field.substr(qualifier.length); // take the qualifier off the beginning
          
        }else{
          // the field doesn't have qualifiers, so just add the field
          field = field.replaceAll(doublequalifier, qualifier); // for any qualifiers within the text that were doubled
          record[record.length] = field;
        }//if
        
      }else{ // we're in quotes mode at the moment
        if (isEndQualifier(field, qualifier)) {
          // we found the end qualifier, so add the combofield
          combofield += delimiter + field.substr(0, field.length - qualifier.length); // take off the qualifier
          combofield = combofield.replaceAll(doublequalifier, qualifier); // for any qualifiers within the text that were doubled
          record[record.length] = combofield;
          combofield = null; 
          
        }else{
          // we haven't found the end qualifier, so just append the field to combofield and go to the next one
          combofield += delimiter + field;
        }//if
      }//if
    }//for
    data[data.length] = record;
  }//for

  return data;
}//convert_csv


/////////////////////////////////////////////////////////////////////////////////////
//   Factory functions to create objects
//

/** Creates a question object */
function createQuestion(category, points, answer, question) {
  return {
    'finaljeopardy' : false,
    'category' : category,
    'points'   : points,
    'answer'   : answer,
    'question' : question,
    'gridid'   : ''  // set when placed on the screen
  };
}

/** Creates a player object */
function createPlayer(name) {
  return {
    "name" : name,
    "score" : 0
  };
}//createPlayer

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

/////////////////////////////////////////////////////////////////////////////////////
//   Main method of the program (called by the HTML page when loading is finished)  
//

/** Loads the game data */
function loadGame() {
  // parse the csv_text into an array of question objects
  // this loads the questions into an ordered array, even if the user has them
  // out of order in the data file
  var data = convert_csv(document.getElementById("setupdata").value);
  var max_questions_in_category = 0;
  categories[0] = []; // add a hard coded element for final jeopardy
  for (var i = 1; i < data.length; i++) {  // skip the header row
    if (data[i].length >= 4) {
      var question = createQuestion(data[i][0], (parseInt(data[i][1]) ? parseInt(data[i][1]) : 0), data[i][2], data[i][3]);
      // find the category for this question (even if they are out of order in the CSV file)
      var index = 0;
      if (question.category.toLowerCase() == 'final jeopardy') {
        question.finaljeopardy = true;
      }else{
        for (index = 1; index < categories.length; index++) {
          if (categories[index][0].category.trim() == question.category.trim()) {
            break;
          }
        }
        // if a new category name, add it to the categories list
        if (index == categories.length) {
          categories[index] = [];
        }
      }//if
      // add the question to this category
      categories[index][categories[index].length] = question;
      max_questions_in_category = Math.max(max_questions_in_category, categories[index].length);
    }//if
  }//for i
  
  // ensure we have some questions
  if (categories.length <= 1) { 
    alert("You didn't specify any questions, or you didn't format them correctly.  You may want to try loading the example game data for a demo (click the yellow link just above the text box).");
    return;
  }

  // create the table grid (category headers first, then grid items)
  var cellwidth = parseInt(100 / categories.length);
  var html = '';
  html += '<table class="grid">';
  html += "<tr>";
  for (var col = 1; col < categories.length; col++) {
    html += '<td width="' + cellwidth + '%" id="grid' + col + '">';
    html += '<div class="dialog-blue"><div class="content-blue"><div class="t-blue"></div>';
    html += '<div id="gridheader' + col + '" class="gridheader">' + categories[col][0].category + '</div>'
    html += '</div><div class="b-blue"><div></div></div></div>';
    html += '</td>';
  }//for col
  html += "</tr>";
  for (var row = 0; row < max_questions_in_category; row++) {
    html += "<tr>";
    for (var col = 1; col < categories.length; col++) {
      var gridid = "grid" + col + '-' + row;
      question = categories[col][row];
      if (question) {
        question.gridid = gridid;
        html += '<td width="' + cellwidth + '%" onclick="showQuestion(' + row + ', ' + col + ')"">';
        html += '<div class="dialog-blue" id="' + gridid + '">';
        html += '<div class="content-blue"><div class="t-blue"></div>';
        html += '<div class="griditem">$' + question.points + '</div>';
        html += '</div><div class="b-blue"><div></div></div></div>';
        html += '</td>';
      }else{
        html += "<td>&nbsp;</td>";
      }//if
    }//for col
    html += "</tr>";
  }//for row
  html += '</table>';
  document.getElementById('griddiv').innerHTML = html;
  
  // set the height of all cells in the header row to be the same height (in case some go multi-line)
  checkHeaderHeight();  
  // add players to the board
  var setupnumplayers = document.getElementById('setupnumplayers');
  var numplayers = parseInt(setupnumplayers.options[setupnumplayers.selectedIndex].text);
  for (var i = 1; i <= numplayers; i++) {
    players[players.length] = createPlayer('Player ' + i);
  }//for
  refreshPlayers();

  // set the final jeopardy questions
  html = '';
  html += '<table class="grid">';
  var col = 0;
  for (var row = 0; row < categories[col].length; row++) {
    var gridid = "grid" + col + '-' + row;
    question = categories[col][row];
    question.gridid = gridid;
    html += "<tr>";
    html += '<td width="' + cellwidth + '%" onclick="showQuestion(' + row + ', ' + col + ')"">';
    html += '<div class="dialog-blue" id="' + gridid + '">';
    html += '<div class="content-blue"><div class="t-blue"></div>';
    html += '<div class="griditem">' + question.category + '</div>';
    html += '</div><div class="b-blue"><div></div></div></div>';
    html += '</td>';
    html += "</tr>";    
  }//if
  html += '</table>';
  document.getElementById('finaljeopardydiv').innerHTML = html;
  
  // Close the setup dialog
  tb_remove();
  
  // now -- do the animation of the board coming in
  var cells = shuffle($('table.grid td, #players .dialog-black')),
  	delay = 100;
  
  for (var i=0; i<cells.length; i++) {
  	var cell = cells[i];
  	
  	cell.style.transitionDelay = (delay * i) + 'ms';
  }
  
  $('table.grid, #players').addClass('show');
  $('#fill-in')[0].play();
  
  setEvents();
}//loadGame function

function setEvents () {
	$(document).bind('keypress', keyPressEvent);
}

function keyPressEvent(e) {
	
	if (e.target.nodeName === 'INPUT') {
		return;
	}
	
	e.preventDefault();
	var player,
		char = String.fromCharCode(e.which),
		incorrectChars = 'qwerty',
		incorrectIndex = incorrectChars.indexOf(char);
	if (49 <= e.which && e.which <= 54 ) {
		player = e.which - 49;
		scoreAnswer(true, player);
		$('#correct')[0].play();
	} else if (incorrectIndex > -1){
		player = incorrectIndex;
		scoreAnswer(false, player);
		$('#incorrect')[0].play();
	} else if (char === '/') {
		$('#jeopardy-theme')[0].play();
	} else if (char === '|') {
		showQuestion(0, 0);
	} else {
		$('audio').each(function(i, el) {
			el.pause();
			el.currentTime = 0;
		})
	}
}
/** Refreshes the players boxes on the screen */
function refreshPlayers() {
  // set the player list in the main window
  var html = '';
  for (var i = 0; i < players.length; i++) {
    var player = players[i];
    html += '<div class="dialog-black" onclick="editPlayer(' + i + ')">';
    html += '<div class="content-black"><div class="t-black"></div><div class="playerinfo">';
    html += '<span class="playername">' + player.name + ': </span>';
    html += '<span class="playerscore" id="playerscore' + i + '">' + player.score + '</span>';
    html += '</div></div><div class="b-black"><div></div></div></div>'
  }//for i  
  document.getElementById("players").innerHTML = html;
  
  // set the player grading table in the answer window
  var row1 = '';
  for (var i = 0; i < players.length; i++) {
    var player = players[i];
    row1 += '<td>';
    row1 += '<div id="answerWindowPlayer' + i + '">';
    row1 += '<div class="answerPlayerName" id="answerPlayerName' + i + '">' + player.name + '</div>';
    row1 += '<div class="answerWindowGrades" id="answerWindowGrade' + i + '">';
    row1 += '<img src="correct.png" onclick="scoreAnswer(true, ' + i + ')">';
    row1 += '&nbsp;&nbsp;&nbsp;';
    row1 += '<img src="incorrect.png" onclick="scoreAnswer(false, ' + i + ')">';
    row1 += '</div>';
    row1 += '<div class="answerWindowScores" id="answerscorediv' + i + '"><input type="text" size="7" value="" id="answerscore' + i + '"></div>';
    row1 += '</div>';
    row1 += '</td>';
  }//for i
  document.getElementById("questionplayers").innerHTML = '<table class="questionPlayerTable"><tr>' + row1 + '</tr></table>';
}//refreshPlayers


/** Resizes the column headers to ensure they have the same width. */
function checkHeaderHeight() {
  // this is a total kludge, but it allows me to vertically center the text (which the CSS-based pretty boxes don't let me do otherwise)
  var maxheight = 0;
  for (var col = 1; col < categories.length; col++) {
    maxheight = Math.max(maxheight, document.getElementById('gridheader' + col).offsetHeight);
  }//for col
  for (var col = 1; col < categories.length; col++) {
    var gridheader = document.getElementById('gridheader' + col);
    front = false;
    
  }//for col
}//checkHeaderSize


/** Edits a player */
function editPlayer(index) {
  var player = players[index];
  document.getElementById('editplayerindex').value = index;
  document.getElementById('editplayername').value = player.name;
  document.getElementById('editplayerscore').value = player.score;
  tb_show('Edit ' + player.name, '#TB_inline?height=250&width=300&inlineId=editPlayerWindow', null);
}//editPlayer


/** Saves edited player changes */
function savePlayer() {
  var player = players[parseInt(document.getElementById('editplayerindex').value)];
  // if changes are made here, they must be replicated in addPlayerAt below
  player.name = document.getElementById('editplayername').value;
  var newscore = parseInt(document.getElementById('editplayerscore').value);
  if (!isNaN(newscore)) {
    player.score = newscore;
  }
  refreshPlayers();
  tb_remove();
}


/** Deletes a player */
function deletePlayer() {
  var index = parseInt(document.getElementById('editplayerindex').value);
  var player = players[index];
  if (players.length > 1) {
    if (confirm("Delete " + player.name + "?")) {
      players.splice(index, 1);
      refreshPlayers();
      tb_remove();
    }
  }else{
    alert("The game wouldn't be any fun without at least one player!");  
  }
}

/** Adds a player at the specified position */
function addPlayerAt(index) {
  // save content just in case the user modified this user
  var player = players[parseInt(document.getElementById('editplayerindex').value)];
  player.name = document.getElementById('editplayername').value;
  player.score = parseInt(document.getElementById('editplayerscore').value);
  players.splice(index, 0, createPlayer('Player ' + (players.length+1)));
  refreshPlayers();
  editPlayer(index);
}

/** Adds a player before the one we're editing */
function addPlayerBefore() {
  var index = parseInt(document.getElementById('editplayerindex').value);
  addPlayerAt(index);
}


/** Adds a player after the one we're editing */
function addPlayerAfter() {
  var index = parseInt(document.getElementById('editplayerindex').value);
  addPlayerAt(index+1);
}


/** Returns whether grid items still exist on the board (not counting final jeopardy) */
function isBoardEmpty() {
  for (var i = 1; i < categories.length; i++) {
    for (var j = 0; j < categories[i].length; j++) {
      if (document.getElementById(categories[i][j].gridid).style.visibility != 'hidden') {
        return false;
      }//if
    }
  }//for
  return true;
}//isBoardEmpty


/** Shows a question when it is clicked */
function showQuestion(row, col) {
  currentquestion = categories[col][row];
  // if this grid item has been hidden, just show it
  if (document.getElementById(currentquestion.gridid).style.visibility == 'hidden') {
    document.getElementById(currentquestion.gridid).style.visibility = 'visible';
    return;
  }//if
  // if this is a final jeopardy question and we still have grid items, ask the user if he's sure
  if (currentquestion.finaljeopardy && !isBoardEmpty()) {
    /* if (!confirm("Items still exist on the board.  Are you sure you want to continue to final jeopardy?")) {
      return;
    }*///if
  }//if
  // set up the question dialog
  document.getElementById("popuptext").innerHTML = currentquestion.answer;
  for (var index = 0; index < players.length; index++) {
    document.getElementById("answerscore" + index).value = currentquestion.points;
    document.getElementById("answerscorediv" + index).style.visibility = (currentquestion.finaljeopardy ? 'visible' : 'hidden');
  }//for
  // hide the grid item for this answer
  document.getElementById(currentquestion.gridid).style.visibility = 'hidden';
  // ensure the answer correct/incorrect divs are visible
  for (var index = 0; index < players.length; index++) {
    document.getElementById("answerPlayerName" + index).style.color = "#FFFFFF";
    document.getElementById("answerWindowGrade" + index).style.visibility = "visible";
    document.getElementById("answerWindowPlayer" + index).style.visibility = 'visible';
  }//for
  // show the dialog
  var width = $(window).width();
  	height = $(window).height();
  tb_show(currentquestion.category, '#TB_inline?height=' + height + '&width=' + width + '&inlineId=questionWindow', null);
}//showQuestion


/** Toggles the answer and question in the answer window */
function toggleAnswer(showQuestion) {
  // ensure we are looking at a question
  if (currentquestion == null) {
    return;
  }
  // toggle the question or answer
  if (showQuestion || document.getElementById("popuptext").innerHTML == currentquestion.answer) {
    document.getElementById("popuptext").innerHTML = currentquestion.question;
  }else{
    document.getElementById("popuptext").innerHTML = currentquestion.answer;
  }//if  
}//toggleAnswer


/** Scores an answer for a player */
function scoreAnswer(correct, index) {
  // ensure we are looking at a question
  if (currentquestion == null) {
    return;
  }
  // get the player and add or remove to the score
  var player = players[index];
  var adjustment = (correct ? 1 : -1) * parseInt(document.getElementById("answerscore" + index).value);
  if (!isNaN(adjustment)) {
    player.score += adjustment;
  }
  // update the player score on the screen
  document.getElementById("playerscore" + index).innerHTML = player.score;

  // adjust the screen based on the answer the player gave
  if (currentquestion.finaljeopardy) {
    document.getElementById("answerscorediv" + index).style.visibility = "hidden";
    document.getElementById("answerWindowGrade" + index).style.visibility = "hidden";
    if (correct) {
      document.getElementById("answerPlayerName" + index).style.color = "#FFFFCC";
    }
    
  }else if (correct) {
    document.getElementById("answerPlayerName" + index).style.color = "#FFFFCC";
    for (var i = 0; i < players.length; i++) {
      document.getElementById("answerWindowGrade" + i).style.visibility = "hidden";
      if (i != index) {
        document.getElementById("answerWindowPlayer" + i).style.visibility = 'hidden';
      }//if
    }//for i
    
  }else { // incorrect
    document.getElementById("answerWindowPlayer" + index).style.visibility = 'hidden';
    document.getElementById("answerWindowGrade" + index).style.visibility = "hidden";
  }//if
  
  // if all are answered, show the question
  var allhidden = true;
  for (var i = 0; i < players.length; i++) {
    if (document.getElementById("answerWindowGrade" + i).style.visibility == 'visible') {
      allhidden = false;
    }
  }
  if (allhidden) {
    toggleAnswer(true);
  }
}//scoreAnswer
  
  
/** Populates the game setup window with example data */
function setupExampleData() {
  if (confirm("You are about to replace the game with example data.  This cannot be undone.  Continue?")) {
    $.ajax({
      type: "GET",
      url: "data.txt",
      dataType: "text",
      error: function (xhr, desc, exceptionobj) {
        alert('An error occurred while reading the example game data: ' + xhr.responseText);
      },
      success : function (data) {
        document.getElementById("setupdata").value = data;
      }
    })
  }//if
}//setupExampleData


/** Main method of the program */
function main() {
  document.title = "JS Jeopardy! v" + VERSION;
  // show the game setup dialog
  tb_show('JS Jeopardy', '#TB_inline?height=500&width=800&inlineId=setupWindow&modal=true', null);
}//main





