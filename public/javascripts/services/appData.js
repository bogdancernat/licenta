'use strict';

/**
 * @ngdoc service
 * @name bounceApp.appData
 * @description
 * # appData
 * Service in the bounceApp.
 */
angular.module('bounceApp')
  .service('appData', function appData() {
    var service =  {};
    var alias = "default";
    var room = "room";

    Object.defineProperty(service, "alias", {
      get: function () {
        return alias;
      },
      set: function (value) {
        if(!alias) {
          alias = value;
        }
      }
    });

    Object.defineProperty(service, "room", {
      get: function () {
        return room;
      },
      set: function (value) {
        if(!room) {
          room = value;
        }
      }
    });

    return service;
  });
