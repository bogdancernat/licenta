'use strict';

/**
 * @ngdoc function
 * @name bounceApp.controller:MapController
 * @description
 * # MapController
 * Controller of the bounceApp
 */

angular.module('bounceApp')
  .controller('MapController', function ($scope, $routeParams, $location, $socket, $localStorage) {
    $scope.mapIsVisible = false;
    $scope.locationToShare = null;

    var map
    , mapOptions = {
        center: {
          lat: 47.156944,
          lng: 27.590278
        },
        zoom: 16,
        panControl: true,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        overviewMapControl: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }
    , geolocation = null
    , marker = null
    ;

    $scope.toggleMap = function () {
      this.mapIsVisible = !this.mapIsVisible;

      if (this.mapIsVisible && !map) {
        if (!geolocation) {
          try {
            navigator.geolocation.getCurrentPosition(function (position) {
              geolocation = position;
              initMap(geolocation);
            });
          } catch (e) {
            console.error(e);
            initMap();
          }
        } else {
           initMap(geolocation);
        }
      } else {
        if (marker) {
          marker.setMap(null);
          marker = null;
          this.locationToShare = null;
        }
      }
    };

    $scope.shareLocation = function () {
      $scope.$emit('send-location-message', {
        lat: this.locationToShare.A,
        lng: this.locationToShare.F
      });

      this.toggleMap();
    };

    function initMap (position) {
      if (position) {
        mapOptions.center.lat = position.coords.latitude;
        mapOptions.center.lng = position.coords.longitude;
      }

      map = new google.maps.Map(document.querySelector('.map__canvas'), mapOptions);
      google.maps.event.addListener(map, 'click', function (event) {
        setMarker(event.latLng);
      });
    }

    function setMarker (latLng) {
      if (!marker) {
        marker = new google.maps.Marker({
          position: latLng,
          map: map
        });
        $scope.locationToShare = latLng;
        $scope.$apply();
      } else {
        marker.setPosition(latLng);
      }
    }
  });
