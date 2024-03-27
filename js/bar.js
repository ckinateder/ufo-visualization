// create a HistogramChart class
// the getterFunction is a function that takes in a data point and returns the attribute that you want to bin
class HistogramChart {
  constructor(_config, _data, getterFunction) {
    this.config = {
      title: _config.title || "Histogram",
      xAxisLabel: _config.xAxisLabel || "x-axis",
      yAxisLabel: "Count",
      numBins: _config.numBins || 20,
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1200,
      containerHeight: _config.containerHeight || 500,
      margin: { top: 50, bottom: 55, right: 10, left: 50 },
      quantileLimit: _config.quantileLimit || 0,
    };

    this.setData(_data, getterFunction);

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

    // we want to create a histogram of the data
    // we need to create a histogram function
    vis.histogram = d3
      .histogram()
      .value(vis.getterFunction)
      .domain(d3.extent(vis.data, vis.getterFunction))
      .thresholds(vis.config.numBins);

    // we need to bin the data
    vis.bins = vis.histogram(vis.data);

    // we need to create a scale for the x-axis
    console.log(
      vis.config.parentElement,
      ":",
      d3.extent(vis.data, vis.getterFunction)
    );
    vis.x = d3
      .scaleLinear()
      .domain(d3.extent(vis.data, vis.getterFunction))
      .range([vis.config.margin.left, vis.width - vis.config.margin.right]);

    // we need to create a scale for the y-axis
    vis.y = d3
      .scaleLinear()
      .domain([0, d3.max(vis.bins, (d) => d.length)])
      .range([vis.height - vis.config.margin.bottom, vis.config.margin.top]);

    // we need to create a bar chart
    vis.svg
      .selectAll("rect")
      .data(vis.bins)
      .join("rect")
      .attr("x", (d) => vis.x(d.x0))
      .attr("y", (d) => vis.y(d.length))
      .attr("width", (d) => vis.x(d.x1) - vis.x(d.x0))
      .attr(
        "height",
        (d) => vis.height - vis.config.margin.bottom - vis.y(d.length)
      )
      .attr("fill", "steelblue");

    // Make xAxis svg element using the x-scale.
    vis.xAxis = d3.axisBottom(vis.x).ticks(10).tickFormat(d3.format(".2s"));

    // Make yAxis svg element using the y-scale.
    vis.yAxis = d3.axisLeft(vis.y).ticks(10).tickFormat(largeTickFormat);

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
