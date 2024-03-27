// create a HistogramChart class
// the getterFunction is a function that takes in a data point and returns the attribute that you want to bin
class HistogramChart {
  constructor(_config, _data, attribute, transformFunction) {
    this.config = {
      title: _config.title || "Histogram",
      xAxisLabel: _config.xAxisLabel || "x-axis",
      yAxisLabel: "Count",
      numBins: _config.numBins || 20,
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1200,
      containerHeight: _config.containerHeight || 500,
      margin: { top: 50, bottom: 55, right: 10, left: 60 },
      quantileLimit: _config.quantileLimit || 0,
    };

    // make a filter id for this chart, must be unique (use date.now())
    this.filterId = `${attribute}-filter-${Date.now()}`;
    this.setData(_data, attribute, transformFunction);

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
    vis.x = d3
      .scaleLinear()
      .domain(d3.extent(vis.data, vis.getterFunction))
      .range([vis.config.margin.left, vis.width - vis.config.margin.right]);

    // we need to create a scale for the y-axis
    vis.y = d3
      .scaleLinear()
      .domain([0, d3.max(vis.bins, (d) => d.length)])
      .range([vis.height - vis.config.margin.bottom, vis.config.margin.top]);

    // add brush
    vis.brush = d3
      .brushX()
      .extent([
        [vis.config.margin.left, vis.config.margin.top],
        [
          vis.width - vis.config.margin.right,
          vis.height - vis.config.margin.bottom,
        ],
      ])
      .on("brush", (event) => {})
      .on("end", (event) => {
        if (!event.selection) {
          // if selection is empty, reset the time range
          removeFilter(vis.filterId); // remove the filter
          updateLeafletMap(); // update the leaflet map
        } else {
          // get the selected range
          let x0 = event.selection[0];
          let x1 = event.selection[1];
          let range = [vis.x.invert(x0), vis.x.invert(x1)];
          updateFilter({
            id: vis.filterId,
            column: vis.attribute,
            transformation: vis.transformFunction,
            range: range,
          }); // update the filter
          updateLeafletMap(); // update the leaflet map
        }
      });

    // we need to create a bar chart
    vis.bars = vis.svg
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
    vis.svg.append("g").attr("class", "brush").call(vis.brush);
    // add tooltips
    vis.bars
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", "orange");

        let tooltipHtml = `<div class="tooltip-label"><strong>Range: </strong>${d.x0} - ${d.x1}</div>`;
        tooltipHtml += `<div class="tooltip-label"><strong>Count: </strong>${d.length}</div>`;
        tooltipHtml += `<div class="tooltip-label"><strong>Percent: </strong>${(
          (d.length / vis.data.length) *
          100
        ).toFixed(2)}%</div>`;

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
      .on("mouseout", function (event, d) {
        d3.select("#tooltip").style("opacity", 0);
        d3.select(this).attr("fill", "steelblue");
      });

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
  setData(newData, attribute, transformFunction) {
    this.getterFunction = (d) => transformFunction(d[attribute]);
    this.transformFunction = transformFunction;
    this.attribute = attribute;
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
