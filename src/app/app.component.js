var fs = require('file-system');
var csvWriter = require('csv-write-stream')
var writer = csvWriter()
var sprintf = require("sprintf-js").sprintf

var writer = csvWriter({ headers: ["TempSensor0", "TempSensor1"] })
writer.pipe(fs.createWriteStream('out.csv'))
// writer.write(['world', 'bar'])
// writer.write(['stuff', 'shit'])
// writer.end()

TempCapturer.controller('AppCtrl', ['$scope', '$window', '$timeout', 'autoDetect', function ($scope, $window, $timeout, autoDetect) {
    console.log('connected right');

    $scope.sample = 0;
    $scope.sampleSize = 10;
    $scope.port = null;

    $scope.NumOfTempSensors = 2;

    $scope.onExit = function () {
        console.log('closed');
        writer.end()
        return;
    };
    $window.onbeforeunload = $scope.onExit;

    autoDetect.then(function (result) {
        $scope.port = new SerialPort(result.comName, {
            baudRate: 9600,
            autoOpen: false,
            parser: SerialPort.parsers.readline('\n')
        });
        $scope.init();
    });

    $scope.init = function () {
        $scope.port.open(function (err) {
            if (err) {
                return console.log('Error opening port: ', err.message);
            }

            console.log('Succesfully opened port!');
            // Because there's no callback to write, write errors will be emitted on the port:
            // port.write('main screen turn on');
        });
        $scope.port.on('data', function (data) {
            // console.log('Data:', data);
            var parsedData = data.replace(/(\r\n|\n|\r)/gm, "").split(',');

            for (var i = 0; i < $scope.NumOfTempSensors; i++) {
                parsedData[i] = parsedData[i] * 5.0 / 1024;     // convert raw adc to mV
                parsedData[i] = (parsedData[i] - 0.5) * 100;    // convert to celsius
                parsedData[i] = (parsedData[i] * 9 / 5) + 32;   // convert to fahrenheit
            }

            $scope.sample++;
            if ($scope.sample > $scope.sampleSize) {
                $scope.labels.shift();
                for (var i = 0; i < $scope.NumOfTempSensors; i++) {
                    $scope.data[i].shift();
                }
            }
            $scope.labels.push($scope.sample.toString());
            for (var i = 0; i < $scope.NumOfTempSensors; i++) {
                $scope.data[i].push(parsedData[i]);
            }
            writer.write(parsedData);

            // Simulate async data update
            $timeout(function () {
                $scope.updateGraph();
            }, 50);
        });
    };

    $scope.labels = [];
    $scope.series = [];
    $scope.data = [];
    $scope.options = {
        animation: false,
        legend: {
            display: true
        },
        scales: {
            yAxes: []
        }
    };
    // setup chart
    for (var i = 0; i < $scope.NumOfTempSensors; i++) {
        $scope.series.push(sprintf("Temp Sensor %d", i));
        $scope.data.push([]);
        if(i == 0) {
            $scope.options.scales.yAxes.push(
                {
                    id: sprintf('y-axis-%d', i),
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: {
                        max: 120,
                        min: -40,
                        stepSize: 10
                    }
                }
            );
        }
        else {
            $scope.options.scales.yAxes.push(
                {
                    id: sprintf('y-axis-%d', i),
                    type: 'linear',
                    display: false,
                    position: 'right',
                    ticks: {
                        max: 120,
                        min: -40,
                        stepSize: 10
                    }
                }
            );
        }
    }
    $scope.onClick = function (points, evt) {
        console.log(points, evt);
    };
    $scope.updateGraph = function () {
        $scope.data = $scope.data;
    };
}]);