'use strict';

angular.module('olcApp')
    .service('Service', function Service(Post, Global, $http, $q, $location) {
        this.call = function (func_to_call, parms, callback) {
            console.log('Function called: ' + func_to_call);
			var deffered = $q.defer();
			var calldata = {
				id: 'httpReq', //constant
				method: 'test1', //maps to Erlang func of same name
				params: ['parm1', 'parm2']
			};
			var data = [];
			
			var set_parms = function (method, parms) {
				calldata.method = method;
				calldata.params = parms;
			};
			
			var async = function (path, async_callback_fn) {
				$http.post(path, calldata)
					.success(function (d) {
						data = d.result; //data-only subset of returned object
						async_callback_fn();
						deffered.resolve();
					})
					.error(function () {
						$location.path('/main');
					});
				return deffered.promise;
			};
			
			var get_data = function () {
				console.log('Get data: ' + angular.toJson(data));
				return data;
			};
			
			set_parms(func_to_call, parms);
			async('form_svc.yaws',
                function () {
                    callback(get_data());
                });
				
        };
        this.callRecur = function (func_to_call, objList, callback, apply) {
			console.log('Function called: ' + func_to_call);
			callRecursion(func_to_call, objList, callback, apply);
        };
		var callRecursion = function(func_to_call, objList, callback, apply) {
			var crntObj = [];
			if(objList.length>0) {
                crntObj=objList.pop();
				Post.set_parms(func_to_call,{current:[Global.get('transType'), Global.get('formId'), crntObj.name, crntObj.value]});
                Post.async('form_svc.yaws',
                    function() {
                        callback(crntObj,Post.get_data());
						callRecursion(func_to_call,objList,callback,apply);
                    });
            } else {
				apply();
			}
			
		};
    })
    .service('Global', function Global() {
        var properties;
        properties = [
            {
                key: 'formId',
                value: ''

            },
            {
                key: 'formName',
                value: ''

            },
            {
                key: 'transType',
                value: ''

            },
            {
                key: 'blurStatus',
                value: 'off'

            },
            {
                key: 'blurObject',
                value: ''

            },
			{
				key: 'parentFormData',
				value: ''
			},
			{
				key: 'childFormId',
				value: ''
			},
			{
				key: 'childTransType',
				value: ''
			},
			{
				key: 'childFormName',
				value: ''
			},
			{
				key: 'childCommands',
				value: ''
			},			
			{
				key: 'childFormData',
				value: ''
			},
			{
				key: 'childFormActive',
				value: false
			},
			{
				key: 'reloadParent',
				value: false
			},
			{
				key: 'errorField',
				value: ''
			}
        ];
        this.get = function (key) {
            var i;
            for (i=0;i<properties.length;i+=1) {
                if (properties[i].key === key) {
                    return properties[i].value;
                }
            }
        };
        this.set = function (key, value) {
            var i;
            for (i=0;i<properties.length;i+=1) {
                if (properties[i].key === key) {
                    properties[i].value = value;
                }
            }
        };
    })
    .factory('Post', function ($http, $q) {
        var deffered = $q.defer();
        //JSON RPC object format required by Yaws JSON_RPC library.
        //Method and Params members shown for reference are replaced
        //by actual data at runtime.
        var calldata = {
            id: 'httpReq', //constant
            method: 'test1', //maps to Erlang func of same name
            params: ['parm1', 'parm2']
        };
        var data = [];
        var full_response = [];
        var Post = {};

        //Provide an interface into calldata object to allow
        //method (server function name) and parms to be cleanly set
        Post.set_parms = function (method, parms) {
            calldata.method = method;
            calldata.params = parms;
        };

        Post.async = function (path, async_callback_fn) {
			$http.post(path, calldata)
                .success(function (d) {
                    full_response = d; //includes error and control info
                    data = d.result; //data-only subset of returned object
                    async_callback_fn();
                    deffered.resolve();
                });
            return deffered.promise;
        };

        Post.get_data = function () {
            console.log('Get data: ' + angular.toJson(data));
			return data;
        };

        Post.get_full_response = function () {
            return full_response;
        };

        return Post;
    });	