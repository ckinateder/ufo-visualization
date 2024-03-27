class DensityChart {
  constructor(_config, _data, getterFunction) {
    // Call the parent constructor
    this.config = {
      title: _config.title || "Density",
      xAxisLabel: _config.xAxisLabel || "x-axis",
      yAxisLabel: "Proportion",
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1200,
      containerHeight: _config.containerHeight || 500,
      margin: { top: 50, bottom: 55, right: 10, left: 60 },
      quantileLimit: _config.quantileLimit || 0,
    };
    this.setData(_data, getterFunction);
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

    // we want to create a histogram of the data
    // we need to create a histogram function

    // we need to create a scale for the x-axis
    vis.x = d3
      .scaleLinear()
      .domain(d3.extent(vis.data, vis.getterFunction))
      .range([vis.config.margin.left, vis.width - vis.config.margin.right]);

    // we need to create a scale for the y-axis
    vis.y = d3
      .scaleLinear()
      .domain([0, 0.01])
      .range([vis.height - vis.config.margin.bottom, vis.config.margin.top]);

    // Compute kernel density estimation
    var kde = kernelDensityEstimator(kernelEpanechnikov(5), vis.x.ticks(40));
    var density = kde(vis.data.map(vis.getterFunction));

    // Plot the area
    vis.curve = vis.svg
      .append("path")
      .datum(density)
      .attr("fill", "#69b3a2")
      .attr("opacity", ".8")
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .attr(
        "d",
        d3
          .line()
          .curve(d3.curveBasis)
          .x(function (d) {
            return vis.x(d[0]);
          })
          .y(function (d) {
            return vis.y(d[1]);
          })
      );

    // add tooltip in curve
    vis.curve
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", "1");
      })
      .on("mousemove", function (event) {
        let tooltipHtml = `<div class="tooltip-label">`;

        let xValue = vis.x.invert(d3.pointer(event)[0]);
        let yValue = vis.y.invert(d3.pointer(event)[1]);
        tooltipHtml += `<strong>${
          vis.config.xAxisLabel
        }: </strong>${xValue.toFixed(0)}<br>`;
        tooltipHtml += `<strong>${
          vis.config.yAxisLabel
        }: </strong>${yValue.toFixed(4)}<br>`;
        tooltipHtml += `</div>`;

        d3.select("#tooltip")
          .style("opacity", 1)
          .style("z-index", 1000000)
          .html(tooltipHtml);
        d3.select("#tooltip")
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + 10 + "px");
      })
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", ".8");
        d3.select("#tooltip").style("opacity", 0);
      });

    // Make xAxis svg element using the x-scale.
    vis.xAxis = d3.axisBottom(vis.x).ticks(10).tickFormat(d3.format(".2s"));

    // Make yAxis svg element using the y-scale.
    vis.yAxis = d3.axisLeft(vis.y).ticks(10).tickFormat(d3.format(""));

    // add axes to plot
    this.addAxes();

    // TODO - add tooltip

    // TODO - add brushing and linking
  }
  addAxes() {
    let vis = this;
    // Append the xAxis to the plot
    vis.svg
      .append("g")
      .attr("id", "x-axis")
      .attr(
        "transform",
        `translate(0, ${vis.height - vis.config.margin.bottom})`
      )
      .call(vis.xAxis);

    // Append the yAxis to the plot
    vis.svg
      .append("g")
      .attr("id", "y-axis")
      .attr("transform", `translate(${vis.config.margin.left}, 0)`)
      .call(vis.yAxis);

    // Add X axis label
    vis.svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", vis.width / 2)
      .attr("y", vis.height - vis.config.margin.bottom / 2 + 5)
      .attr("id", "x-axis-label")
      .style("font-size", "12px")
      .text(vis.config.xAxisLabel);

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
      .text(vis.config.yAxisLabel);

    // Add title
    vis.svg
      .append("text")
      .attr("x", vis.width / 2)
      .attr("y", 0 + vis.config.margin.top - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(vis.config.title);
    /*
      // Add a legend
      vis.legend = vis.svg
        .append("g")
        .attr(
          "transform",
          `translate(${vis.width - 100}, ${vis.config.margin.top})`
        );
      // add background
      vis.legend
        .append("rect")
        .attr("width", 80)
        .attr("height", 20)
        .attr("fill", "white");
      vis.legend
        .append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", "steelblue");
      vis.legend.append("text").attr("x", 15).attr("y", 10).text("Count");
      */
    if (vis.config.quantileLimit > 0) {
      vis.svg
        .append("text")
        .attr("x", vis.width - vis.config.margin.right)
        .attr("y", vis.height - vis.config.margin.bottom / 2 + 5)
        .attr("text-anchor", "end")
        .style("font-size", "10px")
        .text(
          `*Outliers removed using IQR with a ${vis.config.quantileLimit} QT limit`
        );
    }
  }

  setData(newData, getterFunction) {
    this.getterFunction = getterFunction;
    this.data = newData;

    if (this.config.quantileLimit > 0) {
      // filter outliers
      let q1 = d3.quantile(
        this.data.map(this.getterFunction).sort(),
        1 - this.config.quantileLimit
      );
      let q3 = d3.quantile(
        this.data.map(this.getterFunction).sort(),
        this.config.quantileLimit
      );
      let iqr = q3 - q1;
      let lowerBound = q1 - 1.5 * iqr;
      let upperBound = q3 + 1.5 * iqr;
      this.data = this.data.filter(
        (d) =>
          this.getterFunction(d) >= lowerBound &&
          this.getterFunction(d) <= upperBound
      );
    }
  }
}
