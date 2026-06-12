// D3 Graph Gallery was used to get skeleton code for graphs: https://d3-graph-gallery.com/index.html
// D3 Skankey diagram walkthough/plug-in: https://github.com/d3/d3-sankey
// scaleOrdinal for color coding: https://d3js.org/d3-scale/ordinal
// D3 scaleBand: https://d3js.org/d3-scale/band
// mouse events: https://observablehq.com/@d3/multitouch

// diff academic years
let years = ["year 1", "year 2", "year 3", "year 4"];

// using conditions for heat map
let conditions = [
  { column: "depression", label: "Depression" },
  { column: "anxiety", label: "Anxiety" },
  { column: "panic", label: "Panic Attack" },
  { column: "treatment", label: "Treatment" }
];

//using conditions for bar chart - w/o treatment category
let barChartConditions = [
  { column: "depression", label: "Depression" },
  { column: "anxiety", label: "Anxiety" },
  { column: "panic", label: "Panic Attack" }
];

let conditionColors = d3.scaleOrdinal()
  // used to color code charts
  .domain(["Depression", "Anxiety", "Panic Attack", "Treatment"])
  .range(["#4e79a7", "#f28e2b", "#b07aa1", "#59a14f"]);

let conditionColumns = {
  "Depression": "depression",
  "Anxiety": "anxiety",
  "Panic Attack": "panic",
  "Treatment": "treatment"
};

// barchart and heat map use same tooltip
let tooltip = d3.select("body")
.append("div")
.attr("class", "tooltip")
.style("opacity", 0);

// simplified froom using mult if-statements - checks to see if more student answered Yes on survey
// gets lowercase and lowercase yes values
function isYes(value) {
  return String(value).trim().toLowerCase() === "yes";
}

function formatPercent(value) {
  return value.toFixed(1) + "%";
}

d3.csv("data/Student Mental health.csv").then(function(data) {
  console.log(data);
  console.log(data.columns);

  // Clean and rename cols
  data.forEach(function(d) {
    d.year = d["Your current year of Study"].toLowerCase().trim();
    d.depression = d["Do you have Depression?"];
    d.anxiety = d["Do you have Anxiety?"];
    d.panic = d["Do you have Panic attack?"];
    d.treatment = d["Did you seek any specialist for a treatment?"];

    // For Sankey graph
    if (isYes(d.depression) || isYes(d.anxiety) || isYes(d.panic)) {
      d.anyConcern = "Mental Health Concern";
    } else {
      d.anyConcern = "No Mental Health Concern";
    }
  });

  makeBarChart(data);
  makeHeatmap(data);
  makeSankey(data);
});

// making bar chart
function makeBarChart(data) {
  // chart compares depression, anxiety, and panic attack rates across the four academic years
  // clear prev charts 
  d3.select("#overview-chart").selectAll("*").remove();

  // stores data needed for bar chart
  let barChartData = [];

  years.forEach(function(year) {
    let studentsInYear = data.filter(function(d) {
      return d.year === year;
    });

    // calculates num of students who answered yes
    barChartConditions.forEach(function(condition) {
      let yesStudents = studentsInYear.filter(function(d) {
        return isYes(d[condition.column]);
      });

      let percent = 0;

      if (studentsInYear.length > 0) {
        percent = (yesStudents.length / studentsInYear.length) * 100;
      }

      barChartData.push({
        year: year,
        condition: condition.label,
        column: condition.column,
        percent: percent,
        yesCount: yesStudents.length,
        totalCount: studentsInYear.length
      });
    });
  });


  // setting margins and width and height dimensions
  let margin = { top: 35, right: 25, bottom: 110, left: 70 };
  let fullWidth = 620;
  let fullHeight = 410;

  let width = fullWidth - margin.left - margin.right;
  let height = fullHeight - margin.top - margin.bottom;

  let svg = d3.select("#overview-chart")
    .append("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight)
    .attr("viewBox", "0 0 " + fullWidth + " " + fullHeight);

  let chart = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // xScale for x-axis
  let xScale = d3.scaleBand()
    .domain(years)
    .range([0, width])
    .padding(0.2);

    // addition to x-axis -- places bars within each year category 
  let conditionScale = d3.scaleBand()
    .domain(barChartConditions.map(function(d) {
      return d.label;
    }))
    .range([0, xScale.bandwidth()])
    .padding(0.05);

    // yScale from 0-100 for percentages
  let yScale = d3.scaleLinear()
    .domain([0, 100])
    .nice()
    .range([height, 0]);

  // adding x-axis
  chart.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-20)")
    .style("text-anchor", "end")
    .style("font-size", "11px");

  // adding y-axis
  chart.append("g")
    .call(d3.axisLeft(yScale));

  // drawing bars w/ hover features
  chart.selectAll(".bar")
    .data(barChartData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", function(d) {
      return xScale(d.year) + conditionScale(d.condition);
    })
    .attr("y", function(d) {
      return yScale(d.percent);
    })
    .attr("width", conditionScale.bandwidth())
    .attr("height", function(d) {
      return height - yScale(d.percent);
    })
    .attr("fill", function(d) {
      return conditionColors(d.condition);
    })
    .attr("opacity", 0.85)
    .on("mouseover", function(event, d) {
      // highlighting bar when hovered over
      d3.select(this)
        .attr("opacity", 1)
        .attr("stroke", "black")
        .attr("stroke-width", 2);

        // adding condition, student, and percentage info to tooltip
      tooltip
        .style("opacity", 1)
        .html(
          "<strong>" + d.condition + "</strong><br>" +
          "Year: " + d.year + "<br>" +
          "Reported Yes: " + d.yesCount + " out of " + d.totalCount + " students<br>" +
          "Percentage: " + formatPercent(d.percent)
        );
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this)
        .attr("opacity", 0.85)
        .attr("stroke", "none");

      tooltip.style("opacity", 0);
    });

  // Year: x-axis label
  chart.append("text")
    .attr("x", width / 2)
    .attr("y", height + 55)
    .attr("text-anchor", "middle")
    .text("Year of Study");

  // Percentage: y-axis label
  chart.append("text")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Percentage of Students");

  // name of chart
  chart.append("text")
    .attr("x", width / 2)
    .attr("y", -15)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Distribution of Mental Health Concerns Amongst Students");

  // Legend being added and placed below the chart so labels don't get cut off
  // referenced d3 gallery for implementing legend
  let legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + margin.left + "," + (fullHeight - 35) + ")");

  let legendItem = legend.selectAll(".legend-item")
    .data(barChartConditions)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", function(d, i) {
      return "translate(" + (i * 105) + ",0)";
    });

  legendItem.append("rect")
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", function(d) {
      return conditionColors(d.label);
    });

  legendItem.append("text")
    .attr("x", 18)
    .attr("y", 10)
    .style("font-size", "11px")
    .text(function(d) {
      return d.label;
    });
}

// making heatmap
function makeHeatmap(data, selectedGroup) {
  // shows percentage of students who said yes to having each condition in each year

  //clear chart
  d3.select("#focus-chart").selectAll("*").remove();

  // store percent data for chart
  let heatmapData = [];

  // getting percentage of students who answered yes to having mental health condition
  // future --> make this a sep function since bar and heatmap both use
  years.forEach(function(year) {
    let studentsInYear = data.filter(function(d) {
      return d.year === year;
    });

    conditions.forEach(function(condition) {
      let yesStudents = studentsInYear.filter(function(d) {
        return d[condition.column] === "Yes";
      });

      let percent = 0;

      if (studentsInYear.length > 0) {
        percent = (yesStudents.length / studentsInYear.length) * 100;
      }

      heatmapData.push({
        year: year,
        condition: condition.label,
        percent: percent
      });
    });
  });

  // sizing and margins of map
let margin = { top: 45, right: 40, bottom: 75, left: 80 };
let fullWidth = 700;
let fullHeight = 330;

let width = fullWidth - margin.left - margin.right;
let height = fullHeight - margin.top - margin.bottom;

let svg = d3.select("#focus-chart")
  .append("svg")
  .attr("width", fullWidth)
  .attr("height", fullHeight)
  .attr("viewBox", "0 0 " + fullWidth + " " + fullHeight);

svg.append("text")
  .attr("x", fullWidth / 2)
  .attr("y", 18)
  .attr("text-anchor", "middle")
  .style("font-weight", "bold")
  .style("font-size", "16px")
  .text("Percentage of Students Reporting Each Concern and Treatment Seeking");

let chart = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

   // creating x-axis: for names of condition
let xScale = d3.scaleBand()
    .domain(conditions.map(function(d) { return d.label; }))
    .range([0, width])
    .padding(0.05);

    // creating y-axis: academic year
let yScale = d3.scaleBand()
    .domain(years)
    .range([0, height])
    .padding(0.05);

// shade higher perecentages darker
let opacityScale = d3.scaleLinear()
  .domain([0, 100])
  .range([0.25, 1]);

  // drawing cells for heatmap and implementing tooltip w hover
  chart.selectAll("rect")
    .data(heatmapData)
    .enter()
    .append("rect")
    .attr("class", "heatmap-cell")
    .attr("x", function(d) { return xScale(d.condition); })
    .attr("y", function(d) { return yScale(d.year); })
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("fill", function(d) { 
      return conditionColors(d.condition); 
    })
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .attr("opacity", function(d) {
      return opacityScale(d.percent);
    })
    .on("mouseover", function(event, d) {
      d3.select(this)
        .attr("stroke", "black")
        .attr("stroke-width", 2);
      
      tooltip
        .style("opacity", 1)
        .html(
          "<strong>" + d.condition + "</strong><br>" +
          "Year: " + d.year + "<br>" +
          "Percentage: " + formatPercent(d.percent)
        );
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this)
        .attr("stroke", "white")
        .attr("stroke-width", 1);
  
      tooltip.style("opacity", 0);
    });

  // add % inside each cell  
  chart.selectAll(".cell-text")
    .data(heatmapData)
    .enter()
    .append("text")
    .attr("class", "cell-text")
    .attr("x", function(d) { return xScale(d.condition) + xScale.bandwidth() / 2; })
    .attr("y", function(d) { return yScale(d.year) + yScale.bandwidth() / 2; })
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "11px")
    .text(function(d) { return Math.round(d.percent) + "%"; });

  chart.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale));

  chart.append("g")
    .call(d3.axisLeft(yScale));

  // adding note to explain shading opacity for each cell
  svg.append("text")
  .attr("x", margin.left)
  .attr("y", fullHeight - 18)
  .style("font-size", "15px")
  .style("fill", "#444")
  .text("Darker shading = higher percentage of students");
}


// making sankey diagram
function makeSankey(data, selectedCondition) {
  // clearing prev sankey diagram
  d3.select("#advanced-chart").selectAll("*").remove();

  // checking if Sankey d3 plugin is loaded/implemented
  if (typeof d3.sankey !== "function") {
    d3.select("#advanced-chart")
      .append("p")
      .text("Sankey library did not load.");
    console.log("d3.sankey is not available");
    return;
  }

  // if no data avail then stop prod
  if (!data || data.length === 0) {
    d3.select("#advanced-chart")
      .append("p")
      .text("No data available.");
    return;
  }

    // stores num of students going b/w groups
    // year 2 --> mental health concern
  let linkMap = new Map();


  function countLink(source, target) {
    let key = source + "|" + target;

    if (linkMap.has(key)) {
      linkMap.set(key, linkMap.get(key) + 1);
    } else {
      linkMap.set(key, 1);
    }
  }

  // count flows b/w groups for students
  data.forEach(function(d) {
    let year = d.year;
    let concern = d.anyConcern;
    let treatment = "Treatment: " + d.treatment;

    if (year && concern && d.treatment) {
      countLink(year, concern);
      countLink(concern, treatment);
    }
  });

  // making nodes: sections/boxes on sankey diagram
  let nodeNames = [];

  linkMap.forEach(function(value, key) {
    let parts = key.split("|");
    let source = parts[0];
    let target = parts[1];

    if (!nodeNames.includes(source)) {
      nodeNames.push(source);
    }

    if (!nodeNames.includes(target)) {
      nodeNames.push(target);
    }
  });
  // no nodes to draw -> stop
  if (nodeNames.length === 0) {
    d3.select("#advanced-chart")
      .append("p")
      .text("No Sankey data available.");
    return;
  }
  // making node name -> node object
  let nodes = nodeNames.map(function(name) {
    return { name: name };
  });

  // Linking objects on diagram using source/target
  let links = [];

  linkMap.forEach(function(value, key) {
    let parts = key.split("|");
    let source = parts[0];
    let target = parts[1];

    links.push({
      source: nodeNames.indexOf(source),
      target: nodeNames.indexOf(target),
      value: value
    });
  });

  // diagram size and margins
  let margin = { top: 45, right: 130, bottom: 15, left: 70 };
  let fullWidth = 850;
  let fullHeight = 320;

  let width = fullWidth - margin.left - margin.right;
  let height = fullHeight - margin.top - margin.bottom;

  let svg = d3.select("#advanced-chart")
    .append("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight)
    .attr("viewBox", "0 0 " + fullWidth + " " + fullHeight);

  // adding chart title 
  svg.append("text")
    .attr("x", fullWidth / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("font-size", "16px")
    .text("Students' Path from Year to Concern to Treatment");

  let chart = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // making/setting layout for diagram
  let sankey = d3.sankey()
    .nodeWidth(18)
    .nodePadding(12)
    .extent([[0, 0], [width, height]]);

  // running layout of diagram w/ nodes and links
  let graph = sankey({
    nodes: nodes.map(function(d) {
      return Object.assign({}, d);
    }),
    links: links.map(function(d) {
      return Object.assign({}, d);
    })
  });

  // getting color for node and links
  function sankeyColor(name) {
    if (name === "year 1") {
      return "#264653";
    }
    if (name === "year 2") {
      return "#2A9D8F";
    }
    if (name === "year 3") {
      return "#E9C46A";
    }
    if (name === "year 4") {
      return "#E76F51";
    }
    if (name === "Mental Health Concern") {
      return "#6b5b95";
    }
    if (name === "No Mental Health Concern") {
      return "#bdbdbd";
    }
    if (name === "Treatment: Yes") {
      return "#2ca02c";
    }
    if (name === "Treatment: No") {
      return "#d62728";
    }
  
    return "#999999";
  }

  // Draw links
  chart.append("g")
    .selectAll("path")
    .data(graph.links)
    .enter()
    .append("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", function(d) {
      return sankeyColor(d.source.name);
    })
    .attr("stroke-width", function(d) {
      return Math.max(1, d.width);
    })
    .attr("fill", "none")
    .attr("opacity", 0.55)
    .append("title")
    .text(function(d) {
      return d.source.name + " → " + d.target.name + ": " + d.value + " students";
    });

  // Draw nodes
  chart.append("g")
    .selectAll("rect")
    .data(graph.nodes)
    .enter()
    .append("rect")
    .attr("x", function(d) {
      return d.x0;
    })
    .attr("y", function(d) {
      return d.y0;
    })
    .attr("width", function(d) {
      return d.x1 - d.x0;
    })
    .attr("height", function(d) {
      return Math.max(1, d.y1 - d.y0);
    })
    .attr("fill", function(d) {
      return sankeyColor(d.name);
    })
    .attr("stroke", "black")
    .append("title")
    .text(function(d) {
      return d.name + ": " + d.value + " students";
    });

  // Draw labels
  chart.append("g")
    .selectAll("text")
    .data(graph.nodes)
    .enter()
    .append("text")
    .attr("x", function(d) {
      if (d.x0 < width / 2) {
        return d.x1 + 6;
      } else {
        return d.x0 - 6;
      }
    })
    .attr("y", function(d) {
      return (d.y0 + d.y1) / 2;
    })
    .attr("dy", "0.35em")
    .attr("text-anchor", function(d) {
      if (d.x0 < width / 2) {
        return "start";
      } else {
        return "end";
      }
    })
    .style("font-size", "11px")
    .text(function(d) {
      return d.name;
    });


}
