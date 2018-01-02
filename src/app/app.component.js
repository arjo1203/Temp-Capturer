var fs = require('file-system');
var csvWriter = require('csv-write-stream')
var sprintf = require("sprintf-js").sprintf
var parser = require('json-parser');

TempCapturer.controller('AppCtrl', ['$scope', '$window', '$timeout', 'autoDetect', function ($scope, $window, $timeout, autoDetect) {
    console.log('AppCtrl started');

    $scope.sampleCnt = 0;           // sample counter
    $scope.sampleSize = 20;         // samples size for chart
    $scope.numOfTempSensors = 3;    // number of temp sensors

    autoDetect.then(function (result) {
        // serial port for temp sample data
        $scope.port = new SerialPort(result.comName, {
            baudRate: 9600,
            autoOpen: false,
            parser: SerialPort.parsers.readline('\n')
        });
        $scope.init();
    });

    // csv writer instantiation
    $scope.csvHeaders = [];
    for (var i = 0; i < $scope.numOfTempSensors; i++) {
        $scope.csvHeaders.push(sprintf("TempSensor%d", i));
    }
    $scope.csvWriter = csvWriter({ headers: $scope.csvHeaders });
    $window.onbeforeunload = function () {
        $scope.csvWriter.end();   // close csv writer pipe
        return;
    };

    $scope.init = function () {
        $scope.csvWriter.pipe(fs.createWriteStream('out.csv'));
        $scope.port.open(function (err) {
            if (err) {
                return console.log('Error opening port: ', err.message);
            }
            console.log('Succesfully opened port!');
            $scope.fetchNumOfSensors();
        });
        $scope.port.on('data', function (data) {
            // console.log('Data:', data);
            var parsedJson = parser.parse(data, null, true);
            console.log(parsedJson);
            if (parsedJson.hasOwnProperty('s')) {
                $scope.numOfTempSensors = parsedJson.s;
                // console.log("toggle");
                $scope.toggleTempStream();
            }
            else if (parsedJson.hasOwnProperty('t')) {
                if (parsedJson.t.length > 1) {
                    for (var i = 0; i < $scope.numOfTempSensors; i++) {
                        parsedJson.t[i] = parsedJson.t[i] * 5.0 / 1024;     // convert raw adc to mV
                        parsedJson.t[i] = (parsedJson.t[i] - 0.5) * 100;    // convert to celsius
                        parsedJson.t[i] = (parsedJson.t[i] * 9 / 5) + 32;   // convert to fahrenheit
                    }
                    if ($scope.sampleCnt > $scope.sampleSize - 1) {  // start shifting chart
                        $scope.labels.push($scope.sampleCnt.toString());
                        $scope.labels.shift();
                        for (var i = 0; i < $scope.numOfTempSensors; i++) {
                            $scope.data[i].shift();
                        }
                    }
                    for (var i = 0; i < $scope.numOfTempSensors; i++) { // pump data to chart
                        $scope.data[i].push(parsedJson.t[i]);
                    }
                    $scope.csvWriter.write(parsedJson.t);       // pump data to csv
                    $scope.sampleCnt++;             // keep track of the current sample

                    // Simulate async data update
                    $timeout(function () {
                        $scope.updateChart();
                    }, 50);
                }
            }
        });
    };

    $scope.fetchNumOfSensors = function () {
        $scope.port.write('s');
    };
    $scope.toggleTempStream = function () {
        $scope.port.write('a');
    };

    /*************************************************************************************************/
    // initialize empty chart
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
    $scope.datasetOverride = [];
    // configure chart
    for (var i = 0; i < $scope.numOfTempSensors; i++) { // create dataset per temp sensor
        $scope.series.push(sprintf("Temp Sensor %d", i));
        $scope.data.push([]);
        var yAxesOpts = {
            id: sprintf('y-axis-%d', i),
            type: 'linear',
            position: 'right',
            ticks: {
                max: 120,       // max range of TMP36 125 Celsius, 257 Fahrenheit
                min: -40,       // min range of TMP36 -40 Celsius, -40 Fahrenheit
                stepSize: 10    // 10 Degress Fahrenheit resolution
            }
        };
        // only show one y-axis
        if (i == 0) {
            yAxesOpts.display = true;
        }
        else {
            yAxesOpts.display = false;
        }
        $scope.options.scales.yAxes.push(yAxesOpts);
        $scope.datasetOverride.push({ backgroundColor: "rgba(0,0,0,0)" });    // remove fill color
    }
    // renders empty chart
    for (var i = 0; i < $scope.sampleSize; i++) {
        $scope.labels.push(i.toString());
    }
    // console.log($scope.chartColors);
    $scope.onClick = function (points, evt) {
        console.log(points, evt);
    };
    $scope.updateChart = function () {
        $scope.data = $scope.data;
    };
}]);