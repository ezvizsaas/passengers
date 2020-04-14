(function() {
    //hack 将原有Post数据保存到cookie
    (function(){
        GLO.serial ? ($.cookie('GLO_serial',GLO.serial)) : (GLO.serial = $.cookie('GLO_serial'));
        GLO.netType ? ($.cookie('GLO_netType',GLO.netType)) : (GLO.netType = $.cookie('GLO_netType'));
        GLO.channelNo ? ($.cookie('GLO_channelNo',GLO.channelNo)) : (GLO.channelNo = $.cookie('GLO_channelNo'));
        GLO.deviceType ? ($.cookie('GLO_deviceType',GLO.deviceType)) : (GLO.deviceType = $.cookie('GLO_deviceType'));
        GLO.sessionId ? ($.cookie('GLO_sessionId',GLO.sessionId)) : (GLO.sessionId = $.cookie('GLO_sessionId'));
        GLO.clientType ? ($.cookie('GLO_clientType',GLO.clientType)) : (GLO.clientType = $.cookie('GLO_clientType'));
        GLO.version ? ($.cookie('GLO_version',GLO.version)) : (GLO.version = $.cookie('GLO_version'));
        GLO.mac ? ($.cookie('mac',GLO.mac)) : (GLO.mac = $.cookie('mac'));
    })();
    
    //预研-需要区分ios和Android,将Android的高度样式修改即可
    var ua = navigator.userAgent.toLowerCase();
    if(/iphone|ipad|ipod/.test(ua)) {
    	$(".listBar").addClass("list-bar-icon-new-ios");
    	$(".listBar_add").css("display", "block");
    	$("#queryDateBar").css("margin-top", "0.155rem");
    	$("#dateCalendar").css("margin-top", "0.155rem");
    } else if(/android/.test(ua)) {
    	$(".listBar").addClass("list-bar-icon-new-Android");
    	$(".listBar_add").css("display", "none");
    	$(".listBar").css("top", 0);
    	$(".clientAll").css("top", "0.16rem");
    	$("#statisticQuery").css("top", "0.05rem");
    	$(".content").css("margin-top", "0.04rem");
    	$(".listBar span").css("top", "0.16rem");
    }
    
    //api下的接口公共参数
    var publicParam = {
		osVersion: '',
		netType: GLO.netType,
        sessionId: GLO.sessionId,
        clientType: GLO.clientType,
        version: GLO.version,
        appType: GLO.appType,
        cameraId: GLO.cameraId,
        mac: GLO.mac,
        clientNo: 'web_h5'
    };
    if(publicParam.appType == 0) {
    	$(".listBar").css("background", "#0093FF");
    	$(".listBar_add").css("background", "#0093FF");
    	$("#dateSection").css("background", "#0093FF");
    } else if(publicParam.appType == 1) {
    	$(".listBar").css("background", "#FF9714");
    	$(".listBar_add").css("background", "#FF9714");
    	$("#dateSection").css("background", "#FF9714");
    } else {
    	$(".listBar").css("background", "#0093FF");
    	$(".listBar_add").css("background", "#0093FF");
    	$("#dateSection").css("background", "#0093FF");
    }
    //创建查询列表所需要的参数（可以创建多个对象）
    var GraphParams = function(type) {
        if (type === 'empty') {
            var date = new Date();
            this.time = {};
            this.serialChannelNos = [];
        } else {
            var date = new Date();
            this.time = {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate()
            };
            this.serialChannelNos = [{
                serial : GLO.serial,
                channelNo : GLO.channelNo
            }]
        }
    };
    GraphParams.prototype = {
        constructor: GraphParams,
        setTime: function(d) {
            var arr = d.split(/-|\//);
            this.time = {
                year: arr[0] * 1,
                month: arr[1] * 1,
                day: arr[2] * 1
            }
        },
        getTime: function(t) {
            return this.time.year + '-' + (this.time.month < 10 ? '0' : '') + this.time.month + '-' + (this.time.day < 10 ? '0' : '')  + this.time.day;
        }
    };
    //分组模板
    var groupTmp = _.template([
        '<div class="group-list <%if(memberList.length == 1 && memberList[0].serial == GLO.serial){%>active<%}%>" data-name="<%=groupName%>" data-id="<%=groupId%>">',
        '<div class="group-list-bar flex-box">',
        '<div class="group-list-arrow"><span></span></div>',
        '<p class="group-list-title flex1"><%=groupName%></p>',
        '<div class="group-list-check"><span></span></div>',
        '</div>',
        '<div class="group-list-content">',
            '<% for(var i=0;i<memberList.length;i++){%>',
                '<div id="equip_<%=memberList[i].serial%>_<%=memberList[i].channelNo%>" class="equip-list flex-box <%if(memberList[i].serial == GLO.serial){%>active<%}%>" data-name="<%=memberList[i].cameraName%>" data-serial="<%=memberList[i].serial%>" data-channelno="<%=memberList[i].channelNo%>">',
                '<img src="<%=memberList[i].pic%>" onerror="this.src=\'/h5/mobile/assets/public/images/def-camera.jpg\'" alt="" class="equip-list-img">',
                '<div class="equip-list-detail flex1">',
                '<p class="equip-list-title"><%=memberList[i].cameraName%></p>',
                '<p class="equip-list-des"><%=memberList[i].serial%></p>',
                '</div>',
                '<div class="equip-list-check"><span></span></div>',
                '</div>',
            '<% } %>',
        '</div>',
        '</div>'
    ].join(''));
    //判断当前书否为浏览器回退
    var isHistoryBack = true;
    //人为修改hash
    var manChgHash = function(hash) {
        isHistoryBack = false;
        window.location.hash = '#' + hash;
    }
    /******************************* 图表 **************************************/
    //图表动态参数配置对象
    var graphConfig = (function() {
        //数据处理（预留）
        var getNumber = function(n) {};
        return {
            dayStep: (function() {
                var arr = [];
                for (var i = 1; i < 25; i++) {
                    arr.push(i + ':00');
                }
                return arr;
            })(),
            weekStep: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            getMonthStep: function(year, month) {
                var len = (new Date(year, month, 0)).getDate();
                var arr = [];
                for (var i = 1; i <= len; i++) {
                    arr.push(i);
                }
                return arr;
            },
            dayDate: [],
            weekDate: [],
            monthDate: []
        }
    })();
    //逐个对比数据并产出一套合理的图表数字布局（针对d1）
    var getLabelsPosition = function(d1,d2,type){
        var arr = [];
        var max = _.max(d1.concat(d2));
        for(var i=0;i<d1.length;i++){
            if(d1[i] != undefined && d2[i] != undefined){
                if(d1[i]>d2[i]){
                    arr[i] = 'top';
                }else if(d1[i] < d2[i]){
                    arr[i] = 'bottom';
                }else{
                    if(type === 'last'){
                        arr[i] = 'bottom';
                    }else{
                        arr[i] = 'top';
                    }
                }
            }
        }
        return arr;
    };
    //修改图表配置参数
    var adaptGraphConfig = function(d1,d2,type){
        var arr1,arr2
        if(type === 'day'){
            graphOption.grid.width = 1400;
            graphOption.xAxis[0].data = graphConfig.dayStep;
            graphOption.series[0].data = changeData(d1,'hour');
            graphOption.series[1].data = changeData(d2,'hour');
        }else if(type === 'week'){
            graphOption.grid.width = 700;
            graphOption.xAxis[0].data = graphConfig.weekStep;
            graphOption.series[0].data = changeData(d1,'day');
            graphOption.series[1].data = changeData(d2,'day');
        }else{
            graphOption.grid.width = 1400;
            graphOption.xAxis[0].data = graphConfig.getMonthStep(currentParams.time.year, currentParams.time.month);
            graphOption.series[0].data = changeData(d1,'day');
            graphOption.series[1].data = changeData(d2,'day');
        }
        arr1 = graphOption.series[0].data;
        arr2 = graphOption.series[1].data;
        var max = _.max(arr1.concat(arr2));
        var min = _.min(arr1.concat(arr2));
        graphOption.series[0].itemsLabelPosition = getLabelsPosition(arr1,arr2);
        graphOption.series[1].itemsLabelPosition = getLabelsPosition(arr2,arr1,'last');

        graphOption.yAxis[0].max = max + 10;
        graphOption.yAxis[0].min = (max + 10)/(-4);
    };
    //数字变更效果
    var changeNum = function($dom, num, t) {
        var from, step, escNum, descNum;
        if (t === 'fromNow') {
            from = $.trim($dom.html()) * 1;
        } else {
            from = 0;
        }
        if (typeof from === 'number' && typeof num === 'number') {
            step = Math.ceil(Math.abs(from - num) / 7);
            //$dom.html(from);
            escNum = function(t) {
                from += step;
                if (from < num) {
                    setTimeout(function() {
                        $dom.html(from);
                        escNum();
                    }, 50);
                } else {
                    setTimeout(function() {
                        $dom.html(num);
                    }, 50);
                }
            };
            descNum = function() {
                from -= step;
                if (from > num) {
                    setTimeout(function() {
                        $dom.html(from);
                        descNum();
                    }, 50);
                } else {
                    setTimeout(function() {
                        $dom.html(num);
                    }, 50);
                }
            };
            from < num ? escNum() : descNum();

        } else {
            $dom.html(num);
        }
    };
    //缓存数据
    var cacheData = (function(){
        var dayMark = 0;
        var weekMark = 0;
        var monthMark = 0;
        var index = {};
        var days = {};
        var weeks = {};
        var months = {};
        var addData = function(g,d,t,data){
            var G = JSON.stringify(g);
            index[G] = index[G] || {};
            index[G][d] = index[G][d] || {};
            if(t === 'day'){
                index[G][d][t] = dayMark;
                days[dayMark] = data;
                dayMark++;
            }else if(t === 'week'){
                index[G][d][t] = weekMark;
                weeks[weekMark] = data;
                weekMark++;
            }else{
                index[G][d][t] = monthMark;
                months[monthMark] = data;
                monthMark++;
            }
        };
        var getData = function(g,d,t){
            var G = JSON.stringify(g);
            if(index[G] && index[G][d]){
                return t === 'day' ? days[index[G][d][t]] : (t === 'week' ? weeks[index[G][d][t]] : months[index[G][d][t]]);
            }else{
                return undefined;
            }
        };
        return {
            getData : getData,
            addData : addData
        };
    })();
    //切换图表区域的显示内容
    var toggleGraphContent = function(id, type, d){
        var $dom = $('#'+id);
        if(type === 'loading'){
            $dom.find('.graph-content').addClass('hide');
            $dom.find('.graph-content-error').addClass('hide');
            $dom.find('.graph-loading').removeClass('hide');
        }else if(type === 'error'){
        	var strContent = '请求失败';
        	if (typeof(d) != "undefined" && d.resultCode == '-1') {
        		strContent = d.resultDes;
        	}
            $dom.find('.graph-content').addClass('hide');
            $dom.find('.graph-content-error').removeClass('hide').html(strContent);
            $dom.find('.graph-loading').addClass('hide');
        }else if(type === 'empty'){
            $dom.find('.graph-content').addClass('hide');
            $dom.find('.graph-content-error').removeClass('hide').html('暂无数据');
            $dom.find('.graph-loading').addClass('hide');
        }else{
            $dom.find('.graph-content').removeClass('hide');
            $dom.find('.graph-content-error').addClass('hide');
            $dom.find('.graph-loading').addClass('hide');
        }
    };
    //根据现有参数刷新图表
    var refreshGraph = function() {
        //三表刷新
        if (JSON.stringify(lastParams.serialChannelNos) !== JSON.stringify(currentParams.serialChannelNos) ||
            lastParams.time.year !== currentParams.time.year ||
            lastParams.time.month !== currentParams.time.month) {
            getDayGraph(function(){
            	getWeekGraph(function(){
            		getMonthGraph(function(){
            		});
            	});
            });
            
            
        } else {
            if (lastParams.time.day !== currentParams.time.day) { //不更新
                var lastDate = new Date(lastParams.time.year, lastParams.time.month - 1, lastParams.time.day);
                var currentDate = new Date(currentParams.time.year, currentParams.time.month - 1, currentParams.time.day);
                if (!H5COM.checkSameWeek(lastDate, currentDate)) { //两表更新
                    getDayGraph(function(){
	                    getWeekGraph();
	            	});
                } else { //一表更新
                    getDayGraph();
                }
            } else { //不更新

            }
        };
        lastParams.serialChannelNos = currentParams.serialChannelNos;
        lastParams.time.year = currentParams.time.year;
        lastParams.time.month = currentParams.time.month;
        lastParams.time.day = currentParams.time.day;
    };
	
    //计算当前日期所在的周日期范围
    var getDayRange = function(t){
        var nowDate = new Date();
        var thisDate = new Date(currentParams.time.year, currentParams.time.month - 1, currentParams.time.day);
        if($(".slide-next").hasClass("clicked")) {
        	var thisDate = new Date(currentParams.time.year, currentParams.time.month - 1, currentParams.time.day + 1);	
        }
        if($(".slide-pre").hasClass("clicked")) {
        	var thisDate = new Date(currentParams.time.year, currentParams.time.month - 1, currentParams.time.day - 1);	
        }
        var thisDay = thisDate.getDay();
        if(t === 'week'){
    		if(thisDay == 0){
                thisDay = 7;
            };
    		var thisWeekStart = new Date(thisDate.getTime() - (thisDay-1)*3600*1000*24);
            var thisWeekEnd = new Date(thisDate.getTime() + (7-thisDay)*3600*1000*24);
            return '（'+(thisWeekStart.getFullYear() == nowDate.getFullYear() ? '' : thisWeekStart.getFullYear()+'/') +(thisWeekStart.getMonth()+1) + '/' +thisWeekStart.getDate()+'-'+
                (thisWeekEnd.getFullYear() == nowDate.getFullYear() ? '' : thisWeekEnd.getFullYear()+'/')+(thisWeekEnd.getMonth()+1) + '/' +thisWeekEnd.getDate()+'）';
    	}else{
    			return '（'+currentParams.time.year+'/'+(thisDate.getMonth()+1)+'）';
       	
    	}
    };
    // 接口数据转换
    var changeData = function(data,type){
        var arr = [];
        for(var i=0;i<data.length;i++){
            arr[data[i][type]-(type === 'hour'? 0 : 1)] = data[i]['flow'];
        }
        return arr;
    };
    //切换某一天的统计图
    var getDayGraph = function(callback) {
        var data = cacheData.getData(currentParams.serialChannelNos,currentParams.getTime(),'day');
        var renderData = function(d){
            var $content = $('#dayGraphContent');
            if (d.now.length != 0 || d.last.length != 0) {
                toggleGraphContent('dayGraphContent','content');
                adaptGraphConfig(d.now,d.last,'day');
                getGraphScroll('day');
                dayChart.setOption(graphOption);
            } else {
                toggleGraphContent('dayGraphContent','empty');
            }
            changeNum($('#daySlider').find('.current-day').find('.day-flow-count'), d.nowStatus);
        };
        toggleGraphContent('dayGraphContent','loading');
        $.ajax({
            url: '/mobile/passenger/dayStat.action',
            data: {
                sessionId: publicParam.sessionId,
                clientType: publicParam.clientType,
                version: publicParam.version,
                appType: publicParam.appType,
//                  serialChannelNos: formatSerial(currentParams.serialChannelNos),
                mac : publicParam.mac,
                cameraId : publicParam.cameraId,
                date: currentParams.getTime()
            },
            success: function(d) {
//                	var str = '{"last":[{"hour":0,"flow":4},{"hour":1,"flow":4},{"hour":2,"flow":4},{"hour":3,"flow":4},{"hour":4,"flow":4},{"hour":5,"flow":4},{"hour":6,"flow":4},{"hour":7,"flow":4},{"hour":8,"flow":4},{"hour":9,"flow":4},{"hour":10,"flow":4}],"now":[],"resultCode":"0","nowStatus":0,"resultDes":""}';
            	d = eval('('+d+')');
                dayChart.clear();
                if (d.resultCode == '0') {
                    renderData(d);
                    cacheData.addData(currentParams.serialChannelNos,currentParams.getTime(),'day',d);
                }else if(d.resultCode == '-3' && YsAppBridge.version >= 3000000){
                    YsAppBridge.relogin();
                }else{
                    toggleGraphContent('dayGraphContent','error',d);
                }
                if (callback && typeof(callback) == "function") {
                	callback();
                }
            },
            error: function() {
                toggleGraphContent('dayGraphContent','error');
            }
        });

    };
    //切换某一周的统计图
    var getWeekGraph = function(callback) {
        var data = cacheData.getData(currentParams.serialChannelNos,currentParams.getTime(),'week');
        $('#weekTimeRange').html(getDayRange('week'));
        var renderData = function(d){
            var $content = $('#weekGraphContent');
            if (d.now.length != 0 || d.last.length != 0) {
                toggleGraphContent('weekGraphContent','content');
                adaptGraphConfig(d.now,d.last,'week');
                getGraphScroll('week');
                weekChart.setOption(graphOption);
            } else {
                toggleGraphContent('weekGraphContent','empty');
            }
            changeNum($('#currentWeekTotal'), d.nowTotal, 'fromNow');
            changeNum($('#lastWeekTotal'), d.lastTotal, 'fromNow');
            changeNum($('#lastWeekAvg'), d.lastAvg, 'fromNow');
        };
        
        toggleGraphContent('weekGraphContent','loading');
        $.ajax({
            url: '/mobile/passenger/weekStat.action',
            data: {
            	sessionId: publicParam.sessionId,
//                    serialChannelNos: formatSerial(currentParams.serialChannelNos),
                cameraId : window.GLO.cameraId,
                clientType: publicParam.clientType,
                version: publicParam.version,
                appType: publicParam.appType,
                mac : publicParam.mac,
                date: currentParams.getTime()
            },
            success: function(d) {
                weekChart.clear();
//                    var str ='{"nowTotal":0,"last":[{"day":3,"flow":13},{"day":5,"flow":44}],"now":[],"resultCode":"0","lastAvg":28,"lastTotal":57,"resultDes":""}';
                d = eval("("+d+")");
                if (d.resultCode == '0') {
                    renderData(d);
                    cacheData.addData(currentParams.serialChannelNos,currentParams.getTime(),'week',d);
                }else if(d.resultCode == '-3' && YsAppBridge.version >= 3000000){
                    YsAppBridge.relogin();
                }else{
                    toggleGraphContent('weekGraphContent', 'error', d);
                }
                
                if (callback && typeof(callback) == "function") {
                	callback();
                }
            },
            error: function() {
                toggleGraphContent('weekGraphContent','error');
            }
        });

    };
    //切换某一月的统计图
    var getMonthGraph = function(callback) {
        var data = cacheData.getData(currentParams.serialChannelNos,currentParams.getTime(),'month');
        var renderData = function(d){
            var $content = $('#monthGraphContent');
            if (d.now.length != 0 || d.last.length != 0) {
                toggleGraphContent('monthGraphContent','content');
                adaptGraphConfig(d.now,d.last,'month');
                getGraphScroll('month');
                monthChart.setOption(graphOption);
            } else {
                toggleGraphContent('monthGraphContent','empty');
            }
            changeNum($('#currentMonthTotal'), d.nowTotal, 'fromNow');
            changeNum($('#lastMonthTotal'), d.lastTotal, 'fromNow');
            changeNum($('#lastMonthAvg'), d.lastAvg, 'fromNow');
        };
        $('#monthTimeRange').html(getDayRange('month'));
        toggleGraphContent('monthGraphContent','loading');
        $.ajax({
            url: '/mobile/passenger/monthStat.action',
            data: {
            	sessionId: publicParam.sessionId,
//                    serialChannelNos: formatSerial(currentParams.serialChannelNos),
                cameraId : window.GLO.cameraId,
                clientType: publicParam.clientType,
                version: publicParam.version,
                appType: publicParam.appType,
                mac : publicParam.mac,
                date: currentParams.getTime()
            },
            success: function(d) {
                monthChart.clear();
//                    var str = '{"nowTotal":186,"last":[],"now":[{"day":15,"flow":13},{"day":17,"flow":44},{"day":27,"flow":129}],"resultCode":"0","lastAvg":0,"lastTotal":0,"resultDes":""}';
                d = eval("("+d+")");
                if (d.resultCode == '0') {
                    renderData(d);
                    cacheData.addData(currentParams.serialChannelNos,currentParams.getTime(),'month',d);
                }else if(d.resultCode == '-3' && YsAppBridge.version >= 3000000){
                    YsAppBridge.relogin();
                }else{
                    toggleGraphContent('monthGraphContent', 'error', d);
                }
//                    callback();
            },
            error: function() {
                toggleGraphContent('monthGraphContent','error');
            }
        });
    };
    //计算图表滚动位置
    var getGraphScroll = function(type){
        var wholeLen, //滚动区域总长
            steps, // 刻度总数
            viewLen = $(window).width(), //可视区域长度
            scrollLen,//滚动长度
            scrollDom,//滚动对象
            onStep;//所用的当前刻度
        var date = new Date();
        if(type === 'day'){
            wholeLen = 1400;
            steps = 24;
            onStep = date.getHours();
            scrollDom = $('#dayGraphContent').get(0);

        }else if(type === 'week'){
            wholeLen = 700;
            steps = 7;
            onStep = date.getDay();
            scrollDom = $('#weekGraphContent').get(0);
        }else{
            wholeLen = 1400;
            steps = new Date(date.getFullYear(),date.getMonth(),0).getDate();
            onStep = date.getDate();
            scrollDom = $('#monthGraphContent').get(0);
        }
        scrollLen = (onStep-0.5)*wholeLen/steps - viewLen/2;
        scrollDom.scrollLeft = scrollLen > 0 ? scrollLen : 0;
    };
    //图表模板配置项
    var graphOption = {
        grid: {
            x: 0,
            y: 30,
            x2: 0,
            y2: 30,
            borderWidth: 0,
            width: '100%'
        },
        calculable: false,
        color: ['#f37f4c', '#3d9ed9'],
        noDataLoadingOption: {},
        animation : false,
        xAxis: [{
            type: 'category',

            data: [],
            axisLine: {
                lineStyle: {
                    color: '#aaa'
                },
                onZero : false
            },
            axisTick: {
                lineStyle: {
                    color: '#aaa'
                }
            },
            axisLabel: {
                textStyle: {
                    color: '#aaa'
                }
            },
            splitLine: {
                show: false
            },
            splitArea: {
                show: false
            }
        }],
        yAxis: [{
            type: 'value',
            splitLine: {
                show: false
            },
            splitArea: {
                show: false
            },
            min : -0.1
        }],
        series: [{
            name: '',
            type: 'line',
            itemStyle: {
                normal: {
                    label: {
                        show: true,
                        position: 'top'
                    }
                }
            },
            data: [],
            itemsLabelPosition :[]
        }, {
            name: '',
            type: 'line',
            itemStyle: {
                normal: {
                    label: {
                        show: true,
                        position: 'bottom'
                    }
                }
            },
            data: [],
            itemsLabelPosition :[]
        }]
    };

    require.config({
        paths: {
            echarts: '../../widgets/echarts'
        }
    });
    require(
        [
            'echarts',
            'echarts/chart/line'
        ],
        function(ec) {
            window.dayChart = ec.init(document.getElementById('dayGraph'));
            window.weekChart = ec.init(document.getElementById('weekGraph'));
            window.monthChart = ec.init(document.getElementById('monthGraph'));
            refreshGraph();
        }
    );


    /******************************* 滑动 **************************************/
    //============轮播滑动============
    var timeSlide = (function() {
        // var isSlideReset = false; //判断是否为重新定位
        var $slideDays = $('#daySlider').find('.slide-day');
        var nowTime = new Date().getTime();
        var getDay = function(num, time) {
            var date;
            time += num * 1000 * 3600 * 24;
            date = new Date(time);
            return {
                name: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
                time: time
            }
        };
        //为日期滑动暂存的三个时间
        var slideDateRom = [
            getDay(-2, nowTime),
            getDay(-1, nowTime),
            getDay(0, nowTime)
        ];
        var todayDate = getDay(0, nowTime);
        var yesterdayDate = getDay(-1, nowTime);
        //循环索引值
        var circleIndex = function(i){
            return (3+i%3)%3;
        }
        var setDay = function(time){
            slideDateRom[0] = getDay(-1,time);
            slideDateRom[1] = getDay(0,time);
            slideDateRom[2] = getDay(1,time);
        }
        //修改轮播的三个日期
        var changeDay = function(time) {
            var date;
            var renderName = function(name) {
                return name === todayDate.name ? '今天' : (name === yesterdayDate.name ? '昨天' : name);
            };
            var idx;
            if(time){
                idx = 1;
            }else{
                idx = $('.current-day').index();
                time = $slideDays.eq(idx).data('time');
            }
            setDay(time);
            if (slideDateRom[idx].name === todayDate.name) {
                $('.slide-next').addClass('hide');
                $slide.stopDirect('right');
            } else {
                $('.slide-next').removeClass('hide');
                $slide.stopDirect('');
            }
            //清空两边的统计值
            $slideDays.eq(circleIndex(idx-1)).find('.day-flow-count').html('');
            $slideDays.eq(circleIndex(idx+1)).find('.day-flow-count').html('');
            $slideDays.eq(circleIndex(idx-1)).data('time',slideDateRom[0].time).find('.day-flow-date').html(renderName(slideDateRom[0].name));
            $slideDays.eq(idx).data('time',slideDateRom[1].time).find('.day-flow-date').html(renderName(slideDateRom[1].name));
            $slideDays.eq(circleIndex(idx+1)).data('time',slideDateRom[2].time).find('.day-flow-date').html(renderName(slideDateRom[2].name));
        };
        //创建滑动
        var $slide = new Swipe(document.getElementById('daySlider'), {
            startSlide: 1,
            speed: 400,
            continuous: true,
            disableScroll: false,
            stopPropagation: false,
            callback: function(index, e) {
                $slideDays.removeClass('current-day');
                $slideDays.eq(index).addClass('current-day');
                changeDay();
            },
            transitionEnd: function(index, e) {
                currentParams.setTime(slideDateRom[1].name);
                refreshGraph();
            }
        });
        $('.slide-pre').on('click', function() {
            $slide.prev();
            $(".slide-next").removeClass("clicked");
            $(".slide-pre").addClass("clicked");
            $('#weekTimeRange').html(getDayRange('week'));
            $('#monthTimeRange').html(getDayRange('month'));
        });
        $('.slide-next').on('click', function() {
        	$slide.next();
        	$(".slide-pre").removeClass("clicked");
        	$(".slide-next").addClass("clicked");
        	$('#weekTimeRange').html(getDayRange('week'));
        	$('#monthTimeRange').html(getDayRange('month'));
        });
        //立即执行一次时间
        changeDay(nowTime);
        //提供外部调用
        return {
            changeDay: changeDay,
            slideDateRom: slideDateRom,
            slide : $slide
        }
    })();

    /*************************** 页面模块切换及浏览器回退  ********************************/
    (function() {
        var hash, lastHash = window.location.hash;
        //页面切换    
        var gotoPage = function(t) {
            $('._page_').addClass('hide');
            if (t === 'search') {
                $('#searchSection').removeClass('hide');
            } else if (t === 'group') {
                $('#groupSection').removeClass('hide');
            } else if (t === 'date') {
                $('#dateSection').removeClass('hide');
            } else {
                $('#mainSection').removeClass('hide');
            }
        }
        window.onhashchange = function() {
            var hash = window.location.hash;
            //浏览器历史回退控制页面跳转
            if (isHistoryBack) {
                if (lastHash === '#search') {
                    gotoPage('main');
                } else if (lastHash === '#group' || lastHash === '#date') {
                    gotoPage('search');
                } else {
                    YsAppBridge.closePage();
                }
            } else {
                gotoPage(hash.substring(1));
            }
            //重置
            isHistoryBack = true;
            lastHash = hash;
        }
    })();

    /***********************日历****************************/
    (function() {
        new gmu.Calendar($('#dateCalendar'), {
            swipeable: true,
            maxDate: new Date(),
            firstDay: 0,
            select: function(e, date, dateStr, ins) {
                $('#queryDateText').html(dateStr);
                window.history.go(-1);
            }
        });
    })();

    /***********************图表页事件****************************/
    var toggleSlideGroup = function(t) {
        $btn = $('#slideGroupBtn');
        if (t === 'open') {
            $btn.addClass('open')
        } else if (t === 'close') {
            $btn.removeClass('open');
        } else {
            $btn.toggleClass('open');
        }
        if ($btn.hasClass('open')) {

            $('#groupSection').removeClass('hide').addClass('groupSubPage');
        } else {
            $('#groupSection').addClass('hide').removeClass('groupSubPage');
        }
    }
    $('#statisticQuery').on('click', function() {
        toggleSlideGroup('close');
        manChgHash('search');
    });
    $('#slideGroupBtn').on('click', function() {
        toggleSlideGroup('toggle');
    });

    /***********************搜索页事件****************************/
        //查询图表
    $('#searchQueryBtn').on('click', function() {
        var serialChannelNos = $('#queryGroupInfo').data('serialchannelnos');
        var date = $('#queryDateText').html();
        if (date) {
            currentParams.setTime(date);
        }
        if (serialChannelNos) {
            currentParams.serialChannelNos = serialChannelNos;
        }

        if(date !== ''){
            //切换时间
            var thisTime = new Date(currentParams.time.year, currentParams.time.month - 1, currentParams.time.day).getTime();
            timeSlide.changeDay(thisTime);
            timeSlide.slide.slide(1,1);
        }
        refreshGraph();
        $('#selectGroupTitle').html(getGroupName());
        window.history.go(-1);
    });
    //打开日历
    $('#queryDateBar').on('click', function() {
        manChgHash('date');
    });
    //打开分组
    $('#queryGroupBar').on('click', function() {
        manChgHash('group');
    });

    /***********************分组事件(和首页的下拉分组同步执行)****************************/
    var queryGroupFailed = function(t) {
        var $error = $('.error-list');
        if (t === 'empty') {
            $error.find('p').html('暂无分组');
            $error.find('.query-again').addClass('hide');
        } else {
            $error.find('p').html('列表加载失败，请稍后重试');
            $error.find('.query-again').removeClass('hide');
        };
        toggleGroupStatus('error');
    };
    var toggleGroupStatus = function(type){
        if(type==='load'){
            $('.group-list-area').addClass('hide');
            $('.error-list').addClass('hide');
            $('.group-list-loading').removeClass('hide');
            $('.equip-select-btn').addClass('hide');
        }else if(type==='error'){
            $('.group-list-area').addClass('hide');
            $('.error-list').removeClass('hide');
            $('.group-list-loading').addClass('hide');
            $('.equip-select-btn').addClass('hide');
        }else{
            $('.group-list-area').removeClass('hide');
            $('.error-list').addClass('hide');
            $('.group-list-loading').addClass('hide');
            $('.equip-select-btn').removeClass('hide');
        }
    };

    var formatSerial = function(arr){
        var strArr = [];
        for(var i=0,len=arr.length;i<len;i++){
            strArr.push(arr[i].serial+':'+arr[i].channelNo);
        }
        return strArr.join(',')
    };

    //选择分组
    var getGroupName = function(){
        var $selectGroup = $('.group-list.active');
        var $selectList = $('.group-list-area').find('.equip-list.active');
        if($selectList.length === 1 ){
            return $selectList.eq(0).data('name');
        }else if($selectGroup.length === 1 && ($selectGroup.eq(0).find('.equip-list').length === $selectList.length)){
            return $selectGroup.eq(0).data('name');
        }else{
            return '组合查询'
        }

    };

    var queryGroup = function() {
        toggleGroupStatus('load');
        $.ajax({
            url: '/api/passengerflow/flowGroupCameraList',
            type: 'POST',
            data: publicParam,
            success: function(d) {
                var data = (d.resultCode == '0' ? d.group : []);
                var groupHtml = '';
                if (d.resultCode != '0') {
                    queryGroupFailed();
                } else if (d.group.length == 0) {
                    queryGroupFailed('empty');
                } else {
                    toggleGroupStatus('success');
                    for (var i = 0; i < data.length; i++) {
                        if(data[i].memberList.length>0){
                            groupHtml += groupTmp(data[i]);
                        }
                    }
                    $('.group-list-area').html(groupHtml);
                    $('#selectGroupTitle').html(getGroupName());
                    $('#queryGroupInfo').html(getGroupName());
                    //点击展开
                    var openList = function($d) {
                        var $group = $d.closest('.group-list');
                        var $listContent = $group.find('.group-list-content');
                        $group.toggleClass('open');
                        if ($group.hasClass('open')) {
                            setTimeout(function() {
                                $listContent.css('height', $listContent.find('.equip-list').length * Rem2Px * 0.81 + 'px');
                            }, 100);
                        } else {
                            $listContent.css('height', 0);
                        }
                    }
                    //点击全选
                    var selectWholeList = function($d) {
                        var $group = $d.closest('.group-list');
                        var $list = $group.find('.equip-list');
                        $group.toggleClass('active');
                        if($group.hasClass('active')){
                            $list.addClass('active');
                        }else{
                            $list.removeClass('active');
                        }
                    }
                    //点击选中单个
                    var selectOneList = function($d) {
                        $group = $d.closest('.group-list');
                        $list = $group.find('.equip-list');
                        $d.toggleClass('active');
                        //全部选中的情况
                        if($group.find('.equip-list.active').length == $list.length){
                            $group.addClass('active');
                        }else{
                            $group.removeClass('active');
                        }
                    }

                    var createSerialParams = function($d,callback){
                        var list = $d.find('.equip-list.active');
                        var arr = [];
                        for(var i=0,len=list.length;i<len;i++){
                            arr.push({
                                serial : list.eq(i).data('serial'),
                                channelNo : list.eq(i).data('channelno')
                            });
                        };
                        callback && callback(arr);
                    }

                    var toggleGroupSelectBtn = function(){
                        var $selectList = $('#groupSection').find('.equip-list.active');
                        if($selectList.length == 0){
                            $('#equipConfirm').addClass('disable');
                        }else{
                            $('#equipConfirm').removeClass('disable');
                        }
                    }

                    $('.group-list').on('click', function(e) {
                        var _this = e.target;
                        var $bar = $(_this).closest('.group-list-bar');
                        var $arrow = $(_this).closest('.group-list-arrow');
                        var $equip = $(_this).closest('.equip-list');
                        if ($bar.length > 0 && $arrow.length > 0) {
                            openList($arrow);
                        } else if ($bar.length > 0 && $arrow.length === 0) {
                            selectWholeList($bar);
                            toggleGroupSelectBtn();
                        } else if ($equip.length > 0) {
                            selectOneList($equip);
                            toggleGroupSelectBtn();
                        }
                    });
                    // $('#equipConfirm1').on('click',function(){
                    //     toggleSlideGroup('close');
                    //     createSerialParams($(this).siblings('.group-list-area'),function(arr){
                    //         currentParams.serialChannelNos = arr;
                    //         refreshGraph();
                    //     });
                    // });
                    $('#equipConfirm').on('click',function(){
                        var selectName = getGroupName();
                        if(location.hash ==='#group'){
                            createSerialParams($(this).siblings('.group-list-area'),function(arr){
                                $('#queryGroupInfo').data('serialchannelnos',JSON.stringify(arr)).html(selectName);
                                window.history.go(-1);
                            });
                       }else{
                            toggleSlideGroup('close');
                            createSerialParams($(this).siblings('.group-list-area'),function(arr){
                                currentParams.serialChannelNos = arr;
                                refreshGraph();
                            });
                            $('#selectGroupTitle').html(selectName);
                            $('#queryGroupInfo').html(selectName);
                       }
                        
                    });
                }

            },
            error: function() {
                queryGroupFailed();
            }
        });
    }
    $('.query-again').on('click', queryGroup);

    //获取更新时间
    var getUpdateTime = function() {
        $.ajax({
            url: '/api/passengerflow/lastUpdateTime',
            data: {
                sessionId: publicParam.sessionId,
                serial: currentParams.serialChannelNos[0].serial,
                channelNo : currentParams.serialChannelNos[0].channelNo,
                date: currentParams.getTime()
            },
            success: function(d) {
                if (d.resultCode == '0') {
                    var t;
                    if (typeof d.lastUpdate == 'number') {
                        t = new Date(d.lastUpdate);
                        $('#updateTime').html((t.getMonth() + 1) + '-' + t.getDate() + ' ' + t.getHours() + ':' + (t.getMinutes() < 10 ? '0' : '') + t.getMinutes());
                    } else {
                        $('#updateTime').parent().html('暂无更新');
                    }
                }else if(d.resultCode == '-3' && YsAppBridge.version >= 3000000){
                    YsAppBridge.relogin();
                }
            }
        });
    }

    //创建两天的参数配置项，插入今天的时间数据
    var today = new Date();
    var currentParams = new GraphParams();
    var lastParams = new GraphParams('empty');
    currentParams.setTime(today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate());
    //获取更新时间
//    getUpdateTime();
    //获取分组
//    queryGroup();
    //刷新页面时重置锚点
    manChgHash('main');
    //添加获取网页内容高度的方法
    window.getAppPageHeight = function(){
        return document.body.scrollHeight;
    }
})();
