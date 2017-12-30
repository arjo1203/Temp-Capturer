const SerialPort = require('serialport')
var Promise = require('promise')

var TempCapturer = angular.module('TempCapturer', ['ui.router', 'chart.js']);
TempCapturer.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/index');
    $stateProvider
        .state('index', {
            url: '/index',
            templateUrl: './app/app.component.html',
            controller: 'AppCtrl'
        });
});
TempCapturer.service('autoDetect', function () {
    return new Promise(
        function (resolve, reject) {
            SerialPort.list(function (err, ports) {
                var targetPort = null;
                ports.forEach(function (port) {
                    if (port.pnpId.includes('BTHENUM'))
                        targetPort = port
                });
                if (targetPort != null) {
                    resolve(targetPort);
                }
                else {
                    var reason = new Error('Target port not found!');
                    reject(reason);
                }
            });
        }
    );
});
