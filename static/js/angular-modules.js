// angular-modules.js

var app = angular.module('platoon', []).config(function($sceProvider) {
    $sceProvider.enabled(false)
})

// allow XSS
app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
}]);

// controller

app.controller('platoon-main', ['$scope', '$timeout', '$http', '$templateCache', '$interval', '$q', function($scope, $timeout, $http, $templateCache, $interval, $q) {

    // get all servers from DB
    $scope.getServers = function (callback) {
        var url = '/getServers'
        $http.get(url).then(function(res) {
            return callback(res.data)
        })
    }

    $scope.getDetails = function (ip, port, callback) {
        var url = 'http://' + ip + ':' + port + '/status'
        $http.get(url).then(function (res) {
            console.log(res.data)
            return callback(res.data)
        })
    }

    $scope.getAll = function () {
        all = []
        p = $q.defer()
        currentRequest = 0
        $scope.getServers(function (servers) {
            angular.forEach(servers, function (s) {
                $scope.getDetails(s.ip, s.port, function (data) {
                    s.details = data
                    all.push(s)
                    currentRequest++
                    if (currentRequest < servers.length) {
                        next()
                    } else {
                        p.resolve(all)
                    }
                })
            })
        })
        return p.promise;
    }

    $scope.getAll().then(function(results) {
        $scope.cluster = JSON.stringify(results)
        console.log($scope.cluster)
    })



 
}]);
