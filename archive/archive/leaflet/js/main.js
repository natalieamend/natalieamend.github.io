$(document).ready(function() {
	console.log("oh hi!");
	var bike;
	var map = L.map('map', { //leaflet customization
			center: [39.5, -98.35],
			zoom: 4,
			minZoom: 3,
		});

	map.setMaxBounds([
	    [30, -140],
	    [49, -36]
		]);


L.Control.Fullscreen // A fullscreen button. Or use the `{fullscreenControl: true}` option when creating L.Map.
	//add tiles
	L.tileLayer(
		'https://{s}.tiles.mapbox.com/v3/natalieroseamend.jinjgdb7/{z}/{x}/{y}.png', {
			attribution: 'Tiles © Mapbox © Open Street Mapping | Data from 2005-2012 <a href="http://www.census.gov/acs/www/">American Community Surveys</a>'
	}).addTo(map);
	console.log("tiles added");

	//process data
	$.getJSON("data/bike2.json")
		.done(function(data) {
			var info = processData(data);
			createPropSymbols(info.timestamps, data);
			createLegend(info.min,info.max);
			createSliderUI(info.timestamps);
		})
		.fail(function() { alert("There has been a problem loading the data.")});

	function processData(data) {
		console.log("ajax data: ",data);
		var timestamps = ["2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012"];
		var percent = ["percentChange"];
		var	min = Infinity; //start at highest possible #, loop through data +, if data is lower than that #, assign it
		var	max = -Infinity; //start at lowest possible #, loop through data + increase to highest #

		for (var feature in data.features) { //loop through features

			var properties = data.features[feature].properties; //loop through attributes in features

			for (var attribute in properties) { //nested loops - for each attribute in attributes object

				if ( attribute != 'id' &&
					 attribute != 'name' &&
					 attribute != 'lat' &&
					 attribute != 'lon' &&
					 attribute != 'percentChange' ) {
					if ( $.inArray(timestamps) ===  -1) {
						timestamps.push(attribute);
					}
					if (properties[attribute] < min) {
						min = properties[attribute];
					}
					if (properties[attribute] > max) {
						max = properties[attribute];
					}
				}
			}
		}
		return {
			timestamps : timestamps,
			percent : percent,
			min : min,
			max : max
		}
	}
	//end processing bike data

	//create bike proportional symbols
	function createPropSymbols(timestamps, data) {
		bike = L.geoJson(data, {

			pointToLayer: function(feature, latlng) {

				return L.circleMarker(latlng, {

				    fillColor: "#53868B",
				    color: '#2F4F4F',
				    weight: 1,
				    fillOpacity: 0.6

				}).on({

					mouseover: function(e) {
						this.openPopup();
						this.setStyle({color: '#D1EEEE'});
					},
					mouseout: function(e) {
						this.closePopup();
						this.setStyle({color: '#2F4F4F'});

					}

				});
			}
		}).addTo(map);

		updatePropSymbols(timestamps[0]);

	}

	function updatePropSymbols(timestamp) {

		bike.eachLayer(function(layer) { // populating info window // specific to bike

			var props = layer.feature.properties;
			var	radius = calcPropRadius(props[timestamp]);
			var	popupContent = "<b>" + String(props[timestamp]) + "%</b> of commuters biked<br>" +
							   " in <b> " + props.name +
							   "</b> in </b>" + timestamp;

			layer.setRadius(radius);
			layer.bindPopup(popupContent, { offset: new L.Point(0,-radius) });

		});
	}

	function calcPropRadius(attributeValue) {

		var scaleFactor = 700,
			area = attributeValue * scaleFactor;

		return Math.sqrt(area/Math.PI);

	}


	//end creating proportional symbols

	//create symbol legend
	function createLegend(min, max) {

		if (min < 0.5) {
			min = 0.5;
		}

		function roundNumber(inNumber) {

       		return (Math.round(inNumber/0.5) * 0.5);
		}

		var totalLegend = L.control( {position: 'topright'} );


		totalLegend.onAdd = function(map) {

			var legendContainer = L.DomUtil.create("div", "legend");
			var	symbolsContainer = L.DomUtil.create("div", "symbolsContainer");
			var	classes = [roundNumber(min), roundNumber((max-min)/2.75), roundNumber(max)];
			var	legendCircle;
			var	lastRadius = 0;
			var  currentRadius;
			var  margin;

			L.DomEvent.addListener(legendContainer, 'mousedown', function(e) {
				L.DomEvent.stopPropagation(e);
			});

			$(legendContainer).append("<h3 id='legendTitle'>% OF COMMUTERS</h3>");

			for (var i = 0; i <= classes.length-1; i++) {

				legendCircle = L.DomUtil.create("div", "legendCircle");

				currentRadius = calcPropRadius(classes[i]);

				margin = -currentRadius - lastRadius - 2; // margin of legend

				$(legendCircle).attr("style", "width: " + currentRadius*2 + // width of legend
					"px; height: " + currentRadius*2 + // height of legend
					"px; margin-left: " + margin + "px" );

				$(legendCircle).append("<span class='legendValue'>"+classes[i]+"<span>");

				$(symbolsContainer).append(legendCircle);

				lastRadius = currentRadius;

			}

			$(legendContainer).append(symbolsContainer);

			return legendContainer;

		};

		totalLegend.addTo(map);
	}
	// end total % legend

	//create temporal legend
	function createSliderUI(timestamps) {

		var sliderControl = L.control({ position: 'bottomleft'} );

		sliderControl.onAdd = function(map) {

			var slider = L.DomUtil.create("input", "range-slider");

			L.DomEvent.addListener(slider, 'mousedown', function(e) {

				L.DomEvent.stopPropagation(e);

			});

			$(slider)
				.attr({'type':'range', 'max': timestamps[timestamps.length-1], 'min':timestamps[0], 'step': 1,'value': String(timestamps[0])})
		        .on('input change', function() {
		        	updatePropSymbols($(this).val().toString());
		            $(".temporal-legend").text(this.value);
		        });

			return slider;
		}

		sliderControl.addTo(map);
		createTemporalLegend(timestamps[0]);
	}
	function createTemporalLegend(startTimestamp) {

		var temporalLegend = L.control({ position: 'bottomleft' });

		temporalLegend.onAdd = function(map) {

			var output = L.DomUtil.create("output", "temporal-legend");
			return output;
		}

		temporalLegend.addTo(map);
		$(".temporal-legend").text(startTimestamp);
	}
	//end temporal lenged

});