document.addEventListener("deviceready", function () {
    document.addEventListener("backbutton", function () {
        mui.openWindow({
            url: '../index.html',
            id: 'index'
        });
    }, false);
}, false);
var cuserid = "";
var begindate = "";
var enddate = "";
var currentStateObj = null;
var activeState = "";
var pageIndex = 1;
var lastInputVal = "";
var currentIndex = 0;
var isPersonage = "N";
summerready = function () {
    getJumpMesg();
    function getJumpMesg() {
        if (localStorage.getItem("localVal")){
            var localVal = JSON.parse(localStorage.getItem("localVal"))
            cuserid = localVal.cuserid;
            begindate = localVal.begindate;
            enddate = localVal.enddate;
            currentStateObj = localVal.dimsmap;
            activeState = localVal.activeState;
            currentIndex = localVal.currentIndex;
            isPersonage = localVal.isPersonage;
        }
    }

    $("#checkArrow").on("click", function () {
        mui.openWindow({
            url: '../index.html',
            id: 'index'
        });
    })
//点击删除的iocn，删除input里面的内容
    $(".searchBlock .delateIcon").on("click", function () {
        $(".searchBlock .searchInput").val("");
        $("#listsContainer").html("")
        $(".searchBlock .delateIcon").hide();
    })
//点击搜索按钮，进行搜索
    $(".searchBlock .searchInput").on("keyup", function () {
        var inputValue = $(".searchBlock .searchInput").val().trim();
        if (inputValue === "") {
            $(".searchBlock .delateIcon").hide();
            return;
        }
        $("#content1").hide();
        mui('#pullrefresh').pullRefresh().refresh(true);
        lastInputVal = inputValue;
        callActionData({
        	inputValue: inputValue,
        	pageIndex: 1
        })
    })
    //监控键盘按下事件，显示删除按钮
    $(".searchBlock .searchInput").on("keydown", function () {
        $(".searchBlock .delateIcon").show();
    })
    mui(".keywordsListWraper").on("tap","li",function () {
        var listName = $(this).text()
        $("#content1").hide();
        callActionData({
            inputValue: listName,
            pageIndex: 1
        })
    })
//点击取消按钮   初始化
    $(".cancelBtn").on("click", function () {
        $(".searchBlock .delateIcon").hide();
        $(".searchBlock .searchInput").val("");
        $("#listsContainer").html("");
        $("#content1").show();
        mui('#pullrefresh').pullRefresh().disablePullupToRefresh();
    })
mui("#listsContainer").on("tap","li",function(){
	var data = $(this).attr("name");
	var dataName = $('.search-detail-mesg',this).text()
	if (data) {
        if (isPersonage === "Y") {
            var tempKey = globalPersonalSate[activeState];
            //获取相应的主键
            currentStateObj[tempKey[currentIndex].value] = data;
            if (currentIndex === 1) {
                initLocal();
               setTotalData()
                mui.openWindow({
                    url: '../html/listspage.html',
                    id: '../html/listspage.html'
                })
                return;
                //@todo   需要传值到列表页
            }else{
                var currentSate = tempKey[currentIndex + 1].value;
                currentStateObj[currentSate] = "all";
            }
        } else {
            var tempKey = globalState[activeState];
            //获取相应的主键
            currentStateObj[tempKey[currentIndex].value] = data;
            if (currentIndex === 3) {
                initLocal()
               setTotalData();
                mui.openWindow({
                    url: '../html/listspage.html',
                    id: '../html/listspage.html'
                })
                return;
            }else {
                var currentSate = tempKey[currentIndex + 1].value;
                currentStateObj[currentSate] = "all";
            }
            currentIndex++;
            var resultData = {};
            resultData.currentIndex = currentIndex;
            resultData.resultId = data;
            resultData.navName = dataName
            resultData.dimsmap = currentStateObj;
            localStorage.setItem("resultData", JSON.stringify(resultData));
            mui.openWindow({
                url: '../index.html',
                id: 'index'
            });
        }
    }
})
//开始  禁用下拉刷新
function renderList(data){
	var htmlStr = "";
	var listsContainer = $("#listsContainer");
	data.forEach(function(item,index){
		htmlStr +='<li class="mui-table-view-cell" name="'+item.dims_pk+'">'
           +' <i class="mui-icon mui-icon-search"></i>'
           +' <span class="search-detail-mesg">'+item.dims_name+'</span>'
           +' <span class="search-total-money">￥'+item.total+'</span>'
        +'<i class="mui-icon mui-icon-forward"></i></li>'
	})
	listsContainer.append(htmlStr)	
}
function renderNoneMesg(){
	var htmlStr = '<li class="mui-table-view-cell">没有查询到相关的数据！</li>';
	var listsContainer = $("#listsContainer");
}
function callActionData(options){
	var inputValue = options.inputValue||lastInputVal;
	var pageIndex = options.pageIndex || 1;
	var _self    = options.self || "";
	if (isPersonage === "Y"){
	    var dataActiveState = globalPersonalSate[activeState][currentIndex].value
    }else {
	    var dataActiveState = globalState[activeState][currentIndex].value;
    }
	$_ajax._post({
            url: 'com.mobile.controller.MobileReportAnalyzeController',
            handler: 'handler',
            data: {
                cuserid: cuserid,
                begindate: begindate,
                enddate: enddate,
                dimsmap: currentStateObj,
                currdim: dataActiveState,
                matstr: inputValue,
                pageSize: 10,
                pageIndex: pageIndex,
            },
            success: mycallback,
            err: myerr
        })
        function mycallback(data) {
            if (data.datas === null) {
               renderNoneMesg();
                if (_self) {
                    _self.endPullupToRefresh(false)
                }
                return;
            }
            var data = data.datas;
            if (_self) {
                    _self.endPullupToRefresh(false)
            }
            renderList(data);
        }

        function myerr(e) {
        	 if (_self) {
                _self.endPullupToRefresh(false)
            }
            mui.alert("网络异常，请稍候重试！", "提示", "确定", function () {
            })
        }
}
//上拉加载  初始化
    mui.init({
        pullRefresh: {
            container: '#pullrefresh',//待刷新区域标识，querySelector能定位的css选择器均可，比如：id、.class等
            up: {
                height: 50,//可选.默认50.触发上拉加载拖动距离
                auto: false,//可选,默认false.自动上拉加载一次
                contentrefresh: "正在加载...",//可选，正在加载状态时，上拉加载控件上显示的标题内容
                contentnomore: '没有更多数据了',//可选，请求完毕若没有更多数据时显示的提醒内容；
                callback:function(){
                	pageIndex++;
                	callActionData({
                		inputValue: lastInputVal,
                		pageIndex: pageIndex,
                		self: this
                	})
                	
                }
        }
           }
    });
    mui('#pullrefresh').pullRefresh().disablePullupToRefresh();
}
