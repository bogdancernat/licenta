'use strict';

/**
 * @ngdoc service
 * @name bounceApp.scroll
 * @description
 * # scroll
 * Service in the bounceApp.
 */
angular.module('bounceApp')
  .service('scroll', function scroll () {
    var chatSly
    , $wrapper
    ;

    return {
      initChatScroll: initChatScroll,
      refreshChatScroll: refreshChatScroll
    };

    function initChatScroll () {
      $wrapper = $('.chat-wrapper__messages');

      chatSly = new Sly($wrapper, {
        speed: 100,
        scrollBar: $('.chat-wrapper__messages__scrollbar'),
        dragHandle: 1,
        touchDragging: 1,
        dynamicHandle: 1,
        easing: 'swing',
        clickBar: 1,
        scrollBy: 200,
        speed: 0,
        scrollTrap: true,
      }).init();

      chatSly.toEnd();
    }

    function refreshChatScroll () {
      if (!$wrapper || !$wrapper.length || !$.contains(document, $wrapper[0])) {
        initChatScroll();
      }

      if (chatSly) {
        var goToEnd = false;

        if (chatSly.pos.cur === chatSly.pos.end) {
          goToEnd = true;
        }

        chatSly.reload();

        if (goToEnd) {
          chatSly.toEnd();
        }
      }
    }
  });
