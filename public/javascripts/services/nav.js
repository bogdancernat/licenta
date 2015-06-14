'use strict';

/**
 * @ngdoc service
 * @name bounceApp.nav
 * @description
 * # nav
 * Service in the bounceApp.
 */
angular.module('bounceApp')
  .service('nav', function nav() {
    var states = {
      menuIsOpen: false,
      peersMenuIsOpen: false,
      roomUrlIsOpen: false
    };

    function toggleMenu () {
      states.menuIsOpen = !states.menuIsOpen;

      if (states.menuIsOpen) {
        states.peersMenuIsOpen = false;
        states.roomUrlIsOpen = false;
      }
    }

    function togglePeersMenu () {
      states.peersMenuIsOpen = !states.peersMenuIsOpen;

      if (states.peersMenuIsOpen) {
        states.menuIsOpen = false;
        states.roomUrlIsOpen = false;
      }
    }

    function toggleRoomUrl () {
      states.roomUrlIsOpen = !states.roomUrlIsOpen;

      if (states.roomUrlIsOpen) {
        states.peersMenuIsOpen = false;
        states.menuIsOpen = false;
      }
    }

    return {
      states: states,
      togglePeersMenu: togglePeersMenu,
      toggleMenu: toggleMenu,
      toggleRoomUrl: toggleRoomUrl
    };
  });
