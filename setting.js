
$(function(){ 

    var screenWidth = $(window).width(),   //获取屏幕宽度
        screenHeight = $(window).height(),  //获取屏幕高度
        coverLoadedStatus = "",//封面图片是否已经加载
        serial = getParam("serial") || "",     //获取设备序列号
        channelNo = getParam("channelNo") || 1,  //获取设备通道号
        sessionId = getParam("sessionId") || "",  //获取sesssionId
        cameraId = getParam("cameraId") || "",     //获取监控点Id
        clientType = getParam("clientType") || 1, //获取终端类型
        version = getParam("version") || "", //版本信息
        appType = getParam("appType") || "", //获取app类型
        mac = getParam("mac") || "", //获取mac地址
        coverHeight,         //获取封面高度
        currentAngle = 0,    //当前感应线角度
        currentStandardAngle = 0,    //当前范围感应线角度
        currentScale = 1.0,    //当前感应线比例
        currentOrientation = "horizontal",   //当前感应线方向
        currentVerticalScale,   //当前感应线垂直比例
        verticalScale,   //感应线垂直比例
        currentDirection,   //当前感应线方向坐标
        currentLine,    //当前感应线坐标
        isHintShow = false,     //弱提示对话框是否正在显示
        devicePosition = 0,         //设备安装位置
        anglesMoveList = [],    //计算角度拖动点数组集合
        moveX,   //默认移动x轴坐标
        startX,  //默认起始x轴坐标
        codeAxisMap = {   //角度坐标映射表
            "0" : -40,
            "1" : -30,
            "2" : -20,
            "3" : -10,
            "4" : 0,
            "5" : 10,
            "6" : 20,
            "7" : 30,
            "8" : 40
        },
        dire = 90,          //方向长度固定不变
        isStart = false,    //是否开启感应线控制
        isGetCover = false; //是否获取到封面

    //页面加载，默认初始化
    init();

    //计算角度拖动点固定位置
    (function calAnglesList(){
        var eachLeft = document.body.clientWidth / 10;
        var circleWidth = parseFloat($("#circleBtn").css("width"));
        for(var i = 0;i<9;i++){
            anglesMoveList.push(eachLeft*(i+1)-circleWidth/2);
        } 
    })();

    //获取当前的位置
    function getPosLeft(num){

        var _anglesMoveList = anglesMoveList.slice(0);
        _anglesMoveList.push(num);
        _anglesMoveList.sort(function(a,b){
            return a-b;
        });
        var index = _anglesMoveList.indexOf(num);
        if(index === 0){
            return {val:anglesMoveList[0],angle:-40};
        }else if(index === _anglesMoveList.length - 1){
            return {val:anglesMoveList[anglesMoveList.length - 1],angle:40};
        }else{
            return (_anglesMoveList[index] - _anglesMoveList[index-1]) > (_anglesMoveList[index+1] - _anglesMoveList[index]) ? {val:_anglesMoveList[index+1],angle:codeAxisMap[index]} : {val:_anglesMoveList[index-1],angle:codeAxisMap[index-1]};
        }
    }

    //拖动角度
    $("#circleBtn").on("touchstart",function(event){
        // if($(event.target).attr('id') == 'circleBtn'){ 
            var touchPros = event.touches[0];
            startX = touchPros.pageX - event.target.parentNode.offsetLeft;
        // }
        return false;
    }).on("touchmove",function(event){
        // if($(event.target).attr('id') == 'circleBtn'){ 
            var touchPros = event.touches[0];
            moveX = touchPros.pageX - startX;
            console.log("moveX:"+moveX);
            $(this).css('transform','translate3d('+(moveX/100)+'rem,0,0)');
        // }
        return false;
    }).on("touchend",function(event){
        // if($(event.target).attr('id') == 'circleBtn'){ 
            var currentLeft,
                posLeftObj;
            if($(this).css("left").indexOf("px")>-1){
                currentLeft = parseFloat($(this).css("left"))/100;
            }else{
                currentLeft = parseFloat($(this).css("left"));
            }          
            $(this).css('transform','translate3d(0,0,0)');  
            posLeftObj = getPosLeft((currentLeft+(moveX/100))*100);
            $(this).css('left',posLeftObj.val+'px');
            currentAngle = currentStandardAngle + parseInt(posLeftObj.angle);

            if(currentOrientation == "horizontal"){
                rotateAngle(currentAngle,currentScale);
            }else{
                rotateAngle(currentAngle,currentVerticalScale);
            }      
            
        // }
        return false;
    })

    //传入角度，获取线条长度
    function getLine(angle){
        var _angle = (angle+90)*Math.PI/180;
        if(Math.abs(Math.tan(_angle))<screenWidth/coverHeight){
            return Math.abs(coverHeight/Math.cos(_angle));
        }else{
            return Math.abs(screenWidth/Math.sin(_angle));
        }   
    }

    //坐标转换角度
    function getConer(a1,a2,s){
        var add =0;
        if(s.y>0.5 && s.x<0.5){
            add = 2*Math.PI;
        }else if(s.y<0.5){
            add = Math.PI;
        }
        var _angle = Math.atan((s.x-0.5)*screenWidth/((s.y-0.5)*coverHeight))+add;
        var angle = _angle*180/Math.PI;
        if(angle<0) angle = 360+angle;

        var delta = (Math.abs(Math.tan(_angle))<coverHeight/screenWidth) ? Math.abs(a1.x-a2.x) : Math.abs(a1.y-a2.y);
        return {
            angle : angle,
            delta : delta
        };
    }

    //角度转换坐标
    function getCodes(angle,scale){

        var lineNum = getLine(angle)/2;
        var _angle = (angle+90)*Math.PI/180;
        var _angle2 = angle*Math.PI/180;
        var roundNum = function(num){
            return num < 0 ? 0 : (num > 1 ? 1 : num)
        }
        var currentDirection = {
            x1 : 0.5,
            y1 : 0.5,
            y2 : roundNum((Math.cos(_angle2)*dire+0.5*coverHeight)/coverHeight),
            x2 : roundNum((Math.sin(_angle2)*dire+0.5*screenWidth)/screenWidth)
        }
        var currentLine = {
            y2 : roundNum((Math.cos(_angle)*lineNum*scale+0.5*coverHeight)/coverHeight),
            x2 : roundNum((Math.sin(_angle)*lineNum*scale+0.5*screenWidth)/screenWidth)
        }
        currentLine["x1"] = 1-currentLine["x2"];
        currentLine["y1"] = 1-currentLine["y2"];

        return {
            currentDirection : currentDirection,
            currentLine : currentLine
        };
    }

    // window.getConer = getConer;
    // window.getCodes = getCodes;

    //查找视频通道的封面接口
    function getVideoCover(){
        $.ajax({ 
            url: "/mobile/passenger/refreshCoverUrl.action",
            data : {
                "sessionId" : sessionId,
    			"clientType" : clientType, //获取终端类型
        		"version" : clientType, //版本信息
        		"appType" : clientType, //获取app类型
        		"mac" : clientType, //获取mac地址
                "cameraId" : cameraId
            },
            type: "post",
            success: function(data) {
            	data = eval("("+data+")");
                if(data.resultCode == 0){
                    isGetCover = true;
                    $(".video_cover img").attr("src",data.url);
                }else if(data.resultCode == 2000){
                    //hintShow("设备不存在")
                    //$(".video_cover img").attr("src","../../assets/passengers/images/default_bg.png");
                    showErrorTip();
                }else if(data.resultCode == -5){
                    //hintShow("网络操作异常")
                    //$(".video_cover img").attr("src","../../assets/passengers/images/default_bg.png");
                    showErrorTip();
                }else if(data.resultCode == 2003){
                    //hintShow("设备不在线")
                    //$(".video_cover img").attr("src","../../assets/passengers/images/default_bg.png");
                    showErrorTip();
                }else if(data.resultCode == 2009){
                    //hintShow("设备响应超时")
                    //$(".video_cover img").attr("src","../../assets/passengers/images/default_bg.png");
                    showErrorTip();
                }else if(data.resultCode == -3 && YsAppBridge.version >= 3000000){
                     YsAppBridge.relogin();
                }
                else{
                    //hintShow("服务器错误")
                    //$(".video_cover img").attr("src","../../assets/passengers/images/default_bg.png");
                	//hintShow("服务器报错！" + data.resultDes)
                    showErrorTip();
                }
                $("#loading").hide();
            },
            error: function() {
                //hintShow("服务器错误")
                //$(".video_cover img").attr("src","../../assets/passengers/images/default_bg.png");
                showErrorTip();
                $("#loading").hide();
            }
        });

    }
    //将异常数据转换成默认值处理
    function hasIllegalData(data){
        var str = JSON.stringify(data);
        return !!str.match(/null|undefined|nan/ig);
    }

    //显示图片获取失败以及重载按钮
    function showErrorTip(hide){
        if(hide){
            $(".reloadBtn").css("display","none");
            $(".reloadText").css("display","none");    
        }else{
            $(".reloadBtn").css("display","block");
            $(".reloadText").css("display","block");        
        }
    }

    //重新获取封面
    $(".reloadBtn").on("click",function(){
        $("#loading").show();
        getVideoCover();
    })

    //返回统计参考线坐标接口
    function getAxis(){
        $("#loading").show();
        $.ajax({ 
            url: "/mobile/passenger/getFlowConfig.action",
            data : {
                "sessionId" : sessionId,
    			"clientType" : clientType, //获取终端类型
        		"version" : clientType, //版本信息
        		"appType" : clientType, //获取app类型
        		"mac" : clientType, //获取mac地址
                "cameraId" : cameraId
            },
            type: "post",
            success: function(data) {
            	data = eval("("+data+")");
                $("#loading").hide();    //loading
                if(data.resultCode == 0 && data.flowConfig){
                	var flowConfig = eval("("+data.flowConfig+")");
                    currentDirection = (hasIllegalData(flowConfig.direction) ? {x1:0.5,y1:0.5,x2:0.5,y2:0.6} : flowConfig.direction);   //当前感应线方向坐标
                    currentLine = (hasIllegalData(flowConfig.line) ? {x1:0.0,y1:0.5,x2:1.0,y2:0.5} : flowConfig.line);    //当前感应线坐标
                    switchType();   //把坐标值从string转成float类型
                    $(".setBtn button").removeClass("onselected");   //去除所有按钮选中状态
                    selectAxis();   
                    $(".arrow").css({"display":"block"});
                    $(".line").css({"display":"block"});
                }else if(data.resultCode == -2){
                    currentDirection = {x1:0.5,y1:0.5,x2:0.5,y2:0.6};   //当前感应线方向坐标
                    currentLine = {x1:0.0,y1:0.5,x2:1.0,y2:0.5};    //当前感应线坐标
                    $(".setBtn button").removeClass("onselected");   //去除所有按钮选中状态
                    selectAxis();
                    $(".arrow").css({"display":"block"});
                    $(".line").css({"display":"block"});
                }else if(data.resultCode == -3 && YsAppBridge.version >= 3000000){
                    YsAppBridge.relogin();
                }else{
                    hintShow("服务器报错！" + data.resultDes)
                }
            },
            error: function() {
                /*例子测试*/  
                // currentDirection = {x1:0.5,y1:0.5,x2:0.4,y2:0.35};   //当前感应线方向坐标
                // currentLine = {x1:0.0,y1:1.0,x2:1.0,y2:0.0};    //当前感应线坐标
                // switchType();   //把坐标值从string转成float类型
                // console.log(currentDirection);
                // console.log(currentLine);
                // $(".setBtn button").removeClass("onselected");   //去除所有按钮选中状态
                // selectAxis();   
                // $(".arrow").css({"display":"block"});
                // $(".line").css({"display":"block"});
                $("#loading").hide();   
                //hintShow("服务器报错！")
            }
        });

    }

    //感应线0度旋转
    $("body").on("touchstart","#rotate0_btn",function(e){
        if($(event.target).attr('id') == 'rotate0_btn'){ 
            $(this).addClass("selected");
        }
        e.preventDefault(); 
        return false;
    }).on("touchend","#rotate0_btn",function(e){
        if($(event.target).attr('id') == 'rotate0_btn'){ 
            var me = this;
            rotate0Btn(e,me);
        }
        e.preventDefault(); 
        return false;
    }).on("touchmove","#rotate0_btn",function(e){
        if($(event.target).attr('id') == 'rotate0_btn'){ 
            var me = this;
            rotate0Btn(e,me);
        }
        e.preventDefault(); 
        return false;
    })

    //感应线0度旋转(回调函数)
    function rotate0Btn(e,me){
        $("#circleBtn").css("left",anglesMoveList[4]+"px");   //微调角度还原
        $(".setBtn button").removeClass("onselected");
        $("#rotate0_btn").removeClass("selected").addClass("onselected"); 
        currentStandardAngle = 0;
        currentAngle = 0;
        rotateAngle(currentAngle,currentScale); 
        if(currentOrientation == "vertical"){
            currentOrientation = "horizontal";
        }  
    }

    //感应线90度旋转
    $("body").on("touchstart","#rotate90_btn",function(e){
        if($(event.target).attr('id') == 'rotate90_btn'){ 
            $('#rotate90_btn').addClass("selected");
        }
        e.preventDefault(); 
        return false;
    }).on("touchend","#rotate90_btn",function(e){
        if($(event.target).attr('id') == 'rotate90_btn'){ 
            var me = this;
            rotate90Btn(e,me); 
        }
        e.preventDefault(); 
        return false;
    }).on("touchmove","#rotate90_btn",function(e){
        if($(event.target).attr('id') == 'rotate90_btn'){ 
            var me = this;
            rotate90Btn(e,me);  
        }
        e.preventDefault();  
        return false; 
    })

    //感应线90度旋转(回调函数)
    function rotate90Btn(e,me){
        $("#circleBtn").css("left",anglesMoveList[4]+"px");   //微调角度还原
        $(".setBtn button").removeClass("onselected");
        $("#rotate90_btn").removeClass("selected").addClass("onselected"); 
        currentStandardAngle = 90;
        currentStandardAngle = 90;
        currentAngle = 90;      
        rotateAngle(currentAngle,currentVerticalScale); 
        if(currentOrientation == "horizontal"){
            currentOrientation = "vertical";
        }    
    }

    //感应线180度旋转
    $("body").on("touchstart","#rotate180_btn",function(e){
        if($(event.target).attr('id') == 'rotate180_btn'){ 
            $(this).addClass("selected");
        }
        e.preventDefault(); 
        return false;
    }).on("touchend","#rotate180_btn",function(e){
        if($(event.target).attr('id') == 'rotate180_btn'){ 
            var me = this;
            rotate180Btn(e,me);
        }  
        e.preventDefault(); 
        return false;        
    }).on("touchmove","#rotate180_btn",function(e){
        if($(event.target).attr('id') == 'rotate180_btn'){ 
            var me = this;
            rotate180Btn(e,me);
        }  
        e.preventDefault(); 
        return false;        
    })

    //感应线180度旋转(回调函数)
    function rotate180Btn(e,me){
        $("#circleBtn").css("left",anglesMoveList[4]+"px");   //微调角度还原
        $(".setBtn button").removeClass("onselected");
        $("#rotate180_btn").removeClass("selected").addClass("onselected"); 
        currentStandardAngle = 180;
        currentAngle = 180;
        rotateAngle(currentAngle,currentScale); 
        if(currentOrientation == "vertical"){
            currentOrientation = "horizontal";
        } 
    }

    //感应线270度旋转
    $("body").on("touchstart","#rotate270_btn",function(e){
        if($(event.target).attr('id') == 'rotate270_btn'){ 
            $(this).addClass("selected");
        }
        e.preventDefault(); 
        return false;  
    }).on("touchend","#rotate270_btn",function(e){
        if($(event.target).attr('id') == 'rotate270_btn'){ 
            var me = this;
            rotate270Btn(e,me)   
        }
        e.preventDefault(); 
        return false;  
    }).on("touchmove","#rotate270_btn",function(e){
        if($(event.target).attr('id') == 'rotate270_btn'){ 
            var me = this;
            rotate270Btn(e,me)   
        }
        e.preventDefault(); 
        return false;  
    })

    //感应线270度旋转(回调函数)
    function rotate270Btn(e,me){
        $("#circleBtn").css("left",anglesMoveList[4]+"px");   //微调角度还原
        $(".setBtn button").removeClass("onselected");
        $("#rotate270_btn").removeClass("selected").addClass("onselected"); 
        currentStandardAngle = 270;
        currentStandardAngle = 270;
        currentAngle = 270;
        rotateAngle(currentAngle,currentVerticalScale);
        if(currentOrientation == "horizontal"){
            currentOrientation = "vertical";
        }   
    }

    //感应线比例放大
    $("#blowup_btn").on("touchstart",function(e){
        $(this).addClass("selected");
    }).on("touchend",function(e){
        var me = this;
        blowupBtn(e,me);
    }).on("touchmove",function(e){
        $(this).removeClass("selected");
        e.preventDefault();     
    })

    //感应线比例放大(回调函数)
    function blowupBtn(e,me){
        $(me).removeClass("selected"); 
        if(currentOrientation == "horizontal"){
            if(currentScale>=1.0){
                return;
            }else{
                currentScale += 0.2;
                currentScale = parseFloat(currentScale.toFixed(1));
                currentVerticalScale += verticalScale/5;
                rotateAngle(currentAngle,currentScale,true);
            }
        }else{
            console.log("currentVerticalScale:"+currentVerticalScale+"verticalScale:"+verticalScale);
            if(currentVerticalScale>=verticalScale){
                return;
            }else{
                currentVerticalScale += verticalScale/5;
                currentScale += 0.2;
                rotateAngle(currentAngle,currentVerticalScale,true);
            }
        }
        e.preventDefault(); 
    }

    //感应线比例缩小
    $("#shrink_btn").on("touchstart",function(e){
        $(this).addClass("selected");
    }).on("touchend",function(e){
        var me = this;
        shrinkBtn(e,me);               
    }).on("touchmove",function(e){
        $(this).removeClass("selected");
        e.preventDefault();                  
    })

    //感应线比例缩小(回调函数)
    function shrinkBtn(e,me){
        $(me).removeClass("selected"); 
        if(currentOrientation == "horizontal"){
            if(currentScale<=0.2){
                return;
            }else{
                currentScale -= 0.2;
                currentScale = parseFloat(currentScale.toFixed(1));
                currentVerticalScale -= verticalScale/5;
                rotateAngle(currentAngle,currentScale);
            }
        }else{
            if(currentVerticalScale<=(verticalScale/5+0.001)){
                return;
            }else{
                currentScale -= 0.2;
                currentScale = parseFloat(currentScale.toFixed(1));
                currentVerticalScale -= verticalScale/5;
                rotateAngle(currentAngle,currentVerticalScale);
            }
        }
        e.preventDefault(); 
    }

    //保存提交
    $(".saveBtn button").on("touchstart",function(e){
        $(this).addClass("saveSelected");
    }).on("touchend",function(e){
        var me = this;
        saveBtn(e,me);
    }).on("touchmove",function(e){
        var me = this;
        saveBtn(e,me);
    })

    //保存提交(回调函数)
    function saveBtn(e,me){
        $(me).removeClass("saveSelected"); 
        if(coverLoadedStatus == 'loaded'){
             $("#loading").show();
            console.log(currentDirection);
            console.log(currentLine);
            setVideoCover();
        }else if(coverLoadedStatus === 'error'){
            hintShow('封面未载入，请稍等');
        }else{
            hintShow('封面加载失败，请刷新封面');
        }
       
        e.preventDefault();
    }

    //交换对象中的属性值
    function swapObj(obj,a,b){
        var c = obj[a];
        obj[a] = obj[b];
        obj[b] = c;
    }

    //获取超链接参数值
    function getParam(str) {
        var hash = window.location.href.split('?')[1],
            obj = {},
            val = "",
            list = null;
        if (hash) {
            list = hash.split('&');
            $.each(list, function (index, item) {
                var a = item.split('=');
                if(a[0] == str){
                    val = a[1];
                }
            });
            return val;
        }
    }

    //封面加载成功响应回调函数
    $(".cover img").on("load",function(){
        if(!isGetCover) return;
        showErrorTip(true);   //隐藏重载封面按钮
        setTimeout(function(){
            coverLoadedStatus = 'loaded';
            isStart = true;   //开启控制
            coverHeight = $(".cover img").height();  //获取封面高度
            currentVerticalScale = coverHeight/screenWidth;   //当前感应线垂直比例
            verticalScale = coverHeight/screenWidth;   //感应线垂直比例
            getAxis();
        }, 1000);
    });
    //封面加载成功响应回调函数
    $(".cover img").on("error",function(){
        coverLoadedStatus = 'error';
    });

    //封面加载失败响应回调函数
    // $(".cover img").on("error",function(){
    //     $(".video_cover img").attr("src","../../assets/passengers/images/default_bg.png");    
    // })

    //设置统计参考线坐标接口
    function setVideoCover(){

        var objCodes = getCodes(currentAngle,currentScale);
        currentDirection = objCodes.currentDirection;
        currentLine = objCodes.currentLine;

        console.log(currentDirection);
        console.log(currentLine);

        //把坐标值从float转成string类型
        for(var i in currentDirection){
            currentDirection[i] = String(currentDirection[i]);
        }
        for(var j in currentLine){
            currentLine[j] = String(currentLine[j]);
        }
        $.ajax({ 
            url: "/mobile/passenger/setFlowConfig.action",
            data : {
//                "serial" : serial,
//                "channelNo" : channelNo,
                "sessionId" : sessionId,
    			"clientType" : clientType, //获取终端类型
        		"version" : clientType, //版本信息
        		"appType" : clientType, //获取app类型
        		"mac" : clientType, //获取mac地址
                "cameraId" : cameraId,
                "position" : devicePosition,
                "line" : JSON.stringify(currentLine), //"{'x1':0.0,'y1':0.5,'x2':'1.0','y2':'0.5'}", 
                "direction" : JSON.stringify(currentDirection) //"{'x1':0.5,'y1':0.5,'x2':'0.5','y2':'0.6'}"
            },
            type: "post",
            success: function(data) {
                $("#loading").hide();
                data = eval("("+data+")");
                if(data.resultCode == 0){
                    hintShow("保存成功！")
                }else if(data.resultCode == -6){
                    hintShow("参数错误！")
                }else if(data.resultCode == -3 && YsAppBridge.version >= 3000000){
                    YsAppBridge.relogin();
                }else if(data.resultCode == 2000){
                    hintShow("设备不存在！")
                }else if(data.resultCode == 2003){
                    hintShow("设备不在线！")
                }else if(data.resultCode == 2003){
                    hintShow("网络异常！")
                }else{
                    hintShow("服务器错误！" + data.resultDes)
                }            
                //把坐标值从string转成float类型
                switchType();
            },
            error: function() {
                $("#loading").hide();
                hintShow("保存失败！")
                //$("#loading").hide();
                //把坐标值从string转成float类型
                switchType();
            }
        });

    }

    //把坐标值从string转成float类型
    function switchType(){
        for(var i in currentDirection){
            currentDirection[i] = parseFloat(currentDirection[i]);
        }
        for(var j in currentLine){
            currentLine[j] = parseFloat(currentLine[j]);
        }
    }

    //是否显示弱提示对话框
    function hintShow(text){
        if(isHintShow) return;
        isHintShow = true;
        $(".hint").css({"display":"block"});
        $(".hint").html(text).addClass("fadeOut");
        setTimeout(function () { 
            $(".hint").removeClass("fadeOut").css({"display":"none"});
            isHintShow = false;
        }, 3000);
    }

    //角度过滤，取到十位
    function filterAngle(angle){
        var mod = angle % 10;
        return mod>5 ? Math.floor(angle/10)*10+10 : Math.floor(angle/10)*10;
    }

    //设置角度微调位置
    function setAnglePos(angle){
        for(var i in codeAxisMap){
            if(codeAxisMap[i] == angle){
                $("#circleBtn").css("left",anglesMoveList[i]+"px");   //微调角度还原
                break;
            }
        }
    }

    //对应设备，旋转角度是水平相反的，需要做一下处理
    function handleAngle(angle){
        return 180-angle;
    }

    //旋转感应线角度
    function rotateAngle(angle,scale,cancle){
        if(!isStart) return;
        angle = handleAngle(angle);
        $(".line").css('-webkit-transform','rotate('+angle+'deg) scaleX('+scale+')');   //线旋转
        if(!cancle) $(".arrow").css('-webkit-transform','rotate('+angle+'deg)');    //箭头旋转
    }

    //设置感应线初始状态
    function selectAxis(){
        
        var Dx1 = currentDirection["x1"],
            Dy1 = currentDirection["y1"],
            Dx2 = currentDirection["x2"],
            Dy2 = currentDirection["y2"],
            Lx1 = currentLine["x1"],
            Ly1 = currentLine["y1"],
            Lx2 = currentLine["x2"],
            Ly2 = currentLine["y2"],
            conerObj = {};
        conerObj = getConer({"x":Lx1,"y":Ly1},{"x":Lx2,"y":Ly2},{"x":Dx2,"y":Dy2});
        currentAngle = filterAngle(conerObj.angle);  //当前感应线角度
        console.log("currentAngle:"+currentAngle);

        currentScale = conerObj.delta,   //当前感应线比例
        currentVerticalScale = verticalScale * currentScale;   //当前感应线垂直比例

        if((currentAngle >=0 && currentAngle <= 40) || (currentAngle >=320 && currentAngle <= 360)){
            currentStandardAngle = 0;
            currentOrientation = "horizontal";   //当前感应线方向
            rotateAngle(currentAngle,currentScale);
            $(".rotate0_btn").addClass("onselected");
            if(currentAngle >=320){
                setAnglePos(currentAngle-360);   //设置角度微调位置;  
            }else{
                setAnglePos(currentAngle-0);   //设置角度微调位置;   
            }    
        }else if(currentAngle >=50 && currentAngle <= 130){
            currentStandardAngle = 90;
            currentOrientation = "vertical";   //当前感应线方向
            rotateAngle(currentAngle,currentVerticalScale);
            $(".rotate90_btn").addClass("onselected"); 
            setAnglePos(currentAngle-90);   //设置角度微调位置;
        }else if(currentAngle >=140 && currentAngle <= 220){
            currentStandardAngle = 180;
            currentOrientation = "horizontal";   //当前感应线方向
            rotateAngle(currentAngle,currentScale); 
            $(".rotate180_btn").addClass("onselected");
            setAnglePos(currentAngle-180);   //设置角度微调位置;
        }else if(currentAngle >=230 && currentAngle <= 310){
            currentStandardAngle = 270;
            currentOrientation = "vertical";   //当前感应线方向
            rotateAngle(currentAngle,currentVerticalScale);
            $(".rotate270_btn").addClass("onselected");
            setAnglePos(currentAngle-270);   //设置角度微调位置; 
        }

    }

    function getDeviceType(){
        $.ajax({
            url : '/api/device/get',
            type : 'post',
            data : {
                sessionId : sessionId,
                deviceSerialNo : serial,
                clientType : clientType
            },
            success : function(data){
                if(data.resultCode == '0'){
                    var deviceType = data.device.fullModel;
                    //判断当前设备安装位置
                    if(/CT3S|C3/i.test(deviceType)){
                        devicePosition = 0;   //侧面
                    }else if(/CT4S|C4/i.test(deviceType)){
                        devicePosition = 1;   //顶部
                    }
                }
            }
        })
    }

    //页面载入默认初始化
    function init(){
        //默认获取设备封面
        getVideoCover();
        //获取设备类型
//        getDeviceType();
        //弹出loading对话框
        $("#loading").show();

    }

});