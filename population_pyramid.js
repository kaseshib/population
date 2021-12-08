initiate()
year = 1950
// selected_countries[0] = "United States"
// selected_countries[1] = ""

let chart, options, leftBarGroup, rightBarGroup, tooltipDiv, style, 
    population_legend, w_full, h_full, h, w, sectorWidth, 
    leftBegin, rightBegin, maxValue, xScale, yScale;

let graph_height = 450
let graph_width = 450

let male_size= 50
let female_size = 60

var countries = {}
var upper_to_lower = {}

let selected_countries = ["United States"]

const age_ranges = ["0-4", "5-9", "10-14", "15-19", "20-24", "25-29", 
    "30-34", "35-39", "40-44", "45-49", "50-54", "55-59", "60-64", "65-69", 
    "70-74", "75-79", "80-84", "85-89", "90-94", "95-99", "100+"]

var secondCountry = document.getElementById("second-country")
var currSecondCountry = document.getElementById("curr-second-country")

const pyramid_margin = {
    top: 100,
    right: 50,
    bottom: 50,
    left: 50,
    middle: 20
}

$(document).ready(function() {
    $(".js-example-basic-multiple-limit").select2({
        maximumSelectionLength: 2,
        placeholder: "Select up to 2 countries"
    });

    $('#selected-countries').val('United States');
    $('#selected-countries').trigger('change'); // Notify any JS components that the value changed
})

$('#selected-countries').on('select2:select select2:unselect', function (e) {
    // Do something
    selected_countries = $('#selected-countries').val()
    drawChart(selected_countries)
    updateAxes()
    drawBars(countries, year,'#pyramid', options)
    changeBarColors()
    updateLegend()
  });

async function initiate() {
    let male_data = await d3.csv("data/population_male.csv")
    let female_data = await d3.csv("data/population_female.csv")

    //add male data
    male_data.forEach(function (d) {
        var country = d['Region, subregion, country or area *'];
        var country_upper = country.toUpperCase()

        var year = d['Reference date (as of 1 July)']

        if (!(country in countries)) {
            countries[country] = {}
            upper_to_lower[country_upper] = country
        }

        countries[country][year] = addMaleData(d)
    })

    //add female data
    female_data.forEach(function (f) {
        var country = f['Region, subregion, country or area *'];
        var year = f['Reference date (as of 1 July)']

        countries[country][year].forEach(function (t) {
            t['female'] = cleanValue(f[t['age']])
        })
    })

    options = {
        height: graph_height,
        width: graph_width,
        style: {
          leftBarColor: "#229922",
          rightBarColor: "#993222"
        }
    }

    var slider = document.getElementById("myRange");
    var output = document.getElementById("year");

    slider.oninput = function() {
        output.innerHTML = this.value;
        year = this.value
        drawBars(countries, year,'#pyramid', options)
        drawChart(selected_countries)

      }

    setUpChart(countries[selected_countries[0]][year], '#pyramid', options);
    drawBars(countries, year, '#pyramid', options)
}

function addMaleData(row) {
    cleaned = []

    for (const age_range of age_ranges.values()) {
        cleaned.push({"age":age_range, "male": cleanValue(row[age_range])})
    };

    return cleaned
}

function cleanValue(value) {
    return +value.replace(/\s+/g, '');
}

function getData(country, year) {
    return countries[country][year]
}

function setUpChart(data, target, options) {
    w_full = typeof options.width === 'undefined' ? graph_width  : options.width
    h_full = typeof options.height === 'undefined' ? graph_height  : options.height

    if (w_full > $( window ).width()) {
      w_full = $( window ).width();
    }

    sectorWidth = (w_full / 2) - pyramid_margin.middle - pyramid_margin.left,
    leftBegin = sectorWidth + pyramid_margin.left,
    rightBegin = (w_full/2) + pyramid_margin.middle;

    w = (w_full - (pyramid_margin.left + pyramid_margin.right));
    h = (h_full - (pyramid_margin.top + pyramid_margin.bottom));

    dom_year = [1950, 2020]

    if (typeof options.style === 'undefined') {
        style = {
            maleColor: '#2768A4',
            femaleColor: '#E6A6C7',
            
            leftCountryColor: '#e41a1c',
            rightCountryColor: '#377eb8',
            tooltipBG: '#fefefe',
            tooltipColor: 'black'
        };
    } else {
        style = {
            maleColor: typeof options.style.maleColor === 'undefined'  ? '#2768A4' : options.style.maleColor,
            femaleColor: typeof options.style.femaleColor === 'undefined'  ? '#E6A6C7' : options.style.femaleColor,
            leftCountryColor: typeof options.style.leftCountryColor === 'undefined'  ? '#e41a1c' : options.style.leftCountryColor,
            rightCountryColor: typeof options.style.rightCountryColor === 'undefined' ? '#377eb8' : options.style.rightCountryColor,
            tooltipBG: typeof options.style.tooltipBG === 'undefined' ? '#fefefe' : options.style.tooltipBG,
            tooltipColor: typeof options.style.tooltipColor === 'undefined' ? 'black' : options.style.tooltipColor
        };
    }

    var styleSection = d3.select(target).append('style')
        .attr('class', 'bar-styles')
        .text('svg {max-width:100%} \
        .axis line,axis path {shape-rendering: crispEdges;fill: transparent;stroke: #555;} \
        .axis text {font-size: 11px;} \
        .bar {fill-opacity: 0.8;} \
        .bar.left {fill: ' + getLeftBarColor(style) + ';} \
        .bar.left:hover {fill: ' + colorTransform(style.maleColor, '333333') + ';} \
        .bar.right {fill: ' + getRightBarColor(style) + ';} \
        .bar.right:hover {fill: ' + colorTransform(style.femaleColor, '333333') + ';} \
        .tooltip {position: absolute;line-height: 1.1em;padding: 7px; pyramid_margin: 3px;background: ' + style.tooltipBG + '; color: ' + style.tooltipColor + '; pointer-events: none;border-radius: 6px;}')

    var region = d3.select(target).append('svg')
        .attr('width', w_full)
        .attr('height', h_full);

    population_legend = region.append('g')
        .attr('class', 'population_legend');

    population_legend.append('text')
        .text('Population Age Structure')
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .attr('x', w_full/2)
        .attr('y', 30)
        .attr('font-size', 'x-large')

    population_legend.append('text')
        .attr('id', 'first-country-name-pop')
        .text(selected_countries[0])
        .style('text-anchor', 'middle')
        .attr('x', pyramid_margin.left + w/2)
        .attr('y', 70)
        .attr('font-size', 'large')

    population_legend.append('image')
        .attr('id', 'male-image')
        .attr('x', sectorWidth/2 + pyramid_margin.left - male_size/2)
        .style('text-anchor', 'middle')
        .attr('y', 100)
        .attr('xlink:href', 'images/male.png')
        .attr('width', male_size)
        .attr('height', male_size)

    population_legend.append('image')
        .attr('id', 'female-image')
        .attr('x', w_full/2 + pyramid_margin.middle + sectorWidth/2 - female_size/2)
        .style('text-anchor', 'middle')
        .attr('y', 100)
        .attr('xlink:href', 'images/female.png')
        .attr('width', female_size)
        .attr('height', female_size)


    population_legend.append('text')
        .attr('id', 'vs')
        .text('vs.')
        .attr('opacity', 0)

    population_legend.append('text')
        .attr('id', 'second-country-name-pop')
        .style('text-anchor', 'middle')
        .attr('opacity', 0)

    tooltipDiv = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var pyramid = region.append('g')
        .attr('class', 'inner-region')
        .attr('transform', translation(0, pyramid_margin.top));

    maxValue = d3.max(data, (d) => Math.max(d.male, d.female)) / totalPopulation(data)


    // SET UP SCALES

    // the xScale goes from 0 to the width of a region
    //  it will be reversed for the left x-axis
    xScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([0, sectorWidth])
        .nice();

    yScale = d3.scaleBand()
        .domain(data.map(function(d) {
            return d.age;
        }))
        .range([h, 0], 0.1);


    // SET UP AXES
    var yAxisLeft = d3.axisRight()
        .scale(yScale)
        .tickSize(4, 0)
        .tickPadding(pyramid_margin.middle - 4);

    var yAxisRight = d3.axisLeft()
        .scale(yScale)
        .tickSize(4, 0)
        .tickFormat('');

    var xAxisRight = d3.axisBottom()
        .scale(xScale)
        .ticks(3)
        .tickFormat(d3.format('.0%'));

    var xAxisLeft = d3.axisBottom()
        // REVERSE THE X-AXIS SCALE ON THE LEFT SIDE BY REVERSING THE RANGE
        .scale(xScale.copy().range([leftBegin, pyramid_margin.left]))
        .ticks(3)
        .tickFormat(d3.format('.0%'));

    // DRAW AXES
    pyramid.append('g')
        .attr('class', 'axis y left')
        .attr('transform', translation(leftBegin, 0))
        .call(yAxisLeft)
        .selectAll('text')
        .style('text-anchor', 'middle');

    pyramid.append('g')
        .attr('class', 'axis y right')
        .attr('transform', translation(rightBegin, 0))
        .call(yAxisRight);

    pyramid.append('g')
        .attr('class', 'axis x left')
        .attr('transform', translation(0, h))
        .call(xAxisLeft);

    pyramid.append('g')
        .attr('class', 'axis x right')
        .attr('transform', translation(rightBegin, h))
        .call(xAxisRight);

    leftBarGroup = pyramid.append('g')
        .attr('class', 'left-bars')
        .attr('transform', translation(leftBegin, 0) + 'scale(-1,1)');
    rightBarGroup = pyramid.append('g')
        .attr('class', 'right-bars')
        .attr('transform', translation(rightBegin, 0));

}

function drawBars(data, year, options) {
    countryOneData = data[selected_countries[0]][year]

    let countryTwoData = {};
    if (selected_countries.length == 2) {
        countryTwoData = data[selected_countries[1]][year]
    }

    var w_full = typeof options.width === 'undefined' ? graph_width  : options.width,
        h_full = typeof options.height === 'undefined' ? graph_height  : options.height

    if (w_full > $( window ).width()) {
      w_full = $( window ).width();
    }

    dom_year = [1950, 2020]

    var xScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([0, (sectorWidth)])
        .nice();

    var yScale = d3.scaleBand()
        .domain(countryOneData.map(function(d) {
            return d.age;
        }))
        .range([h, 0], 0.1);
    

    var leftBars = leftBarGroup.selectAll('.bar.left')
        .data(countryOneData, d => d.age)
        .join('rect')
        .attr('class', 'bar left')
        .attr('x', 0)
        .attr('y', function(d) {
            return yScale(d.age) + yScale.bandwidth()/12;
        })
        .attr('width', function(d) {
            let leftPop = d.male;
            if (selected_countries.length == 2) {
                leftPop += d.female
            }
            return xScale(percentageOfPopulation(leftPop, countryOneData));
        })
        .attr('height', yScale.bandwidth()*2/3)


    leftBars.on("mouseover", function(d, a) {
            tooltipDiv.transition()
                .duration(200)
                .style("opacity", 0.9);
            
            let prefix, percentage

            if (selected_countries.length == 1) {
                prefix = "<strong>Males Age "
                percentage = Math.round(percentageOfPopulation(a.male, countryOneData) * 1000) / 10

            } else {
                prefix = "<strong>" + truncateStrings(selected_countries[0]) + " Age "
                percentage = Math.round(percentageOfPopulation(a.male + a.female, countryOneData) * 1000) / 10

            }

            tooltipDiv.html(prefix + a.age + "</strong>" +
                    "<br />  Population: " + prettyFormat(a.male) +
                    "<br />" + percentage + "% of Total")
                .style("left", d.clientX + "px")
                .style("top", d.clientY - 28 + "px");
        })
        .on("mouseout", function(d) {
            tooltipDiv.transition()
                .duration(500)
                .style("opacity", 0);
        });


    let rightData = countryOneData;    
    if (selected_countries.length == 2) {
        rightData = countryTwoData
    }


    var rightBars = rightBarGroup.selectAll('.bar.right')
        .data(rightData)
        .join('rect')
        .attr('class', 'bar right')
        .attr('x', 0)
        .attr('y', function(d) {
            return yScale(d.age) + yScale.bandwidth()/12;
        })
        .attr('width', function(d) {
            let rightPop = d.female;
            if (selected_countries.length == 2) {
                rightPop += d.male
            }
            return xScale(percentageOfPopulation(rightPop, rightData));
        })
        .attr('height', yScale.bandwidth()*2/3)

    rightBars.on("mouseover", function(d, a) {
            tooltipDiv.transition()
                .duration(200)
                .style("opacity", 0.9);
            
            let prefix, percentage
            
            if (selected_countries.length == 1) {
                prefix = "<strong>Females Age "
                percentage = Math.round(percentageOfPopulation(a.female, rightData) * 1000) / 10
            } else {
                prefix = "<strong>" + truncateStrings(selected_countries[1]) + " Age "
                percentage = Math.round(percentageOfPopulation(a.female + a.male, rightData) * 1000) / 10

            }
            tooltipDiv.html(prefix + a.age + "</strong>" +
                    "<br />  Population: " + prettyFormat(a.female) +
                    "<br />" + percentage + "% of Total")
                .style("left", d.clientX + "px")
                .style("top", d.clientY - 28 + "px");
        })
        .on("mouseout", function(d) {
            tooltipDiv.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

function totalPopulation(data) {
    return d3.sum(data, function(d) {
        return d.male + d.female
    })
}

function percentageOfPopulation(val, data) {
    return val / totalPopulation(data)
}

// string concat for translate
function translation(x, y) {
    return 'translate(' + x + ',' + y + ')';
}

// numbers with commas
function prettyFormat(x) {
    return (x*1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getLeftBarColor(style) {
    // return '#229922'
    if (selected_countries.length == 1) {
        return style.maleColor
    } else {
        return style.leftCountryColor
    }
}

function getRightBarColor(style) {
    if (selected_countries.length == 1) {
        return style.femaleColor
    } else {
        return style.rightCountryColor
    }
}

// lighten colors
function colorTransform(c1, c2) {
    var c1 = c1.replace('#','')
        origHex = {
            r: c1.substring(0, 2),
            g: c1.substring(2, 4),
            b: c1.substring(4, 6)
        },
        transVec = {
            r: c2.substring(0, 2),
            g: c2.substring(2, 4),
            b: c2.substring(4, 6)
        },
        newHex = {};

    function transform(d, e) {
        var f = parseInt(d, 16) + parseInt(e, 16);
        if (f > 255) {
            f = 255;
        }
        return f.toString(16);
    }
    newHex.r = transform(origHex.r, transVec.r);
    newHex.g = transform(origHex.g, transVec.g);
    newHex.b = transform(origHex.b, transVec.b);
    return '#' + newHex.r + newHex.g + newHex.b;
}

function changeBarColors() {
    var styleSection = d3.select(".bar-styles").append('style')
        .attr('class', 'bar-styles2')
        .text('svg {max-width:100%} \
        .axis line,axis path {shape-rendering: crispEdges;fill: transparent;stroke: #555;} \
        .axis text {font-size: 11px;} \
        .bar {fill-opacity: 0.8;} \
        .bar.left {fill: ' + getLeftBarColor(style) + ';} \
        .bar.left:hover {fill: ' + colorTransform(getLeftBarColor(style), '333333') + ';} \
        .bar.right {fill: ' + getRightBarColor(style) + ';} \
        .bar.right:hover {fill: ' + colorTransform(getRightBarColor(style), '333333') + ';} \
        .tooltip {position: absolute;line-height: 1.1em;padding: 7px; pyramid_margin: 3px;background: ' + style.tooltipBG + '; color: ' + style.tooltipColor + '; pointer-events: none;border-radius: 6px;}')

}

function updateLegend() {
    let leftText, rightText

    if (selected_countries.length == 1) {
        population_legend.select('#first-country-name-pop')
            .join('text')
            .text(truncateStrings(selected_countries[0]))
            .style('text-anchor', 'middle')
            .attr('x', pyramid_margin.left + w/2)
            .attr('y', 70)
            .attr('font-size', 'large')
            .style('fill', 'black')

        population_legend.select('#vs')
            .join('text')
            .attr('opacity', 0)
        population_legend.select('#second-country-name-pop')
            .join('text')
            .attr('opacity', 0)

        gdp_legend.select('#first-country-name-gdp')
            .join('text')
            .text(truncateStrings(selected_countries[0]))
            .style('text-anchor', 'middle')
            .attr('x', (gdp_w_full+gdp_margin.left)/2)
            .attr('y', 70)
            .attr('font-size', 'large')
            .style('fill', 'black')
        
        gdp_legend.select('#and')
            .join('text')
            .attr('opacity', 0)
        gdp_legend.select('#second-country-name-gdp')
            .join('text')
            .attr('opacity', 0)
            
        population_legend.select("#male-image")
            .attr("opacity", 1)
        population_legend.select("#female-image")
            .attr("opacity", 1)
        
    } else {
        population_legend.select('#first-country-name-pop')
            .join('text')
            .text(truncateStrings(selected_countries[0]))
            .style('text-anchor', 'middle')
            .attr('x', sectorWidth/2 + pyramid_margin.left)
            .attr('y', 70)
            .attr('font-size', 'large')
            .style('fill', style.leftCountryColor)

        population_legend.select('#vs')
            .join('text')
            .attr('id', 'vs')
            .text("vs.")
            .style('text-anchor', 'middle')
            .attr('x', w_full/2)
            .attr('y', 70)
            .attr('font-size', 'large')
            .attr('opacity', 1)

        population_legend.select('#second-country-name-pop')
            .join('text')
            .text(truncateStrings(selected_countries[1]))
            .style('text-anchor', 'middle')
            .attr('x', w_full/2 + pyramid_margin.middle + sectorWidth/2)
            .attr('y', 70)
            .attr('font-size', 'large')
            .style('fill', style.rightCountryColor)
            .attr('opacity', 1)


        gdp_legend.select('#first-country-name-gdp')
            .join('text')
            .text(truncateStrings(selected_countries[0]))
            .style('text-anchor', 'middle')
            .attr('font-size', 'large')
            .style('fill', style.leftCountryColor)
            .append('tspan')
            .text(' vs. ')
            .style('fill', 'black')
            .append('tspan')
            .text(truncateStrings(selected_countries[1]))
            .style('fill', style.rightCountryColor)

        
        gdp_legend.select('#and')
            .join('text')
            .text('vs')
            .style('text-anchor', 'middle')
            .attr('font-size', 'large')
            .attr('opacity', 1)
            .append('tspan')
            .text('silly me')
            .attr('font-size', 'large')
            .style('fill', style.rightCountryColor)

        gdp_legend.select('#second-country-name-gdp')
            .join('text')
            .attr('opacity', 0)

        population_legend.select("#male-image")
            .attr("opacity", 0)
        population_legend.select("#female-image")
            .attr("opacity", 0)
    }
}

function truncateStrings(str) {
    let truncated = str
    let len = str.length
    let maxLen = 13
    if (len > maxLen) {
        if (str.charAt(maxLen) == " "){
            maxLen -= 1
        }
        truncated = str.substring(0, maxLen+1) + "..."
    }

    return truncated
}

function updateAxes() {
    maxValue = 0

    for (let country of selected_countries) {
        for (let year = 1950; year <= 2020; year++) {
            let currData = getData(country, year)
            maxValue = Math.max(maxValue, d3.max(currData, (d) => getAgeMax(d)) / totalPopulation(currData))
        }
    }
    
    xScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([0, sectorWidth])
        .nice();


    var xAxisRight = d3.axisBottom()
        .scale(xScale)
        .ticks(3)
        .tickFormat(d3.format('.0%'));

    var xAxisLeft = d3.axisBottom()
        // REVERSE THE X-AXIS SCALE ON THE LEFT SIDE BY REVERSING THE RANGE
        .scale(xScale.copy().range([leftBegin, pyramid_margin.left]))
        .ticks(3)
        .tickFormat(d3.format('.0%'));

    d3.select('.axis.x.left')
        .join('g')
        .attr('transform', translation(0, h))
        .transition().duration(1500)
        .call(xAxisLeft);
        

    d3.select('.axis.x.right')
        .join('g')
        .attr('transform', translation(rightBegin, h))
        .transition().duration(1500)
        .call(xAxisRight);
}

function getAgeMax(d) {
    if (selected_countries.length == 1) {
        return Math.max(d.male, d.female)
    } else {
        return d.male + d.female
    }
}