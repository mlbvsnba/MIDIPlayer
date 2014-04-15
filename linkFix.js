$(document).ready(function () {
    $('a[href$="mid"],a[href$="MID"],a[href$="Mid"]').click(function (e) {
    	var fUrl = encodeURIComponent($(this).attr('href'));
    	var curr = encodeURIComponent(window.location);
        window.location = 'midiplayer.html?title=' + fUrl + '&ret=' + curr;
        e.preventDefault();
        return false;
    });
});
