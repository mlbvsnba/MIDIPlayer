const baseURL = '/ketzev/';
const jumpTime = 10000; // 10 seconds
const pauseImg = "img/pause.png";
const playImg = "img/play.png";
var filePath, fileName, fileURL;
var slider, currTime, endTime;
var pbButton, forwardButton, backwardButton, speedControls, speedBtns;
var seekBarCont, mobileButton, BPMCont, BPM;
var initSlider = false;
var moveSlider = true;
var bpmFactor = 1;

$(document).ready(function () {
    init();
    playSong();
});

function init() {
    filePath  = baseURL + getParameterByName('title');
    fileName = getFileName(filePath);
    if (filePath === "") filePath  = 'N/A';
    document.title = document.title + ' - ' + fileName;
    $('#title').text(fileName);
    $('#returnLink').attr('href', getParameterByName('ret'));
    initObj();
    mobileButton.button();
    initHandlers();
}

// Initializes global jQuery DOM objects to be used later
function initObj() {
    speedControls = $('#speedControls');
    pbButton = $('#togglePlayback');
    backwardButton = $('#jumpBackward');
    forwardButton = $('#jumpForward');
    mobileButton = $('#mobileStart');
    seekBarCont = $('#seekBarContainer');
    slider = $('#seekBar');
    currTime = $('#currTime');
    endTime = $('#endTime');
    speedBtns = $('.speedBtn');
    BPMCont = $('#BPMContainer');
    BPM = $('#BPM');
}

// Initializes all jQuery handlers (click, slider events, etc.)
function initHandlers() {
    pbButton.click(togglePlayback);
    backwardButton.click(function () { jump(-jumpTime); } );
    forwardButton.click(function () { jump(jumpTime); } );
    slider.on( "slidestart", function() {
        moveSlider = false;
    }).on( "slidestop", handleSlider);
    mobileButton.click(handleMobileButton);
    speedBtns.button().click(function() {
        speedBtns.button('enable');
        $(this).button('disable');
        bpmFactor = parseFloat($(this).attr('factor'));
        setSpeed(parseFloat($(this).attr('warp')));
    }).each(function() {
        if ($(this).attr('warp') != '1') $(this).button('enable');
        else $(this).button('disable');
    });
    $('#speedChangeLink').click(setCustomSpeed);
}

// Handles a slider 'drop' event
function handleSlider(wP) {
    var wasPlaying = typeof wP == 'boolean' ? wP : MIDI.Player.playing;
    if (wasPlaying) MIDI.Player.pause();
    MIDI.Player.currentTime = slider.slider('value') / 100 * MIDI.Player.endTime;
    if (wasPlaying) MIDI.Player.resume();
    moveSlider = true;
}

function handleMobileButton() {
    mobileButton.fadeOut();
    BPMCont.fadeIn();
    seekBarCont.fadeIn();
    pbButton.fadeIn();
    forwardButton.fadeIn();
    backwardButton.fadeIn();
    speedControls.fadeIn();
    MIDI.Player.start();
}

//Initializes the keyboard shortcuts
function initShortcuts() {
    $(window).keydown(function(e) {
        var key = e.which;
        if (key == 112 || key == 32 || key == 40) {
            // p, spacebar, down arrow
            togglePlayback();
        } else if(key == 102 || key == 39) {
            // f, right arrow
            jump(jumpTime);
        } else if(key == 66 || key == 37) {
            // b, left arrow
            jump(-jumpTime);
        } else if(key == 83) {
            // s
            setCustomSpeed();            
        }
    });    
}

// Prompts the user for a warp value and reloads the midi with it
function setCustomSpeed() {
    var wasPlaying = MIDI.Player.playing;
    if (wasPlaying) MIDI.Player.pause();
    var speed = prompt("What should the timewarp value be?\n\n(> 1 is slower, < 1 is faster)", 1);
    if(speed !== null && !isNaN(speed) && speed != '' && parseFloat(speed) > 0) {
        speed = parseFloat(speed);
        //bpmFactor = 0;
        bpmFactor = speed < 1 ? 2 : 0;
        speedBtns.each(function() {
            if (parseFloat($(this).attr('warp')) != speed) {
                $(this).button('enable');
            } else {
                bpmFactor = parseFloat($(this).attr('factor'));
                $(this).button('disable');
            }
        });
        if (wasPlaying) MIDI.Player.resume();
        setSpeed(speed);
    } else if(wasPlaying) {
        MIDI.Player.resume();
    }
}

// Jumps 'diff' seconds ahead/behind in the midi
function jump(diff) {
    var wasPlaying = MIDI.Player.playing;
    if (wasPlaying) MIDI.Player.pause();
    var nTime = MIDI.Player.currentTime + diff;
    if (nTime < 0) nTime = 0;
    if (nTime > MIDI.Player.endTime) nTime = MIDI.Player.endTime;
    MIDI.Player.currentTime = nTime;
    slider.slider('value', MIDI.Player.currentTime / MIDI.Player.endTime * 100);
    if (wasPlaying) MIDI.Player.resume();
}

// Plays/pauses the midi and updates the play/pause icons
function togglePlayback() {
    var elm = $(this);
    if (MIDI.Player.playing) {
        MIDI.Player.pause();
        pbButton.attr('src', playImg);
    } else {
        MIDI.Player.resume();
        pbButton.attr('src', pauseImg);
    }
}

// loads the song set in filePath
function playSong() {
    fileURL = filePath;
    MIDI.loader = new widgets.Loader;
    MIDI.loadPlugin({
		soundfontUrl: "./soundfont/",
		instrument: "acoustic_grand_piano",
		callback: function() {
            MIDI.Player.timeWarp = 1;
			MIDI.Player.loadFile(fileURL, function() {
                if (!isMobile()) {
                    MIDI.Player.start();
                    BPMCont.fadeIn();
                    seekBarCont.fadeIn();
                    pbButton.fadeIn();
                    forwardButton.fadeIn();
                    backwardButton.fadeIn();
                    speedControls.fadeIn();
                } else {
                    mobileButton.fadeIn();
                }
            });
            MIDI.loader.stop();
            initShortcuts();
		}
	});
    MIDI.Player.setAnimation(updateSlider);
}

// Sets the warp value given by reloading the song with it
function setSpeed(warpVal) {
    var wasPlaying = MIDI.Player.playing;
    MIDI.Player.timeWarp = warpVal;
    moveSlider = false;
    MIDI.Player.stop();
    MIDI.Player.loadFile(fileURL, function() {
        handleSlider(wasPlaying);
        initSlider = false;
    });
}

// Updates the slider with the playback time - initializes slider if needed
// Note: does nothing if moveSlider == false
function updateSlider(data) {
    var now = data.now < data.end ? data.now : data.end;
    currTime.text(formatTime(now));
    if (!moveSlider) return;
    if (!initSlider) {
        slider.slider({ range: "min", min: 0, max: 100, value: data.now / data.end * 100 });
        endTime.text(formatTime(data.end));
        initSlider = true;
    } else {
        slider.slider('value', data.now / data.end * 100);
    }
}

// Formats the time given by MIDI.js
// Note: code adapted from MIDI.js examples
function formatTime(n) {
    var minutes = n / 60 >> 0;
	var seconds = String(n - (minutes * 60) >> 0);
	if (seconds.length == 1) seconds = "0" + seconds;
	return minutes + ":" + seconds;
}

// Updates the BPM displayed to the user
// Note: Only gets called from an altered jasmid Replayer
function updateBPM(bpmVal) {
    /* 
     * It seems that the warp value doesn't scale how I thought it did...
     * so instead of lying about changed BPM value, just give a general
     * >, =, or < value from the original.
     */
    var bpmText = Math.round(bpmVal, 0);
    if (bpmFactor > 1) {
        bpmText = '> ' + bpmText;
    } else if (bpmFactor < 1) {
        bpmText = '< ' + bpmText;
    }
    BPM.text(bpmText);
}

// Extracts and returns the filename from a path
function getFileName(path) {
    return path === "" ? 'N/A' : toTitleCase(path.replace(/^.*[\\\/]/, ''));
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

// Extracts and returns a 'GET' parameter by name
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// Checks if the user's browser identifies itself as a mobile browser
// This is a workaround for a 'feature' that requires user interaction
// before playing sound and is not necessary on Android devices.
function isMobile() {
    //return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    return /webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}