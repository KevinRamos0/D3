// Seleccionar elemento chart
const chart = d3.select("#barChart");
const options = d3.select("#options");
const pieChart = d3.select("#pieChart");

//generar margenes automaticos
const margins = {
  top: 50,
  right: 20,
  bottom: 100,
  left: 150,
  end: 20,
};
// const totalWith = +chart.style("width").slice(0, -2);
const totalWith = 650;
const totalHeigthChart = (totalWith * 9) / (totalWith / 90);
const chartWith = totalWith - margins.left - margins.right;
const chartHeigth =
  totalHeigthChart - margins.top - margins.bottom - margins.end;

// agrega los parametros obtenidos del dataset a elemento de seleccion
const optionsFilter = async () => {
  const data = await readDatachart();

  const filters = new Set(data.map((d) => d.Parametro)); // solo valores unicos

  // Actualiza el dom del select para agregar los valores
  filters.forEach((sample) => {
    options.append("option").text(sample).property("value", sample);
  });
};

// aplica el filtro seleccionado para actualizar los datos
const optionChanged = async (option) => {
  parameter = option;
  loadData();
};

// funcion que extrae los datos del dataset
const readDatachart = async () => {
  const {
    Respuesta: {
      Datos: { Metricas: metrics },
    },
  } = await d3.json("data/las_cifras_del_crimen_en_españa.json", d3.autoType);
  // autoType asigna el tipo de dato segun el valor del campo
  // OJO: verificar el valor de los datos cuando (null, false)

  const data = metrics[0].Datos; // se obtiene unicamente el array de datos

  return data;
};

// por defecto filtrar los datos de este parametro
let parameter = "Agresión sexual con penetración";

// cargar los datos y crear los dominios de las ejes
const loadData = async () => {
  const data = await readDatachart(); // obtener los datos

  // filtrar unicamente los datos del parametro indiciado(filtro)
  const newData = data.filter((d) => d.Parametro === parameter);

  renderBarChart(newData);
  renderPieChart(newData);
};

/**
 * GRAFICA DE BARRAS
 */
// crear dimensiones del chart
const svgBarChart = chart
  .append("svg")
  .attr("width", totalWith)
  .attr("height", totalHeigthChart)
  .append("g")
  .attr("transform", `translate(${margins.left}, ${margins.top})`);

// generar escaladores para los ejes
const x = d3.scaleBand().range([0, chartWith]);
// invertir y (por defecto está inverso)
const y = d3.scaleLinear().range([chartHeigth, 0]);

// // crear ejes del chartbarChart
const xAxis = svgBarChart
  .append("g")
  .attr("transform", "translate(0," + chartHeigth + ")")
  .attr("class", "axisX");

const yAxis = svgBarChart.append("g").attr("class", "axisY");

// funcion que genera y actualiza la grafica según los datos obtenidos
const renderBarChart = (data) => {
  x.domain(data.map((d) => (d.Agno = `${d.Periodo} (${d.Agno})`))).padding(0.2);
  y.domain([0, d3.max(data, (d) => d.Valor) * 1.1]);

  // efectos al actualizar el filtro
  xAxis.transition().duration(1000).call(d3.axisBottom(x));
  yAxis.transition().duration(1000).call(d3.axisLeft(y));

  svgBarChart
    .append("text")
    .attr("x", chartWith / 2)
    .attr("y", -10)
    .attr("class", "labels")
    .attr("text-anchor", "middle")
    .text("Infracciones Penales por Trimestre");

  svgBarChart
    .append("g")
    .attr("transform", `translate(-80, ${chartHeigth / 2})`)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("class", "labels")
    .text("Unidades");

  // mostrar detalles del dato
  const tooltip = chart
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip");

  const rect = svgBarChart.selectAll("rect").data(data);

  rect
    .enter()
    .append("rect")
    .merge(rect)
    .transition()
    .duration(1000)
    .attr("x", (d) => x(d.Agno))
    .attr("y", (d) => y(d.Valor))
    .attr("width", x.bandwidth())
    .attr("height", (d) => chartHeigth - y(d.Valor))
    .attr("fill", "#ff000099");

  // ejecutar eventos la pasar el mouse por el elemento
  rect
    .on("mouseover", (d, i) => {
      tooltip
        .html(
          `Valor: ${i.Valor} <br /> Estado: ${i.Estado} <br /> Notas: ${i.Notas}`
        )
        .style("opacity", 1);
    })

    .on("mousemove", (event, d) => {
      tooltip
        .style("transform", `translateY(-600%)`)
        .style("margin-left", `${event.x - 10}px`);
    })

    .on("mouseout", () => {
      tooltip.html(``).style("opacity", 0);
    });
};

/**
 * GRAFICA DE TARTA
 */
const radius = Math.min(chartWith, chartHeigth) / 2 - margins.top;

const svgPieChart = pieChart
  .append("svg")
  .attr("width", chartWith)
  .attr("height", chartHeigth);

const g = svgPieChart
  .append("g")
  .attr(
    "transform",
    "translate(" + chartWith / 2 + "," + chartHeigth / 2 + ")"
  );

// A function that create / update the plot for a given variable:
const renderPieChart = (newData) => {
  const data = newData.reduce(
    (obj, cur) => ({ ...obj, [cur.Agno]: cur.Valor }),
    {}
  );
  const color = d3.scaleOrdinal().range(d3.schemeSet2);

  // Compute the position of each group on the pie:
  const pie = d3
    .pie()
    .value((d) => d[1])
    .sort((a, b) => d3.ascending(a.key, b.key));
  // This make sure that group order remains the same in the pie chart
  const data_ready = pie(Object.entries(data));

  var arc = d3.arc()
  .innerRadius(radius - 65)
  .outerRadius(radius);

  // map to data
  //   const u = g.selectAll("arc").data(data_ready);
  const u = g.selectAll("path").data(data_ready);

  // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
  u.join("path")
    .transition()
    .duration(1000)
    .attr("d", arc)
    .attr("fill", (d) => color(d.data[0]))
    .attr('transform', 'translate(0, 0)')

  const legend = g
    .selectAll(".legend") //the legend and placement
    .data(color.domain())
    .enter()
    .append("g")
    .attr("class", "circle-legend")
    .attr("transform", (_, i) => {
      const offset = (20 * color.domain().length) / 2;
      const vert = i * 20 - offset;
      return "translate(-60," + vert + ")";
    });

  legend
    .append("circle") //keys
    .style("fill", color)
    .style("stroke", color)
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", ".5rem");

  legend
    .append("text") //labels
    .attr("x", 20)
    .attr("y", 5)
    .text((d) => d);
};

loadData();
optionsFilter();
