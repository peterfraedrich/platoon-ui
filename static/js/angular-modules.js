// angular-modules.js

var app = angular.module('platoon', []).config(function($sceProvider) {
    $sceProvider.enabled(false)
})

// allow XSS
app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
}]);

// controller

app.controller('platoon-main', ['$scope', '$window', '$timeout', '$http', '$templateCache', '$interval', '$q', function($scope, $window, $timeout, $http, $templateCache, $interval, $q) {

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

    $scope.cluster_status = function (i) {
        if (i == false || i == 'false') {
            return "#CC5731"
        } else {
            return "#58CC31"
        }
    }

    $scope.member_status = function (m, i) {
        if (i.details.down.indexOf(m.hostname) != -1) {
            return '#CC5731'
        } else {
            return '#58CC31'
        }
    }

    $scope.member_status_detail = function (m) {
        if ($scope.detail.details.down.indexOf(m.hostname) != -1) {
            return '#CC5731'
        } else {
            return '#58CC31'
        }
    }

    $scope.show_json = function (i) {
        $window.open('data:application/json,' + encodeURIComponent(JSON.stringify(i)),'_blank')
    }

    $scope.show_detail = function (i) {
        $scope.detail = i
    }

    $scope.refresh = function () {
        $scope.getAll().then(function(results) {
            $scope.cluster = results
        })
    }

    $scope.getAll().then(function(results) {
        $scope.cluster = results
    })

    $scope.detail = {
        cluster_id : 'dev',
        hostname : 'cluster-manager',
        ip : '96.118.61.42',
        port : 5000,
        region : 'as_b',
        _id : '570fce',
        details : {
            quorum: true
        }
    }


 
}]);
