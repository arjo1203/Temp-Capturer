TempCapturer.controller('AppCtrl', ['$scope', 'autoDetect', function ($scope, autoDetect) {
    console.log('connected right');

    autoDetect.then(function (result) {
        console.log(result);
    });
}]);