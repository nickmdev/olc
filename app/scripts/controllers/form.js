'use strict';

var ModalCtrl = ['$scope', '$sce', '$modalInstance', 'message', function ($scope, $sce, $modalInstance, message) {
	$scope.body = $sce.trustAsHtml(message);

	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
}];

var YesNoCtrl = ['$scope', '$sce', '$modalInstance', 'message', function ($scope, $sce, $modalInstance, message) {
	$scope.message = $sce.trustAsHtml(message);

	$scope.yes = function () {
        $modalInstance.close('yes');
    };
	
	$scope.no = function () {
        $modalInstance.close('no');
    };
}];

angular.module('olcApp')
  .controller('FormCtrl', ['$scope', '$route', '$location', '$sce', '$interval', '$modal', 'Service', 'Global',
	function ($scope, $route, $location, $sce, $interval, $modal, Service, Global) {
    
	$scope.isLoading = true;
	
	// datetime var
	var timerRefresh;
	var timerInit;
	var tickerCount = 0;
	var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	$scope.dateTime;
	$scope.dateIndex;
	$scope.timeIndex;		
	$scope.dateAlphaIndex;
	$scope.timeAlphaIndex;	
	
	$scope.childFormActive = Global.get('childFormActive');
	$scope.formTitle = Global.get(($scope.childFormActive === true) ? 'childFormName' : 'formName');
    $scope.form_data = '';
	$scope.messageCollapsed = true;
	$scope.rowSelected = null;
	
	var formError = false;

    $scope.init = function() {
        $scope.loadForm();
    };

    $scope.loadForm = function() {
		if(Global.get('reloadParent') === true) {
			console.log('Loading parent form data');
			console.log(angular.toJson(Global.get('parentFormData')));
			$scope.form_data = Global.get('parentFormData');
			$scope.postKeyValues();
		} else {
			Global.set('blurStatus', 'off');
			Global.set('blurObject', '');
			Global.set('errorField', '');
			console.log('Attempting to load form: ' + $scope.formTitle);
			Service.call(
				'get_webform_elements',
				{
					trans_type: Global.get(($scope.childFormActive === true) ? 'childTransType' : 'transType'),
					form_id: Global.get(($scope.childFormActive === true) ? 'childFormId' : 'formId'),
				},
				function (r) {
					var response = r;
					$scope.form_data = response.set_fields;
					console.log('Form Load: ' + angular.toJson($scope.form_data));
					$scope.customFormBuild();
				}
			);
		}
    };
	
	$scope.buildTableHeaders = function(obj) {
		//console.log('Obj to add to: ' + angular.toJson(obj));
		//obj.tableHeaders = ['Stock Area','Bin','S/N - Lot','Quantity on Hand'];
		
        Service.call(
            'get_table_headings',
            {
                trans_type: Global.get(($scope.childFormActive === true) ? 'childTransType' : 'transType'),
                form_id: Global.get(($scope.childFormActive === true) ? 'childFormId' : 'formId'),
				tbl_name: obj.name
            },
            function (r) {
                var response = r;
				obj.tableHeaders = response.row_data;
				console.log('Table Headings Response: ', angular.toJson(response));
				$scope.applyDefaults();
            }
        );			
		
	};
	
	$scope.onFocus = function() {
		console.log('Special Focus Event');
		var obj = {};
		if(Global.get('blurStatus') === 'on') {
			obj = Global.get('blurObject');
			console.log('This object called blur: ' + obj.name);
			// did we have a previous error on the form?
			if(Global.get('errorField') === '' || obj.name === Global.get('errorField')){
				var checkFieldsArray = (obj.check_fields !== null) ? $scope.buildCheckFields(obj.check_fields) : [];
				Service.call(
					'on_change',
					{
						current: [
							Global.get(($scope.childFormActive === true) ? 'childTransType' : 'transType'),
							Global.get(($scope.childFormActive === true) ? 'childFormId' : 'formId'),
							obj.name,
							obj.value
						],
						check_fields: checkFieldsArray
					},
					function (r) {
						var response = r;
						console.log('On Change: ', angular.toJson(response));
						$scope.updateForm(response);
						console.log('Resetting blur objects to defaults');
						Global.set('blurStatus', 'off');
						Global.set('blurObject', '');
					}
				);
			}
		}	
	};
	
	$scope.buildTableData = function(obj) {
		/*
		obj.tableData = [];
		obj.tableData.push(['CJM1','CJM1000','','593.0000']);
		obj.tableData.push(['CJM1','CJM1000','103828','95.0000']);
		obj.tableData.push(['CJM1','CJM1001','','2.0000']);
		obj.tableData.push(['CJM1','CJM1002','','8.0000']);
		obj.tableData.push(['CJM2','CJM2001','','3.0000']);
		*/
		var fieldsArray = $scope.buildAllFieldValues();
        Service.call(
            'get_table_contents',
            {
                trans_type: Global.get(($scope.childFormActive === true) ? 'childTransType' : 'transType'),
                form_id: Global.get(($scope.childFormActive === true) ? 'childFormId' : 'formId'),
				tbl_name: obj.name,
				form_fields: fieldsArray
            },
            function (r) {
                var response = r;
				console.log('Table content Response: ', angular.toJson(response));
            }
        );			
		
	};	
	
	$scope.selectTableRow = function(id, obj) {
		//console.log('Row selected: ' + id);
		$scope.rowSelected = id;
		// if check_fields is null then just give the table name back
		obj.check_fields = (obj.check_fields == null) ? obj.name : obj.check_fields;
		$scope.btnCall(obj, false);
	};
	
	$scope.isDisabled = function(value) {
		return (value === 'Y') ? true : false;
	};
	
	$scope.customFormBuild = function() {
		var lookupList=[],
			applyDefaults = false;
		angular.forEach($scope.form_data, function(obj){
			//Add custom attributes to form data
			obj.has_focus = false;
			obj.has_error = '';
			//Generate list of controls for which lookup data is required.
			if (obj.element_type === "select" || obj.element_type === "dropdown") {
				lookupList.push(obj);
			}
			if (obj.element_type === "table") {
				applyDefaults = true;
				$scope.buildTableHeaders(obj);
			}
			
			// element type to call server and refresh date/time
			if (obj.element_type.indexOf('timer') !== -1 ) {
				if ( angular.isDefined(timerInit) ) return;
				timerInit = true;
				for(var i=0;i<$scope.form_data.length;i+=1) {
					if($scope.form_data[i].element_type === 'datetimer') {
						$scope.dateIndex = i;
					}
					if($scope.form_data[i].element_type === 'timetimer') {
						$scope.timeIndex = i;
					}
					if($scope.form_data[i].element_type === 'datealphatimer') {
						$scope.dateAlphaIndex = i;
					}
					if($scope.form_data[i].element_type === 'timealphatimer') {
						$scope.timeAlphaIndex = i;
					}
				}
				getServerDatetime();
				
				if ( angular.isDefined(timerRefresh) ) return;
				timerRefresh = $interval(function() {
					if(tickerCount === 11) {
						getServerDatetime();
					} else {
						$scope.dateTime.setSeconds($scope.dateTime.getSeconds() + 5);
						formatDates();
					}
					
					if(tickerCount === 11) { tickerCount = 0; }
					tickerCount += 1;
					//console.log(tickerCount);

				}, 5000);
			}
			
		});


		//Enter recursive version of on_lookup.
		//One object is peeled off of lookupList each time through
		//recursive call.
		if (lookupList.length > 0) {
			applyDefaults = true;
			Service.callRecur(
				'on_lookup',
				lookupList,
				function (obj,r) {
					var response = r;
					var categories=[];
					for(var i=0;i<response.length;i+=1) {
						categories.push(response[i]);
					}
					obj.categories = categories;
				},
				function() {
					$scope.applyDefaults();
				}
			);
		} 
		
		if (applyDefaults === false) {
			$scope.applyDefaults();
		}	
	};
	
	function getServerDatetime() {
		Service.call(
			'getdatetime',
			{
				trans_type: Global.get(($scope.childFormActive === true) ? 'childTransType' : 'transType'),
				form_id: Global.get(($scope.childFormActive === true) ? 'childFormId' : 'formId')
			},
			function (r) {
				var response = r;
				var rDate = response.set_fields[0].Date.replace(/-/g , '/');
				var rTime = response.set_fields[0].Time;
				$scope.dateTime = new Date(rDate + ' ' + rTime);				
				formatDates();
			}
		);
	}
	
	function formatDates() {
		$scope.form_data[$scope.dateIndex].value = formatDateTimer($scope.dateTime);
		$scope.form_data[$scope.timeIndex].value = formatTimeTimer($scope.dateTime);
		$scope.form_data[$scope.dateAlphaIndex].value = formatAlphaDate($scope.dateTime);
		$scope.form_data[$scope.timeAlphaIndex].value = formatAlphaTime($scope.dateTime);		
	}
	
	function formatDateTimer(date) {
		return date.getFullYear() + '/' + pad2((date.getMonth() + 1)) + '/' + pad2(date.getDate());
	}

	function formatTimeTimer(date) {
		return pad2(date.getHours()) + ':' + pad2(date.getMinutes()) + ':' +  pad2(date.getSeconds());
	}

	function formatAlphaDate(d) {
		return monthNames[d.getMonth()] + ' ' + pad2(d.getDate()) + ', ' + d.getFullYear();
	}

	function formatAlphaTime(datetime) {
		var hours = datetime.getHours();
		var minutes = datetime.getMinutes();
		var ampm = hours >= 12 ? 'PM' : 'AM';
		hours = hours % 12;
		hours = hours ? hours : 12;
		minutes = minutes < 10 ? '0' + minutes : minutes;
		var strTime = hours + ':' + minutes + ' ' + ampm;
		return strTime;
	}	
	
	function pad2(number) {
		return (number < 10 ? '0' : '') + number
	}
	
	$scope.applyDefaults = function() {
		console.log('Attempting Apply Defaults');
		Service.call(
            'apply_defaults',
            {
                trans_type: Global.get(($scope.childFormActive === true) ? 'childTransType' : 'transType'),
				form_id: Global.get(($scope.childFormActive === true) ? 'childFormId' : 'formId')
            },
            function (r) {
                var response = r;
                console.log('Defaults Applied');
				$scope.updateForm(response);
            }
        );
	};
	
	$scope.postKeyValues = function() {
		console.log('Posting key value list: ' + Global.get('childCommands'));
		Service.call(
            (Global.get('reloadParent') === true) ? 'on_popup_close' : 'on_get_key_value_list',
            {
                trans_type: Global.get(($scope.childFormActive === true) ? 'childTransType' : 'transType'),
				form_id: Global.get(($scope.childFormActive === true) ? 'childFormId' : 'formId'),
				key_value_list: Global.get('childCommands')
            },
            function (r) {
                var response = r;
				Global.set('reloadParent', false);
				$scope.updateForm(response);
            }
        );
	};
	
	$scope.blurCall = function (obj) {
		if (obj.fire_change === 'Y') {
			Global.set('blurStatus', 'on');
			Global.set('blurObject', obj);
		}
    };
	
	$scope.buildCheckFields = function(fields_array) {
		var values = [];
		var i;
		var that = fields_array.split(',');
		for(i=0;i<that.length;i+=1){
			angular.forEach($scope.form_data, function(obj){
				 if (that[i] === obj.name) {
					
					switch(obj.element_type)
					{
						case 'table':
							// table element types get the selected row values
							console.log('Selected Row: ' + angular.toJson(obj.tableData[$scope.rowSelected]));
							angular.forEach(obj.tableData[$scope.rowSelected], function(cell){
								console.log(angular.toJson(cell));
								console.log(cell);
								values.push([ cell.name, cell.value ]);
							});
						break;
						
						default:
							values.push([ obj.name, obj.value ]);
						break;
					
					}
					
				 }
			});				
		}
		return values;
	};

	$scope.playAudio = function(file) {
		var audioFile = new Audio("../sounds/" + file);
        audioFile.play();
	};
	
	$scope.updateForm = function(response) {
		var i,
			updateFieldsArray = response.set_fields,
			commandArray = (response.client_commands != null) ? response.client_commands : [];
		
		// set updated field/values
		for(i=0;i<updateFieldsArray.length;i+=1){
			for (var propName in updateFieldsArray[i]) {
				angular.forEach($scope.form_data, function(obj){
					 if (propName === obj.name) {
						obj.value = updateFieldsArray[i][propName];
					 }
				});							
			}
		}		
		
		console.log('Client Commands: ' + commandArray);
		// run client commands
		if (commandArray.length > 0) {
			console.log('Running Client Commands!');
			for(i=0;i<commandArray.length;i+=1){
				switch(commandArray[i][0])
				{
				case 'set_property':
					angular.forEach($scope.form_data, function(obj){
						if (commandArray[i][1] === obj.name) {
							console.log('Should be setting: ' + commandArray[i][1] + ' property: ' + commandArray[i][2] + ' to ' + commandArray[i][3]);
							obj[commandArray[i][2]] = commandArray[i][3];
						}
					});					
					break;
				case 'refresh_heading':
					angular.forEach($scope.form_data, function(obj){
						if (commandArray[i][1] === obj.name) {
							obj.tableHeaders = commandArray[i][3];
						}
					});	
					break;
				case 'refresh_table':
					angular.forEach($scope.form_data, function(obj){
						if (commandArray[i][1] === obj.name) {
							obj.tableData = commandArray[i][3];
						}
					});	
					break;
				case 'open_popup_form':
					console.log('Open Modal Form: ' + angular.toJson(commandArray[i]));
					Global.set('parentFormData', angular.copy($scope.form_data));
					Global.set('childFormId', commandArray[i][1]);
					Global.set('childTransType', commandArray[i][2]);
					Global.set('childCommands', commandArray[i][3]);
					Global.set('childFormName', commandArray[i][4]);
					Global.set('childFormActive', true);
					$route.reload();
					break;
				case 'close_popup_form':
					console.log('Close Modal Form: ' + angular.toJson(commandArray[i]));
					Global.set('childFormActive', false);
					Global.set('childCommands', commandArray[i][1]);
					Global.set('reloadParent', true);
					$route.reload();
					break;
				case 'get_key_value_list':
					$scope.postKeyValues();
					break;
				case 'reset':
					$scope.reset();
					break;
				case 'play_sound':
					$scope.playAudio(commandArray[i][1]);
					break;
				case 'back':
					$location.path('/menu');					
					break;
				case 'need_login':
					$location.path('/main');					
					break;					
				case 'temp_message':		
				case 'modal_message':
				case 'yesno_message':
					$scope.buildMessage(commandArray[i]);
					break;								
				case 'apply_defaults':
					$scope.clearFields();
					$scope.applyDefaults();
					break;				
				}					
			}	
		}
		
		if (response.error_code === 1 && formError === false) {
			formError = true;
			$scope.errorPopover(response.focus_field, response.error_msg);
		} 
		else {
			formError = false;
			Global.set('errorField', '');
			// set focus field
			angular.forEach($scope.form_data, function(obj){
				obj.has_focus = false;
				obj.has_error = '';
				if (response.focus_field === obj.name) {
					console.log('Setting focus on ' + obj.name);
					obj.has_focus = true;
				}
			});		
		
		console.log('FOCUS: ' + $scope.focusCheck());			
		}
		
		$scope.isLoading = false;
	};
	
	$scope.buildAllFieldValues = function() {
		var values = [];
		
		angular.forEach($scope.form_data, function(obj){
			switch(obj.element_type)
			{
				case 'table':
					// table element types get the selected row values
					console.log('Selected Row: ' + angular.toJson(obj.tableData[$scope.rowSelected]));
					angular.forEach(obj.tableData[$scope.rowSelected], function(cell){
						console.log(angular.toJson(cell));
						console.log(cell);
						values.push([ cell.name, cell.value ]);
					});
				break;
				
				default:
					// skip button element types
					if(obj.element_type !== 'button') {
						values.push([ obj.name, obj.value ]);
					}
				break;
			}

		});
		return values;
	};
	
	$scope.btnCall = function(obj, showLoad) {
		if(showLoad !== false) {
			$scope.isLoading = true;
		}
		var fieldsArray = [];
		if(obj.check_fields === 'All') {
			fieldsArray = $scope.buildAllFieldValues();
		} else {
			fieldsArray = (obj.check_fields != null) ? $scope.buildCheckFields(obj.check_fields) : [];
		}

		console.log('Sending to server: ' + fieldsArray);
		
		Service.call(
			'click',
			{
				trans_type: Global.get(($scope.childFormActive === true) ? 'childTransType' : 'transType'),
				form_id: Global.get(($scope.childFormActive === true) ? 'childFormId' : 'formId'),
				btn_name: obj.name,
				form_fields: fieldsArray
			},
			function (r) {
				var response = r;
				console.log('Click Response: ', angular.toJson(response));
				$scope.updateForm(response);
			}
		);		
	};
	
	$scope.zoomCall = function(obj, showLoad) {
		if(showLoad !== false) {
			$scope.isLoading = true;
		}
		var fieldsArray = [];
		if(obj.check_fields === 'All') {
			fieldsArray = $scope.buildAllFieldValues();
		} else {
			fieldsArray = (obj.check_fields != null) ? $scope.buildCheckFields(obj.check_fields) : [];
		}

		console.log('Zoom - Sending to server: ' + fieldsArray);
		
		Service.call(
			'on_zoom',
			{
				current: [
					Global.get(($scope.childFormActive === true) ? 'childTransType' : 'transType'),
					Global.get(($scope.childFormActive === true) ? 'childFormId' : 'formId'),
					obj.name,
					obj.value
				],
				check_fields: fieldsArray
			},
			function (r) {
				var response = r;
				console.log('Zoom Response: ', angular.toJson(response));
				$scope.updateForm(response);
			}
		);		
	};
	
	$scope.testCall = function() {

		Global.set('childFormActive', false);
		Global.set('reloadParent', true);
		$route.reload();
		
		/*
		var fieldsArray = [];
			fieldsArray = $scope.buildAllFieldValues();
			
		console.log('Test Sending to server: ' + fieldsArray);
		
		Service.call(
			'click',
			{
				trans_type: ($scope.childFormActive === true) ? Global.get('childTransType') : Global.get('transType'),
                form_id: ($scope.childFormActive === true) ? Global.get('childFormId') : Global.get('formId'),
				btn_name: 'test-btn',
				form_fields: fieldsArray
			},
			function (r) {
				var response = r;
				console.log('Click Response: ', angular.toJson(response));
				$scope.updateForm(response);
			}
		);
		*/		
	};
	
	$scope.submit = function() {
		var fieldsArray = $scope.buildAllFieldValues();
        Service.call(
            'submit',
            {
                trans_type: Global.get(($scope.childFormActive === true) ? 'childTransType' : 'transType'),
				form_id: Global.get(($scope.childFormActive === true) ? 'childFormId' : 'formId'),
				form_fields: fieldsArray
            },
            function (r) {
                var response = r;
				console.log('Submit Response: ', angular.toJson(response));
				if (response.error_code === 1) {
					$scope.errorModal(response.error_msg);
				} else {
					$scope.showSuccess(response.error_msg);
				}
            }
        );		
	};
	
	$scope.reset = function() {
		$scope.clearFields();
		// set values back to default values
		angular.forEach($scope.form_data, function(obj){
			obj.value = obj.default_value;
		});		
		$scope.applyDefaults();
	};
	
	
	$scope.catFeature = function (index,code) {
		$scope.form_data[index].value = code;
	};	
	
	$scope.message = {
		header: '',
		content: '',
		type: ''
	};
			
	$scope.errorPopover = function(focusField,message) {
		angular.forEach($scope.form_data, function(obj){
			obj.has_focus = false;
			obj.has_error = '';
			if (focusField === obj.name) {
				console.log('Error Popover on: ' + focusField);
				obj.has_error = message;
				obj.has_focus = true;
				Global.set('errorField', focusField);
			}
		});
		
		console.log('FOCUS: ' + $scope.focusCheck());
	};
		
	$scope.focusCheck = function() {
		var name;
		angular.forEach($scope.form_data, function(obj){
			if (obj.has_focus === true) {
				name = obj.name;
			}
		});
		return name;
	};
		
	$scope.clearFields = function() {
		angular.forEach($scope.form_data, function(obj){
			obj.value = '';
			obj.has_error = '';
			obj.has_focus = false;
		});
		console.log('Cleared All Fields');
	};
		
	$scope.clear_errors = function() {
		angular.forEach($scope.form_data, function(obj){
			obj.has_error = '';
		});
	};
	
	$scope.buildMessage = function(message) {
		// modal or temp message?
		switch(message[0])
		{
		case 'temp_message':
			console.log('Temp Message: ' + message);
			$scope.tempMessage(message);
			break;
		case 'modal_message':
			console.log('Modal Message: ' + message);
			$scope.modalMessage(message);
			break;			
		case 'yesno_message':
			console.log('Yes/No Message: ' + message);
			$scope.modalYesNo(message);
			break;			
		}
	};
		
	$scope.tempMessage = function(message) {
		$scope.tempMessageText = message[1];
		window.scrollTo(0,0);
		$scope.messageCollapsed = false;
		setTimeout(function() {
			if (message[3] === 'reset') {
				console.log("Force reset");
				$scope.reset();
			}
			$scope.messageCollapsed = true;
			$scope.$apply();
		}, parseInt(message[2])*1000);
	};
	
	$scope.stopServerTimer = function() {
		if (angular.isDefined(timerRefresh)) {
			$interval.cancel(timerRefresh);
			timerRefresh = undefined;
		}
	};	
	
	$scope.$on('$destroy', function() {
		// Make sure that the interval is destroyed too
		$scope.stopServerTimer();
	});

	$scope.modalMessage = function (message) {
		$scope.message = message[1];
		var template = '<div class="modal-body">' +
							'<div ng-bind-html="body"></div>'+
						'</div>'+
						'<div class="modal-footer">'+
							'<button class="btn" ng-click="cancel()">Close</button>'+
						'</div>';
		var modalInstance = $modal.open({
		  template: template,
		  controller: ModalCtrl,
		  backdrop: 'static',
		  resolve: {
			message: function () {
			  return $scope.message;
			}
		  }
		});

		modalInstance.result.then(function () {
		}, function () {

		});
	};
	
	$scope.modalYesNo = function (message) {
		$scope.message = message[1];
		var template =  '<div class="modal-body">' +
							'<div ng-bind-html="message"></div>'+
						'</div>'+
						'<div class="modal-footer">'+
							'<button ng-click="yes()" class="btn btn-primary">Yes</button>' +
							'<button ng-click="no()" style="margin-left:10px" class="btn btn-default">No</button>'+
						'</div>';
		var modalInstance = $modal.open({
		  template: template,
		  controller: YesNoCtrl,
		  backdrop: 'static',
		  resolve: {
			message: function () {
			  return $scope.message;
			}
		  }
		});

		modalInstance.result.then(function (action) {
			//console.log(action);
			Service.call(
				'on_yesno_close',
				{
					trans_type: Global.get(($scope.childFormActive === true) ? 'childTransType' : 'transType'),
					form_id: Global.get(($scope.childFormActive === true) ? 'childFormId' : 'formId'),
					yesno_id: message[2],
					yesno_value: action,
					key_value_list: message[3]
				},
				function (r) {
					var response = r;
					console.log('Yes/No Close: ', angular.toJson(response));
					$scope.updateForm(response);
				}
			);
		}, function () {

		});
	};
		
	$scope.errorModal = function (message) {
		$scope.message.header = "Error!";
		$scope.body = $sce.trustAsHtml(message);
		var modalInstance = $modal.open({
		  templateUrl: 'messageContent.html',
		  controller: ModalCtrl,
		  resolve: {
			message: function () {
			  return $scope.message;
			}
		  }
		});

		modalInstance.result.then(function () {
		}, function () {

		});
	};		
	
  }]);