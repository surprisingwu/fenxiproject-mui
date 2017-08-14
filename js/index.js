/**
 * Created by 巫运廷 on 2017/7/11.
 */
//定义三个全局变量，用来接收。用户所选择的时间区间
var wholeVariateTime = {
	begindate: new Date().getFullYear() + '-01-01',
	enddate: new Date().getFullYear() + '-12-31',
};
var cuserid = "1001F410000000000446";
//分页的索引
var pageIndex = 1;

//是够清除 列表的数据
var clearFlag = true;
//用来保存当前的维度，来确定层级的顺序
var activeState = "szxmid";
//每次点击 +1
var currentIndex = 0;
//一个对象用来保存，当前层级的主键和参数
var currentStateObj = {
	szxmid: "all"
};
var isPersonage = "N";

//用来保存  刷新时全局的数据和钱
var refreshGlobalData = [];
var lastGetData = null;
document.addEventListener("deviceready", function() {
	document.addEventListener("backbutton", function() {
		functionback();
		initLocal();
	}, false);
}, false);
summerready = function() {
	mui("header").on("tap", "a", function() {
		functionback();
	})

	function returnBackRefresh() {
		var resultData = localStorage.getItem("resultData");
		var navHtmlStr = localStorage.getItem("htmlStr");
		var localVal = JSON.parse(localStorage.getItem("localVal"));
		wholeVariateTime.begindate = localVal.begindate;
		wholeVariateTime.enddate = localVal.enddate;
		activeState = localVal.activeState;
		$('#navWraper').html(navHtmlStr);
		if(resultData) {
			resultData = JSON.parse(resultData);
			if(isPersonage === "Y") {
				var tempKey = globalPersonalSate[activeState];
				//获取相应的主键
				currentStateObj[tempKey[currentIndex].value] = resultData.resultId;
				var currentSate = tempKey[currentIndex + 1].value;
				currentStateObj[currentSate] = "all";
			} else {
				var tempKey = globalState[activeState];
				//获取相应的主键
				currentStateObj[tempKey[currentIndex].value] = resultData.resultId;
				var currentSate = tempKey[currentIndex + 1].value;
				currentStateObj[currentSate] = "all";
			}
			var navText = resultData.navName
			var navLastData = localStorage.getItem("lastGetData")
			currentIndex = resultData.currentIndex;
			currentStateObj = resultData.dimsmap;
			createNav(navText, navLastData)

		} else {
			currentIndex = localVal.currentIndex;
			currentStateObj = localVal.dimsmap;
		}
		pageIndex = 1;
		if(currentIndex > 0) {
			$("#checkTimeRang").hide();
		}
	}

	//维度和时间区间。 回调里面调数据，来展示用户选择的维度或区间内的数据
	$(function() {
		if(isPersonage === "Y") {
			var weidu = ["收支项目", "默认收支项目", "单据类型"]
		} else {
			var weidu = [
				"人员", "部门", "默认收支项目", "单据类型", "收支项目"
			]
		}
		$.scrEvent({
			data: weidu,
			evEle: '#selectWeidu',
			title: '选择维度',
			defValue: "默认收支项目",
			afterAction: function(data) {
				//根据选择的不同，维度进行调取后台拿相应的数据
				pageIndex = 1;

				refreshGlobalData = [];
				$("#checkTimeRang").show();
				if(data === "人员") {
					activeState = "jkbxr";
				} else if(data === "部门") {
					activeState = "fydeptid";
				} else if(data === "单据类型") {
					activeState = "djlx";
				} else {
					activeState = "szxmid";
				}
				currentStateObj = $.deleteObjKey(currentStateObj);
				currentStateObj[activeState] = "all";
				callActionData({
					startTime: wholeVariateTime.begindate,
					endTime: wholeVariateTime.enddate,
					dimsmap: currentStateObj,
					initialize: checkWeiduInit,
				})
			}
		});
		$.dateSelector({
			evEle: '.checkIconWraper',
			startYear: '2015',
			endYear: '2022',
			timeBoo: false,
			title: "选择时间区间",
			afterAction: function(d1, d2) {
				//日期格式   2017-01-01     2017-12-31   第二个参数不区分是季度还是月份。
				var d1 = parseInt(d1);
				currentStateObj = $.deleteObjKey(currentStateObj);
				currentStateObj[activeState] = "all";
				refreshGlobalData = [];
				if(d2.indexOf("月") >= 0) {
					var checkMonth = parseInt(d2);
					var checkDays = new Date(d1, checkMonth, 0).getDate();
					wholeVariateTime.begindate = new Date(d1 + "-" + checkMonth + "-01").Format("yyyy-MM-dd");
					wholeVariateTime.enddate = new Date(d1 + "-" + checkMonth + "-" + checkDays).Format("yyyy-MM-dd")
				} else if(d2.indexOf("季度")) {
					var checkQuarter = parseInt(d2);
					var checkFirstMonth = (checkQuarter - 1) * 3 + 1;
					var checkEndtMonth = (checkQuarter - 1) * 3 + 3;
					var checkDays = new Date(d1, checkEndtMonth, 0).getDate();
					wholeVariateTime.begindate = new Date(d1 + "-" + checkFirstMonth + "-01").Format("yyyy-MM-dd")
					wholeVariateTime.enddate = new Date(d1 + "-" + checkEndtMonth + "-" + checkDays).Format("yyyy-MM-dd")
				} else {
					wholeVariateTime = {
						begindate: new Date().getFullYear() + '-01-01',
						enddate: new Date().getFullYear() + '-12-31',
					};
				}
				callActionData({
					startTime: wholeVariateTime.begindate,
					endTime: wholeVariateTime.enddate,
					dimsmap: currentStateObj,
				})
			}
		});
	})
	//图标初始化
	var myChart = echarts.init(document.getElementById('main'));
	if(localStorage.getItem("localVal")) {
		returnBackRefresh();
	}
	callActionData({
		startTime: wholeVariateTime.begindate,
		endTime: wholeVariateTime.enddate,
		dimsmap: currentStateObj,
		pageIndex: 1
	})
	//第一次调用，默认显示的维度是收支项目
	$(".navWraper").on("click", "li", function() {
		var currentLiIndex = $(this).index();
		var currentLiNum = currentLiIndex / 2;
		if(currentLiNum === currentIndex) {
			return;
		}
		if(currentLiIndex % 2 === 1) {
			return;
		}
		//currentStateObj   的状态要进行重置
		if(isPersonage === "Y") {
			var stateArr = globalPersonalSate[activeState]
		} else {
			var stateArr = globalState[activeState];
		}
		var tempObj = {}
		for(var i = 0; i <= currentLiNum; i++) {
			var tempItem = stateArr[i].value;
			if(i == currentLiNum) {
				tempObj[tempItem] = "all";
			} else {
				tempObj[tempItem] = currentStateObj[tempItem];
			}

		}
		currentStateObj = tempObj;
		$("~li", this).remove();
		var data = JSON.parse($(this).attr("navdata"));
		$(this).addClass("navActive");
		currentIndex = currentLiNum;
		drawEhart(data);
		if(currentLiIndex === 0) {
			$("#checkTimeRang").show();
		}
	})
	//根据数据绘制相应的图形
	function drawEhart(data) {
		if(data === null) {
			return
		}
		myChart.clean;
		$("#list-wraper").html("")
		var dataArr = [];
		var totalMoney = 0;
		var colorArr = [];
		var listColordata = [];
		data.forEach(function(item, index) {
			var obj = {
				value: item.total,
				name: item.dims_name
			};
			var randNum = Math.floor(Math.random() * 8)
			totalMoney += Number(item.total);
			dataArr.push(obj)
			listColordata.push(dataColor[randNum])
			colorArr.push(dataColor[randNum].color);
		})
		option = {
			tooltip: {
				trigger: 'item',
				formatter: "{a} <br/>{b}: {c} ({d}%)"
			},
			title: {
				text: "￥" + translate_1(totalMoney, 2),
				subtext: "总支出",
				textStyle: {
					fontSize: 20,
					color: "#000000"
				},
				subtextStyle: {
					fontSize: 12,
					color: "#8E8E93"
				},
				top: '43%',
				left: 'center'
			},
			color: colorArr,
			series: [{
				name: '我的项目',
				type: 'pie',
				radius: ['50%', '70%'],
				avoidLabelOverlap: false,
				label: {
					normal: {
						show: false,
						formatter: function(params) {
							return Math.round(params.percent / 1) + "%";
						},
						//formatter: '{d}%',
						position: 'inside',
						textStyle: {
							fontSize: '10',
							fontWeight: 'bold'
						}
					},
					emphasis: {
						show: false,
						// formatter: '{d}%',
						formatter: function(params) {
							return Math.round(params.percent / 1) + "%";
						},
						position: "center",
						textStyle: {
							fontSize: '12',
							fontWeight: 'bold'
						}
					}
				},
				labelLine: {
					normal: {
						show: false
					}
				},
				data: dataArr
			}]
		}
		myChart.setOption(option);
		renderList(data, totalMoney, listColordata);
		clearFlag = true;
	}

	//渲染图表下对应的列表  首先需要对应的颜色，数据  可以对后台返回的数据进行遍历，插入dom树后做处理。
	function renderList(data, total, colorData) {
		var htmlStr = "";
		var $listWraper = $("#list-wraper");
		data.forEach(function(item, index) {
			htmlStr += '<li class="listItem" name="' + item.dims_pk + '">' +
				'<span class="circleContainer ' + colorData[index].background + '">' +
				'</span>' +
				'<span class="detailMesg">' +
				item.dims_name +
				'</span>' +
				'<span class="percentageContainer">' +
				Math.round(item.total / total * 100 / 1) + "%" +
				'</span>' +
				'<span class="moneyContainer">￥' + item.total +
				'</span>' +
				'<i class="mui-icon mui-icon-forward"></i>' +
				'</li>'
		})
		$listWraper.append(htmlStr);
	}

	listBindEvent();

	function listBindEvent() {
		//点击列表的每一项，渲染相应的图表和数据     
		mui("#list-wraper").on("tap", "li", function() {
			var pkname = $(this).attr("name");
			if(isPersonage === "Y") {
				var tempKey = globalPersonalSate[activeState];
				//获取相应的主键
				currentStateObj[tempKey[currentIndex].value] = pkname;
				if(currentIndex === 1) {
					initLocal();
					setTotalData();
					mui.openWindow({
						url: 'html/listspage.html',
						id: 'html/listspage.html'
					})
					return;
				} else {
					var currentSate = tempKey[currentIndex + 1].value;
					currentStateObj[currentSate] = "all";
				}

			} else {
				var tempKey = globalState[activeState];
				//获取相应的主键
				currentStateObj[tempKey[currentIndex].value] = pkname;
				if(currentIndex === 3) {
					initLocal();
					setTotalData();
					mui.openWindow({
						url: 'html/listspage.html',
						id: 'html/listspage.html'
					})
					return;
				} else {
					var currentSate = tempKey[currentIndex + 1].value;
					currentStateObj[currentSate] = "all";
				}
			}
			pageIndex = 1;
			var _self = this;
			$_ajax._post({
				url: 'com.mobile.controller.MobileReportAnalyzeController',
				handler: 'handler',
				data: {
					cuserid: cuserid,
					begindate: wholeVariateTime.begindate,
					enddate: wholeVariateTime.enddate,
					dimsmap: currentStateObj,
					currdim: "",
					matstr: "",
					pageSize: 10,
					pageIndex: 1,
				},
				success: mycallback,
				err: myerr
			})

			function mycallback(data) {
				if(data.datas === null) {
					mui.alert("没有更多的数据了！", "提示", "确定", function() {})
					return;
				}
				$("#checkTimeRang").hide();
				currentIndex++;
				var data = data.datas;
				if(data.length >= 10) {
					mui('#pullrefresh').pullRefresh().enablePullupToRefresh();
				} else {
					mui('#pullrefresh').pullRefresh().disablePullupToRefresh();
				}
				refreshGlobalData = [];
				refreshGlobalData = refreshGlobalData.concat(data);
				lastGetData = data
				var _text = $(".detailMesg", _self).text();
				createNav(_text, data)
				drawEhart(data)
			}

			function myerr(err) {
				mui.alert("网络异常，请稍候重试！", "提示", "确定", function() {})
			}
		})
	}

	function createNav(text, data) {
		var htmlStr = ' <li class="navArrow"></li>\
                <li class="navItem" id="nav_' + currentIndex + '">' + text + '</li>'
		$(".navWraper").append(htmlStr);
		$("#nav_" + currentIndex).attr("navdata", JSON.stringify(data))
		$("#nav_" + currentIndex).siblings().removeClass("navActive");
		$("#nav_" + currentIndex).addClass("navActive");
	}
	//初次进入页面时的逻辑
	function callActionData(options) {
		var params = {};
		params.begindate = options.startTime || "2017-01-01";
		params.enddate = options.endTime || "2017-12-31";
		params.cuserid = cuserid;
		params.matstr = options.matstr || "";
		params.currdim = options.currdim || "";
		params.pageSize = options.pageSize || 10;
		params.pageIndex = options.pageIndex || 1;
		params.dimsmap = options.dimsmap || {
			"szxmid": "all"
		};
		var _self = options.this || null;
		var initialize = options.initialize || "";
		$_ajax._post({
			url: 'com.mobile.controller.MobileReportAnalyzeController',
			handler: 'handler',
			data: params,
			success: mycallback,
			err: myerr
		})

		function mycallback(data) {
			if(data.datas === null) {
				mui.alert("没有更多的数据了！", "提示", "确定", function() {})
				if(_self) {
					_self.endPullupToRefresh(false)
				}
				return;
			}
			var data = data.datas;
			if(_self) {
				_self.endPullupToRefresh(false)
			}
			if(data.length >= 10) {
				mui('#pullrefresh').pullRefresh().enablePullupToRefresh();
			} else {
				mui('#pullrefresh').pullRefresh().disablePullupToRefresh();
			}
			lastGetData = data
			refreshGlobalData = refreshGlobalData.concat(data);
			if(typeof initialize === "function") {
				initialize()
			}
			if(data[0].ispersonal === "Y") {
				isPersonage = "Y"
			}
			if(clearFlag) {
				drawEhart(data);
			} else {
				drawEhart(refreshGlobalData)
			}
			if(params.pageIndex === 1 && currentIndex === 0) {
				$("#nav_0").attr("navdata", JSON.stringify(data));
			}
		}

		function myerr(err) {
			if(_self) {
				_self.endPullupToRefresh(false)
			}
			clearFlag = true;
			mui.alert("网络异常，请稍候重试！", "提示", "确定", function() {})
		}
	}

	mui.init({
		pullRefresh: {
			container: "#pullrefresh", //待刷新区域标识，querySelector能定位的css选择器均可，比如：id、.class等
			up: {
				height: 70, //可选.默认50.触发上拉加载拖动距离
				auto: false, //可选,默认false.自动上拉加载一次
				contentrefresh: "正在加载...", //可选，正在加载状态时，上拉加载控件上显示的标题内容
				contentnomore: '没有更多数据了', //可选，请求完毕若没有更多数据时显示的提醒内容；
				callback: function() {
					pageIndex++;
					clearFlag = false;
					callActionData({
						startTime: wholeVariateTime.begindate,
						endTime: wholeVariateTime.enddate,
						dimsmap: currentStateObj,
						this: this,
						pageIndex: pageIndex
					})

				} //必选，刷新函数，根据具体业务来编写，比如通过ajax从服务器获取新数据；
			}
		}
	});
	//保留几位小数
	function translate_1(number, n) {
		n = n ? parseInt(n) : 0;
		if(n <= 0) return Math.round(number);
		number = Math.round(number * Math.pow(10, n)) / Math.pow(10, n);
		return number;
	}

	//点击查询按钮的一些逻辑
	$("#checkBtn").on("click", function() {
		//这里采用mui的打开页面组件进行操作，方便页面间传值
		initLocal()
		var localVal = {
			activeState: activeState,
			begindate: wholeVariateTime.begindate,
			enddate: wholeVariateTime.enddate,
			cuserid: cuserid,
			dimsmap: currentStateObj,
			currentIndex: currentIndex,
			isPersonage: isPersonage
		}
		var htmlStr = $("#navWraper").html();
		localStorage.setItem("htmlStr", htmlStr)
		localStorage.setItem("localVal", JSON.stringify(localVal));
		localStorage.setItem("lastGetData", JSON.stringify(lastGetData))
		mui.openWindow({
			url: 'html/search.html',
			id: 'search'
		});
	})

	//选择维度 一些状态进行初始化
	function checkWeiduInit(data) {
		var $myProject = $("#nav_0");
		$myProject.removeAttr("navdata")
		$myProject.attr("navdata", JSON.stringify(data));
		currentIndex = 0;
		if($(".navWraper>li").length > 1) {
			$("#nav_0~li").remove();
			$myProject.addClass("navActive");
		}
	}
}