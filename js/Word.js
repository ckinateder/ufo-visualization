class Wordcloud {
  constructor(_config, _data, attribute, transformFunction) {
    // Configuration object with defaults
    this.config = {
      parentElement: _config.parentElement,
      colorScale: _config.colorScale,
      containerWidth: _config.containerWidth || 260,
      containerHeight: _config.containerHeight || 300,
      margin: _config.margin || { top: 25, right: 20, bottom: 20, left: 40 },
      numWords: _config.numWords || 75,
    };
    this.setData(_data, attribute, transformFunction);
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

  updateVis() {
    // List of words
    let vis = this;
    var myWords = vis.data.map(vis.getterFunction);

    var wrdCloudArray = vis.getWordsByFrequency(myWords);

    // Constructs a new cloud layout instance. It run an algorithm to find the position of words that suits your requirements
    // Wordcloud features that are different from one word to the other must be here
    vis.layout = d3.layout
      .cloud()
      .size([vis.width, vis.height])
      .words(
        wrdCloudArray.map((d) => {
          return { text: d.text, size: d.size, count: d.count };
        })
      )
      .padding(5) //space between words
      .rotate(() => ~~(Math.random() * 2) * 90)
      .fontSize((d) => d.size) // font size of words
      .on("end", (words) => {
        // This function takes the output of 'layout' above and draw the words
        // Wordcloud features that are THE SAME from one word to the other can be here
        vis.svg
          .append("g")
          .attr(
            "transform",
            "translate(" +
              vis.layout.size()[0] / 2 +
              "," +
              vis.layout.size()[1] / 2 +
              ")"
          )
          .selectAll("text")
          .data(words)
          .enter()
          .append("text")
          .style("fill", normalColor)
          .style("font-size", (d) => d.size + "px")
          .attr("text-anchor", "middle")
          .style("font-family", "Impact")
          .attr(
            "transform",
            (d) => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"
          )
          .text((d) => d.text)
          .on("mouseover", function (event, d) {
            // set cursor to pointer
            d3.select(this).style("cursor", "default");

            // set the color to accent color
            d3.select(this)
              .transition()
              .duration(100)
              .style("fill", accentColor);

            // show tooltip
            let tooltipHtml = `<div class="tooltip-label"><strong>Word: </strong>${d.text}</div>`;
            tooltipHtml += `<div class="tooltip-label"><strong>Count: </strong>${d.count}</div>`;
            tooltipHtml += `<div class="tooltip-label"><strong>Percentage: </strong>${(
              (d.count / vis.data.length) *
              100
            ).toFixed(2)}%</div>`;

            d3.select("#tooltip").style("opacity", 1).html(tooltipHtml);
            d3.select("#tooltip")
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY + 10 + "px");
          })
          .on("mouseout", function (event, d) {
            d3.select("#tooltip").style("opacity", 0);
            d3.select(this)
              .transition()
              .duration(100)
              .style("fill", normalColor);
          });
      });

    vis.layout.start();
  }
  getWordsByFrequency(texts) {
    let vis = this;
    // Define the list of words to exclude
    const excludedWords = [
      "the",
      "in",
      "a",
      "and",
      "of",
      "to",
      "i",
      "at",
      "it",
    ];

    // Object to store word frequencies
    const wordFreq = {};

    // Register each text and count word occurrences
    texts.forEach((text) => {
      const words = text.toLowerCase().split(/\W+/);
      words.forEach((word) => {
        if (word !== "" && !excludedWords.includes(word) && isNaN(word)) {
          // Check if the word is not in the excluded list
          if (wordFreq[word]) {
            wordFreq[word]++;
          } else {
            wordFreq[word] = 1;
          }
        }
      });
    });

    // Convert object to array of {text, size} objects
    const wordFreqArray = Object.keys(wordFreq).map((word) => ({
      text: word,
      count: wordFreq[word],
      size: wordFreq[word],
    }));

    // Sort by frequency (descending)
    wordFreqArray.sort((a, b) => b.size - a.size);

    // Calculate the sum of the top sizes
    let sumOfTopSizes = 0;
    for (
      let i = 0;
      i < Math.min(wordFreqArray.length, vis.config.numWords);
      i++
    ) {
      sumOfTopSizes += wordFreqArray[i].size;
    }

    // Update sizes with percentage of the sum
    for (
      let i = 0;
      i < Math.min(wordFreqArray.length, vis.config.numWords);
      i++
    ) {
      wordFreqArray[i].size = (wordFreqArray[i].size / sumOfTopSizes) * 1000;
    }

    return wordFreqArray.slice(0, vis.config.numWords);
  }
  setData(newData, attribute, transformFunction) {
    if (transformFunction === undefined) {
      transformFunction = (d) => d;
    }
    this.getterFunction = (d) => transformFunction(d[attribute]);
    this.transformFunction = transformFunction;
    this.attribute = attribute;
    this.data = newData;
  }
}
