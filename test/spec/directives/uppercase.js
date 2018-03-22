'use strict';

describe('Directive: uppercase', function () {

  // load the directive's module
  beforeEach(module('olcApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<uppercase></uppercase>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the uppercase directive');
  }));
});
