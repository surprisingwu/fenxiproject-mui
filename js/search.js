document.addEventListener("deviceready", function() {
	document.addEventListener("backbutton", function() {
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
$(function() {
	//定时器名称，用于函数节流
	var timerID = null;
	getJumpMesg();//获取传过来的数据
    bindEvent();//绑定事件
	//接收分析存储的数据
	function getJumpMesg() {
		if(localStorage.getItem("localVal")) {
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
	//绑定事件
	function bindEvent() {
		//点击左上角的按钮，返回上一页
        $("#checkArrow").on("click", function() {
            mui.openWindow({
                url: '../index.html',
                id: 'index'
            });
        })
        //点击搜索按钮，进行搜索，并启用定时器用于函数节流。减少不必要的请求次数
        $(".searchBlock .searchInput").on("keyup", function() {
            clearTimeout(timerID);
            //对于用户的输入，做延迟处理，减少不必要的请
            timerID = setTimeout(function() {
                var inputValue = $(".searchBlock .searchInput").val().trim();
                if(inputValue === "") {
                    $(".searchBlock .delateIcon").hide();
                    content1Show()
                    return;
                }
                content1Hide()
                lastInputVal = inputValue;
                callActionData({
                    inputValue: inputValue,
                    pageIndex: 1
                })
            }, 300)

        })
        //点击删除的iocn，删除input里面的内容
        $(".searchBlock .delateIcon").on("click", function() {
            $(".searchBlock .searchInput").val("");
            $("#listsContainer").html("")
            $(".searchBlock .delateIcon").hide();
            content1Show()
        })
        //监控键盘按下事件，显示删除按钮
        $(".searchBlock .searchInput").on("keydown", function() {
            $(".searchBlock .delateIcon").show();
        })
        //点击取消按钮   初始化
        $(".cancelBtn").on("click", function() {
            $(".searchBlock .delateIcon").hide();
            $(".searchBlock .searchInput").val("");
            content1Show()
        })
		//点击关键字，根据关键字进行搜索
        mui(".keywordsListWraper").on("tap", "li", function() {
            var listName = $(this).text().trim();
            $(".searchBlock .searchInput").val(listName);
            $(".searchBlock .delateIcon").show();
            $("#content1").hide();
            callActionData({
                inputValue: listName,
                pageIndex: 1
            })
        })
    }


	// 关键字   列表是否展示
	function content1Show() {
		$("#listsContainer").html("");
		$("#content1").show();
	}

	function content1Hide() {
		$("#listsContainer").html("");
		$("#content1").hide();
	}
	mui("#listsContainer").on("tap", "li", function() {
		var data = $(this).attr("name");
		var dataName = $('.search-detail-mesg', this).text()
		if(data) {
			if(isPersonage === "Y") {
				var tempKey = globalPersonalSate[activeState];
				//获取相应的主键
				currentStateObj[tempKey[currentIndex].value] = data;
				if(currentIndex === 1) {
					initLocal();
					setTotalData()
					mui.openWindow({
						url: '../html/listspage.html',
						id: '../html/listspage.html'
					})
					return;
				} else {
					var currentSate = tempKey[currentIndex + 1].value;
					currentStateObj[currentSate] = "all";
				}
			} else {
				var tempKey = globalState[activeState];
				//获取相应的主键
				currentStateObj[tempKey[currentIndex].value] = data;
				if(currentIndex === 3) {
					initLocal()
					setTotalData();
					mui.openWindow({
						url: '../html/listspage.html',
						id: '../html/listspage.html'
					})
					return;
				} else {
					var currentSate = tempKey[currentIndex + 1].value;
					currentStateObj[currentSate] = "all";
				}
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
	})
	//渲染返回的数据
	function renderList(data) {
		var htmlStr = "";
		var listsContainer = $("#listsContainer");
		data.forEach(function(item, index) {
			htmlStr += '<li class="mui-table-view-cell" name="' + item.dims_pk + '">' +
				' <i class="mui-icon mui-icon-search"></i>' +
				' <span class="search-detail-mesg">' + item.dims_name + '</span>' +
				' <span class="search-total-money">￥' + item.total + '</span>' +
				'<i class="mui-icon mui-icon-forward"></i></li>'
		})
		listsContainer.append(htmlStr)
	}

	function renderNoneMesg() {
		var htmlStr = '<li class="mui-table-view-cell">没有查询到相关的数据！</li>';
		var $listsContainer = $("#listsContainer");
		$listsContainer.html(htmlStr)
	}
	//  调取后台的数据
	function callActionData(options) {
		var inputValue = options.inputValue || lastInputVal;
		var pageIndex = options.pageIndex || 1;
		var _self = options.self || "";
		if(isPersonage === "Y") {
			var dataActiveState = globalPersonalSate[activeState][currentIndex].value
		} else {
			var dataActiveState = globalState[activeState][currentIndex].value;
		}
		var params = {};
		params.controllerid = 'com.mobile.controller.MobileReportAnalyzeController';
		params.appid = 'handler';
		params.cuserid = cuserid;
		params.begindate = begindate;
		params.enddate = enddate;
		params.dimsmap = currentStateObj;
		params.currdim = dataActiveState;
		params.matstr = inputValue;
		params.pageSize = 10;
		params.pageIndex = pageIndex;
		callService(mycallback, myerr, params)
		mycallback(data)

		function mycallback(data) {
			try {
				data = JSON.parse(data)
			} catch(e) {
				data = data
			}
			if(data.datas === null || data.datas === "null") {
				renderNoneMesg();
				if(_self) {
					_self.endPullupToRefresh(false)
				}
				return;
			}
			var data = data.datas;
			if(data.length >= 10) {
				mui('#pullrefresh').pullRefresh().enablePullupToRefresh();
			} else {
				mui('#pullrefresh').pullRefresh().disablePullupToRefresh();
			}
			if(_self) {
				_self.endPullupToRefresh(false)
			}
			renderList(data);
		}

		function myerr(e) {
			if(_self) {
				_self.endPullupToRefresh(false)
			}
			mui.alert("网络异常，请稍候重试！", "提示", "确定", function() {})
		}
	}
	//上拉加载  初始化
	mui.init({
		pullRefresh: {
			container: '#pullrefresh', //待刷新区域标识，querySelector能定位的css选择器均可，比如：id、.class等
			up: {
				height: 50, //可选.默认50.触发上拉加载拖动距离
				auto: false, //可选,默认false.自动上拉加载一次
				contentrefresh: "正在加载...", //可选，正在加载状态时，上拉加载控件上显示的标题内容
				contentnomore: '没有更多数据了', //可选，请求完毕若没有更多数据时显示的提醒内容；
				callback: function() {
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
})