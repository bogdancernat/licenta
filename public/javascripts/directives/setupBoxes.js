angular.module('bounceApp')
  .directive('ngAliasBox', function() {
    return {
      restrict: 'E',
      templateUrl: '/javascripts/templates/alias-box.html'
    }
  });