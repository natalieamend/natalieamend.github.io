var keyArray = ["Poverty", "Stroke", "Alzheimers", "LungCancer", "BreastCancer", "ProstateCancer", "InfantMortality", "Homicide"];
var expressed = keyArray[0];
var recolor;
var width = 500;
var height = 650;
var chartWidth = 450;
var chartHeight = 250;

window.onload = initialize();

function initialize() {
	setMap();
};

function setMap() {

	var map = d3.select("body")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.style("float", "right")
        .style("margin-right", "9%");

	var projection = d3.geo.transverseMercator()
		.center([0, 41.830])
		.rotate([87.73, 0])
		.scale(90000)
		.translate([width / 2, height / 2]);

	console.log(projection.center());

	var path = d3.geo.path()
		.projection(projection);

	queue()
		.defer(d3.csv, "data/chicagoData.csv")
		.defer(d3.json, "data/chicago.json")
		.await(callback);

	function callback(error, chicagoData, chicago) {
		console.log(chicago);
		recolor = colorScale(chicagoData);
		var jsonAreas = chicago.objects.communityAreas.geometries;

		for (var i=0; i<chicagoData.length; i++) {
			var csvArea = chicagoData[i];
			var csvAdm1 = csvArea.adm1_code;

			for (var a=0; a<jsonAreas.length; a++) {
				if (jsonAreas[a].properties.adm1_code === csvAdm1) {
					for (var key in keyArray) {
						var attr = keyArray[key];
						var val = parseFloat(csvArea[attr]);
						jsonAreas[a].properties[attr] = val;
					};
				jsonAreas[a].properties.name = csvArea.name;
				break;
				};
			};
		};

		var communityAreas = map.selectAll(".communityAreas")
		    .data(topojson.feature(chicago, chicago.objects.communityAreas).features)
		    .enter()
		    .append("g")
		    .attr("class", "communityAreas")
		    .append("path")
		    .attr("class", function(d) { return d.properties.adm1_code })
		    .attr("d", path)
			.style("fill", function(d) {
				return choropleth(d, recolor);
			})
			.on("mouseover", highlight)
			.on("mouseout", dehighlight)
			.on("mousemove", moveLabel)
			.append("desc")
				.text(function(d) {
					return choropleth(d, recolor);
				});
		createDropdown(chicagoData);
		setChart(chicagoData, recolor);
		};
};

function createDropdown(chicagoData){

	var dropdown = d3.select("body")
		.append("div")
		.attr("class","dropdown")
		.html("<h2>Select Variable:</h2>")
		.append("select")
		.on("change", function(){ changeAttribute(this.value, chicagoData) });
	
	dropdown.selectAll("options")
		.data(keyArray)
		.enter()
		.append("option")
		.attr("value", function(d){ return d })
		.text(function(d) {
			d = d[0].toUpperCase() + d.substring(1,3) + d.substring(3);
			return d
		});
};

function setChart(chicagoData, recolor){

	var chart = d3.select("body")
		.append("svg")
		.attr("width", chartWidth)
		.attr("height", chartHeight)
		.attr("class", "chart");
    
	var title = chart.append("text")
		.attr("x", 20)
		.attr("y", 40)
		.attr("class", "chartTitle");

	var bars = chart.selectAll(".bar")
		.data(chicagoData)
		.enter()
		.append("rect")
		.sort(function(a, b){return a[expressed]-b[expressed]})
		.attr("class", function(d){
			return "bar " + d.adm1_code;
		})
		.attr("width", chartWidth / chicagoData.length - 0.7)
		.on("mouseover", highlight)
		.on("mouseout", dehighlight)
		.on("mousemove", moveLabel);

	updateChart(bars, chicagoData.length);
};

function colorScale(chicagoData){

	var color = d3.scale.quantile()
		.range([
			"#C31",
			"#92240c",
			"#5e1808",
            "#461206"
			]);
	
	var domainArray = [];
	for (var i in chicagoData){
		domainArray.push(Number(chicagoData[i][expressed]));
	};
	
	color.domain(domainArray);
	
	return color;
};

function choropleth(d, recolor){
	var value = d.properties ? d.properties[expressed] : d[expressed];

	if (value) {
		return recolor(value);
		return "rgba(211, 211, 211, 0.5)";
	};
};

function changeAttribute(attribute, chicagoData){
	expressed = attribute;
	recolor = colorScale(chicagoData);
	
	d3.selectAll(".communityAreas")
		.select("path")
		.style("fill", function(d) {
			return choropleth(d, recolor);
		})
		.select("desc")
			.text(function(d) {
				return choropleth(d, recolor);
			});

	var bars = d3.selectAll(".bar")
		.sort(function(a, b){
			return a[expressed]-b[expressed];
		})
		.transition()
		.delay(function(d, i){
			return i * 10 
		});

	updateChart(bars, chicagoData.length);
};

function updateChart(bars, numbars){
	bars.attr("height", function(d, i){
			return Number(d[expressed])*3;
		})
		.attr("y", function(d, i){
			return chartHeight - Number(d[expressed])*3;
		})
		.attr("x", function(d, i){
			return i * (chartWidth / numbars);
		})
		.style("fill", function(d){
			return choropleth(d, recolor);
		});
	d3.select(".chartTitle")
		.text(expressed+
			" Rate In Each Community Area")
        .style("color", "#C31");
};

function format(value){
		if (expressed != "Population"){
		value = "$"+roundRight(value);
	} else {
		value = roundRight(value);
	};
	
	return value;
};

function roundRight(number){
	
	if (number>=100){
		var num = Math.round(number);
		return num.toLocaleString();
	} else if (number<100 && number>=10){
		return number.toPrecision(4);
	} else if (number<10 && number>=1){
		return number.toPrecision(3);
	} else if (number<1){
		return number.toPrecision(2);
	};
};

function highlight(data){

	var props = data.properties ? data.properties : data;

	d3.selectAll("."+props.adm1_code)
		.style("fill", "rgba(211, 211, 211, 0.5)");

	var labelAttribute = "<h1>"+props[expressed]+
		"</h1><br><b>"+expressed+"</b>Rate";
	var labelName = props.name
	
	var infolabel = d3.select("body")
		.append("div")
		.attr("class", "infolabel")
		.attr("id", props.adm1_code+"label")
		.html(labelAttribute)
		.append("div")
		.attr("class", "labelname")
		.html(labelName);
};

function dehighlight(data){
	
	var props = data.properties ? data.properties : data;
	var commArea = d3.selectAll("."+props.adm1_code);
	var fillcolor = commArea.select("desc").text();
	commArea.style("fill", fillcolor);
	
	d3.select("#"+props.adm1_code+"label").remove();
};

function moveLabel() {

	var x = d3.event.clientX < window.innerWidth - 245 ? d3.event.clientX+10 : d3.event.clientX-210; 
	var y = d3.event.clientY < window.innerHeight - 100 ? d3.event.clientY-300 : d3.event.clientY-200; 
	
	d3.select(".infolabel")
		.style("margin-left", x+"px")
		.style("margin-top", y+"px");
};