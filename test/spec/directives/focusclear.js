'use strict';

describe('Directive: focusClear', function () {

  // load the directive's module
  beforeEach(module('olcApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<focus-clear></focus-clear>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the focusClear directive');
  }));
});
