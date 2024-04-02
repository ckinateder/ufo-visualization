class LeafletMap {
  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement.replace("#", ""), //without the # sign
      defaultZoom: _config.defaultZoom || 2,
      defaultCenter: _config.defaultCenter || [30, 0],
    };
    this.data = _data;
    this.radiusSize = 3;

    this.initVis();
  }

  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    //this is the base map layer, where we are showing the map background
    vis.base_layer = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );

    vis.theMap = L.map(this.config.parentElement, {
      center: this.config.defaultCenter,
      zoom: this.config.defaultZoom,
      layers: [vis.base_layer],
    });

    //if you stopped here, you would just have a map

    //initialize svg for d3 to add to map
    L.svg({ clickable: true }).addTo(vis.theMap); // we have to make the svg layer clickable
    vis.overlay = d3.select(vis.theMap.getPanes().overlayPane);
    vis.svg = vis.overlay.select("svg").attr("pointer-events", "auto");

    // color scale for the points
    vis.setColoring(defaultColoring);

    // filter out any points that don't have a lat/lon
    vis.data = vis.data.filter((d) => d.latitude && d.longitude);

    //these are the city locations, displayed as a set of dots
    vis.Dots = vis.svg
      .selectAll("circle")
      .data(vis.data)
      .join("circle")
      .attr("fill", vis.colorScaleFunction)
      .attr("stroke", "black")
      //Leaflet has to take control of projecting points. Here we are feeding the latitude and longitude coordinates to
      //leaflet so that it can project them on the coordinates of the view. Notice, we have to reverse lat and lon.
      //Finally, the returned conversion produces an x and y point. We have to select the the desired one using .x or .y
      .attr(
        "cx",
        (d) => vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]).x
      )
      .attr(
        "cy",
        (d) => vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]).y
      )
      .attr("r", vis.radiusSize)
      .on("mouseover", function (event, d) {
        //function to add mouseover event
        d3.select(this)
          .transition() //D3 selects the object we have moused over in order to perform operations on it
          .duration("150") //how long we are transitioning between the two states (works like keyframes)
          .attr("fill", "red") //change the fill
          .attr("r", 4); //change radius

        //create the tooltip
        let dateTimeString =
          d.date_time.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }) +
          " " +
          d.date_time.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
          });
        let cityString = d.city + ", " + d.state + ", " + d.country;

        let tooltipHtml = `<div class="tooltip-label">
                            <strong>Date: </strong>${dateTimeString}<br>
                            <strong>City: </strong>${cityString}<br>
                            <strong>Shape: </strong>${d.shape}<br>
                            <strong>Encounter: </strong>"${d.description}"</div>`;

        //create a tool tip
        d3.select("#tooltip")
          .style("opacity", 1)
          .style("z-index", 1000000)
          // Format number with million and thousand separator
          .html(tooltipHtml);
      })
      .on("mousemove", (event) => {
        //position the tooltip
        d3.select("#tooltip")
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + 10 + "px");
      })
      .on("mouseleave", function () {
        //function to add mouseover event
        d3.select(this)
          .transition() //D3 selects the object we have moused over in order to perform operations on it
          .duration("150") //how long we are transitioning between the two states (works like keyframes)
          .attr("fill", vis.colorScaleFunction) //change the fill
          .attr("r", vis.radiusSize); //change radius

        d3.select("#tooltip").style("opacity", 0); //turn off the tooltip
      })
      .on("click", (event, d) => {
        //experimental feature I was trying- click on point and then fly to it
        // vis.newZoom = vis.theMap.getZoom()+2;
        // if( vis.newZoom > 18)
        //  vis.newZoom = 18;
        // vis.theMap.flyTo([d.latitude, d.longitude], vis.newZoom);
      });

    //handler here for updating the map, as you zoom in and out
    vis.theMap.on("zoomend", function () {
      vis.updateVis();
    });
  }

  updateVis() {
    let vis = this;

    //want to see how zoomed in you are?
    // console.log(vis.map.getZoom()); //how zoomed am I

    //want to control the size of the radius to be a certain number of meters?

    // if( vis.theMap.getZoom > 15 ){
    //   metresPerPixel = 40075016.686 * Math.abs(Math.cos(map.getCenter().lat * Math.PI/180)) / Math.pow(2, map.getZoom()+8);
    //   desiredMetersForPoint = 100; //or the uncertainty measure... =)
    //   radiusSize = desiredMetersForPoint / metresPerPixel;
    // }

    //redraw based on new zoom- need to recalculate on-screen position
    vis.Dots.attr(
      "cx",
      (d) => vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]).x
    )
      .attr(
        "cy",
        (d) => vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]).y
      )
      .attr("r", vis.radiusSize)
      .attr("fill", vis.colorScaleFunction);

    // only show dots if within timeRange
    vis.Dots.attr("display", (d) => {
      if (inFilter(d)) {
        return "block";
      } else {
        return "none";
      }
    });
  }

  setColoring(coloring) {
    let vis = this;
    // assert that the coloring is a valid column in colorByOptions
    if (!colorByOptions.includes(coloring)) {
      console.error("Invalid coloring column");
      return;
    }

    // make a color scale based on the colorByOption
    if (coloring === "month") {
      // january, february, march, etc.
      this.colorBy = (d) => d.date_time.getMonth();
      this.colorScale = d3
        .scaleSequential()
        .domain(d3.extent(this.data, this.colorBy))
        .interpolator(d3.interpolateViridis);
    } else if (coloring === "time") {
      // color by hour of the day
      this.colorBy = (d) => d.date_time.getHours();
      this.colorScale = d3
        .scaleSequential()
        .domain(d3.extent(this.data, this.colorBy))
        .interpolator(d3.interpolateViridis);
    } else if (coloring === "shape") {
      // oval, triangle, circle, etc.
      // sort by alphabetical order first
      this.colorBy = (d) => d.shape;
      this.colorScale = d3
        .scaleOrdinal()
        .domain(
          this.data
            .map((d) => d.shape)
            .filter((d, i, self) => self.indexOf(d) === i)
            .sort()
        )
        .range(d3.schemeTableau10);
    } else {
      // default to year
      this.colorBy = (d) => d.date_time.getFullYear();
      this.colorScale = d3
        .scaleSequential()
        .domain(d3.extent(this.data, this.colorBy))
        .interpolator(d3.interpolateViridis);
    }
    this.colorScaleFunction = (d) => vis.colorScale(vis.colorBy(d));
  }

  renderVis() {
    let vis = this;

    //not using right now...
  }

  resetMap() {
    let vis = this;

    vis.theMap.setView(vis.config.defaultCenter, vis.config.defaultZoom);
  }
}
