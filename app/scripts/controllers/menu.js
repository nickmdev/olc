'use strict';

angular.module('olcApp')
  .controller('MenuCtrl', function ($scope, $location, Service, Global) {
    $scope.formTitle = '';
    $scope.menu_data = '';
	Global.set('childFormName', '');
	Global.set('childFormId', '');
	Global.set('childTransType', '');
	Global.set('childCommands', '');
	Global.set('childFormActive', false);
	Global.set('reloadParent', false);
	$scope.isLoading = false;
		
    $scope.init = function() {
        $scope.loadFormMenu();
    };

    $scope.loadFormMenu = function() {
        $scope.formTitle = 'Menu';
		Service.call(
            'get_webform_elements',
            {
                trans_type: 'init',
                form_id: 'init'
            },
            function (r) {
                var response = r;
				console.log('Init Menu Response: ' + angular.toJson(response));
                $scope.menu_data = response.set_fields;
            }
        );
    };

    $scope.loadForm = function(form) {
        $scope.isLoading = true;
		Global.set('transType',form.value);
        Global.set('formId',form.name);
        Global.set('formName',form.text);
        console.log('LOAD FORM:: ' + 'TransType: ' + form.value + ' Form Id: ' + form.name + ' Form Name: ' + form.text);
		$location.path('/form');
    };
	
	$scope.logout = function() {
		
		Service.call(
					'logout',
					{
							user_id: '',
							password: ''
					},
					function () {
						$location.path('/main');
					}
			);		
		
		
		};
  });