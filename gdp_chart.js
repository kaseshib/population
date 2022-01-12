let svg, gdp, grouped_data, gdp_legend, x, width, height

let gdp_w_full = 450
let gdp_h_full = 450
let colors = ['#e41a1c','#377eb8']
const color = d3.scaleOrdinal()
    .range(['#e41a1c','#377eb8'])

var gdp_margin = {top: 100, right: 73, bottom: 50, left: 73}

initiate()

async function initiate(){
    if (gdp_w_full > $( window ).width()) {
        gdp_w_full = $( window ).width();
    }
    
    width = gdp_w_full - gdp_margin.left - gdp_margin.right,
    height = gdp_h_full - gdp_margin.top - gdp_margin.bottom;

    // append the svg object to the body of the page
    svg = d3.select("#gdp")
        .append("svg")
        .attr("width", gdp_w_full)
        .attr("height", gdp_h_full)
    
    gdp = await d3.csv("data/gdp_per_capita_tidy.csv")
    
    grouped_data = d3.group(gdp, d => d['Country Name']);
    
    var selected_countries = ["United States"]
    
    gdp_legend = svg.append('g')
        .attr('class', 'gdp_legend')
    
    gdp_legend.append('text')
        .text('GDP per Capita, 2020-adj. $')
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .attr('x', gdp_w_full/2)
        .attr('y', 30)
        .attr('font-size', 'x-large')
        .attr("transform", 'translate(0,0)')

    gdp_legend.append('text')
        .attr('id', 'first-country-name-gdp')
        .text(selected_countries[0])
        .style('text-anchor', 'middle')
        .attr('x', gdp_w_full/2)
        .attr('y', 70)
        .attr('font-size', 'large')

    // Add X axis
    x = d3.scaleLinear()
        .domain(d3.extent(gdp, function(d) { return +d["Year"]; }))
        .range([ 0, width ])
        .nice();
    
    svg.append("g")
        .attr('class', 'x axis')
        .attr("transform", translation(gdp_margin.left, height + gdp_margin.top))
        .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(5));

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([0, d3.max(grouped_data.get(selected_countries[0]), function(d) { return +d["GDP"]; })])
        // .domain([0, d3.max(gdp, function(d) { return +d["GDP"]; })])
        .nice()
        .range([ height, 0 ]);
    svg.append("g")
        .attr('class', 'y axis')
        .attr('transform', translation(gdp_margin.left, gdp_margin.top))
        .call(d3.axisLeft(y));

    drawChart(selected_countries)
    
}

function drawChart(selected_countries) {
    var filtered = new Map();
    filtered.set(selected_countries[0], grouped_data.get(selected_countries[0]))
    var flat = filtered.get(selected_countries[0])

    if (selected_countries.length == 2) {
        filtered.set(selected_countries[1], grouped_data.get(selected_countries[1]))
        flat = flat.concat(filtered.get(selected_countries[1]))
    }

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([0, d3.max(flat, function(d) { return +d["GDP"]; })])
        .nice()
        .range([ height, 0 ]);

    svg.selectAll('.y.axis')
        .transition().duration(1500)
        .call(d3.axisLeft(y));
        
    svg.selectAll(".line")
        .data(filtered)
        .join("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", function(d){ 
                return selected_countries.length > 1 ? colors[selected_countries.indexOf(d[0])] : 'black'})
            .attr("stroke-width", 3)
            .attr("d", function(d){ return d3.line()                
                .defined(d => +d["Year"] <= year && +d["GDP"])

                .x(d => x(+d["Year"]) )
                .y(d => y(+d["GDP"]) )
                (d[1])
            })
            .attr('transform', translation(gdp_margin.left, gdp_margin.top))

    let yearLabel = Math.max(0, year-1960)

    svg.selectAll(".line-label-one")
        .data(filtered)
        .join("text")
        .attr("class", "line-label-one")
        .attr("transform", translation(gdp_margin.left + 6+width*((year - 1960)/(2020-1960)), gdp_margin.top + y(filtered.get(selected_countries[0])[yearLabel].GDP) ))
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .attr("opacity", (year - 1960) * filtered.get(selected_countries[0])[yearLabel].GDP)
        .style("fill", () => selected_countries.length > 1 ? '#e41a1c' : 'black')
        .text(formatDollars(filtered.get(selected_countries[0])[yearLabel].GDP));

    if (selected_countries.length == 2){
        svg.selectAll(".line-label-two")
            .data(filtered)
            .join("text")
            .attr("class", "line-label-two")
            .attr("transform", translation(gdp_margin.left + 6+width*((year - 1960)/(2020-1960)), gdp_margin.top + y(filtered.get(selected_countries[1])[yearLabel].GDP) ))
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .attr("opacity", (year - 1960) * filtered.get(selected_countries[1])[yearLabel].GDP)
            .style("fill", '#377eb8')
            .text(formatDollars(filtered.get(selected_countries[1])[yearLabel].GDP));
    } else {
        svg.selectAll(".line-label-two")
            .attr("opacity", 0)
    }
}

function formatDollars(str) {
    let asInt = parseInt(str)
    return "$" + asInt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}