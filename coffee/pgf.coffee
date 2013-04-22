jQuery ($) ->

  timeZone = $.cookie('timezone')

  if timeZone
    $('body').addClass 'timezone-selected'
  else
    $('body').delay(800).queue () ->
      positionTimezone()
      $(this).addClass 'timezone'

  $(document).on 'click', '#timezone li', () ->
    $.cookie 'timezone', $(this).attr('data-time'), {expires: 365}
    $('#timezone').remove()
    $('body').removeClass 'timezone'
    console.log(window.location.pathname.split('/')[1])
    location.reload() if window.location.pathname.split('/')[1] is 'player'

  $(document).on 'click', '.change-timezone', () ->
    $('#timezone').css 'display', 'block'
    $('body').delay(800).queue () ->
      positionTimezone()
      $(this).addClass 'timezone'

  positionTimezone = () ->
    tzHeight = $('#timezone').height()
    windowHeight = $(window).height()

    tzOffset = (if (tzHeight > windowHeight) then 0 else (windowHeight - tzHeight) / 2)
    $('#timezone').css 'top', tzOffset