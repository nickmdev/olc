'use strict';

angular.module('olcApp')
  .controller('MainCtrl', function ($scope, $location, Service) {

    $scope.loginError = false;
    $scope.loginErrorMessage = '';

    $scope.login = function(user) {
        Service.call(
            'login',
            {
                user_id: user.name,
                password: user.password
            },
            function (r) {
                var response = r;
                var defaultMessage = 'Invalid login, please re-enter.';
                switch (response.error_code) {
                    case 0:
                        var commandArray = (response.client_commands != null) ? response.client_commands : [];
						if(commandArray.length > 0) {
							$scope.login(user);
							return;
						} else {
							$scope.loginError = false;
							$scope.loginErrorMessage = '';
							$location.path('/menu');						
						}
                        break;
                    case 1:
                        $scope.loginError = true;
                        $scope.loginErrorMessage = response.error_msg || defaultMessage;
						//$scope.loginErrorMessage = 'Invalid login, please re-enter.';
                        break;
                }
            }
        );
    };
  });
