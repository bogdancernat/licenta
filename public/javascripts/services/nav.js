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
      peersMenuIsOpen: false
    };

    function toggleMenu () {
      states.menuIsOpen = !states.menuIsOpen;
    };

    function togglePeersMenu () {
      states.peersMenuIsOpen = !states.peersMenuIsOpen;
    }

    return {
      states: states,
      togglePeersMenu: togglePeersMenu,
      toggleMenu: toggleMenu
    };
  });
