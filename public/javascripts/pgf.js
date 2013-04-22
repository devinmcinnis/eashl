// Generated by CoffeeScript 1.6.2
(function() {
  jQuery(function($) {
    var positionTimezone, timeZone;

    timeZone = $.cookie('timezone');
    if (timeZone) {
      $('body').addClass('timezone-selected');
    } else {
      $('body').delay(800).queue(function() {
        positionTimezone();
        return $(this).addClass('timezone');
      });
    }
    $(document).on('click', '#timezone li', function() {
      $.cookie('timezone', $(this).attr('data-time'), {
        expires: 365
      });
      $('#timezone').remove();
      $('body').removeClass('timezone');
      console.log(window.location.pathname.split('/')[1]);
      if (window.location.pathname.split('/')[1] === 'player') {
        return location.reload();
      }
    });
    $(document).on('click', '.change-timezone', function() {
      $('#timezone').css('display', 'block');
      return $('body').delay(800).queue(function() {
        positionTimezone();
        return $(this).addClass('timezone');
      });
    });
    return positionTimezone = function() {
      var tzHeight, tzOffset, windowHeight;

      tzHeight = $('#timezone').height();
      windowHeight = $(window).height();
      tzOffset = (tzHeight > windowHeight ? 0 : (windowHeight - tzHeight) / 2);
      return $('#timezone').css('top', tzOffset);
    };
  });

}).call(this);
