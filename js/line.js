class TimeLineChart {
  constructor(_config, _data, attribute1, attribute2) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1200,
      containerHeight: _config.containerHeight || 500,
      margin: { top: 30, bottom: 55, right: 10, left: 50 },
    };

    this.setData(_data, attribute1, attribute2);

    // Call a class function
    this.initVis();
  }
  initVis() {
    let vis = this; // create svg element

    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    vis.svg = d3
      .select(vis.config.parentElement)
      .append("svg")
      .attr("width", vis.width)
      .attr("height", vis.height);

    this.updateVis();
  }

  // //leave this empty for now...
  updateVis() {
    let vis = this; // create svg element

    // resuable function to get the x and y value
    let xValue = (d) => d[vis.attribute1];
    let yValue = (d) => d[vis.attribute2];

    // Create the scale
    vis.x = d3
      .scaleTime()
      .domain(d3.extent(vis.data, xValue))
      .range([vis.config.margin.left, vis.width - vis.config.margin.right]);

    // Make xAxis svg element using the x-scale.
    vis.xAxis = d3.axisBottom(vis.x).ticks(10);

    // Append the xAxis to the plot
    vis.svg
      .append("g")
      .attr("id", "x-axis")
      .attr(
        "transform",
        `translate(0, ${vis.height - vis.config.margin.bottom})`
      )
      .call(vis.xAxis);

    // Add X axis label
    vis.svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", vis.config.margin.left + vis.width / 2)
      .attr("y", vis.height - vis.config.margin.bottom / 2)
      .attr("id", "x-axis-label")
      .style("font-size", "12px")
      .text("Year");

    // Create the y scale
    vis.y = d3
      .scaleLinear()
      .domain([0, d3.max(vis.data, yValue)])
      .range([vis.height - vis.config.margin.bottom, vis.config.margin.top]);

    // Make yAxis svg element using the y-scale.
    vis.yAxis = d3.axisLeft(vis.y).ticks(10);

    // Append the yAxis to the plot
    vis.svg
      .append("g")
      .attr("id", "y-axis")
      .attr("transform", `translate(${vis.config.margin.left}, 0)`)
      .call(vis.yAxis);

    // Add Y axis label
    vis.svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("x", -vis.height / 2)
      .attr("id", "y-axis-label")
      .attr("dy", ".75em")
      .style("font-size", "12px")
      .text("Count");

    // Add the line using join
    vis.line = vis.svg
      .append("path")
      .datum(vis.data)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr(
        "d",
        d3
          .line()
          .x((d) => vis.x(xValue(d)))
          .y((d) => vis.y(yValue(d)))
      );

    // Add the dots using join
    vis.dots = vis.svg
      .selectAll("circle")
      .data(vis.data)
      .join("circle")
      .attr("fill", "steelblue")
      .attr("r", 3)
      .attr("cx", (d) => vis.x(xValue(d)))
      .attr("cy", (d) => vis.y(yValue(d)));

    // Add the tooltip to the dots
    vis.dots
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration("50")
          .attr("fill", "red")
          .attr("r", 4);

        let tooltipHtml = `<div class="tooltip-label"><strong>Month: </strong>${d[
          vis.attribute1
        ].toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            <br><strong>Sightings: </strong>${
                              d[vis.attribute2]
                            }</div>`;

        d3.select("#tooltip")
          .style("opacity", 1)
          .style("z-index", 1000000)
          .html(tooltipHtml);
      })
      .on("mousemove", (event) => {
        d3.select("#tooltip")
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + 10 + "px");
      })
      .on("mouseleave", function () {
        d3.select(this)
          .transition()
          .duration("150")
          .attr("fill", "steelblue")
          .attr("r", 2);

        d3.select("#tooltip").style("opacity", 0);
      });

    // Add title
    vis.svg
      .append("text")
      .attr("x", vis.width / 2)
      .attr("y", 0 + vis.config.margin.top)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("UFO Sightings by Month and Year");
  }

  setData(newData, attribute1, attribute2) {
    this.attribute1 = attribute1; // MUST BE A DATE OBJECT
    this.attribute2 = attribute2; // MUST BE A NUMBER

    // assert the column is a date object
    if (typeof newData[0][attribute1] !== "object") {
      console.error("The column is not a date object");
      return;
    }
    // assert the column is a number
    if (typeof newData[0][attribute2] !== "number") {
      console.error("The column is not a number");
      return;
    }

    this.data = newData;
  }
}
