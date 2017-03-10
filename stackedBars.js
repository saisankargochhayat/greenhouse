var stackedBars = function ( options ) {
	var thisElem = this;
	var element = options.element;
	var data;

	this.bars;

	this.datasets = {
		"Livestock Related" : "FAO-manure-emissions-USA.csv",
		"Crop Related" : "FAO-manure-emissions-USA.csv",
		"Overview" : "FAO-manure-emissions-USA.csv"
	};
	var url = this.datasets["Livestock Related"];
	this.selectedSourceType = "Livestock Related";
	// this.sources = thisElem.sourceTypes[thisElem.selectedSourceType];
	this.sources = [];

	// Size options
	var margin = {left: 40, right: 100, top: 20, bottom: 50} // Default, can be changed
	var width = $(element).width() - margin.left - margin.right,
		height = $(element).height() - margin.top - margin.bottom;
	
	// Colors
	this.color = d3.scale.ordinal();
	this.colorRanges = {
		"Livestock Related": ["#d7191c","#fdae61","#ffffbf","#a6d96a","#1a9641"],
		"Crop Related": ["#d7191c","#fdae61","#ffffbf","#abd9e9","#2c7bb6"],
		"Overview" : ["#f7fcb9","#addd8e","#31a354"]
	};

	this.changeDataset = function ( type ) {

	};

	this.draw = function () {

		thisElem.color.domain(d3.keys(thisElem.sources));
		thisElem.color.range(thisElem.colorRanges[thisElem.selectedSourceType]);

		svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
              .attr("x", -10)
              .attr("y", -6)
              .attr("transform", "rotate(-90)")
              .style("text-anchor", "end");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
          .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("CO2 Equivalent Emissions");

        thisElem.bars = svg.selectAll(".state")
            .data(data)
          .enter().append("g")
            .attr("class", "g")
            .attr("transform", function(d) { return "translate(" + x(d["year"]) + ",0)"; });

        thisElem.bars.selectAll("rect")
            .data(function(d) { return d["sources"]; })
          .enter().append("rect")
            .attr("width", x.rangeBand())
            .attr("y", height-margin.top)
            .attr("height", function(d) { return 0; })
            .attr("class", function(d) {return d["source"] + " " + d["emissions"];})
            .style("fill", function(d) { 
            	if ( d["source"] == "Other" ) {
            		return '#cccccc';
            	} else {
            		return thisElem.color(d["source"]); 
            	}
			});

        thisElem.bars.selectAll("rect")
            .transition()
            .attr("y", function(d) { return y(+d["y1"]); })
            .attr("height", function(d) { return y(d.y0) - y(d.y1); })
            .duration(1000) // this is 1s
            .delay(100);

        createLegend();
	};

	var createLegend = function () {
		thisElem.legend = svg.selectAll(".legend")
            .data(thisElem.sources.reverse());

        thisElem.legend
        	.enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

        thisElem.legend.append("rect")
            .attr("x", width + 100- margin.right)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", function (d) {
            	if ( d == "Other" ) {
            		return '#cccccc';
            	} else {
            		return thisElem.color(d); 
            	}
            });

        thisElem.legend.append("text")
            .attr("x", width + 122 - margin.right)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(function(d) { return d; });
	}

	var processData = function (data) {
        var years = {};
        var formattedData = [];

        // Create keys for source types
        data.forEach(function(d){
        	thisElem.sources.push(d["source"]);
			year = +d["year"];
			if(!years[year]) {
			years[year] = [];
			}
			years[year].push({"source": d["source"], "emissions": +d["emissions"]});
        });

        for(year in years){
			yearObj = years[year];
			var y0 = y1 = 0;
			for(source in yearObj){   
				var d = yearObj[source];
				d.y0 = y0;
				y0 += +d["emissions"];
				d.y1 = y1 = y0;
			};   
			formattedData.push({"year": +year, "total": y1, "sources": yearObj});

        };

        thisElem.sources = jQuery.unique(thisElem.sources);
        formattedData.sort(function(a, b) { return a.year - b.year; });
        x.domain(formattedData.map(function(d) { return d.year; }));
        y.domain([0, d3.max(formattedData, function(d) { return d["total"]; })]);

        return formattedData;
	};

	var loadData = function ( url ) {
		var deferred = $.Deferred();
		d3.csv("FAO-manure-emissions-USA.csv", function(error, data) {
			deferred.resolve(data);
		});
		return deferred.promise();
	};

	var svg = d3.select("#visualization").append('svg')
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// Axes 
	var x = d3.scale.ordinal()
    	.rangeRoundBands([0, width], .03);

	var y = d3.scale.linear()
		.rangeRound([height, 0]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.tickFormat(d3.format(".2s"));

	$.when(loadData(url)).done(function(payload){
		console.log(payload);
		data = processData(payload);
		thisElem.draw();
	});

	return this;
};
