// THIS IS FOR STRING DATA
class BarChart {
  constructor(_config, _data, attribute, descriptionFunction) {
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
      accentColor: _config.accentColor || "#FFB400",
      normalColor: _config.normalColor || "#69b3a2",
      yPadding: 0.1, // padding for the y-axis (percentage of the range)
      barGap: 0.5, // gap between bars
    };

    // make a filter id for this chart, must be unique (use date.now())
    this.filterId = `${attribute}-${Date.now().toString(36)}`;
    this.setData(_data, attribute, descriptionFunction);

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

    // reset the brush area if it exists
    this.resetBrushArea();

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
        } else {
          let range = [
            scaleBandInvert(vis.x)(event.selection[0]),
            scaleBandInvert(vis.x)(event.selection[1]),
          ];

          updateFilter({
            id: vis.filterId,
            column: vis.attribute,
            range: range,
            description: vis.descriptionFunction(
              vis.attribute,
              vis.getCategoriesInRange(range)
            ),
          }); // update the filter
        }
      });

    // add brush to context
    vis.brushArea = vis.svg.append("g").attr("class", "brush").call(vis.brush);

    // X axis
    vis.x = d3
      .scaleBand()
      .domain(vis.data.map((d) => d.attribute))
      .padding(0.2)
      .range([vis.config.margin.left, vis.width - vis.config.margin.right]);

    // Add Y axis
    vis.y = d3
      .scaleSqrt()
      .domain([0, d3.max(vis.data, (d) => d.count)])
      .range([
        vis.height - vis.config.margin.bottom,
        (1 + vis.config.yPadding) * vis.config.margin.top,
      ]);

    vis.context = vis.svg.append("g");

    // add bars
    vis.bars = vis.context
      .selectAll("rect")
      .data(vis.data)
      .enter()
      .append("rect")
      .attr("x", (d) => vis.x(d.attribute))
      .attr("y", (d) => vis.y(d.count))
      .attr("width", vis.x.bandwidth())
      .attr(
        "height",
        (d) => vis.height - vis.config.margin.bottom - vis.y(d.count)
      )
      .attr("fill", vis.config.normalColor);
    // add tooltips
    vis.bars
      .on("mouseover", function (event, d) {})
      .on("mousemove", function (event, d) {
        d3.select(this).attr("fill", vis.config.accentColor);
        let tooltipHtml = `<div class="tooltip-label"><strong>Shape: </strong>${d.attribute}<br>`;
        tooltipHtml += `<strong>Count: </strong>${d.count}<br>`;
        tooltipHtml += `<strong>Percentage: </strong>${(
          (d.count / vis.sum) *
          100
        ).toFixed(2)}%`;
        tooltipHtml += "</div>";

        d3.select("#tooltip").style("opacity", 1).html(tooltipHtml);
        d3.select("#tooltip")
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + 10 + "px");
      })
      .on("mouseout", function (event, d) {
        d3.select("#tooltip").style("opacity", 0);
        d3.select(this).attr("fill", vis.config.normalColor);
      });
    // Make xAxis svg element using the x-scale.
    vis.xAxis = d3.axisBottom(vis.x);

    // Make yAxis svg element using the y-scale.
    vis.yAxis = d3.axisLeft(vis.y).ticks(10).tickFormat(d3.format(".2s"));

    // add axes to plot
    this.addAxes();

    // TODO - add tooltip

    // TODO - add brushing and linking
  }
  addAxes() {
    let vis = this;
    // Append the xAxis to the plot
    vis.context
      .append("g")
      .attr("id", "x-axis")
      .attr(
        "transform",
        `translate(0, ${vis.height - vis.config.margin.bottom})`
      )
      .call(vis.xAxis)
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    // Append the yAxis to the plot
    vis.context
      .append("g")
      .attr("id", "y-axis")
      .attr("transform", `translate(${vis.config.margin.left}, 0)`)
      .call(vis.yAxis);

    // Add X axis label
    /*
    vis.context
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", vis.width / 2)
      .attr("y", vis.height - vis.config.margin.bottom / 2 + 15)
      .attr("id", "x-axis-label")
      .style("font-size", "12px")
      .text(vis.config.xAxisLabel);
    */
    // Add Y axis label
    vis.context
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
    vis.context
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
        .attr("fill", vis.config.normalColor);
      vis.legend.append("text").attr("x", 15).attr("y", 10).text("Count");
      */
    if (vis.config.quantileLimit > 0) {
      vis.context
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
  setData(newData, attribute, descriptionFunction) {
    if (descriptionFunction === undefined) {
      descriptionFunction = (c, r) => `${c} in [${r[0]}, ${r[1]}]`;
    }
    this.descriptionFunction = descriptionFunction;
    this.getterFunction = (d) => d[attribute];
    this.attribute = attribute;

    // create a dataset that counts the number of times each attribute appears
    let rolledUp = d3.rollup(newData, (v) => v.length, this.getterFunction);

    // convert rolled up data to an array with key `attribute` and value `count`
    this.data = Array.from(rolledUp, ([attribute, count]) => ({
      attribute,
      count,
    }));

    // sort alphabetically
    this.data.sort((a, b) => a.attribute.localeCompare(b.attribute));

    // get sum
    this.sum = d3.sum(this.data, (d) => d.count);
  }

  getCategoriesInRange(range) {
    let cats = this.data.filter(
      (d) => range[0] <= d.attribute && d.attribute <= range[1]
    );
    return cats.map((d) => d.attribute);
  }

  resetBrushArea() {
    let vis = this;
    if (vis.brushArea) {
      vis.brushArea.call(vis.brush).call(vis.brush.move, null);
    }
  }
}
